/**
 * Read-only query layer over the committed snapshot. Server-only: pages call
 * these and pass small serializable view models down to client components.
 */
import raw from "@/data/snapshot.json";
import { TRACKED_LEAGUES } from "@/config/competitions";
import { aggregate, inScope, type Scope, type Totals } from "./stats";
import type { Appearance, Competition, Highlight, Match, Player, Snapshot, Team } from "./types";

const snap = raw as unknown as Snapshot;

export const snapshot = () => snap;
export const generatedAt = () => snap.generatedAt;

const UNKNOWN_TEAM: Team = { id: 0, name: "Unknown", shortName: "Unknown", color: "#8E8E93" };

export const team = (id: number): Team => snap.teams[id] ?? { ...UNKNOWN_TEAM, id };
/** Display name for a team, falling back to a provider-supplied name for teams we never stored. */
export const teamName = (id: number, fallback: string) => snap.teams[id]?.shortName || snap.teams[id]?.name || fallback;
export const competition = (id: number): Competition =>
  snap.competitions[id] ?? { id, name: "Other", shortName: "Other", country: "", kind: "other" };
export const match = (id: number): Match | undefined => snap.matches[id];

export const players = (): Player[] => snap.players;
export const playerBySlug = (slug: string) => snap.players.find((p) => p.slug === slug);

export function appsInScope(p: Player, scope: Scope): Appearance[] {
  return p.appearances.filter((a) => {
    const m = snap.matches[a.matchId];
    return m && inScope(competition(m.competitionId).kind, scope);
  });
}

export const totals = (p: Player, scope: Scope = "club"): Totals => aggregate(appsInScope(p, scope));

// ---------------------------------------------------------------------------
// View models

export type Result = "W" | "D" | "L";

export interface Performance {
  playerId: number;
  slug: string;
  name: string;
  lastName: string;
  nameJa: string | null;
  matchId: number;
  date: string;
  competitionId: number;
  competition: string;
  competitionKind: Competition["kind"];
  teamId: number;
  teamName: string;
  opponentId: number;
  opponentName: string;
  home: boolean;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: Result | null;
  started: boolean;
  unusedSub: boolean;
  minutes: number;
  goals: number;
  assists: number;
  rating: number | null;
  isTopRating: boolean;
  playerOfTheMatch: boolean;
  yellowCards: number;
  redCards: number;
  xg: number | null;
  xa: number | null;
  shots: number | null;
  chancesCreated: number | null;
  goalMinutes: number[];
  assistMinutes: number[];
  highlight: Highlight | null;
  matchUrl: string | null;
}

/** Every appearance for one player (including unused-substitute rows), newest first. */
export function playerPerformances(p: Player): Performance[] {
  return p.appearances.map((a) => toPerformance(p, a)).filter((x): x is Performance => x !== null);
}

export function toPerformance(p: Player, a: Appearance): Performance | null {
  const m = snap.matches[a.matchId];
  if (!m) return null;
  const home = m.home.id === a.teamId;
  const us = home ? m.home : m.away;
  const them = home ? m.away : m.home;
  const comp = competition(m.competitionId);
  const gf = us.score;
  const ga = them.score;
  const result: Result | null = gf === null || ga === null || !m.finished ? null : gf > ga ? "W" : gf < ga ? "L" : "D";
  return {
    playerId: p.id,
    slug: p.slug,
    name: p.name,
    lastName: p.lastName,
    nameJa: p.nameJa,
    matchId: m.id,
    date: m.date,
    competitionId: comp.id,
    competition: comp.shortName,
    competitionKind: comp.kind,
    teamId: us.id,
    teamName: teamName(us.id, us.name),
    opponentId: them.id,
    opponentName: teamName(them.id, them.name),
    home,
    goalsFor: gf,
    goalsAgainst: ga,
    result,
    started: a.started,
    unusedSub: a.unusedSub,
    minutes: a.minutes,
    goals: a.goals,
    assists: a.assists,
    rating: a.rating,
    isTopRating: a.isTopRating,
    playerOfTheMatch: a.playerOfTheMatch,
    yellowCards: a.yellowCards,
    redCards: a.redCards,
    xg: a.xg,
    xa: a.xa,
    shots: a.shots,
    chancesCreated: a.chancesCreated,
    goalMinutes: a.goalMinutes,
    assistMinutes: a.assistMinutes,
    highlight: m.highlight,
    matchUrl: m.url ? `https://www.fotmob.com${m.url.startsWith("/") ? "" : "/"}${m.url}` : null,
  };
}

/** Every played appearance across all players, newest first. */
export function allPerformances(scope: Scope = "all"): Performance[] {
  const out: Performance[] = [];
  for (const p of snap.players) {
    for (const a of appsInScope(p, scope)) {
      if (a.unusedSub) continue;
      const perf = toPerformance(p, a);
      if (perf) out.push(perf);
    }
  }
  return out.sort((x, y) => y.date.localeCompare(x.date) || (y.rating ?? 0) - (x.rating ?? 0));
}

const DAY = 864e5;

const standoutScore = (p: Performance) => (p.rating ?? 0) + (p.goals + p.assists) * 0.35;

/** Best performances within `days` of the snapshot time. */
export function standouts(days = 7, limit = 12): Performance[] {
  const cutoff = new Date(snap.generatedAt).getTime() - days * DAY;
  return allPerformances("all")
    .filter((p) => new Date(p.date).getTime() >= cutoff && p.rating !== null)
    // Rating first, with a nudge for goal contributions.
    .sort((a, b) => standoutScore(b) - standoutScore(a))
    .slice(0, limit);
}

export interface PlayerCardData {
  id: number;
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
  nameJa: string | null;
  age: number | null;
  position: string;
  positionShort: string;
  positionGroup: Player["positionGroup"];
  teamId: number;
  teamName: string;
  teamColor: string;
  leagueId: number;
  leagueName: string;
  injured: boolean;
  totals: Totals;
  /** Last five club ratings, oldest → newest. */
  form: (number | null)[];
  lastPlayed: string | null;
}

export function playerCard(p: Player, scope: Scope = "club"): PlayerCardData {
  const t = team(p.teamId);
  const played = appsInScope(p, "club").filter((a) => !a.unusedSub);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    firstName: p.firstName,
    lastName: p.lastName,
    nameJa: p.nameJa,
    age: p.age,
    position: p.position,
    positionShort: p.positionShort,
    positionGroup: p.positionGroup,
    teamId: p.teamId,
    teamName: t.shortName || t.name,
    teamColor: t.color,
    leagueId: p.leagueId,
    leagueName: competition(p.leagueId).shortName,
    injured: Boolean(p.injury),
    totals: totals(p, scope),
    form: played
      .slice(0, 5)
      .map((a) => a.rating)
      .reverse(),
    lastPlayed: played[0] ? (snap.matches[played[0].matchId]?.date ?? null) : null,
  };
}

export const playerCards = (scope: Scope = "club") => snap.players.map((p) => playerCard(p, scope));

export const trackedLeagues = () =>
  TRACKED_LEAGUES.map((l) => ({ ...l, players: snap.players.filter((p) => p.leagueId === l.id).length })).filter(
    (l) => l.players > 0,
  );

// ---------------------------------------------------------------------------
// Matches & fixtures

export interface MatchDigest {
  match: Match;
  competition: Competition;
  performances: Performance[];
}

/** Finished matches involving at least one tracked player who played, newest first. */
export function matchDigests(): MatchDigest[] {
  const byMatch = new Map<number, Performance[]>();
  for (const perf of allPerformances("all")) {
    byMatch.set(perf.matchId, [...(byMatch.get(perf.matchId) ?? []), perf]);
  }
  return [...byMatch.entries()]
    .map(([id, perfs]) => ({
      match: snap.matches[id],
      competition: competition(snap.matches[id].competitionId),
      performances: perfs.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    }))
    .filter((d) => d.match.finished)
    .sort((a, b) => b.match.date.localeCompare(a.match.date));
}

export interface Fixture {
  matchId: number;
  date: string;
  competitionId: number;
  competition: string;
  home: { id: number; name: string };
  away: { id: number; name: string };
  players: { slug: string; name: string; lastName: string; id: number }[];
}

export function upcomingFixtures(days = 14): Fixture[] {
  const now = new Date(snap.generatedAt).getTime();
  const map = new Map<number, Fixture>();
  for (const p of snap.players) {
    const nm = p.nextMatch;
    if (!nm) continue;
    const t = new Date(nm.date).getTime();
    if (t < now - 3 * 36e5 || t > now + days * DAY) continue;
    const f = map.get(nm.matchId) ?? {
      matchId: nm.matchId,
      date: nm.date,
      competitionId: nm.competitionId,
      competition: competition(nm.competitionId).shortName || nm.competitionName,
      home: { id: nm.homeId, name: teamName(nm.homeId, nm.homeName) },
      away: { id: nm.awayId, name: teamName(nm.awayId, nm.awayName) },
      players: [],
    };
    f.players.push({ slug: p.slug, name: p.name, lastName: p.lastName, id: p.id });
    map.set(nm.matchId, f);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// Highlights

export interface HighlightItem {
  matchId: number;
  date: string;
  competition: string;
  home: { id: number; name: string; score: number | null };
  away: { id: number; name: string; score: number | null };
  highlight: Highlight;
  involvements: Pick<Performance, "playerId" | "slug" | "name" | "lastName" | "goals" | "assists" | "rating" | "goalMinutes" | "assistMinutes">[];
}

/** Match highlight videos where a tracked player scored or assisted. */
export function highlightFeed(): HighlightItem[] {
  return matchDigests()
    .filter((d) => d.match.highlight && d.performances.some((p) => p.goals + p.assists > 0))
    .map((d) => ({
      matchId: d.match.id,
      date: d.match.date,
      competition: d.competition.shortName,
      home: { ...d.match.home, name: teamName(d.match.home.id, d.match.home.name) },
      away: { ...d.match.away, name: teamName(d.match.away.id, d.match.away.name) },
      highlight: d.match.highlight!,
      involvements: d.performances
        .filter((p) => p.goals + p.assists > 0)
        .map(({ playerId, slug, name, lastName, goals, assists, rating, goalMinutes, assistMinutes }) => ({
          playerId,
          slug,
          name,
          lastName,
          goals,
          assists,
          rating,
          goalMinutes,
          assistMinutes,
        })),
    }));
}

// ---------------------------------------------------------------------------
// Season headline numbers

export function seasonHeadline() {
  const cards = playerCards("club");
  const sum = (f: (t: Totals) => number) => cards.reduce((n, c) => n + f(c.totals), 0);
  return {
    players: cards.length,
    leagues: new Set(cards.map((c) => c.leagueId)).size,
    goals: sum((t) => t.goals),
    assists: sum((t) => t.assists),
    minutes: sum((t) => t.minutes),
    apps: sum((t) => t.apps),
  };
}

// ---------------------------------------------------------------------------
// Leaderboards

export type Metric = "goals" | "assists" | "ga" | "avgRating" | "minutes" | "ga90" | "xg" | "xa" | "apps" | "potm";

export const METRICS: { id: Metric; label: string; short: string; decimals: number; minMinutes: number; hint?: string }[] = [
  { id: "ga", label: "Goal contributions", short: "G+A", decimals: 0, minMinutes: 0 },
  { id: "goals", label: "Goals", short: "Goals", decimals: 0, minMinutes: 0 },
  { id: "assists", label: "Assists", short: "Assists", decimals: 0, minMinutes: 0 },
  { id: "avgRating", label: "Average rating", short: "Rating", decimals: 2, minMinutes: 450, hint: "Minimum 450 minutes" },
  { id: "ga90", label: "G+A per 90", short: "G+A/90", decimals: 2, minMinutes: 450, hint: "Minimum 450 minutes" },
  { id: "xg", label: "Expected goals", short: "xG", decimals: 2, minMinutes: 0 },
  { id: "xa", label: "Expected assists", short: "xA", decimals: 2, minMinutes: 0 },
  { id: "minutes", label: "Minutes played", short: "Minutes", decimals: 0, minMinutes: 0 },
  { id: "apps", label: "Appearances", short: "Apps", decimals: 0, minMinutes: 0 },
  { id: "potm", label: "Player of the match", short: "POTM", decimals: 0, minMinutes: 0 },
];

export const metricValue = (t: Totals, m: Metric): number | null => t[m];

/** Ranked player cards for a metric. Ties break on minutes (fewer is better). */
export function leaders(metric: Metric, scope: Scope = "club", limit = 10): PlayerCardData[] {
  const def = METRICS.find((m) => m.id === metric)!;
  return playerCards(scope)
    .filter((c) => c.totals.minutes >= def.minMinutes && (metricValue(c.totals, metric) ?? 0) > 0)
    .sort(
      (a, b) =>
        (metricValue(b.totals, metric) ?? 0) - (metricValue(a.totals, metric) ?? 0) || a.totals.minutes - b.totals.minutes,
    )
    .slice(0, limit);
}
