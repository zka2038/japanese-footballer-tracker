/**
 * Decides whether a YouTube video is the highlights of a specific match.
 * Pure and dependency-free so it can be unit tested without the network.
 */

const fold = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Club-name filler that never identifies a team on its own. */
const STOP = new Set([
  "fc", "afc", "cf", "sc", "sk", "krc", "kv", "kas", "rsc", "rc", "ac", "as", "ss", "us", "sv", "vfb", "vfl", "tsg",
  "fk", "if", "bk", "nk", "club", "de", "da", "do", "la", "le", "les", "real", "sporting", "royal", "united", "city",
  "town", "athletic", "athletico", "the", "and", "st", "saint", "sint", "sankt", "olympique", "stade", "calcio", "1",
  "04", "05", "1899", "1846", "1860", "football", "futbol", "hove", "albion",
]);

/** Extra names that commonly appear in video titles. Keys are folded names. */
const ALIASES: Record<string, string[]> = {
  "bayern munchen": ["bayern", "munich"],
  "psv eindhoven": ["psv"],
  "az alkmaar": ["az"],
  "union st gilloise": ["union sg", "usg", "union saint gilloise", "royale union"],
  "st truiden": ["stvv", "sint truiden", "sint truidense"],
  "crystal palace": ["palace"],
  "brighton hove albion": ["brighton"],
  "wolverhampton wanderers": ["wolves"],
  "tottenham hotspur": ["spurs", "tottenham"],
  "manchester united": ["man utd", "man united"],
  "manchester city": ["man city"],
  "newcastle united": ["newcastle"],
  "nottingham forest": ["forest", "nottm forest"],
  "west ham united": ["west ham"],
  "borussia monchengladbach": ["gladbach", "monchengladbach"],
  "borussia dortmund": ["dortmund", "bvb"],
  "bayer leverkusen": ["leverkusen"],
  "eintracht frankfurt": ["frankfurt"],
  "rb leipzig": ["leipzig"],
  "1 fc koln": ["koln", "cologne"],
  "inter": ["inter milan", "internazionale"],
  "paris saint germain": ["psg", "paris sg"],
  "olympique lyonnais": ["lyon"],
  "olympique marseille": ["marseille", "om"],
  "lyon": ["olympique lyonnais", "ol"],
  "club brugge": ["brugge", "bruges"],
  "cercle brugge": ["cercle"],
  "zulte waregem": ["zulte", "essevee"],
  "royal antwerp": ["antwerp"],
  "oh leuven": ["ohl", "leuven"],
  "sparta rotterdam": ["sparta"],
  "feyenoord": ["feyenoord rotterdam"],
  "ajax": ["afc ajax"],
  "go ahead eagles": ["gae"],
  "nec nijmegen": ["nec"],
  "fc twente": ["twente"],
  "fc utrecht": ["utrecht"],
  "real sociedad": ["sociedad"],
  "atletico madrid": ["atleti", "atletico"],
  "athletic club": ["athletic bilbao", "bilbao"],
  "besiktas": ["besiktas jk"],
  "japan": ["samurai blue", "jpn", "nippon"],
};

const HIGHLIGHT_WORDS =
  /\b(highlights?|extended highlights|resumen|resume|samenvatting|sintesi|zusammenfassung|melhores momentos|all goals|goals and highlights|match recap)\b/;

const REJECT_WORDS =
  /\b(reaction|reacts|fifa ?\d*|ea ?fc ?\d*|efootball|pes ?\d*|simulation|simulated|prediction|predicted|preview|watchalong|watch along|live stream|livestream|press conference|post match|pre match|fan cam|fancam|tifo|training|interview|full match|player ratings|ratings|rated|u ?1[5-9]|u ?2[0-3]|women|vrouwen|frauen|femminile|feminin)\b/;

export interface TitleMatch {
  ok: boolean;
  score: number;
  reason: string;
}

function teamKeys(name: string): string[] {
  const full = fold(name);
  const words = full.split(" ").filter((w) => w.length >= 4 && !STOP.has(w));
  return [...new Set([full, ...words, ...(ALIASES[full] ?? [])])].filter(Boolean);
}

function mentions(title: string, name: string): boolean {
  const t = ` ${title} `;
  return teamKeys(name).some((k) => t.includes(` ${k} `));
}

/** Channels that publish official highlights; a match here is a strong signal. */
const TRUSTED_CHANNEL =
  /(uefa|tnt sports|cbs sports|golazo|premier league|laliga|bundesliga|serie a|ligue 1|eredivisie|espn|pro league|jupiler|sky sports|dazn|bein|canal\+|movistar|spfl|liga portugal|sport tv|videoland|vtm|play sports|ziggo|jfa|japan football|nbc sports|paramount|amazon prime|rtl|sport1|ard|zdf|ntv|tv2|viaplay|official|fc$| fc |club)/i;

/** Scores a candidate video for a match. Both teams must be named and it must read as highlights. */
export function matchTitle(
  video: { title: string; channel: string },
  match: { home: string; away: string; homeScore: number | null; awayScore: number | null },
): TitleMatch {
  const title = fold(video.title);
  if (REJECT_WORDS.test(title)) return { ok: false, score: 0, reason: "rejected word" };
  if (!HIGHLIGHT_WORDS.test(title)) return { ok: false, score: 0, reason: "not highlights" };
  if (!mentions(title, match.home) || !mentions(title, match.away)) {
    return { ok: false, score: 0, reason: "teams not both named" };
  }

  let score = 10;
  if (TRUSTED_CHANNEL.test(video.channel)) score += 5;
  if (match.homeScore !== null && match.awayScore !== null) {
    const raw = video.title.replace(/\s/g, "");
    const a = `${match.homeScore}-${match.awayScore}`;
    const b = `${match.homeScore}:${match.awayScore}`;
    const c = `${match.homeScore}–${match.awayScore}`;
    if (raw.includes(a) || raw.includes(b) || raw.includes(c)) score += 3;
    // A different scoreline in the title means a different game between the same clubs.
    else if (/\b\d{1,2}\s?[-–:]\s?\d{1,2}\b/.test(video.title)) return { ok: false, score: 0, reason: "different score" };
  }
  return { ok: true, score, reason: "match" };
}

/** Parses an ISO-8601 duration like PT6M12S into seconds. */
export function isoDurationSeconds(iso: string): number {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}
