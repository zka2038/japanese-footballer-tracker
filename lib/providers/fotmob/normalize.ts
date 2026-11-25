import type { Appearance, Highlight, Match, Player, PositionGroup, Team, Trait } from "@/lib/types";
import type { FmLineupPlayer, FmMatchDetails, FmPlayerData, FmRecentMatch, FmStatValue } from "./raw";

/** Per-player line extracted from a match's details. Stored in the match cache. */
export interface MatchPlayerLine {
  playerId: number;
  teamId: number;
  started: boolean;
  cameOn: boolean;
  minutes: number | null;
  rating: number | null;
  xg: number | null;
  xa: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  chancesCreated: number | null;
  touches: number | null;
  passesCompleted: number | null;
  passesAttempted: number | null;
  dribblesWon: number | null;
  defensiveActions: number | null;
  goalMinutes: number[];
  assistMinutes: number[];
}

export interface ExtractedMatch {
  match: Match;
  competition: { id: number; name: string; countryCode: string };
  teams: Team[];
  /** Keyed by player id. Contains every Japanese player in the lineup. */
  lines: Record<string, MatchPlayerLine>;
}

// ---------------------------------------------------------------------------
// Players

export function positionGroup(key: string | undefined): PositionGroup {
  const k = (key ?? "").toLowerCase();
  if (k.includes("keeper")) return "GK";
  if (k.includes("back") || k.includes("defender")) return "DEF";
  if (k.includes("winger") || k.includes("striker") || k.includes("forward")) return "FWD";
  return "MID";
}

function info(raw: FmPlayerData, key: string): number | string | null {
  const item = raw.playerInformation?.find((i) => i.translationKey === key || i.title === key);
  if (!item) return null;
  return item.value.numberValue ?? item.value.fallback ?? null;
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeProfile(
  raw: FmPlayerData,
  opts: { leagueId: number; nameJa: string | null },
): Omit<Player, "appearances"> {
  const positions = raw.positionDescription?.positions ?? [];
  const main = positions.find((p) => p.isMainPosition) ?? positions[0];
  const primary = raw.positionDescription?.primaryPosition ?? main?.strPos;
  const [firstName, ...rest] = raw.name.split(" ");

  const traits: Trait[] = (raw.traits?.items ?? []).map((t) => ({
    key: t.key,
    title: t.title,
    value: Math.max(0, Math.min(1, t.value)),
  }));

  const values = raw.marketValues?.values ?? [];
  const latestValue = values.length ? values[values.length - 1] : null;

  const nm = raw.nextMatch;
  const injury = raw.injuryInformation?.name
    ? {
        name: raw.injuryInformation.name,
        expectedReturn:
          raw.injuryInformation.expectedReturn?.expectedReturnFallback ??
          raw.injuryInformation.expectedReturn?.expectedReturnDateParam ??
          null,
      }
    : null;

  const foot = info(raw, "preferred_foot");
  const height = info(raw, "height_sentencecase");
  const shirt = info(raw, "shirt");
  const age = info(raw, "age_sentencecase");

  return {
    id: raw.id,
    slug: raw.meta?.seopath || slugify(raw.name),
    name: raw.name,
    firstName: rest.length ? firstName : "",
    lastName: rest.length ? rest.join(" ") : firstName,
    nameJa: opts.nameJa,
    birthDate: raw.birthDate?.utcTime?.slice(0, 10) ?? null,
    age: typeof age === "number" ? age : age ? Number(age) || null : null,
    heightCm: typeof height === "number" ? height : null,
    shirtNumber: typeof shirt === "number" ? shirt : shirt ? Number(shirt) || null : null,
    preferredFoot: typeof foot === "string" ? foot : null,
    position: primary?.label ?? "Player",
    positionShort: main?.strPosShort?.label ?? "",
    positionGroup: positionGroup(primary?.key ?? main?.strPos?.key),
    teamId: raw.primaryTeam?.teamId ?? 0,
    leagueId: opts.leagueId,
    onLoan: Boolean(raw.primaryTeam?.onLoan),
    contractEnd: raw.contractEnd?.utcTime?.slice(0, 10) ?? null,
    marketValueEur: latestValue && latestValue.currency === "EUR" ? latestValue.value : null,
    injury,
    traits,
    nextMatch:
      nm && !nm.status?.cancelled
        ? {
            matchId: nm.matchId,
            date: new Date(nm.matchDate).toISOString(),
            competitionId: nm.parentLeagueId && nm.parentLeagueId > 0 ? nm.parentLeagueId : nm.leagueId,
            competitionName: nm.leagueName,
            homeId: nm.homeId,
            homeName: nm.homeName,
            awayId: nm.awayId,
            awayName: nm.awayName,
          }
        : null,
  };
}

// ---------------------------------------------------------------------------
// Matches

function num(v: FmStatValue | undefined): number | null {
  if (!v || v.stat.value === null || v.stat.value === undefined) return null;
  const n = Number(v.stat.value);
  return Number.isFinite(n) ? n : null;
}

function findStat(groups: { stats: Record<string, FmStatValue> }[] | undefined, key: string): FmStatValue | undefined {
  for (const g of groups ?? []) {
    for (const s of Object.values(g.stats ?? {})) {
      if (s.key === key) return s;
    }
  }
  return undefined;
}

export function parseYouTube(url: string | undefined | null): Highlight | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (!m) return null;
  const videoId = m[1];
  return {
    provider: "youtube",
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export function extractMatch(raw: FmMatchDetails, extraPlayerIds: Set<number> = new Set()): ExtractedMatch | null {
  const g = raw.general;
  if (!g) return null;
  const header = raw.header?.teams ?? [];
  const homeScore = header[0]?.score ?? null;
  const awayScore = header[1]?.score ?? null;
  const finished = Boolean(raw.header?.status?.finished ?? g.finished);
  const competitionId = g.parentLeagueId && g.parentLeagueId > 0 ? g.parentLeagueId : g.leagueId;

  const match: Match = {
    id: Number(g.matchId),
    date: g.matchTimeUTCDate,
    competitionId,
    round: g.leagueRoundName || g.matchRound || null,
    home: { id: g.homeTeam.id, name: g.homeTeam.name, score: homeScore },
    away: { id: g.awayTeam.id, name: g.awayTeam.name, score: awayScore },
    finished,
    highlight: parseYouTube(raw.content?.matchFacts?.highlights?.url),
    url: raw.seo?.path ?? null,
  };

  const colors = g.teamColors?.lightMode ?? {};
  const teams: Team[] = [
    { id: g.homeTeam.id, name: g.homeTeam.name, shortName: g.homeTeam.name, color: colors.home ?? "#8E8E93" },
    { id: g.awayTeam.id, name: g.awayTeam.name, shortName: g.awayTeam.name, color: colors.away ?? "#8E8E93" },
  ];

  // Goal and assist minutes for everyone, from the event feed.
  const events = raw.content?.matchFacts?.events?.events ?? [];
  const goalMins = new Map<number, number[]>();
  const assistMins = new Map<number, number[]>();
  for (const e of events) {
    if (e.type !== "Goal" || e.ownGoal || e.isPenaltyShootoutEvent) continue;
    const minute = e.time ?? 0;
    const scorer = e.playerId ?? e.player?.id;
    if (scorer) goalMins.set(scorer, [...(goalMins.get(scorer) ?? []), minute]);
    if (e.assistPlayerId) assistMins.set(e.assistPlayerId, [...(assistMins.get(e.assistPlayerId) ?? []), minute]);
  }

  const lines: Record<string, MatchPlayerLine> = {};
  const lineup = raw.content?.lineup;
  const sides: [number, FmLineupPlayer[], boolean][] = [];
  if (lineup?.homeTeam) {
    sides.push([lineup.homeTeam.id, lineup.homeTeam.starters ?? [], true]);
    sides.push([lineup.homeTeam.id, lineup.homeTeam.subs ?? [], false]);
  }
  if (lineup?.awayTeam) {
    sides.push([lineup.awayTeam.id, lineup.awayTeam.starters ?? [], true]);
    sides.push([lineup.awayTeam.id, lineup.awayTeam.subs ?? [], false]);
  }

  const stats = raw.content?.playerStats ?? {};
  for (const [teamId, players, started] of sides) {
    for (const p of players) {
      if (p.countryCode !== "JPN" && !extraPlayerIds.has(p.id)) continue;
      const ps = stats[String(p.id)]?.stats;
      const cameOn =
        started ||
        Boolean(p.performance?.substitutionEvents?.some((s) => s.type === "subIn")) ||
        (num(findStat(ps, "minutes_played")) ?? 0) > 0;
      const passes = findStat(ps, "accurate_passes");
      // FotMob omits shot-based stats when a player has none. If the match has
      // deep coverage (touches are recorded) a missing value really means zero.
      const deep = cameOn && num(findStat(ps, "touches")) !== null;
      const z = (v: number | null) => (v === null && deep ? 0 : v);
      lines[String(p.id)] = {
        playerId: p.id,
        teamId,
        started,
        cameOn,
        minutes: num(findStat(ps, "minutes_played")),
        rating: num(findStat(ps, "rating_title")) ?? p.performance?.rating ?? null,
        xg: z(num(findStat(ps, "expected_goals"))),
        xa: z(num(findStat(ps, "expected_assists"))),
        shots: z(num(findStat(ps, "total_shots"))),
        shotsOnTarget: z(num(findStat(ps, "ShotsOnTarget"))),
        chancesCreated: z(num(findStat(ps, "chances_created"))),
        touches: num(findStat(ps, "touches")),
        passesCompleted: num(passes),
        passesAttempted: passes?.stat.total ?? null,
        dribblesWon: num(findStat(ps, "dribbles_succeeded")),
        defensiveActions: num(findStat(ps, "defensive_actions")),
        goalMinutes: goalMins.get(p.id) ?? [],
        assistMinutes: assistMins.get(p.id) ?? [],
      };
    }
  }

  return {
    match,
    competition: { id: competitionId, name: g.leagueName, countryCode: g.countryCode ?? "" },
    teams,
    lines,
  };
}

/** Fallback match record built from a player's recent-match row when details are unavailable. */
export function matchFromRecent(r: FmRecentMatch): Match {
  const home = r.isHomeTeam
    ? { id: r.teamId, name: r.teamName }
    : { id: r.opponentTeamId, name: r.opponentTeamName };
  const away = r.isHomeTeam
    ? { id: r.opponentTeamId, name: r.opponentTeamName }
    : { id: r.teamId, name: r.teamName };
  return {
    id: r.id,
    date: r.matchDate?.utcTime ?? "",
    competitionId: r.leagueId,
    round: null,
    home: { ...home, score: r.homeScore ?? null },
    away: { ...away, score: r.awayScore ?? null },
    finished: r.homeScore !== null && r.homeScore !== undefined,
    highlight: null,
    url: r.matchPageUrl ?? null,
  };
}

function toRating(v: string | number | undefined): number | null {
  if (v === undefined || v === null || v === "" || v === 0 || v === "0") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Merges a player's recent-match row with the (optional) detailed line from match details. */
export function buildAppearance(r: FmRecentMatch, line: MatchPlayerLine | undefined): Appearance {
  // Note: FotMob's `onBench` means "started on the bench", not "unused".
  const unusedSub =
    r.playedInMatch !== undefined ? !r.playedInMatch && !(r.minutesPlayed && r.minutesPlayed > 0) : line ? !line.cameOn : false;
  const minutes = line?.minutes ?? r.minutesPlayed ?? 0;
  return {
    matchId: r.id,
    teamId: r.teamId,
    started: line ? line.started : !r.onBench && !unusedSub,
    unusedSub,
    minutes: unusedSub ? 0 : minutes,
    goals: r.goals ?? line?.goalMinutes.length ?? 0,
    assists: r.assists ?? line?.assistMinutes.length ?? 0,
    rating: toRating(r.ratingProps?.rating) ?? (unusedSub ? null : line?.rating ?? null),
    isTopRating: Boolean(r.ratingProps?.isTopRating),
    playerOfTheMatch: Boolean(r.playerOfTheMatch),
    yellowCards: r.yellowCards ?? 0,
    redCards: r.redCards ?? 0,
    xg: line?.xg ?? null,
    xa: line?.xa ?? null,
    shots: line?.shots ?? null,
    shotsOnTarget: line?.shotsOnTarget ?? null,
    chancesCreated: line?.chancesCreated ?? null,
    touches: line?.touches ?? null,
    passesCompleted: line?.passesCompleted ?? null,
    passesAttempted: line?.passesAttempted ?? null,
    dribblesWon: line?.dribblesWon ?? null,
    defensiveActions: line?.defensiveActions ?? null,
    goalMinutes: line?.goalMinutes ?? [],
    assistMinutes: line?.assistMinutes ?? [],
  };
}
