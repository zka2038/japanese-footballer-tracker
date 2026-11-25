import type { Snapshot } from "./types";

/** Returns a list of problems. An empty list means the snapshot is safe to publish. */
export function validateSnapshot(snap: Snapshot, rosterSize: number): string[] {
  const problems: string[] = [];
  if (snap.players.length === 0) problems.push("no players");
  if (snap.players.length < Math.ceil(rosterSize * 0.6)) {
    problems.push(`only ${snap.players.length}/${rosterSize} players fetched`);
  }
  for (const p of snap.players) {
    if (!p.slug) problems.push(`player ${p.id} has no slug`);
    if (!snap.teams[p.teamId]) problems.push(`player ${p.name} references unknown team ${p.teamId}`);
    for (const a of p.appearances) {
      if (!snap.matches[a.matchId]) problems.push(`${p.name}: appearance references unknown match ${a.matchId}`);
    }
  }
  for (const m of Object.values(snap.matches)) {
    if (!snap.competitions[m.competitionId]) problems.push(`match ${m.id} references unknown competition ${m.competitionId}`);
  }
  const slugs = new Set<string>();
  for (const p of snap.players) {
    if (slugs.has(p.slug)) problems.push(`duplicate slug ${p.slug}`);
    slugs.add(p.slug);
  }
  return problems.slice(0, 25);
}
