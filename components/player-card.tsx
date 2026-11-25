import Link from "next/link";
import type { PlayerCardData } from "@/lib/data";
import { FormStrip, PlayerAvatar, RatingPill, TeamLogo } from "./ui";

export function PlayerCard({ p }: { p: PlayerCardData }) {
  const t = p.totals;
  return (
    <Link
      href={`/players/${p.slug}`}
      className="card group relative flex h-full flex-col overflow-hidden p-5 transition-[box-shadow,transform] duration-500 ease-(--ease-apple) hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
        style={{ background: `radial-gradient(circle, color-mix(in oklab, ${p.teamColor} 40%, transparent), transparent 70%)` }}
      />
      <div className="relative flex items-start gap-4">
        <PlayerAvatar id={p.id} name={p.name} color={p.teamColor} size={64} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">{p.name}</p>
          <p className="truncate font-jp text-[12px] text-ink-3">{p.nameJa ?? " "}</p>
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-[12.5px] text-ink-2">
            <TeamLogo id={p.teamId} size={15} />
            <span className="truncate">{p.teamName}</span>
          </p>
        </div>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
          {p.positionShort || p.positionGroup}
        </span>
      </div>

      <dl className="relative mt-5 grid grid-cols-4 gap-2 border-t border-hairline pt-4 text-center">
        {[
          { label: "Apps", value: t.apps },
          { label: "Goals", value: t.goals },
          { label: "Assists", value: t.assists },
        ].map((s) => (
          <div key={s.label}>
            <dt className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-ink-3">{s.label}</dt>
            <dd className="mt-0.5 text-[19px] font-semibold tabular">{s.value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-ink-3">Rating</dt>
          <dd className="mt-1">
            <RatingPill rating={t.avgRating !== null ? Math.round(t.avgRating * 100) / 100 : null} size="sm" />
          </dd>
        </div>
      </dl>

      <div className="relative mt-4 flex items-center justify-between text-[11.5px] text-ink-3">
        {p.injured ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-[color-mix(in_oklab,var(--r-poor)_80%,var(--ink))]">
            <span className="size-1.5 rounded-full bg-[var(--r-poor)]" /> Injured
          </span>
        ) : (
          <span>{t.minutes.toLocaleString("en-GB")} minutes</span>
        )}
        <span className="flex items-center gap-2">
          Form <FormStrip form={p.form} />
        </span>
      </div>
    </Link>
  );
}
