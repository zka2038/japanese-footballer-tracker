/** Formatting helpers. Server-safe: all date output is pinned to UTC so it never mismatches on hydration. */

const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const longFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fullFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const formatDay = (iso: string) => dayFmt.format(new Date(iso));
export const formatShortDate = (iso: string) => shortFmt.format(new Date(iso));
export const formatLongDate = (iso: string) => longFmt.format(new Date(iso));
export const formatFullDate = (iso: string) => fullFmt.format(new Date(iso));

/** UTC calendar day key, e.g. "2026-11-22". */
export const dayKey = (iso: string) => iso.slice(0, 10);

export function formatRating(r: number | null | undefined): string {
  return r === null || r === undefined ? "–" : r.toFixed(1);
}

export function formatMoney(eur: number | null): string {
  if (!eur) return "–";
  if (eur >= 1e6) return `€${(eur / 1e6).toFixed(eur >= 1e7 ? 0 : 1)}M`;
  if (eur >= 1e3) return `€${Math.round(eur / 1e3)}K`;
  return `€${eur}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Relative day phrase against a fixed "now" (the snapshot time), e.g. "Today", "Yesterday", "3 days ago". */
export function relativeDay(iso: string, nowIso: string): string {
  const day = (s: string) => Math.floor(new Date(s).getTime() / 864e5);
  const diff = day(nowIso) - day(iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff === -1) return "Tomorrow";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < -1 && diff > -7) return `In ${-diff} days`;
  return formatShortDate(iso);
}
