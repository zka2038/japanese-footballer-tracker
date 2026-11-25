import type { Competition } from "@/lib/types";

/**
 * Leagues we scan for Japanese players. IDs are FotMob league IDs.
 * Add a league here (e.g. 48 Championship, 146 2. Bundesliga) and run
 * `npm run discover` to pick up its players.
 */
export const TRACKED_LEAGUES: Competition[] = [
  { id: 47, name: "Premier League", shortName: "Premier League", country: "ENG", kind: "league" },
  { id: 87, name: "LaLiga", shortName: "LaLiga", country: "ESP", kind: "league" },
  { id: 54, name: "Bundesliga", shortName: "Bundesliga", country: "GER", kind: "league" },
  { id: 55, name: "Serie A", shortName: "Serie A", country: "ITA", kind: "league" },
  { id: 53, name: "Ligue 1", shortName: "Ligue 1", country: "FRA", kind: "league" },
  { id: 57, name: "Eredivisie", shortName: "Eredivisie", country: "NED", kind: "league" },
  { id: 40, name: "Belgian Pro League", shortName: "Pro League", country: "BEL", kind: "league" },
  { id: 64, name: "Scottish Premiership", shortName: "Premiership", country: "SCO", kind: "league" },
  { id: 61, name: "Liga Portugal", shortName: "Liga Portugal", country: "POR", kind: "league" },
];

export const EUROPEAN_COMPETITIONS: Competition[] = [
  { id: 42, name: "Champions League", shortName: "UCL", country: "INT", kind: "europe" },
  { id: 73, name: "Europa League", shortName: "UEL", country: "INT", kind: "europe" },
  { id: 10216, name: "Conference League", shortName: "UECL", country: "INT", kind: "europe" },
];

/** Japan national team (FotMob team id). */
export const JAPAN_TEAM_ID = 6715;

export const CURRENT_SEASON = "2026/2027";
export const SEASON_START = "2026-07-01";

const KNOWN = new Map<number, Competition>(
  [...TRACKED_LEAGUES, ...EUROPEAN_COMPETITIONS].map((c) => [c.id, c]),
);

const ADJECTIVE: Record<string, string> = {
  ENG: "English", ESP: "Spanish", GER: "German", ITA: "Italian", FRA: "French",
  NED: "Dutch", BEL: "Belgian", SCO: "Scottish", POR: "Portuguese", INT: "",
};

const EUROPE_QUALIFIERS: [RegExp, string][] = [
  [/^Champions League Qualification/i, "UCL Qual."],
  [/^Europa League Qualification/i, "UEL Qual."],
  [/^Conference League Qualification/i, "UECL Qual."],
];

const CUP = /cup|pokal|copa|coppa|ta[cç]a|coupe|beker|super|trophy|shield/i;

/** Matches we leave out entirely: club friendlies and club football outside Europe. */
export function isExcludedCompetition(name: string, countryCode: string, isNationalTeam: boolean): boolean {
  if (isNationalTeam) return false;
  if (/club friendlies/i.test(name)) return true;
  if (countryCode === "JPN" || /\bAFC\b|J\. ?League/i.test(name)) return true;
  return false;
}

/** Best-effort classification of any competition a provider hands us. */
export function classifyCompetition(
  id: number,
  name: string,
  isNationalTeam: boolean,
  countryCode = "",
): Competition {
  const known = KNOWN.get(id);
  if (known) return known;
  if (isNationalTeam) {
    return { id, name, shortName: shortenCompetition(name), country: "JPN", kind: "national" };
  }
  for (const [re, short] of EUROPE_QUALIFIERS) {
    if (re.test(name)) return { id, name, shortName: short, country: "INT", kind: "europe" };
  }
  const adjective = ADJECTIVE[countryCode] ?? "";
  // Generic names ("Cup", "Super Cup", "League Cup") read better with a country.
  const generic = /^(cup|super cup|league cup)$/i.test(name.trim());
  const fullName = generic && adjective ? `${adjective} ${name}` : name;
  return {
    id,
    name: fullName,
    shortName: shortenCompetition(fullName),
    country: countryCode,
    kind: CUP.test(name) ? "cup" : "other",
  };
}

function shortenCompetition(name: string): string {
  const map: Record<string, string> = {
    "World Cup Qualification AFC": "WCQ",
    "World Cup": "World Cup",
    "AFC Asian Cup": "Asian Cup",
    Friendlies: "Friendly",
    "Taca de Portugal": "Taça de Portugal",
    "DFB Pokal": "DFB-Pokal",
  };
  return map[name] ?? name;
}
