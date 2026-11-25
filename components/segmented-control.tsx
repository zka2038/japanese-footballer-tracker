"use client";

import { motion } from "motion/react";
import { useId } from "react";

export interface Segment<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
}

/** iOS-style segmented control with a sliding thumb. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  size = "md",
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className="no-scrollbar inline-flex max-w-full overflow-x-auto rounded-full bg-surface-3/60 p-[3px]"
    >
      {segments.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={s.disabled}
            onClick={() => onChange(s.id)}
            className={`relative shrink-0 rounded-full font-medium transition-colors disabled:opacity-35 ${
              size === "sm" ? "px-3 py-1 text-[12px]" : "px-4 py-1.5 text-[13px]"
            } ${active ? "text-ink" : "text-ink-2 hover:text-ink"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.04)]"
                transition={{ type: "spring", stiffness: 520, damping: 42 }}
              />
            )}
            <span className="relative whitespace-nowrap">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
