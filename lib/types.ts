/**
 * Normalized data model. Every provider (FotMob, API-Football) maps into these
 * types, and the site only ever reads `Snapshot`.
 */

/** league = tracked top flight, other = lower tier / reserve football. */
export type CompetitionKind = "league" | "europe" | "cup" | "national" | "other";

export interface Competition {
  id: number;
  name: string;
  shortName: string;
  country: string; // ISO-ish code used by the provider, e.g. ENG, ESP, INT
  kind: CompetitionKind;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  color: string; // hex
  /** Absolute logo URL. When absent the UI derives it from the FotMob team id. */
  logo?: string;
}

export type PositionGroup = "GK" | "DEF" | "MID" | "FWD";

export interface Injury {
  name: string;
  expectedReturn: string | null;
}

export interface Trait {
  key: string;
  title: string;
  value: number; // 0..1 percentile vs positional peers
}

export interface NextMatch {
  matchId: number;
  date: string; // ISO
  competitionId: number;
  competitionName: string;
  homeId: number;
  homeName: string;
  awayId: number;
  awayName: string;
}

/** One player's involvement in one match. */
export interface Appearance {
  matchId: number;
  teamId: number;
  /** Starting XI. */
  started: boolean;
  /** Named in the squad but did not come on. */
  unusedSub: boolean;
  minutes: number;
  goals: number;
  assists: number;
  rating: number | null;
  isTopRating: boolean;
  playerOfTheMatch: boolean;
  yellowCards: number;
  redCards: number;
  // Detailed stats. Null when the provider has no deep coverage for the match.
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
  /** Minutes of goals scored / assisted in this match. */
  goalMinutes: number[];
  assistMinutes: number[];
}

export interface Highlight {
  provider: "youtube";
  videoId: string;
  url: string;
  thumbnail: string;
}

export interface MatchTeamSide {
  id: number;
  name: string;
  score: number | null;
}

export interface Match {
  id: number;
  date: string; // ISO
  competitionId: number;
  round: string | null;
  home: MatchTeamSide;
  away: MatchTeamSide;
  finished: boolean;
  highlight: Highlight | null;
  /** FotMob page path, for an outbound "full match centre" link. */
  url: string | null;
}

export interface Player {
  id: number;
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
  nameJa: string | null;
  birthDate: string | null;
  age: number | null;
  heightCm: number | null;
  shirtNumber: number | null;
  preferredFoot: string | null;
  position: string;
  positionShort: string;
  positionGroup: PositionGroup;
  teamId: number;
  /** Primary domestic league of the player's club. */
  leagueId: number;
  onLoan: boolean;
  contractEnd: string | null;
  marketValueEur: number | null;
  injury: Injury | null;
  traits: Trait[];
  nextMatch: NextMatch | null;
  appearances: Appearance[];
}

export interface Snapshot {
  version: 1;
  provider: "fotmob" | "api-football" | "seed";
  generatedAt: string; // ISO
  season: string; // e.g. "2026/2027"
  seasonStart: string; // ISO date
  competitions: Record<string, Competition>;
  teams: Record<string, Team>;
  matches: Record<string, Match>;
  players: Player[];
}
