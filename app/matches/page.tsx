import type { Metadata } from "next";
import Link from "next/link";
import { LocalTime } from "@/components/local-time";
import { MatchesFeed, type FeedMatch } from "@/components/matches-feed";
import { Reveal } from "@/components/motion";
import { PlayerAvatar, TeamLogo } from "@/components/ui";
import { VideoProvider } from "@/components/video";
import { matchDigests, snapshot, teamName, upcomingFixtures } from "@/lib/data";

export const metadata: Metadata = {
  title: "Matches",
  description: "Every match involving a Japanese player in Europe this season: results, ratings, goals and highlights.",
};

export default function MatchesPage() {
  const snap = snapshot();
  const fixtures = upcomingFixtures(10);
  const feed: FeedMatch[] = matchDigests().map((d) => ({
    id: d.match.id,
    date: d.match.date,
    competition: d.competition.shortName,
    competitionKind: d.competition.kind,
    round: d.match.round,
    home: { ...d.match.home, name: teamName(d.match.home.id, d.match.home.name) },
    away: { ...d.match.away, name: teamName(d.match.away.id, d.match.away.name) },
    highlight: d.match.highlight,
    performances: d.performances.map((p) => ({
      playerId: p.playerId,
      slug: p.slug,
      name: p.name,
      teamId: p.teamId,
      minutes: p.minutes,
      started: p.started,
      goals: p.goals,
      assists: p.assists,
      rating: p.rating,
      isTopRating: p.isTopRating,
      goalMinutes: p.goalMinutes,
      assistMinutes: p.assistMinutes,
    })),
  }));

  return (
    <VideoProvider>
      <div className="container-page pt-14 sm:pt-20">
        <Reveal>
          <p className="eyebrow">{snap.season.replace("/20", "/")} season</p>
          <h1 className="display-lg mt-3">Matches.</h1>
          <p className="mt-4 max-w-2xl text-[19px] leading-relaxed text-ink-2">
            Every game a Japanese player featured in, newest first — with ratings, goals and the official highlights.
          </p>
        </Reveal>

        {fixtures.length > 0 && (
          <section className="mt-12" aria-labelledby="upcoming">
            <h2 id="upcoming" className="title mb-4">
              Coming up
            </h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
              {fixtures.map((f) => (
                <div key={f.matchId} className="card w-[260px] shrink-0 snap-start p-4">
                  <p className="text-[12px] text-ink-3">
                    {f.competition} · <LocalTime iso={f.date} withDay />
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-[14px] font-medium">
                    <TeamLogo id={f.home.id} size={20} /> <span className="truncate">{f.home.name}</span>
                  </p>
                  <p className="mt-1.5 flex items-center gap-2 text-[14px] font-medium">
                    <TeamLogo id={f.away.id} size={20} /> <span className="truncate">{f.away.name}</span>
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="flex -space-x-2">
                      {f.players.slice(0, 5).map((p) => (
                        <Link key={p.id} href={`/players/${p.slug}`} title={p.name} aria-label={p.name}>
                          <PlayerAvatar id={p.id} name={p.name} size={26} ring />
                        </Link>
                      ))}
                    </span>
                    <span className="truncate text-[12px] text-ink-2">
                      {f.players.map((p) => p.lastName).join(", ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12" aria-label="Results">
          <h2 className="title mb-1">Results</h2>
          <MatchesFeed matches={feed} />
        </section>
      </div>
    </VideoProvider>
  );
}
