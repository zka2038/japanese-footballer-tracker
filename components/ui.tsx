import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatRating } from "@/lib/format";
import { playerImage, teamLogo } from "@/lib/images";
import { ratingBand } from "@/lib/stats";
import { Assist, Ball, ChevronRight, Star } from "./icons";

// ---------------------------------------------------------------------------
// Rating pill

export function RatingPill({
  rating,
  size = "md",
  top = false,
}: {
  rating: number | null;
  size?: "sm" | "md" | "lg";
  top?: boolean;
}) {
  const sizes = {
    sm: "h-5 min-w-[30px] px-1.5 text-[11px]",
    md: "h-6 min-w-[36px] px-2 text-[12.5px]",
    lg: "h-9 min-w-[54px] px-3 text-[17px]",
  }[size];
  if (rating === null) {
    return (
      <span
        className={`${sizes} inline-flex items-center justify-center rounded-full bg-surface-2 font-semibold text-ink-3 tabular`}
        aria-label="No rating"
      >
        –
      </span>
    );
  }
  const band = ratingBand(rating);
  return (
    <span
      className={`${sizes} relative inline-flex items-center justify-center gap-0.5 rounded-full font-semibold tabular`}
      style={{ backgroundColor: `var(--r-${band})`, color: `var(--r-${band}-ink)` }}
      aria-label={`Rating ${formatRating(rating)}${top ? ", top rated in match" : ""}`}
    >
      {formatRating(rating)}
      {top && <Star size={size === "lg" ? 12 : 9} className="-mr-0.5 opacity-90" />}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Images

export function TeamLogo({ id, logo, size = 20, className = "" }: { id: number; logo?: string; size?: number; className?: string }) {
  return (
    <Image
      src={teamLogo({ id, logo })}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Headshot on a soft disc tinted with the club colour. */
export function PlayerAvatar({
  id,
  name,
  color,
  size = 56,
  ring = false,
  priority = false,
}: {
  id: number;
  name: string;
  color?: string;
  size?: number;
  ring?: boolean;
  priority?: boolean;
}) {
  const tint = color ?? "#8e8e93";
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full ${ring ? "shadow-[0_0_0_3px_var(--surface)]" : ""}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 90% at 50% 110%, color-mix(in oklab, ${tint} 55%, transparent), color-mix(in oklab, ${tint} 14%, var(--surface-2)) 70%)`,
      }}
    >
      <Image
        src={playerImage(id)}
        alt={name}
        width={size * 2}
        height={size * 2}
        priority={priority}
        className="absolute inset-x-0 bottom-0 h-full w-full object-cover object-top"
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Small badges

export function ResultBadge({ result }: { result: "W" | "D" | "L" | null }) {
  if (!result) return null;
  const color = { W: "var(--win)", D: "var(--draw)", L: "var(--loss)" }[result];
  const label = { W: "Win", D: "Draw", L: "Loss" }[result];
  return (
    <span
      className="inline-grid size-5 place-items-center rounded-md text-[10.5px] font-bold text-white"
      style={{ backgroundColor: color }}
      aria-label={label}
      title={label}
    >
      {result}
    </span>
  );
}

/** Goals and assists as compact icon chips, e.g. ⚽︎×2 ↗︎ */
export function Contributions({ goals, assists, size = 13 }: { goals: number; assists: number; size?: number }) {
  if (!goals && !assists) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-ink" aria-label={`${goals} goals, ${assists} assists`}>
      {goals > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <Ball size={size} />
          {goals > 1 && <span className="text-[11px] font-semibold tabular">×{goals}</span>}
        </span>
      )}
      {assists > 0 && (
        <span className="inline-flex items-center gap-0.5 text-ink-2">
          <Assist size={size} />
          {assists > 1 && <span className="text-[11px] font-semibold tabular">×{assists}</span>}
        </span>
      )}
    </span>
  );
}

/** Last-five-ratings strip: one rounded bar per match, height ∝ rating. */
export function FormStrip({ form }: { form: (number | null)[] }) {
  const slots = [...Array(Math.max(0, 5 - form.length)).fill(undefined), ...form] as (number | null | undefined)[];
  return (
    <span className="inline-flex h-5 items-end gap-[3px]" aria-label="Recent form">
      {slots.map((r, i) => {
        if (r === undefined) return <span key={i} className="h-[3px] w-[5px] rounded-full bg-surface-3" />;
        if (r === null) return <span key={i} className="h-[6px] w-[5px] rounded-full bg-surface-3" title="No rating" />;
        const h = Math.max(4, Math.min(20, ((r - 5) / 4.5) * 20));
        return (
          <span
            key={i}
            className="w-[5px] rounded-full"
            style={{ height: h, backgroundColor: `var(--r-${ratingBand(r)})` }}
            title={r.toFixed(1)}
          />
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Layout helpers

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "See all",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 sm:mb-8">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="display-md">{title}</h2>
        {description && <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="link inline-flex items-center gap-0.5 text-[15px]">
          {linkLabel}
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  className = "",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card flex flex-col justify-between p-5 ${className}`}>
      <p className="text-[13px] font-medium text-ink-2">{label}</p>
      <p className="mt-3 font-display text-[34px] font-semibold leading-none tracking-[-0.03em] tabular">{value}</p>
      {sub && <p className="mt-2 text-[12px] text-ink-3">{sub}</p>}
    </div>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warning" }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-2",
    accent: "bg-accent-soft text-accent",
    warning: "bg-[color-mix(in_oklab,var(--r-average)_18%,transparent)] text-[color-mix(in_oklab,var(--r-average)_70%,var(--ink))]",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${tones}`}>{children}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center">
      <p className="title">{title}</p>
      {children && <p className="mt-2 max-w-sm text-[15px] text-ink-2">{children}</p>}
    </div>
  );
}
