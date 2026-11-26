import type { ReactNode } from "react";
import { SITE } from "@/config/site";
import { formatFullDate } from "@/lib/format";

/** Shared layout for About / Privacy / Terms: generous measure, quiet typography. */
export function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <article className="container-page pt-14 sm:pt-20">
      <header className="max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-lg mt-3">{title}</h1>
        <p className="mt-4 text-[19px] leading-relaxed text-ink-2">{intro}</p>
        <p className="mt-4 text-[13px] text-ink-3">Last updated {formatFullDate(SITE.legalUpdated)}</p>
      </header>
      <div className="card mt-10 max-w-3xl p-6 sm:p-10">
        <div className="legal space-y-10 text-[16px] leading-[1.7] text-ink-2">{children}</div>
      </div>
    </article>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="title mb-3 text-ink">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="link" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
