import Link from "next/link";
import { team } from "@/lib/data";
import type { Performance } from "@/lib/data";
import { relativeDay } from "@/lib/format";
import { Assist, Ball } from "./icons";
import { PlayerAvatar, RatingPill, ResultBadge, TeamLogo } from "./ui";
import { PlayButton } from "./video";

export function scoreline(p: Pick<Performance, "home" | "goalsFor" | "goalsAgainst" | "teamName" | "opponentName">) {
  const homeName = p.home ? p.teamName : p.opponentName;
  const awayName = p.home ? p.opponentName : p.teamName;
  const hs = p.home ? p.goalsFor : p.goalsAgainst;
  const as = p.home ? p.goalsAgainst : p.goalsFor;
  return { homeName, awayName, score: hs === null || as === null ? "v" : `${hs}–${as}` };
}

/** A single standout performance: who, which match, how they did. */
export function PerformanceCard({ perf, now }: { perf: Performance; now: string }) {
  const color = team(perf.teamId).color;
  const { homeName, awayName, score } = scoreline(perf);
  const title = `${homeName} ${score} ${awayName}`;

  return (
    <article className="card relative flex h-full flex-col overflow-hidden p-5 transition-shadow duration-500 hover:shadow-lift">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
        style={{ background: `radial-gradient(80% 100% at 20% 0%, color-mix(in oklab, ${color} 22%, transparent), transparent)` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <Link href={`/players/${perf.slug}`} className="flex min-w-0 items-center gap-3 after:absolute after:inset-0">
          <PlayerAvatar id={perf.playerId} name={perf.name} color={color} size={52} />
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-semibold tracking-[-0.01em]">{perf.name}</span>
            {perf.nameJa && <span className="block truncate font-jp text-[12px] text-ink-3">{perf.nameJa}</span>}
          </span>
        </Link>
        <RatingPill rating={perf.rating} size="lg" top={perf.isTopRating} />
      </div>

      <div className="relative mt-5 flex items-center gap-2 text-[14px]">
        <TeamLogo id={perf.teamId} size={18} />
        <span className="truncate font-medium">{title}</span>
        <ResultBadge result={perf.result} />
      </div>
      <p className="relative mt-1 text-[12px] text-ink-3">
        {perf.competition} · {relativeDay(perf.date, now)} · {perf.minutes}&prime;
        {perf.started ? "" : " off the bench"}
      </p>

      <div className="relative mt-auto flex items-center justify-between gap-2 pt-5">
        <div className="flex flex-wrap gap-1.5">
          {perf.goalMinutes.length
            ? perf.goalMinutes.map((m, i) => (
                <span key={`g${i}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[12px] font-medium">
                  <Ball size={12} /> {m}&prime;
                </span>
              ))
            : Array.from({ length: perf.goals }, (_, i) => (
                <span key={`g${i}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[12px] font-medium">
                  <Ball size={12} /> Goal
                </span>
              ))}
          {perf.assistMinutes.length
            ? perf.assistMinutes.map((m, i) => (
                <span key={`a${i}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[12px] font-medium text-ink-2">
                  <Assist size={12} /> {m}&prime;
                </span>
              ))
            : Array.from({ length: perf.assists }, (_, i) => (
                <span key={`a${i}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[12px] font-medium text-ink-2">
                  <Assist size={12} /> Assist
                </span>
              ))}
          {perf.goals + perf.assists === 0 && perf.xg !== null && (
            <span className="rounded-full bg-surface-2 px-2 py-1 text-[12px] text-ink-2 tabular">
              {perf.xg.toFixed(2)} xG · {perf.chancesCreated ?? 0} chances
            </span>
          )}
        </div>
        {perf.highlight && (
          <span className="relative z-10">
            <PlayButton videoId={perf.highlight.videoId} title={title} subtitle={`${perf.competition} highlights`} />
          </span>
        )}
      </div>
    </article>
  );
}
