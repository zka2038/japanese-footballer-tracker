"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Performance } from "@/lib/data";
import { inScope, type Scope } from "@/lib/stats";
import type { CompetitionKind, Highlight } from "@/lib/types";
import { SegmentedControl } from "./segmented-control";
import { Contributions, PlayerAvatar, RatingPill, TeamLogo } from "./ui";
import { PlayButton } from "./video";

export interface FeedMatch {
  id: number;
  date: string;
  competition: string;
  competitionKind: CompetitionKind;
  round: string | null;
  home: { id: number; name: string; score: number | null };
  away: { id: number; name: string; score: number | null };
  highlight: Highlight | null;
  performances: Pick<
    Performance,
    | "playerId"
    | "slug"
    | "name"
    | "teamId"
    | "minutes"
    | "started"
    | "goals"
    | "assists"
    | "rating"
    | "isTopRating"
    | "goalMinutes"
    | "assistMinutes"
  >[];
}

const SCOPES: { id: Scope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "league", label: "League" },
  { id: "europe", label: "Europe" },
  { id: "cups", label: "Cups" },
  { id: "national", label: "Japan" },
];

const dayHeading = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const PAGE_DAYS = 10;

export function MatchesFeed({ matches }: { matches: FeedMatch[] }) {
  const [scope, setScope] = useState<Scope>("all");
  const [days, setDays] = useState(PAGE_DAYS);

  const groups = useMemo(() => {
    const map = new Map<string, FeedMatch[]>();
    for (const m of matches) {
      if (!inScope(m.competitionKind, scope)) continue;
      const k = m.date.slice(0, 10);
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    return [...map.entries()];
  }, [matches, scope]);

  const shown = groups.slice(0, days);

  return (
    <div>
      <div className="sticky top-12 z-20 -mx-4 bg-bg/80 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:px-0">
        <SegmentedControl
          label="Competition"
          segments={SCOPES}
          value={scope}
          onChange={(v) => {
            setScope(v);
            setDays(PAGE_DAYS);
          }}
        />
      </div>

      <div className="mt-4 space-y-10">
        {shown.map(([day, ms]) => (
          <section key={day} aria-labelledby={`d-${day}`}>
            <h2 id={`d-${day}`} className="mb-3 text-[15px] font-semibold text-ink-2">
              {dayHeading.format(new Date(day))}
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {ms.map((m) => (
                <MatchCard key={m.id} m={m} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {groups.length > days && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setDays((d) => d + PAGE_DAYS)}
            className="rounded-full bg-surface px-6 py-3 text-[14px] font-medium text-link shadow-card transition hover:shadow-lift"
          >
            Show earlier matches
          </button>
        </div>
      )}
      {groups.length === 0 && <p className="py-16 text-center text-ink-3">No matches in this competition yet.</p>}
    </div>
  );
}

function MatchCard({ m }: { m: FeedMatch }) {
  const title = `${m.home.name} ${m.home.score}–${m.away.score} ${m.away.name}`;
  return (
    <article className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 text-[12px] text-ink-3">
        <span>
          {m.competition}
          {m.round && /^\d+$/.test(m.round) ? ` · Matchday ${m.round}` : m.round ? ` · ${m.round}` : ""}
        </span>
        {m.highlight && <PlayButton videoId={m.highlight.videoId} title={title} subtitle={m.competition} />}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 pb-4 pt-2">
        <span className="flex min-w-0 items-center justify-end gap-2.5 text-right">
          <span className="truncate text-[15px] font-semibold">{m.home.name}</span>
          <TeamLogo id={m.home.id} size={28} />
        </span>
        <span className="rounded-xl bg-surface-2 px-3 py-1 font-display text-[20px] font-semibold tracking-[-0.02em] tabular">
          {m.home.score ?? "–"}
          <span className="mx-1 text-ink-3">:</span>
          {m.away.score ?? "–"}
        </span>
        <span className="flex min-w-0 items-center gap-2.5">
          <TeamLogo id={m.away.id} size={28} />
          <span className="truncate text-[15px] font-semibold">{m.away.name}</span>
        </span>
      </div>
      <ul className="divide-y divide-hairline border-t border-hairline">
        {m.performances.map((p) => (
          <li key={p.playerId}>
            <Link
              href={`/players/${p.slug}`}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-2/60"
            >
              <PlayerAvatar id={p.playerId} name="" size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{p.name}</span>
                <span className="block text-[11.5px] text-ink-3">
                  {p.minutes}&prime; {p.started ? "" : "· sub"}
                  {p.goalMinutes.length > 0 && ` · scored ${p.goalMinutes.map((x) => `${x}′`).join(", ")}`}
                  {p.assistMinutes.length > 0 && ` · assisted ${p.assistMinutes.map((x) => `${x}′`).join(", ")}`}
                </span>
              </span>
              <Contributions goals={p.goals} assists={p.assists} />
              <RatingPill rating={p.rating} top={p.isTopRating} />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
