"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { HighlightItem } from "@/lib/data";
import { PlayerAvatar } from "./ui";
import { VideoThumb } from "./video";

const dateFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function describe(i: HighlightItem["involvements"][number]) {
  const parts: string[] = [];
  if (i.goals) parts.push(i.goals > 1 ? `${i.goals} goals` : "goal");
  if (i.assists) parts.push(i.assists > 1 ? `${i.assists} assists` : "assist");
  return `${i.lastName || i.name} ${parts.join(" + ")}`;
}

export function HighlightsGallery({ items }: { items: HighlightItem[] }) {
  const people = useMemo(() => {
    const m = new Map<number, { id: number; name: string; lastName: string; count: number }>();
    for (const it of items)
      for (const p of it.involvements) {
        const e = m.get(p.playerId) ?? { id: p.playerId, name: p.name, lastName: p.lastName, count: 0 };
        e.count++;
        m.set(p.playerId, e);
      }
    const list = [...m.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    // Use the full name wherever two players share a surname.
    const seen = new Map<string, number>();
    for (const p of list) seen.set(p.lastName, (seen.get(p.lastName) ?? 0) + 1);
    return list.map((p) => ({ ...p, label: (seen.get(p.lastName) ?? 0) > 1 || !p.lastName ? p.name : p.lastName }));
  }, [items]);

  const [player, setPlayer] = useState<number | null>(null);
  const visible = player ? items.filter((i) => i.involvements.some((p) => p.playerId === player)) : items;
  const [featured, ...rest] = visible;

  return (
    <div>
      <div className="rail no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => setPlayer(null)}
          aria-pressed={player === null}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
            player === null ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card hover:text-ink"
          }`}
        >
          Everyone
        </button>
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlayer(p.id)}
            aria-pressed={player === p.id}
            className={`flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[13px] font-medium transition-colors ${
              player === p.id ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card hover:text-ink"
            }`}
          >
            <PlayerAvatar id={p.id} name="" size={26} />
            <span className="whitespace-nowrap">{p.label}</span>
            <span className="tabular opacity-60">{p.count}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={player ?? "all"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {featured && (
            <VideoThumb
              videoId={featured.highlight.videoId}
              thumbnail={featured.highlight.thumbnail.replace("hqdefault", "maxresdefault")}
              title={`${featured.home.name} ${featured.home.score}–${featured.away.score} ${featured.away.name}`}
              subtitle={`${featured.competition} · ${dateFmt.format(new Date(featured.date))}`}
              className="mt-8 aspect-video sm:aspect-[21/9]"
            >
              <span className="block text-[13px] font-medium text-white/70">
                Latest · {featured.competition} · {dateFmt.format(new Date(featured.date))}
              </span>
              <span className="mt-1 block font-display text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">
                {featured.home.name} {featured.home.score}–{featured.away.score} {featured.away.name}
              </span>
              <span className="mt-1 block text-[15px] text-white/85">{featured.involvements.map(describe).join(" · ")}</span>
              {featured.highlight.source === "youtube-search" && featured.highlight.channel && (
                <span className="mt-1 block text-[12px] text-white/55">via {featured.highlight.channel}</span>
              )}
            </VideoThumb>
          )}

          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((h) => (
              <li key={h.matchId}>
                <VideoThumb
                  videoId={h.highlight.videoId}
                  thumbnail={h.highlight.thumbnail}
                  title={`${h.home.name} ${h.home.score}–${h.away.score} ${h.away.name}`}
                  subtitle={`${h.competition} · ${dateFmt.format(new Date(h.date))}`}
                  className="aspect-video"
                >
                  <span className="block text-[12px] text-white/70">
                    {h.competition} · {dateFmt.format(new Date(h.date))}
                  </span>
                  <span className="block text-[16px] font-semibold leading-snug">
                    {h.home.name} {h.home.score}–{h.away.score} {h.away.name}
                  </span>
                  <span className="block truncate text-[12.5px] text-white/80">{h.involvements.map(describe).join(" · ")}</span>
                  {h.highlight.source === "youtube-search" && h.highlight.channel && (
                    <span className="mt-0.5 block truncate text-[11px] text-white/55">via {h.highlight.channel}</span>
                  )}
                </VideoThumb>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      {visible.length === 0 && <p className="py-16 text-center text-ink-3">No highlights yet.</p>}
    </div>
  );
}
