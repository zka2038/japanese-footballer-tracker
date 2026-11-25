import type { Metadata } from "next";
import { Suspense } from "react";
import { Reveal } from "@/components/motion";
import { PlayerCard } from "@/components/player-card";
import { PlayersExplorer } from "@/components/players-explorer";
import { playerCards, snapshot, trackedLeagues } from "@/lib/data";

export const metadata: Metadata = {
  title: "Players",
  description: "Every Japanese footballer in Europe's top leagues, with season stats, ratings and form.",
};

export default function PlayersPage() {
  const cards = playerCards("club");
  const leagues = trackedLeagues();
  const snap = snapshot();
  const fallback = [...cards].sort((a, b) => b.totals.ga - a.totals.ga || b.totals.goals - a.totals.goals);

  return (
    <div className="container-page pt-14 sm:pt-20">
      <Reveal>
        <p className="eyebrow">{snap.season.replace("/20", "/")} season</p>
        <h1 className="display-lg mt-3">Players.</h1>
        <p className="mt-4 max-w-2xl text-[19px] leading-relaxed text-ink-2">
          {cards.length} Japanese footballers across {leagues.length} European leagues. Club stats include league, cup and
          European matches.
        </p>
      </Reveal>

      <div className="mt-10">
        <Suspense
          fallback={
            <ul className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fallback.map((p) => (
                <li key={p.id}>
                  <PlayerCard p={p} />
                </li>
              ))}
            </ul>
          }
        >
          <PlayersExplorer players={cards} leagues={leagues} />
        </Suspense>
      </div>
    </div>
  );
}
