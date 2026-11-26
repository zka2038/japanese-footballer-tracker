import Link from "next/link";
import { SITE } from "@/config/site";
import { generatedAt, snapshot } from "@/lib/data";
import { formatFullDate } from "@/lib/format";
import { Brand } from "./brand";

const EXPLORE = [
  { href: "/", label: "Overview" },
  { href: "/players", label: "Players" },
  { href: "/matches", label: "Matches" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/highlights", label: "Highlights" },
];

const INFO = [
  { href: "/about", label: "About & sources" },
  { href: "/about#takedown", label: "Removal requests" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms of use" },
];

export function Footer() {
  const snap = snapshot();
  const updated = generatedAt();
  const year = updated.slice(0, 4);
  return (
    <footer className="mt-24 border-t border-hairline bg-bg text-[12px] leading-relaxed text-ink-3">
      <div className="container-page py-10">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Brand />
            <p className="max-w-sm">
              Every Japanese footballer in Europe&rsquo;s top divisions, through the {snap.season} season. An
              independent, non-commercial fan project.
            </p>
            <p>
              Updated {formatFullDate(updated)} at {updated.slice(11, 16)} UTC · {snap.players.length} players ·{" "}
              {Object.keys(snap.matches).length} matches
            </p>
          </div>

          <nav aria-label="Explore">
            <p className="mb-2 font-semibold text-ink-2">Explore</p>
            <ul className="space-y-1.5">
              {EXPLORE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ink hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Information">
            <p className="mb-2 font-semibold text-ink-2">Information</p>
            <ul className="space-y-1.5">
              {INFO.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ink hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={SITE.contactUrl} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                  Contact &amp; corrections
                </a>
              </li>
              <li>
                <a href={SITE.repo} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                  Source code
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 space-y-2 border-t border-hairline pt-6">
          <p>
            Statistics and match ratings ©{" "}
            <a className="link" href="https://www.fotmob.com" target="_blank" rel="noreferrer">
              FotMob
            </a>{" "}
            and its data partners. Highlight videos are embedded from their publishers on YouTube. Japanese names via
            Wikidata.
          </p>
          <p>
            Not affiliated with or endorsed by FotMob, YouTube, the Japan Football Association, UEFA, or any league,
            club or player. Player images, club crests and competition logos belong to their respective owners and are
            used for identification only. Information is provided as is and may be inaccurate or delayed.
          </p>
          <p className="pt-2">
            Copyright © {year} {SITE.name}. Site design and code only; third-party content remains with its owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
