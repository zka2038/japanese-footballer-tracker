import type { Snapshot } from "@/lib/types";

/** A player we track, as found by discovery (or added by hand). */
export interface RosterEntry {
  /** Provider-specific player id (FotMob id for the FotMob provider). */
  id: number;
  name: string;
  teamId: number;
  teamName: string;
  leagueId: number;
}

export interface BuildOptions {
  season: string;
  seasonStart: string;
  /** Previous snapshot, used to skip refetching finished matches. */
  previous: Snapshot | null;
  log: (msg: string) => void;
}

/**
 * The swappable boundary between the site and wherever stats come from.
 * Each provider turns a roster into a full normalized snapshot.
 */
export interface DataProvider {
  name: Snapshot["provider"];
  discover(leagueIds: number[], log: (msg: string) => void): Promise<RosterEntry[]>;
  buildSnapshot(roster: RosterEntry[], opts: BuildOptions): Promise<Snapshot>;
}
