"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import type { PlayerCardData } from "@/lib/data";
import { leagueLogo } from "@/lib/images";
import type { PositionGroup } from "@/lib/types";
import { Search } from "./icons";
import { PlayerCard } from "./player-card";
import { SegmentedControl } from "./segmented-control";

type SortKey = "ga" | "goals" | "assists" | "rating" | "minutes" | "name";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "ga", label: "Goal contributions" },
  { id: "goals", label: "Goals" },
  { id: "assists", label: "Assists" },
  { id: "rating", label: "Average rating" },
  { id: "minutes", label: "Minutes" },
  { id: "name", label: "Name" },
];

const POSITIONS: { id: "ALL" | PositionGroup; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "GK", label: "Keepers" },
  { id: "DEF", label: "Defenders" },
  { id: "MID", label: "Midfielders" },
  { id: "FWD", label: "Forwards" },
];

const fold = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function sortValue(p: PlayerCardData, key: SortKey): number {
  const t = p.totals;
  switch (key) {
    case "ga":
      return t.ga * 1000 + t.goals;
    case "goals":
      return t.goals * 1000 + t.assists;
    case "assists":
      return t.assists * 1000 + t.goals;
    case "rating":
      // Players with very little time sink below regulars.
      return (t.minutes >= 270 ? 100 : 0) + (t.avgRating ?? 0);
    case "minutes":
      return t.minutes;
    case "name":
      return 0;
  }
}

/** Writes filters to the URL without a navigation, so links are shareable. */
function syncUrl(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  window.history.replaceState(null, "", url);
}

export function PlayersExplorer({
  players,
  leagues,
}: {
  players: PlayerCardData[];
  leagues: { id: number; name: string; shortName: string; players: number }[];
}) {
  const search = useSearchParams();
  const [league, setLeague] = useState<number | null>(() => Number(search.get("league")) || null);
  const [position, setPosition] = useState<"ALL" | PositionGroup>(
    () => (POSITIONS.find((p) => p.id === search.get("pos"))?.id ?? "ALL") as "ALL" | PositionGroup,
  );
  const [sort, setSort] = useState<SortKey>(() => (SORTS.find((s) => s.id === search.get("sort"))?.id ?? "ga") as SortKey);
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query);

  const visible = useMemo(() => {
    const needle = fold(q.trim());
    return players
      .filter((p) => (league ? p.leagueId === league : true))
      .filter((p) => (position === "ALL" ? true : p.positionGroup === position))
      .filter((p) => !needle || fold(`${p.name} ${p.teamName} ${p.nameJa ?? ""}`).includes(needle))
      .sort((a, b) =>
        sort === "name" ? a.lastName.localeCompare(b.lastName) : sortValue(b, sort) - sortValue(a, sort) || a.name.localeCompare(b.name),
      );
  }, [players, league, position, sort, q]);

  const pickLeague = (id: number | null) => {
    setLeague(id);
    syncUrl({ league: id ? String(id) : null });
  };

  return (
    <div>
      {/* League chips */}
      <div className="rail no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => pickLeague(null)}
          aria-pressed={league === null}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
            league === null ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card hover:text-ink"
          }`}
        >
          All leagues
        </button>
        {leagues.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => pickLeague(l.id)}
            aria-pressed={league === l.id}
            className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-[13px] font-medium transition-colors ${
              league === l.id ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card hover:text-ink"
            }`}
          >
            <span className="grid size-6 place-items-center rounded-full bg-white p-0.5">
              <Image src={leagueLogo(l.id)} alt="" width={18} height={18} className="size-[18px] object-contain" />
            </span>
            {l.shortName}
            <span className="tabular opacity-60">{l.players}</span>
          </button>
        ))}
      </div>

      {/* Position, search, sort */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Position"
          segments={POSITIONS}
          value={position}
          onChange={(v) => {
            setPosition(v);
            syncUrl({ pos: v === "ALL" ? null : v });
          }}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <label className="relative flex min-w-[200px] flex-1 items-center sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3.5 text-ink-3" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players or clubs"
              aria-label="Search players or clubs"
              className="h-10 w-full rounded-full bg-surface pl-10 pr-4 text-[14px] shadow-card outline-none placeholder:text-ink-3 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--link)_35%,transparent)]"
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink-2">
            Sort by
            <select
              value={sort}
              onChange={(e) => {
                const v = e.target.value as SortKey;
                setSort(v);
                syncUrl({ sort: v === "ga" ? null : v });
              }}
              className="h-10 cursor-pointer appearance-none rounded-full bg-surface px-4 pr-9 text-[13px] font-medium text-ink shadow-card outline-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
              }}
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-[13px] text-ink-3" aria-live="polite">
        {visible.length} {visible.length === 1 ? "player" : "players"}
      </p>

      <motion.ul layout className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <PlayerCard p={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {visible.length === 0 && (
        <div className="card mt-3 grid place-items-center px-6 py-16 text-center">
          <p className="title">No players match.</p>
          <p className="mt-2 text-[15px] text-ink-2">Try another league, position or search.</p>
        </div>
      )}
    </div>
  );
}
