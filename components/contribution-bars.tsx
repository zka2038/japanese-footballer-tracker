import Link from "next/link";
import type { PlayerCardData } from "@/lib/data";
import { PlayerAvatar } from "./ui";

/** Horizontal stacked bars: goals + assists per player, total at the tip. */
export function ContributionBars({ rows }: { rows: PlayerCardData[] }) {
  const max = Math.max(1, ...rows.map((r) => r.totals.ga));
  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-[12px] text-ink-2" aria-hidden>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: "var(--series-goals)" }} /> Goals
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: "var(--series-assists)" }} /> Assists
        </span>
      </div>
      <ol className="space-y-1">
        {rows.map((r, i) => {
          const g = (r.totals.goals / max) * 100;
          const a = (r.totals.assists / max) * 100;
          return (
            <li key={r.id}>
              <Link
                href={`/players/${r.slug}`}
                className="group grid grid-cols-[18px_32px_minmax(0,9rem)_1fr] items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-2"
                aria-label={`${r.name}: ${r.totals.goals} goals, ${r.totals.assists} assists`}
              >
                <span className="text-[12px] font-medium text-ink-3 tabular">{i + 1}</span>
                <PlayerAvatar id={r.id} name="" color={r.teamColor} size={32} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">{r.lastName || r.name}</span>
                  <span className="block truncate text-[11.5px] text-ink-3">{r.teamName}</span>
                </span>
                <span className="relative flex h-6 items-center">
                  <span className="flex h-2.5 w-full items-center gap-[2px]">
                    {r.totals.goals > 0 && (
                      <span
                        className="h-full rounded-l-[4px] last:rounded-r-[4px]"
                        style={{ width: `${g}%`, background: "var(--series-goals)" }}
                      />
                    )}
                    {r.totals.assists > 0 && (
                      <span
                        className={`h-full rounded-r-[4px] ${r.totals.goals ? "" : "rounded-l-[4px]"}`}
                        style={{ width: `${a}%`, background: "var(--series-assists)" }}
                      />
                    )}
                    <span className="ml-2 shrink-0 text-[14px] font-semibold tabular">{r.totals.ga}</span>
                    <span className="ml-1.5 shrink-0 text-[11.5px] text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 tabular">
                      {r.totals.goals}G · {r.totals.assists}A
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
