"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Metric, PlayerCardData } from "@/lib/data";
import type { Scope } from "@/lib/stats";
import { SegmentedControl } from "./segmented-control";
import { PlayerAvatar, TeamLogo } from "./ui";

interface MetricDef {
  id: Metric;
  label: string;
  short: string;
  decimals: number;
  minMinutes: number;
  hint?: string;
}

const SCOPES: { id: Scope; label: string }[] = [
  { id: "club", label: "All club" },
  { id: "league", label: "League" },
  { id: "europe", label: "Europe" },
  { id: "cups", label: "Cups" },
];

const value = (p: PlayerCardData, m: Metric) => p.totals[m] ?? 0;

export function Leaderboard({
  metrics,
  byScope,
}: {
  metrics: MetricDef[];
  byScope: Record<string, PlayerCardData[]>;
}) {
  const [metric, setMetric] = useState<Metric>("ga");
  const [scope, setScope] = useState<Scope>("club");
  const def = metrics.find((m) => m.id === metric)!;

  const ranked = useMemo(
    () =>
      (byScope[scope] ?? [])
        .filter((p) => p.totals.minutes >= def.minMinutes && value(p, metric) > 0)
        .sort((a, b) => value(b, metric) - value(a, metric) || a.totals.minutes - b.totals.minutes)
        .slice(0, 25),
    [byScope, scope, metric, def.minMinutes],
  );

  // Standard competition ranking: ties share a rank.
  const ranks = ranked.map((p, i) => {
    let r = i;
    while (r > 0 && value(ranked[r - 1], metric) === value(p, metric)) r--;
    return r + 1;
  });

  const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: def.decimals, maximumFractionDigits: def.decimals });
  const max = ranked.length ? value(ranked[0], metric) : 1;
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="rail no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6">
          {metrics.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetric(m.id)}
              aria-pressed={metric === m.id}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                metric === m.id ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl label="Competition" segments={SCOPES} value={scope} onChange={setScope} />
          {def.hint && <span className="text-[12.5px] text-ink-3">{def.hint}</span>}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${metric}-${scope}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.28, 0.11, 0.32, 1] }}
        >
          {ranked.length === 0 ? (
            <p className="card mt-8 py-16 text-center text-ink-3">Nobody qualifies yet.</p>
          ) : (
            <>
              {/* Podium */}
              <ol className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
                {podium.map((p, i) => (
                  <li key={p.id} className={i === 0 ? "md:order-2" : i === 1 ? "md:order-1" : "md:order-3"}>
                    <Link
                      href={`/players/${p.slug}`}
                      className={`card group relative grid h-full grid-cols-[auto_1fr_auto] items-center gap-x-4 overflow-hidden p-4 transition-shadow duration-500 hover:shadow-lift md:flex md:flex-col md:items-center md:px-6 md:pb-7 md:text-center ${
                        i === 0 ? "md:-mt-4 md:pt-10" : "md:pt-8"
                      }`}
                    >
                      <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-40 opacity-70"
                        style={{
                          background: `radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, ${p.teamColor} 35%, transparent), transparent)`,
                        }}
                      />
                      <span className="relative col-start-2 row-start-1 self-end text-[11px] font-semibold text-ink-3 md:mb-4 md:self-center md:text-[12px]">
                        {ranks[i] === 1 ? "1st" : ranks[i] === 2 ? "2nd" : "3rd"}
                      </span>
                      <span className="relative col-start-1 row-span-3 row-start-1 md:hidden">
                        <PlayerAvatar id={p.id} name={p.name} color={p.teamColor} size={56} />
                      </span>
                      <span className="relative hidden md:block">
                        <PlayerAvatar id={p.id} name={p.name} color={p.teamColor} size={i === 0 ? 112 : 92} />
                      </span>
                      <span className="relative col-start-2 row-start-2 truncate text-[16px] font-semibold tracking-[-0.01em] md:mt-4 md:overflow-visible md:whitespace-normal md:text-[18px]">
                        {p.name}
                      </span>
                      <span className="relative col-start-2 row-start-3 flex items-center gap-1.5 self-start text-[12.5px] text-ink-3 md:mt-1 md:self-center">
                        <TeamLogo id={p.teamId} size={14} /> {p.teamName}
                      </span>
                      <span
                        className={`relative col-start-3 row-span-3 row-start-1 font-display text-[36px] font-semibold leading-none tracking-[-0.04em] tabular md:mt-4 ${
                          i === 0 ? "md:text-[64px]" : "md:text-[52px]"
                        }`}
                      >
                        {fmt(value(p, metric))}
                      </span>
                      <span className="relative mt-2 hidden text-[12px] text-ink-3 md:block">
                        {p.totals.apps} apps · {p.totals.minutes.toLocaleString("en-GB")}&prime;
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>

              {/* The rest */}
              {rest.length > 0 && (
                <ol className="card mt-4 divide-y divide-hairline overflow-hidden">
                  {rest.map((p, j) => {
                    const i = j + 3;
                    const v = value(p, metric);
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/players/${p.slug}`}
                          className="grid grid-cols-[28px_36px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/60 sm:grid-cols-[32px_36px_minmax(0,14rem)_1fr_auto] sm:px-6"
                        >
                          <span className="text-[13px] font-medium text-ink-3 tabular">{ranks[i]}</span>
                          <PlayerAvatar id={p.id} name="" color={p.teamColor} size={36} />
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-medium">{p.name}</span>
                            <span className="block truncate text-[12px] text-ink-3">{p.teamName}</span>
                          </span>
                          <span className="hidden h-2 sm:block" aria-hidden>
                            <span
                              className="block h-2 rounded-full bg-accent/80"
                              style={{ width: `${Math.max(2, (v / max) * 100)}%` }}
                            />
                          </span>
                          <span className="w-14 text-right text-[16px] font-semibold tabular">{fmt(v)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
