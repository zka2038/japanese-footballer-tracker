import Link from "next/link";
import type { PlayerCardData } from "@/lib/data";
import { PlayerAvatar } from "./ui";

/** Endless, gently drifting rows of headshots. Pauses on hover; static with reduced motion. */
export function PlayerMarquee({ players }: { players: PlayerCardData[] }) {
  const half = Math.ceil(players.length / 2);
  const rows = [players.slice(0, half), players.slice(half)];
  return (
    <div
      className="marquee relative overflow-hidden py-2"
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
      }}
    >
      {rows.map((row, r) => (
        <div key={r} className={`marquee-track flex w-max gap-3 ${r === 1 ? "marquee-reverse mt-3" : ""}`}>
          {[...row, ...row].map((p, i) => (
            <Link
              key={`${p.id}-${i}`}
              href={`/players/${p.slug}`}
              aria-hidden={i >= row.length}
              tabIndex={i >= row.length ? -1 : 0}
              className="group flex items-center gap-2.5 rounded-full bg-surface py-1.5 pl-1.5 pr-4 shadow-card transition-shadow hover:shadow-lift"
            >
              <PlayerAvatar id={p.id} name="" color={p.teamColor} size={34} />
              <span className="whitespace-nowrap text-[13px] font-medium">
                {p.name}
                <span className="ml-1.5 text-ink-3">{p.teamName}</span>
              </span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
