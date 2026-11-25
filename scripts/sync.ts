/**
 * Pulls fresh data and writes data/snapshot.json.
 *
 *   npm run sync                 # refresh stats for the current roster
 *   npm run sync -- --discover   # rescan tracked leagues for Japanese players first
 *
 * Env:
 *   DATA_PROVIDER=fotmob|api-football   primary provider (default fotmob)
 *   API_FOOTBALL_KEY=...                enables the API-Football fallback
 */
import fs from "node:fs/promises";
import path from "node:path";
import { CURRENT_SEASON, SEASON_START, TRACKED_LEAGUES } from "@/config/competitions";
import { EXCLUDED_PLAYERS, EXTRA_PLAYERS } from "@/config/players";
import { apiFootball } from "@/lib/providers/api-football";
import { fotmob } from "@/lib/providers/fotmob";
import type { DataProvider, RosterEntry } from "@/lib/providers/types";
import { validateSnapshot } from "@/lib/snapshot-validate";
import type { Snapshot } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const ROSTER_FILE = path.join(DATA_DIR, "roster.json");
const SNAPSHOT_FILE = path.join(DATA_DIR, "snapshot.json");
const ROSTER_MAX_AGE_DAYS = 7;

const log = (msg: string) => console.log(msg);

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

interface RosterFile {
  discoveredAt: string;
  players: RosterEntry[];
}

async function loadRoster(forceDiscover: boolean): Promise<RosterEntry[]> {
  const existing = await readJson<RosterFile>(ROSTER_FILE);
  const ageDays = existing ? (Date.now() - new Date(existing.discoveredAt).getTime()) / 864e5 : Infinity;

  let players = existing?.players ?? [];
  if (forceDiscover || ageDays > ROSTER_MAX_AGE_DAYS) {
    log(`Discovering Japanese players across ${TRACKED_LEAGUES.length} leagues…`);
    try {
      const found = await fotmob.discover(
        TRACKED_LEAGUES.map((l) => l.id),
        log,
      );
      // Guard against a partial outage wiping the roster.
      if (found.length >= Math.max(5, players.length * 0.6)) {
        players = found;
        await fs.writeFile(
          ROSTER_FILE,
          JSON.stringify({ discoveredAt: new Date().toISOString(), players } satisfies RosterFile, null, 2) + "\n",
        );
        log(`Roster: ${players.length} players`);
      } else {
        log(`Discovery found only ${found.length} players; keeping the existing roster of ${players.length}.`);
      }
    } catch (err) {
      log(`Discovery failed (${(err as Error).message}); keeping the existing roster.`);
    }
  }

  const byId = new Map(players.map((p) => [p.id, p]));
  for (const extra of EXTRA_PLAYERS) {
    if (!byId.has(extra.id)) byId.set(extra.id, { id: extra.id, name: "", teamId: 0, teamName: "", leagueId: extra.leagueId });
  }
  for (const id of EXCLUDED_PLAYERS) byId.delete(id);
  return [...byId.values()];
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const roster = await loadRoster(args.has("--discover"));
  if (roster.length === 0) throw new Error("Roster is empty. Run `npm run sync -- --discover`.");

  const previous = await readJson<Snapshot>(SNAPSHOT_FILE);
  const primaryName = process.env.DATA_PROVIDER ?? "fotmob";
  const providers: DataProvider[] = primaryName === "api-football" ? [apiFootball, fotmob] : [fotmob, apiFootball];

  for (const provider of providers) {
    if (provider.name === "api-football" && !process.env.API_FOOTBALL_KEY) {
      log("Skipping API-Football (no API_FOOTBALL_KEY set).");
      continue;
    }
    log(`\nBuilding snapshot with ${provider.name} for ${roster.length} players…`);
    try {
      const snap = await provider.buildSnapshot(roster, {
        season: CURRENT_SEASON,
        seasonStart: SEASON_START,
        previous,
        log,
      });
      const problems = validateSnapshot(snap, roster.length);
      if (problems.length) {
        log(`Snapshot from ${provider.name} failed validation:\n  - ${problems.join("\n  - ")}`);
        continue;
      }
      await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(snap) + "\n");
      const apps = snap.players.reduce((n, p) => n + p.appearances.length, 0);
      log(
        `\nWrote ${path.relative(process.cwd(), SNAPSHOT_FILE)}: ${snap.players.length} players, ` +
          `${Object.keys(snap.matches).length} matches, ${apps} appearances.`,
      );
      return;
    } catch (err) {
      log(`${provider.name} failed: ${(err as Error).stack ?? err}`);
    }
  }

  log("\nAll providers failed. The existing snapshot was left untouched.");
  process.exitCode = 1;
}

main();
