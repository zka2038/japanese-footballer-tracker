/**
 * API-Football (api-sports.io) fallback provider.
 *
 * Official and documented, but the free tier allows only 100 requests/day, so
 * this provider is incremental: it maps FotMob roster ids to API-Football ids
 * once (cached in data/api-football-ids.json), then only fetches match lines
 * it has not already stored in a previous API-Football snapshot. A large
 * backfill on the free tier may take a few days of scheduled runs.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { classifyCompetition, JAPAN_TEAM_ID } from "@/config/competitions";
import { japaneseName } from "@/config/players";
import type { Appearance, Competition, Match, Player, PositionGroup, Snapshot, Team } from "@/lib/types";
import { createGate, fetchJson } from "../http";
import { slugify } from "../fotmob/normalize";
import type { DataProvider, RosterEntry } from "../types";

const BASE = "https://v3.football.api-sports.io";
const IDS_FILE = path.join(process.cwd(), "data", "api-football-ids.json");
const gate = createGate(2, 700);

/** FotMob league id → API-Football league id. */
const LEAGUE_MAP: Record<number, number> = {
  47: 39, 87: 140, 54: 78, 55: 135, 53: 61, 57: 88, 40: 144, 64: 179, 61: 94,
  42: 2, 73: 3, 10216: 848,
};
const REVERSE_LEAGUE = Object.fromEntries(Object.entries(LEAGUE_MAP).map(([fm, af]) => [af, Number(fm)]));

interface AfEnvelope<T> {
  response: T;
  errors: unknown;
  paging?: { current: number; total: number };
}

interface AfPlayerStats {
  player: { id: number; name: string; firstname: string; lastname: string; age: number; birth?: { date: string }; height?: string; nationality?: string };
  statistics: {
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string };
    games: { position?: string; number?: number | null };
  }[];
}

interface AfFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; round?: string };
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
  goals: { home: number | null; away: number | null };
}

interface AfFixturePlayers {
  team: { id: number; name: string };
  players: {
    player: { id: number; name: string };
    statistics: {
      games: { minutes: number | null; rating: string | null; substitute: boolean };
      shots: { total: number | null; on: number | null };
      goals: { total: number | null; assists: number | null };
      passes: { total: number | null; key: number | null; accuracy: string | null };
      dribbles: { success: number | null };
      tackles: { total: number | null; interceptions: number | null };
      cards: { yellow: number; red: number };
    }[];
  }[];
}

class Budget {
  constructor(public remaining: number) {}
  take() {
    if (this.remaining <= 0) throw new Error("API-Football request budget exhausted for this run");
    this.remaining--;
  }
}

function makeClient(key: string, budget: Budget) {
  return async function get<T>(p: string): Promise<T> {
    budget.take();
    const body = await gate(() => fetchJson<AfEnvelope<T>>(`${BASE}/${p}`, { headers: { "x-apisports-key": key } }));
    const errs = body.errors;
    if (errs && (Array.isArray(errs) ? errs.length : Object.keys(errs as object).length)) {
      throw new Error(`API-Football error: ${JSON.stringify(errs)}`);
    }
    return body.response;
  };
}

const group = (pos?: string): PositionGroup =>
  pos === "Goalkeeper" ? "GK" : pos === "Defender" ? "DEF" : pos === "Attacker" ? "FWD" : "MID";

const seasonYear = (season: string) => Number(season.slice(0, 4));

export const apiFootball: DataProvider = {
  name: "api-football",

  async discover() {
    // Nationality search across whole leagues costs hundreds of requests;
    // discovery always runs on FotMob and this provider maps ids from it.
    return [];
  },

  async buildSnapshot(roster: RosterEntry[], { season, seasonStart, previous, log }): Promise<Snapshot> {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) throw new Error("API_FOOTBALL_KEY is not set");
    const budget = new Budget(Number(process.env.API_FOOTBALL_BUDGET ?? 95));
    const get = makeClient(key, budget);
    const year = seasonYear(season);

    // 1. Map FotMob ids → API-Football ids (cached forever).
    let ids: Record<string, number> = {};
    try {
      ids = JSON.parse(await fs.readFile(IDS_FILE, "utf8"));
    } catch {}
    for (const entry of roster) {
      if (ids[entry.id] || !entry.name) continue;
      const league = LEAGUE_MAP[entry.leagueId];
      if (!league) continue;
      const surname = entry.name.split(" ").slice(-1)[0];
      try {
        const res = await get<AfPlayerStats[]>(`players?search=${encodeURIComponent(surname)}&league=${league}&season=${year}`);
        const hit = res.find((r) => r.player.nationality === "Japan");
        if (hit) ids[entry.id] = hit.player.id;
      } catch (err) {
        log(`  ! id lookup ${entry.name}: ${(err as Error).message}`);
        break;
      }
    }
    await fs.writeFile(IDS_FILE, JSON.stringify(ids, null, 2) + "\n");

    const competitions: Record<string, Competition> = {};
    const teams: Record<string, Team> = {};
    const matches: Record<string, Match> = { ...(previous?.provider === "api-football" ? previous.matches : {}) };
    const prevPlayers = new Map((previous?.provider === "api-football" ? previous.players : []).map((p) => [p.id, p]));
    const players: Player[] = [];

    const fmLeague = (afId: number) => REVERSE_LEAGUE[afId] ?? afId;

    for (const entry of roster) {
      const afId = ids[entry.id];
      if (!afId) continue;
      const prev = prevPlayers.get(entry.id);
      try {
        const [stats] = await get<AfPlayerStats[]>(`players?id=${afId}&season=${year}`);
        if (!stats) continue;
        const club = stats.statistics.find((s) => s.team.id !== JAPAN_TEAM_ID) ?? stats.statistics[0];
        teams[club.team.id] = { id: club.team.id, name: club.team.name, shortName: club.team.name, color: "#8E8E93", logo: club.team.logo };

        const fixtures = await get<AfFixture[]>(
          `fixtures?team=${club.team.id}&season=${year}&from=${seasonStart}&to=${new Date().toISOString().slice(0, 10)}`,
        );
        const appearances: Appearance[] = [...(prev?.appearances ?? [])];
        const known = new Set(appearances.map((a) => a.matchId));

        for (const f of fixtures.filter((x) => ["FT", "AET", "PEN"].includes(x.fixture.status.short))) {
          const compId = fmLeague(f.league.id);
          competitions[compId] ??= classifyCompetition(compId, f.league.name, false);
          for (const side of [f.teams.home, f.teams.away]) {
            teams[side.id] ??= { id: side.id, name: side.name, shortName: side.name, color: "#8E8E93", logo: side.logo };
          }
          matches[f.fixture.id] = {
            id: f.fixture.id,
            date: f.fixture.date,
            competitionId: compId,
            round: f.league.round ?? null,
            home: { id: f.teams.home.id, name: f.teams.home.name, score: f.goals.home },
            away: { id: f.teams.away.id, name: f.teams.away.name, score: f.goals.away },
            finished: true,
            highlight: null,
            url: null,
          };
          if (known.has(f.fixture.id) || budget.remaining < 2) continue;

          const lines = await get<AfFixturePlayers[]>(`fixtures/players?fixture=${f.fixture.id}&team=${club.team.id}`);
          const row = lines.flatMap((t) => t.players).find((p) => p.player.id === afId);
          if (!row) continue;
          const s = row.statistics[0];
          const minutes = s.games.minutes ?? 0;
          appearances.push({
            matchId: f.fixture.id,
            teamId: club.team.id,
            started: !s.games.substitute,
            unusedSub: minutes === 0,
            minutes,
            goals: s.goals.total ?? 0,
            assists: s.goals.assists ?? 0,
            rating: s.games.rating ? Number(s.games.rating) : null,
            isTopRating: false,
            playerOfTheMatch: false,
            yellowCards: s.cards.yellow,
            redCards: s.cards.red,
            xg: null,
            xa: null,
            shots: s.shots.total,
            shotsOnTarget: s.shots.on,
            chancesCreated: s.passes.key,
            touches: null,
            passesCompleted: null,
            passesAttempted: s.passes.total,
            dribblesWon: s.dribbles.success,
            defensiveActions: (s.tackles.total ?? 0) + (s.tackles.interceptions ?? 0),
            goalMinutes: [],
            assistMinutes: [],
          });
        }

        appearances.sort((a, b) => (matches[b.matchId]?.date ?? "").localeCompare(matches[a.matchId]?.date ?? ""));
        const p = stats.player;
        players.push({
          id: entry.id,
          slug: prev?.slug ?? slugify(p.name),
          name: entry.name || p.name,
          firstName: p.firstname,
          lastName: p.lastname,
          nameJa: japaneseName(entry.id, entry.name || p.name),
          birthDate: p.birth?.date ?? null,
          age: p.age,
          heightCm: p.height ? parseInt(p.height, 10) || null : null,
          shirtNumber: club.games.number ?? null,
          preferredFoot: null,
          position: club.games.position ?? "Player",
          positionShort: (club.games.position ?? "").slice(0, 3).toUpperCase(),
          positionGroup: group(club.games.position),
          teamId: club.team.id,
          leagueId: entry.leagueId,
          onLoan: false,
          contractEnd: null,
          marketValueEur: null,
          injury: null,
          traits: [],
          nextMatch: null,
          appearances,
        });
        log(`  ✓ ${p.name}: ${appearances.length} matches (budget left ${budget.remaining})`);
      } catch (err) {
        log(`  ! ${entry.name}: ${(err as Error).message}`);
        if (budget.remaining <= 0) break;
      }
    }

    for (const pl of players) {
      competitions[pl.leagueId] ??= classifyCompetition(pl.leagueId, "", false);
    }

    return {
      version: 1,
      provider: "api-football",
      generatedAt: new Date().toISOString(),
      season,
      seasonStart,
      competitions,
      teams,
      matches,
      players,
    };
  },
};
