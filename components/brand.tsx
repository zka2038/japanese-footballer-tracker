import Link from "next/link";

/** Wordmark: a small hinomaru disc and the name. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label="Kaigai home">
      <span className="relative grid size-[22px] place-items-center rounded-full bg-surface shadow-[inset_0_0_0_1px_var(--hairline-strong)]">
        <span className="size-[11px] rounded-full bg-accent transition-transform duration-500 ease-(--ease-apple) group-hover:scale-110" />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.02em]">
          Kaigai<span className="ml-1.5 font-jp text-[12px] font-medium tracking-normal text-ink-3">海外組</span>
        </span>
      )}
    </Link>
  );
}
