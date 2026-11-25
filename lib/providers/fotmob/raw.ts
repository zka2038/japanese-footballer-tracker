/**
 * Partial shapes of FotMob's undocumented JSON (only the fields we read).
 * Everything is optional on purpose: the API changes without notice and the
 * normalizer must degrade gracefully instead of crashing the sync.
 */

export interface FmInfoValue {
  numberValue?: number;
  key?: string | null;
  fallback?: string | number;
}

export interface FmRecentMatch {
  id: number;
  teamId: number;
  teamName: string;
  opponentTeamId: number;
  opponentTeamName: string;
  isHomeTeam: boolean;
  matchDate?: { utcTime: string };
  matchPageUrl?: string;
  leagueId: number;
  leagueName: string;
  homeScore?: number | null;
  awayScore?: number | null;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  ratingProps?: { rating?: string | number; isTopRating?: boolean };
  playerOfTheMatch?: boolean;
  onBench?: boolean;
  playedInMatch?: boolean;
}

export interface FmPlayerData {
  id: number;
  name: string;
  birthDate?: { utcTime: string } | null;
  contractEnd?: { utcTime: string } | null;
  primaryTeam?: {
    teamId: number;
    teamName: string;
    onLoan?: boolean;
    teamColors?: { color?: string };
  } | null;
  positionDescription?: {
    positions?: {
      strPos?: { label: string; key: string };
      strPosShort?: { label: string; key: string };
      isMainPosition?: boolean;
    }[];
    primaryPosition?: { label: string; key: string };
  } | null;
  injuryInformation?: {
    name?: string;
    expectedReturn?: { expectedReturnFallback?: string; expectedReturnDateParam?: string } | null;
  } | null;
  playerInformation?: { title: string; translationKey?: string; value: FmInfoValue }[];
  mainLeague?: { leagueId: number; leagueName: string; season: string } | null;
  recentMatches?: FmRecentMatch[];
  traits?: { items?: { key: string; title: string; value: number }[] } | null;
  meta?: { seopath?: string } | null;
  marketValues?: { values?: { date: string; value: number; currency: string }[] } | null;
  nextMatch?: {
    matchId: number;
    homeId: number;
    awayId: number;
    homeName: string;
    awayName: string;
    matchDate: string;
    leagueId: number;
    parentLeagueId?: number;
    leagueName: string;
    status?: { cancelled?: boolean };
  } | null;
}

export interface FmStatValue {
  key: string | null;
  stat: { value: number | string | null; total?: number; type: string };
}

export interface FmLineupPlayer {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  shirtNumber?: string;
  performance?: {
    rating?: number;
    substitutionEvents?: { time: number; type: "subIn" | "subOut" }[];
  };
}

export interface FmLineupTeam {
  id: number;
  name: string;
  starters?: FmLineupPlayer[];
  subs?: FmLineupPlayer[];
}

export interface FmEvent {
  type: string;
  time?: number;
  overloadTime?: number | null;
  playerId?: number;
  player?: { id: number; name: string };
  assistPlayerId?: number | null;
  ownGoal?: boolean | null;
  isPenaltyShootoutEvent?: boolean;
}

export interface FmMatchDetails {
  general?: {
    matchId: string | number;
    leagueId: number;
    parentLeagueId?: number;
    leagueName: string;
    countryCode?: string;
    leagueRoundName?: string;
    matchRound?: string;
    matchTimeUTCDate: string;
    finished?: boolean;
    homeTeam: { id: number; name: string };
    awayTeam: { id: number; name: string };
    teamColors?: { lightMode?: { home?: string; away?: string } };
  };
  header?: {
    teams?: { id: number; name: string; score?: number | null }[];
    status?: { finished?: boolean; cancelled?: boolean };
  };
  seo?: { path?: string };
  content?: {
    matchFacts?: {
      highlights?: { url?: string; image?: string; source?: string } | null;
      playerOfTheMatch?: { id?: number } | null;
      events?: { events?: FmEvent[] } | null;
    } | null;
    lineup?: { homeTeam?: FmLineupTeam; awayTeam?: FmLineupTeam } | null;
    playerStats?: Record<
      string,
      {
        id: number;
        name: string;
        teamId: number;
        stats?: { key: string; stats: Record<string, FmStatValue> }[];
      }
    > | null;
  };
}

export interface FmTableRow {
  id: number;
  name: string;
  shortName?: string;
}

export interface FmTableData {
  leagueId: number;
  table?: { all?: FmTableRow[] };
  tables?: { table?: { all?: FmTableRow[] } }[];
}

export interface FmSquadMember {
  id: number;
  name: string;
  ccode?: string;
  role?: { key: string };
  excludeFromRanking?: boolean;
}

export interface FmTeamData {
  details?: { id: number; name: string; shortName?: string };
  squad?: { squad?: { title: string; members: FmSquadMember[] }[] };
}
