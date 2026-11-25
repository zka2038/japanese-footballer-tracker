"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Performance } from "@/lib/data";
import { aggregate, inScope, SCOPES, type Scope } from "@/lib/stats";
import { Assist, Ball } from "./icons";
import { RatingChart } from "./rating-chart";
import { SegmentedControl } from "./segmented-control";
import { RatingPill, ResultBadge, TeamLogo } from "./ui";
import { PlayButton } from "./video";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function PlayerSeason({ performances, season }: { performances: Performance[]; season: string }) {
  const available = useMemo(
    () => SCOPES.map((s) => ({ ...s, disabled: !performances.some((p) => inScope(p.competitionKind, s.id)) })),
    [performances],
  );
  const [scope, setScope] = useState<Scope>("club");
  const [showAll, setShowAll] = useState(false);

  const inView = useMemo(() => performances.filter((p) => inScope(p.competitionKind, scope)), [performances, scope]);
  const t = useMemo(() => aggregate(inView), [inView]);
  const played = inView.filter((p) => !p.unusedSub);
  const rows = showAll ? inView : inView.slice(0, 12);

  const tiles: { label: string; value: string; sub?: string }[] = [
    { label: "Appearances", value: String(t.apps), sub: `${t.starts} starts · ${t.apps - t.starts} sub` },
    { label: "Goals", value: String(t.goals), sub: t.xMatches ? `${t.xg.toFixed(2)} xG` : undefined },
    { label: "Assists", value: String(t.assists), sub: t.xMatches ? `${t.xa.toFixed(2)} xA` : undefined },
    { label: "G+A per 90", value: t.ga90 !== null ? t.ga90.toFixed(2) : "–", sub: `${t.ga} goal contributions` },
    {
      label: "Average rating",
      value: t.avgRating !== null ? t.avgRating.toFixed(2) : "–",
      sub: t.bestRating ? `Best ${t.bestRating.toFixed(1)}${t.potm ? ` · ${t.potm}× POTM` : ""}` : undefined,
    },
    {
      label: "Minutes",
      value: t.minutes.toLocaleString("en-GB"),
      sub: t.apps ? `${Math.round(t.minutes / t.apps)}′ per appearance` : undefined,
    },
  ];

  return (
    <section className="container-page mt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{season.replace("/20", "/")} season</p>
          <h2 className="display-md">Season stats.</h2>
        </div>
        <SegmentedControl label="Competition" segments={available} value={scope} onChange={setScope} />
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={scope}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6"
        >
          {tiles.map((tile) => (
            <div key={tile.label} className="card p-5">
              <p className="text-[12.5px] font-medium text-ink-2">{tile.label}</p>
              <p className="mt-2 font-display text-[34px] font-semibold leading-none tracking-[-0.03em] tabular">
                {tile.value}
              </p>
              {tile.sub && <p className="mt-2 text-[11.5px] text-ink-3">{tile.sub}</p>}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="card mt-4 p-5 sm:p-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="title">Match ratings</p>
          <p className="text-[13px] text-ink-3">FotMob rating per match, oldest to newest</p>
        </div>
        <RatingChart key={scope} performances={played} />
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="flex items-baseline justify-between px-5 pb-3 pt-6 sm:px-8">
          <p className="title">Match log</p>
          <p className="text-[13px] text-ink-3">{inView.length} matches</p>
        </div>
        {inView.length === 0 ? (
          <p className="px-8 pb-8 text-[14px] text-ink-3">No matches in this competition yet.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-[14px] sm:min-w-[560px]">
              <thead>
                <tr className="border-y border-hairline text-left text-[11.5px] font-medium text-ink-3">
                  <th className="hidden py-2.5 pl-5 font-medium sm:table-cell sm:pl-8">Date</th>
                  <th className="py-2.5 pl-4 font-medium sm:pl-0">Match</th>
                  <th className="px-1.5 py-2.5 text-center font-medium sm:px-3">Result</th>
                  <th className="px-1.5 py-2.5 text-right font-medium sm:px-3">Min</th>
                  <th className="px-1.5 py-2.5 text-center font-medium sm:px-3">G/A</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">xG</th>
                  <th className="px-1.5 py-2.5 text-center font-medium sm:px-3">Rating</th>
                  <th className="py-2.5 pr-5 sm:pr-8">
                    <span className="sr-only">Highlights</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((p) => (
                  <tr key={p.matchId} className={`transition-colors hover:bg-surface-2/60 ${p.unusedSub ? "text-ink-3" : ""}`}>
                    <td className="hidden whitespace-nowrap py-3 pl-5 text-ink-2 tabular sm:table-cell sm:pl-8">
                      {dateFmt.format(new Date(p.date))}
                      <span className="block text-[11px] text-ink-3">{p.competition}</span>
                    </td>
                    <td className="w-full max-w-0 py-3 pl-4 sm:pl-0">
                      <span className="flex items-center gap-2">
                        <TeamLogo id={p.opponentId} size={20} />
                        <span className="min-w-0 truncate">
                          <span className="text-ink-3">{p.home ? "vs " : "at "}</span>
                          {p.opponentName}
                          <span className="block text-[11px] text-ink-3 sm:hidden">
                            {dateFmt.format(new Date(p.date))} · {p.competition}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="w-px whitespace-nowrap px-1.5 py-3 sm:px-3">
                      <span className="flex items-center justify-center gap-2 tabular">
                        <ResultBadge result={p.result} />
                        <span className="hidden w-9 text-[13px] sm:inline">
                          {p.goalsFor ?? "–"}–{p.goalsAgainst ?? "–"}
                        </span>
                      </span>
                    </td>
                    <td className="w-px whitespace-nowrap px-1.5 py-3 text-right tabular sm:px-3">
                      {p.unusedSub ? (
                        <span className="text-[12px]">Bench</span>
                      ) : (
                        <>
                          {p.minutes}&prime;
                          {!p.started && <span className="ml-1 hidden text-[11px] text-ink-3 sm:inline">sub</span>}
                        </>
                      )}
                    </td>
                    <td className="w-px whitespace-nowrap px-1.5 py-3 sm:px-3">
                      <span className="flex items-center justify-center gap-2">
                        {p.goals > 0 && (
                          <span className="inline-flex items-center gap-0.5 font-medium">
                            <Ball size={13} />
                            {p.goals > 1 && <span className="text-[12px]">{p.goals}</span>}
                          </span>
                        )}
                        {p.assists > 0 && (
                          <span className="inline-flex items-center gap-0.5 font-medium text-ink-2">
                            <Assist size={13} />
                            {p.assists > 1 && <span className="text-[12px]">{p.assists}</span>}
                          </span>
                        )}
                        {!p.goals && !p.assists && <span className="text-ink-3">–</span>}
                      </span>
                    </td>
                    <td className="hidden w-px whitespace-nowrap px-3 py-3 text-right text-ink-2 tabular sm:table-cell">
                      {p.xg !== null ? p.xg.toFixed(2) : "–"}
                    </td>
                    <td className="w-px whitespace-nowrap px-1.5 py-3 text-center sm:px-3">
                      {!p.unusedSub && <RatingPill rating={p.rating} size="sm" top={p.isTopRating} />}
                    </td>
                    <td className="w-px whitespace-nowrap py-3 pl-1.5 pr-4 text-right sm:pl-3 sm:pr-8">
                      {p.highlight && (
                        <PlayButton
                          videoId={p.highlight.videoId}
                          title={`${p.home ? p.teamName : p.opponentName} ${p.home ? p.goalsFor : p.goalsAgainst}–${p.home ? p.goalsAgainst : p.goalsFor} ${p.home ? p.opponentName : p.teamName}`}
                          subtitle={`${p.competition} · ${dateFmt.format(new Date(p.date))}`}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {inView.length > 12 && (
          <div className="border-t border-hairline px-5 py-3 text-center sm:px-8">
            <button type="button" onClick={() => setShowAll((v) => !v)} className="link text-[14px]">
              {showAll ? "Show fewer" : `Show all ${inView.length} matches`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
