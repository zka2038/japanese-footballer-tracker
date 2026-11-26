/**
 * YouTube fallback for match highlights FotMob doesn't link (typically UEFA
 * competitions and some Dutch/Belgian games).
 *
 * Only matches where a tracked player scored or assisted are searched, results
 * are cached in data/highlight-search.json, and each run is capped so the free
 * YouTube Data API quota (10,000 units/day; a search costs 100) is never hit.
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { Highlight, Snapshot } from "@/lib/types";
import { fetchJson } from "../providers/http";
import { isoDurationSeconds, matchTitle } from "./match-title";

const API = "https://www.googleapis.com/youtube/v3";
const CACHE_FILE = path.join(process.cwd(), "data", "highlight-search.json");

const HOUR = 36e5;
/** Wait this long after kick-off before the first search (uploads take a while). */
const FIRST_SEARCH_AFTER = 4 * HOUR;
/** Re-search a match that had no result after this long… */
const RETRY_AFTER = 20 * HOUR;
/** …until it is this old, then give up. */
const GIVE_UP_AFTER = 6 * 24 * HOUR;

interface CacheEntry {
  searchedAt: string;
  attempts: number;
  hit: (Highlight & { title: string; channel: string }) | null;
}
type Cache = Record<string, CacheEntry>;

interface SearchItem {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string; publishedAt: string };
}
interface VideoItem {
  id: string;
  contentDetails: { duration: string; regionRestriction?: { blocked?: string[]; allowed?: string[] } };
  status: { embeddable: boolean; privacyStatus: string };
}

async function readCache(): Promise<Cache> {
  try {
    return JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

async function search(
  key: string,
  m: { home: string; away: string; date: string; homeScore: number | null; awayScore: number | null },
) {
  const kickoff = new Date(m.date).getTime();
  const q = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    maxResults: "10",
    order: "relevance",
    q: `${m.home} vs ${m.away} highlights`,
    publishedAfter: new Date(kickoff).toISOString(),
    publishedBefore: new Date(kickoff + GIVE_UP_AFTER).toISOString(),
    key,
  });
  const res = await fetchJson<{ items?: SearchItem[] }>(`${API}/search?${q}`, { retries: 1 });
  const candidates = (res.items ?? [])
    .map((it) => {
      const title = decode(it.snippet.title);
      const channel = decode(it.snippet.channelTitle);
      return { videoId: it.id.videoId, title, channel, verdict: matchTitle({ title, channel }, m) };
    })
    .filter((c) => c.verdict.ok)
    .sort((a, b) => b.verdict.score - a.verdict.score);
  if (!candidates.length) return null;

  // Confirm the top candidates are real, embeddable, highlight-length videos (1 unit).
  const ids = candidates.slice(0, 5).map((c) => c.videoId);
  const details = await fetchJson<{ items?: VideoItem[] }>(
    `${API}/videos?${new URLSearchParams({ part: "contentDetails,status", id: ids.join(","), key })}`,
    { retries: 1 },
  );
  const ok = new Map(
    (details.items ?? [])
      .filter((v) => {
        const secs = isoDurationSeconds(v.contentDetails.duration);
        // Skip videos only viewable in a handful of countries.
        const allowed = v.contentDetails.regionRestriction?.allowed;
        const geoLocked = allowed !== undefined && allowed.length < 40;
        return v.status.embeddable && v.status.privacyStatus === "public" && secs >= 45 && secs <= 25 * 60 && !geoLocked;
      })
      .map((v) => [v.id, v]),
  );
  const best = candidates.find((c) => ok.has(c.videoId));
  if (!best) return null;
  return {
    provider: "youtube" as const,
    videoId: best.videoId,
    url: `https://www.youtube.com/watch?v=${best.videoId}`,
    thumbnail: `https://i.ytimg.com/vi/${best.videoId}/hqdefault.jpg`,
    source: "youtube-search" as const,
    title: best.title,
    channel: best.channel,
  };
}

/**
 * Fills `highlight` on matches with a tracked goal contribution and no FotMob
 * video. Mutates and returns the snapshot. Without a key it only applies
 * previously cached results.
 */
export async function enrichHighlights(snap: Snapshot, log: (m: string) => void): Promise<Snapshot> {
  const key = process.env.YOUTUBE_API_KEY;
  const limit = Number(process.env.YOUTUBE_SEARCH_LIMIT ?? 12);
  const cache = await readCache();
  const now = Date.now();

  const wanted = new Set<number>();
  for (const p of snap.players) for (const a of p.appearances) if (a.goals + a.assists > 0) wanted.add(a.matchId);

  const todo = [...wanted]
    .map((id) => snap.matches[id])
    .filter((m) => m && m.finished && !m.highlight)
    .sort((a, b) => b.date.localeCompare(a.date));

  let applied = 0;
  let searched = 0;
  let found = 0;
  for (const m of todo) {
    const entry = cache[m.id];
    if (entry?.hit) {
      m.highlight = entry.hit;
      applied++;
      continue;
    }
    if (!key || searched >= limit) continue;
    const age = now - new Date(m.date).getTime();
    if (age < FIRST_SEARCH_AFTER || age > GIVE_UP_AFTER + RETRY_AFTER) continue;
    if (entry && now - new Date(entry.searchedAt).getTime() < RETRY_AFTER) continue;

    const home = snap.teams[m.home.id]?.name ?? m.home.name;
    const away = snap.teams[m.away.id]?.name ?? m.away.name;
    try {
      searched++;
      const hit = await search(key, { home, away, date: m.date, homeScore: m.home.score, awayScore: m.away.score });
      cache[m.id] = { searchedAt: new Date(now).toISOString(), attempts: (entry?.attempts ?? 0) + 1, hit };
      if (hit) {
        m.highlight = hit;
        found++;
        log(`  ▶ ${home} v ${away}: "${hit.title}" (${hit.channel})`);
      } else {
        log(`  · ${home} v ${away}: no confident match yet`);
      }
    } catch (err) {
      const msg = (err as Error).message;
      log(`  ! YouTube search failed (${msg}); stopping searches for this run.`);
      break; // most likely quota; try again next run
    }
  }

  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 1) + "\n");
  const missing = todo.filter((m) => !m.highlight).length;
  log(
    `Highlights: ${applied} from cache, ${found} newly found (${searched} searches)` +
      `${key ? "" : " — set YOUTUBE_API_KEY to search for missing ones"}; ${missing} still missing.`,
  );
  return snap;
}
