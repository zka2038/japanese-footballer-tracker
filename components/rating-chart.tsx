"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Performance } from "@/lib/data";
import { ratingBand } from "@/lib/stats";
import { RatingPill } from "./ui";

const H = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 32 };
const Y_MIN = 5;
const Y_MAX = 10;
const TICKS = [6, 7, 8, 9];

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** Match-by-match FotMob rating, oldest → newest. Single series: the title names it, no legend. */
export function RatingChart({ performances }: { performances: Performance[] }) {
  const gradId = useId();
  const ref = useRef<SVGSVGElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the real pixel width so text and strokes never scale.
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo(
    () =>
      performances
        .filter((p) => p.rating !== null)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [performances],
  );

  if (points.length < 2) {
    return (
      <div className="grid h-[240px] place-items-center text-[14px] text-ink-3">
        Not enough rated matches yet.
      </div>
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (r: number) => PAD.top + (1 - (Math.min(Y_MAX, Math.max(Y_MIN, r)) - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.rating!).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z`;
  const avg = points.reduce((n, p) => n + p.rating!, 0) / points.length;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  const hp = hover !== null ? points[hover] : null;
  // Label every nth date so they never collide.
  const every = Math.ceil(points.length / Math.max(2, Math.floor(W / 110)));

  return (
    <div className="relative" ref={wrap}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block touch-pan-y select-none"
        role="img"
        aria-label={`Rating trend across ${points.length} matches, average ${avg.toFixed(2)}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {TICKS.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--hairline)" strokeWidth={1} />
            <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--ink-3)">
              {t}
            </text>
          </g>
        ))}

        {/* Season average */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(avg)}
          y2={y(avg)}
          stroke="var(--ink-3)"
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.7}
        />
        <text x={W - PAD.right} y={y(avg) - 6} textAnchor="end" fontSize={11} fill="var(--ink-2)">
          avg {avg.toFixed(2)}
        </text>

        <motion.path
          d={area}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="var(--ink-2)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.28, 0.11, 0.32, 1] }}
        />

        {hp && (
          <line
            x1={x(hover!)}
            x2={x(hover!)}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="var(--hairline-strong)"
            strokeWidth={1}
          />
        )}

        {points.map((p, i) => (
          <circle
            key={p.matchId}
            cx={x(i)}
            cy={y(p.rating!)}
            r={hover === i ? 6.5 : 4.5}
            fill={`var(--r-${ratingBand(p.rating!)})`}
            stroke="var(--surface)"
            strokeWidth={2}
            style={{ transition: "r 150ms" }}
          />
        ))}

        {points.map((p, i) =>
          i % every === 0 || i === points.length - 1 ? (
            <text key={p.matchId} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--ink-3)">
              {shortDate.format(new Date(p.date))}
            </text>
          ) : null,
        )}
      </svg>

      <AnimatePresence>
        {hp && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute top-0 z-10 w-56 rounded-2xl bg-bg-elevated/95 p-3 text-[12.5px] shadow-lift backdrop-blur-xl"
            style={{
              left: `clamp(0px, calc(${(x(hover!) / W) * 100}% - 112px), calc(100% - 224px))`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">
                {hp.home ? "vs" : "at"} {hp.opponentName}
              </span>
              <RatingPill rating={hp.rating} size="sm" />
            </div>
            <p className="mt-0.5 text-ink-3">
              {hp.competition} · {shortDate.format(new Date(hp.date))} · {hp.minutes}&prime;
            </p>
            <p className="mt-1.5 text-ink-2">
              {hp.goalsFor ?? "–"}–{hp.goalsAgainst ?? "–"} {hp.result === "W" ? "win" : hp.result === "L" ? "loss" : "draw"}
              {hp.goals ? ` · ${hp.goals} goal${hp.goals > 1 ? "s" : ""}` : ""}
              {hp.assists ? ` · ${hp.assists} assist${hp.assists > 1 ? "s" : ""}` : ""}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
