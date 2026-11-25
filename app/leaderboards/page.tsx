import type { Metadata } from "next";
import { Leaderboard } from "@/components/leaderboard";
import { Reveal } from "@/components/motion";
import { METRICS, playerCards, snapshot } from "@/lib/data";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Who leads the Japanese contingent in Europe for goals, assists, ratings, xG and minutes this season.",
};

export default function LeaderboardsPage() {
  const snap = snapshot();
  const byScope = {
    club: playerCards("club"),
    league: playerCards("league"),
    europe: playerCards("europe"),
    cups: playerCards("cups"),
  };

  return (
    <div className="container-page pt-14 sm:pt-20">
      <Reveal>
        <p className="eyebrow">{snap.season.replace("/20", "/")} season</p>
        <h1 className="display-lg mt-3">Leaderboards.</h1>
        <p className="mt-4 max-w-2xl text-[19px] leading-relaxed text-ink-2">
          Who&rsquo;s leading the way. Pick a stat and a competition — ratings and per-90 numbers need at least 450
          minutes to qualify.
        </p>
      </Reveal>
      <div className="mt-10">
        <Leaderboard metrics={METRICS} byScope={byScope} />
      </div>
    </div>
  );
}
