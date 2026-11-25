/**
 * Looks up native Japanese names on Wikidata for every rostered player and
 * writes config/ja-names.json (keyed by FotMob id). Run after discovery:
 *
 *   npm run ja-names
 *
 * Only entities that are Japanese citizens (P27 = Q17) and association football
 * players (P106 = Q937857) are accepted, so namesakes never sneak in.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createGate, fetchJson } from "@/lib/providers/http";
import type { RosterEntry } from "@/lib/providers/types";

const API = "https://www.wikidata.org/w/api.php";
const HEADERS = { "User-Agent": "jp-footballer-tracker/0.1 (personal, non-commercial)" };
const OUT = path.join(process.cwd(), "config", "ja-names.json");
const gate = createGate(1, 2000);

interface SearchResult {
  search: { id: string }[];
}
interface Entities {
  entities: Record<
    string,
    {
      labels?: Record<string, { value: string }>;
      claims?: Record<string, { mainsnak: { datavalue?: { value: { id: string } } } }[]>;
    }
  >;
}

const claimIds = (e: Entities["entities"][string], prop: string) =>
  (e.claims?.[prop] ?? []).map((c) => c.mainsnak.datavalue?.value.id).filter(Boolean);

async function lookup(name: string): Promise<string | null> {
  const q = new URLSearchParams({ action: "wbsearchentities", search: name, language: "en", type: "item", limit: "7", format: "json" });
  const res = await gate(() => fetchJson<SearchResult>(`${API}?${q}`, { headers: HEADERS }));
  const ids = (res.search ?? []).map((s) => s.id);
  if (!ids.length) return null;
  const q2 = new URLSearchParams({ action: "wbgetentities", ids: ids.join("|"), props: "labels|claims", languages: "ja", format: "json" });
  const ents = await gate(() => fetchJson<Entities>(`${API}?${q2}`, { headers: HEADERS }));
  for (const id of ids) {
    const e = ents.entities[id];
    if (!e) continue;
    if (claimIds(e, "P27").includes("Q17") && claimIds(e, "P106").includes("Q937857")) {
      return e.labels?.ja?.value ?? null;
    }
  }
  return null;
}

async function main() {
  const roster: { players: RosterEntry[] } = JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "roster.json"), "utf8"));
  let existing: Record<string, string> = {};
  try {
    existing = JSON.parse(await fs.readFile(OUT, "utf8"));
  } catch {}

  const out: Record<string, string> = { ...existing };
  // Sequential on purpose: Wikidata rate-limits bursts aggressively.
  for (const p of roster.players) {
    {
      if (out[p.id]) continue;
      try {
        const ja = await lookup(p.name);
        if (ja) {
          out[p.id] = ja;
          console.log(`  ${p.name} → ${ja}`);
        } else {
          console.log(`  ${p.name} → (not found)`);
        }
      } catch (err) {
        console.log(`  ! ${p.name}: ${(err as Error).message}`);
        await new Promise((r) => setTimeout(r, 8000));
      }
    }
  }
  const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => Number(a) - Number(b)));
  await fs.writeFile(OUT, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`Wrote ${Object.keys(sorted).length} names to config/ja-names.json`);
}

main();
