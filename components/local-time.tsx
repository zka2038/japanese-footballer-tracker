"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Kick-off time in the visitor's own time zone. Renders a UTC fallback on the
 * server and swaps to local time after hydration.
 */
export function LocalTime({ iso, withDay = false }: { iso: string; withDay?: boolean }) {
  const local = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(withDay ? { weekday: "short", day: "numeric", month: "short" } : {}),
    ...(local ? {} : { timeZone: "UTC" }),
  };
  const text = d.toLocaleString(local ? undefined : "en-GB", opts);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
      {local ? "" : " UTC"}
    </time>
  );
}
