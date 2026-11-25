import type { Appearance, CompetitionKind } from "./types";

/** Which slice of a season to aggregate. */
export type Scope = "all" | "club" | "league" | "europe" | "cups" | "national";

export const SCOPES: { id: Scope; label: string }[] = [
  { id: "club", label: "All club" },
  { id: "league", label: "League" },
  { id: "europe", label: "Europe" },
  { id: "cups", label: "Cups" },
  { id: "national", label: "Japan" },
];

export function inScope(kind: CompetitionKind | undefined, scope: Scope): boolean {
  switch (scope) {
    case "all":
      return true;
    case "club":
      return kind !== "national";
    case "league":
      return kind === "league";
    case "europe":
      return kind === "europe";
    case "cups":
      return kind === "cup" || kind === "other";
    case "national":
      return kind === "national";
  }
}

export interface Totals {
  apps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  ga: number;
  /** Goals + assists per 90 minutes. Null below 90 minutes played. */
  ga90: number | null;
  avgRating: number | null;
  ratedApps: number;
  bestRating: number | null;
  xg: number;
  xa: number;
  /** Matches that contributed to xG/xA (deep-coverage matches). */
  xMatches: number;
  shots: number;
  chancesCreated: number;
  potm: number;
  yellowCards: number;
  redCards: number;
}

export const EMPTY_TOTALS: Totals = {
  apps: 0,
  starts: 0,
  minutes: 0,
  goals: 0,
  assists: 0,
  ga: 0,
  ga90: null,
  avgRating: null,
  ratedApps: 0,
  bestRating: null,
  xg: 0,
  xa: 0,
  xMatches: 0,
  shots: 0,
  chancesCreated: 0,
  potm: 0,
  yellowCards: 0,
  redCards: 0,
};

const round = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp;

export type StatLine = Pick<
  Appearance,
  | "unusedSub"
  | "started"
  | "minutes"
  | "goals"
  | "assists"
  | "yellowCards"
  | "redCards"
  | "playerOfTheMatch"
  | "rating"
  | "xg"
  | "xa"
  | "shots"
  | "chancesCreated"
>;

/** Aggregates appearances. Unused-substitute rows never count as appearances. */
export function aggregate(apps: StatLine[]): Totals {
  const t = { ...EMPTY_TOTALS };
  let ratingSum = 0;
  for (const a of apps) {
    if (a.unusedSub) continue;
    t.apps++;
    if (a.started) t.starts++;
    t.minutes += a.minutes;
    t.goals += a.goals;
    t.assists += a.assists;
    t.yellowCards += a.yellowCards;
    t.redCards += a.redCards;
    if (a.playerOfTheMatch) t.potm++;
    if (a.rating !== null) {
      t.ratedApps++;
      ratingSum += a.rating;
      t.bestRating = Math.max(t.bestRating ?? 0, a.rating);
    }
    if (a.xg !== null || a.xa !== null) {
      t.xMatches++;
      t.xg += a.xg ?? 0;
      t.xa += a.xa ?? 0;
    }
    t.shots += a.shots ?? 0;
    t.chancesCreated += a.chancesCreated ?? 0;
  }
  t.ga = t.goals + t.assists;
  t.ga90 = t.minutes >= 90 ? round((t.ga / t.minutes) * 90, 2) : null;
  t.avgRating = t.ratedApps ? round(ratingSum / t.ratedApps, 2) : null;
  t.xg = round(t.xg, 2);
  t.xa = round(t.xa, 2);
  return t;
}

export type RatingBand = "elite" | "good" | "average" | "poor";

/** FotMob-style rating bands. */
export function ratingBand(rating: number): RatingBand {
  if (rating >= 8) return "elite";
  if (rating >= 7) return "good";
  if (rating >= 6) return "average";
  return "poor";
}
