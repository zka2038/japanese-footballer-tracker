import Link from "next/link";
import { generatedAt, snapshot } from "@/lib/data";
import { formatFullDate } from "@/lib/format";
import { Brand } from "./brand";

export function Footer() {
  const snap = snapshot();
  const updated = new Date(generatedAt());
  const time = updated.toISOString().slice(11, 16);
  return (
    <footer className="mt-24 border-t border-hairline bg-bg">
      <div className="container-page grid gap-8 py-10 text-[12px] leading-relaxed text-ink-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <Brand />
          <p className="max-w-md">
            Tracking every Japanese footballer in Europe&rsquo;s top divisions through the {snap.season} season.
            Statistics and ratings from{" "}
            <a className="link" href="https://www.fotmob.com" target="_blank" rel="noreferrer">
              FotMob
            </a>
            ; highlight videos from official broadcasters on YouTube. An independent fan project, not affiliated with
            any club, league or data provider.
          </p>
        </div>
        <div className="space-y-1 sm:text-right">
          <p>
            Updated {formatFullDate(snap.generatedAt)} at {time} UTC
          </p>
          <p>
            {snap.players.length} players · {Object.keys(snap.matches).length} matches
          </p>
          <p className="flex gap-4 pt-2 sm:justify-end">
            <Link href="/players" className="hover:text-ink">
              Players
            </Link>
            <Link href="/leaderboards" className="hover:text-ink">
              Leaderboards
            </Link>
            <Link href="/highlights" className="hover:text-ink">
              Highlights
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
