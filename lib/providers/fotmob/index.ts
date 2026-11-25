import fs from "node:fs/promises";
import path from "node:path";
import { classifyCompetition, isExcludedCompetition, JAPAN_TEAM_ID } from "@/config/competitions";
import { japaneseName } from "@/config/players";
import type { Competition, Match, Player, Snapshot, Team } from "@/lib/types";
import { createGate, fetchJson } from "../http";
import type { DataProvider, RosterEntry } from "../types";
import { buildAppearance, extractMatch, matchFromRecent, normalizeProfile, type ExtractedMatch } from "./normalize";
import type { FmMatchDetails, FmPlayerData, FmTableData, FmTeamData } from "./raw";

const BASE = "https://www.fotmob.com/api/data";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-GB,en;q=0.9",
};

const MATCH_CACHE_DIR = path.join(process.cwd(), "data", "matches");
const gate = createGate(4, 150);
const get = <T>(p: string) => gate(() => fetchJson<T>(`${BASE}/${p}`, { headers: HEADERS }));

/** Bump when ExtractedMatch changes shape so cached files are re-extracted. */
const CACHE_SCHEMA = 2;

interface CachedMatch extends ExtractedMatch {
  fetchedAt: string;
  schema?: number;
}

async function readCachedMatch(id: number): Promise<CachedMatch | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(MATCH_CACHE_DIR, `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

async function writeCachedMatch(m: CachedMatch) {
  await fs.mkdir(MATCH_CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(MATCH_CACHE_DIR, `${m.match.id}.json`), JSON.stringify(m));
}

/** Finished matches are immutable, except highlights can land a few days late. */
function isStale(cached: CachedMatch, now: number): boolean {
  if (cached.schema !== CACHE_SCHEMA) return true;
  if (!cached.match.finished) return true;
  const age = now - new Date(cached.match.date).getTime();
  const fetchedAgo = now - new Date(cached.fetchedAt).getTime();
  const fiveDays = 5 * 864e5;
  return !cached.match.highlight && age < fiveDays && fetchedAgo > 3 * 36e5;
}

async function getMatch(id: number, rosterIds: Set<number>, now: number): Promise<ExtractedMatch | null> {
  const cached = await readCachedMatch(id);
  if (cached && !isStale(cached, now)) return cached;
  try {
    const raw = await get<FmMatchDetails>(`matchDetails?matchId=${id}`);
    const extracted = extractMatch(raw, rosterIds);
    if (!extracted) return cached;
    const record: CachedMatch = { ...extracted, fetchedAt: new Date(now).toISOString(), schema: CACHE_SCHEMA };
    await writeCachedMatch(record);
    return record;
  } catch {
    return cached; // keep whatever we had
  }
}

function tableRows(t: FmTableData) {
  if (t.table?.all) return t.table.all;
  return (t.tables ?? []).flatMap((x) => x.table?.all ?? []);
}

export const fotmob: DataProvider = {
  name: "fotmob",

  async discover(leagueIds, log) {
    const found = new Map<number, RosterEntry>();
    for (const leagueId of leagueIds) {
      const tl = await get<{ data: FmTableData }[]>(`tltable?leagueId=${leagueId}`);
      const teams = new Map<number, string>();
      for (const block of tl) for (const row of tableRows(block.data)) teams.set(row.id, row.name);
      log(`  league ${leagueId}: ${teams.size} clubs`);

      await Promise.all(
        [...teams].map(async ([teamId, teamName]) => {
          try {
            const team = await get<FmTeamData>(`teams?id=${teamId}`);
            for (const group of team.squad?.squad ?? []) {
              if (group.title === "coach") continue;
              for (const m of group.members) {
                if (m.ccode !== "JPN" || m.role?.key === "coach") continue;
                found.set(m.id, { id: m.id, name: m.name, teamId, teamName, leagueId });
                log(`    + ${m.name} (${teamName})`);
              }
            }
          } catch (err) {
            log(`    ! team ${teamId} failed: ${(err as Error).message}`);
          }
        }),
      );
    }
    return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
  },

  async buildSnapshot(roster, { season, seasonStart, log }) {
    const now = Date.now();
    const startMs = new Date(seasonStart).getTime();
    const rosterIds = new Set(roster.map((r) => r.id));

    const competitions: Record<string, Competition> = {};
    const teams: Record<string, Team> = {};
    const matches: Record<string, Match> = {};
    const players: Player[] = [];

    const addTeam = (t: Team, preferColor = false) => {
      const existing = teams[t.id];
      if (!existing || preferColor) teams[t.id] = { ...existing, ...t };
    };

    const profiles = await Promise.all(
      roster.map(async (entry) => {
        try {
          return { entry, raw: await get<FmPlayerData>(`playerData?id=${entry.id}`) };
        } catch (err) {
          log(`  ! player ${entry.name} failed: ${(err as Error).message}`);
          return null;
        }
      }),
    );

    for (const p of profiles) {
      if (!p) continue;
      const { entry, raw } = p;
      const profile = normalizeProfile(raw, { leagueId: entry.leagueId, nameJa: japaneseName(raw.id, raw.name) });
      if (raw.primaryTeam) {
        addTeam(
          {
            id: raw.primaryTeam.teamId,
            name: raw.primaryTeam.teamName,
            shortName: entry.teamId === raw.primaryTeam.teamId ? entry.teamName : raw.primaryTeam.teamName,
            color: raw.primaryTeam.teamColors?.color ?? "#8E8E93",
          },
          true,
        );
      }

      const recent = (raw.recentMatches ?? []).filter((m) => {
        const t = new Date(m.matchDate?.utcTime ?? 0).getTime();
        return t >= startMs && t <= now;
      });

      const details = await Promise.all(recent.map((m) => getMatch(m.id, rosterIds, now)));
      const appearances = recent.flatMap((r, i) => {
        const d = details[i];
        const isNational = r.teamId === JAPAN_TEAM_ID || r.teamName.startsWith("Japan");
        const compName = d?.competition.name ?? r.leagueName;
        const country = d?.competition.countryCode ?? "";
        if (isExcludedCompetition(compName, country, isNational)) return [];
        const compId = d?.competition.id ?? r.leagueId;
        if (!competitions[compId]) {
          competitions[compId] = classifyCompetition(compId, compName, isNational, country);
        }
        if (d) {
          matches[d.match.id] = d.match;
          for (const t of d.teams) addTeam(t);
        } else if (!matches[r.id]) {
          matches[r.id] = matchFromRecent(r);
          addTeam({ id: r.teamId, name: r.teamName, shortName: r.teamName, color: "#8E8E93" });
          addTeam({ id: r.opponentTeamId, name: r.opponentTeamName, shortName: r.opponentTeamName, color: "#8E8E93" });
        }
        return [buildAppearance(r, d?.lines[String(entry.id)])];
      });

      appearances.sort((a, b) => (matches[b.matchId]?.date ?? "").localeCompare(matches[a.matchId]?.date ?? ""));
      players.push({ ...profile, appearances });
      log(`  ✓ ${profile.name}: ${appearances.length} matches`);
    }

    // Make sure every referenced competition exists (e.g. for next fixtures).
    for (const pl of players) {
      const nm = pl.nextMatch;
      if (nm && !competitions[nm.competitionId]) {
        const national = nm.homeId === JAPAN_TEAM_ID || nm.awayId === JAPAN_TEAM_ID;
        competitions[nm.competitionId] = classifyCompetition(nm.competitionId, nm.competitionName, national);
      }
      if (!competitions[pl.leagueId]) competitions[pl.leagueId] = classifyCompetition(pl.leagueId, "", false);
    }

    return {
      version: 1,
      provider: "fotmob",
      generatedAt: new Date(now).toISOString(),
      season,
      seasonStart,
      competitions,
      teams,
      matches,
      players: players.sort((a, b) => a.name.localeCompare(b.name)),
    };
  },
};
