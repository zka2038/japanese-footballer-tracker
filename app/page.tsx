import Image from "next/image";
import Link from "next/link";
import { ContributionBars } from "@/components/contribution-bars";
import { Calendar, ChevronRight } from "@/components/icons";
import { LocalTime } from "@/components/local-time";
import { CountUp, Reveal } from "@/components/motion";
import { PerformanceCard } from "@/components/performance-card";
import { PlayerMarquee } from "@/components/player-marquee";
import { PlayerAvatar, SectionHeader, TeamLogo } from "@/components/ui";
import { VideoProvider, VideoThumb } from "@/components/video";
import {
  highlightFeed,
  leaders,
  playerCards,
  seasonHeadline,
  snapshot,
  standouts,
  trackedLeagues,
  upcomingFixtures,
  type PlayerCardData,
} from "@/lib/data";
import { formatDay, formatNumber } from "@/lib/format";
import { leagueLogo } from "@/lib/images";

export default function Home() {
  const snap = snapshot();
  const head = seasonHeadline();
  const cards = playerCards("club").sort((a, b) => b.totals.minutes - a.totals.minutes);
  const week = standouts(7, 12);
  const highlights = highlightFeed().slice(0, 4);
  const fixtures = upcomingFixtures(7).slice(0, 6);
  const leagues = trackedLeagues();

  const topScorer = leaders("goals")[0];
  const topAssist = leaders("assists")[0];
  const topRated = leaders("avgRating")[0];
  const ironman = leaders("minutes")[0];
  const gaTop = leaders("ga", "club", 8);
  const minutesTop = leaders("minutes", "club", 5);

  return (
    <VideoProvider>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="hero-sun pointer-events-none absolute left-1/2 top-[44%] size-[min(78vw,640px)] rounded-full opacity-[0.16] blur-[80px] dark:opacity-25"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 68%)" }}
        />
        <div className="container-page relative pb-10 pt-16 text-center sm:pt-24">
          <Reveal>
            <p className="eyebrow">{snap.season.replace("/20", "/")} season</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="display-xl mx-auto mt-4 max-w-4xl">
              Samurai Blue,
              <br />
              <span className="text-gradient">all over Europe.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-[19px] leading-relaxed text-ink-2 sm:text-[21px]">
              {head.players} Japanese players across {head.leagues} leagues. Every appearance, rating, goal and highlight
              — in one place.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/players"
                className="rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-white transition hover:brightness-110"
              >
                Explore players
              </Link>
              <Link
                href="/highlights"
                className="rounded-full px-6 py-3 text-[15px] font-medium text-link transition hover:bg-surface"
              >
                Watch highlights <ChevronRight size={14} className="inline -mt-0.5" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-y-8 sm:grid-cols-4">
              {[
                { label: "Goals", value: head.goals },
                { label: "Assists", value: head.assists },
                { label: "Appearances", value: head.apps },
                { label: "Minutes", value: head.minutes },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-[13px] font-medium text-ink-2">{s.label}</dt>
                  <dd className="mt-1 font-display text-[40px] font-semibold tracking-[-0.03em] tabular sm:text-[48px]">
                    <CountUp value={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[12px] text-ink-3">Club competitions, {snap.season} season to date.</p>
          </Reveal>
        </div>
        <Reveal delay={0.4} y={12}>
          <PlayerMarquee players={cards} />
        </Reveal>
      </section>

      {/* ------------------------------------------------------- This week */}
      {week.length > 0 && (
        <section className="mt-24 sm:mt-32">
          <div className="container-page">
            <Reveal>
              <SectionHeader
                eyebrow="This week"
                title="Standout performances."
                description="The best-rated displays from the last seven days, with every goal and assist."
                href="/matches"
                linkLabel="All matches"
              />
            </Reveal>
          </div>
          <Reveal>
            <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-6 sm:scroll-px-6 sm:px-6 lg:px-[max(24px,calc((100vw-1180px)/2+24px))] lg:scroll-px-[max(24px,calc((100vw-1180px)/2+24px))]">
              {week.map((perf) => (
                <div key={`${perf.playerId}-${perf.matchId}`} className="w-[300px] shrink-0 snap-start sm:w-[330px]">
                  <PerformanceCard perf={perf} now={snap.generatedAt} />
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ---------------------------------------------------- Season leaders */}
      <section className="container-page mt-20 sm:mt-28">
        <Reveal>
          <SectionHeader
            eyebrow="Season leaders"
            title="The numbers so far."
            href="/leaderboards"
            linkLabel="Leaderboards"
          />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-6">
          {topScorer && (
            <Reveal className="md:col-span-3 md:row-span-2">
              <HeroLeader label="Top scorer" value={topScorer.totals.goals} unit="goals" player={topScorer} />
            </Reveal>
          )}
          {topAssist && (
            <Reveal className="md:col-span-3" delay={0.06}>
              <MiniLeader label="Most assists" value={String(topAssist.totals.assists)} player={topAssist} />
            </Reveal>
          )}
          {topRated && (
            <Reveal className="md:col-span-3" delay={0.12}>
              <MiniLeader
                label="Highest average rating"
                value={topRated.totals.avgRating!.toFixed(2)}
                player={topRated}
                note="Min. 450 minutes"
              />
            </Reveal>
          )}
          <Reveal className="md:col-span-4" delay={0.06}>
            <div className="card h-full p-6 sm:p-8">
              <p className="title">Goal contributions</p>
              <p className="mb-5 mt-1 text-[14px] text-ink-2">Goals and assists in all club competitions.</p>
              <ContributionBars rows={gaTop} />
            </div>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.12}>
            <div className="card flex h-full flex-col p-6 sm:p-8">
              <p className="title">Most minutes</p>
              <p className="mb-5 mt-1 text-[14px] text-ink-2">The players their coaches trust.</p>
              {ironman && (
                <p className="font-display text-[56px] font-semibold leading-none tracking-[-0.04em] tabular">
                  <CountUp value={ironman.totals.minutes} />
                  <span className="ml-1 text-[22px] text-ink-3">min</span>
                </p>
              )}
              <ol className="mt-6 space-y-3">
                {minutesTop.map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/players/${p.slug}`} className="flex items-center gap-3 rounded-xl transition-opacity hover:opacity-70">
                      <span className="w-3 text-[12px] text-ink-3 tabular">{i + 1}</span>
                      <PlayerAvatar id={p.id} name="" color={p.teamColor} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{p.name}</span>
                        <span className="block truncate text-[11.5px] text-ink-3">
                          {p.totals.starts}/{p.totals.apps} started
                        </span>
                      </span>
                      <span className="text-[13px] font-semibold tabular">{p.totals.minutes.toLocaleString("en-GB")}&prime;</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------ Highlights */}
      {highlights.length > 0 && (
        <section className="container-page mt-20 sm:mt-28">
          <Reveal>
            <SectionHeader
              eyebrow="Highlights"
              title="Watch the goals."
              description="Official match highlights from every game where a Japanese player scored or assisted."
              href="/highlights"
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((h, i) => (
              <Reveal key={h.matchId} delay={(i % 2) * 0.06}>
                <VideoThumb
                  videoId={h.highlight.videoId}
                  thumbnail={h.highlight.thumbnail}
                  title={`${h.home.name} ${h.home.score}–${h.away.score} ${h.away.name}`}
                  subtitle={`${h.competition} · ${formatDay(h.date)}`}
                  className="aspect-video"
                >
                  <span className="block text-[12px] font-medium text-white/70">
                    {h.competition} · {formatDay(h.date)}
                  </span>
                  <span className="mt-0.5 block text-[19px] font-semibold tracking-[-0.01em]">
                    {h.home.name} {h.home.score}–{h.away.score} {h.away.name}
                  </span>
                  <span className="mt-1 block text-[13px] text-white/80">
                    {h.involvements
                      .map((p) => {
                        const parts = [];
                        if (p.goals) parts.push(p.goals > 1 ? `${p.goals} goals` : "goal");
                        if (p.assists) parts.push(p.assists > 1 ? `${p.assists} assists` : "assist");
                        return `${p.lastName || p.name} ${parts.join(" + ")}`;
                      })
                      .join(" · ")}
                  </span>
                </VideoThumb>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------- Fixtures */}
      {fixtures.length > 0 && (
        <section className="container-page mt-20 sm:mt-28">
          <Reveal>
            <SectionHeader eyebrow="Coming up" title="Next fixtures." />
          </Reveal>
          <Reveal>
            <ul className="card divide-y divide-hairline overflow-hidden">
              {fixtures.map((f) => (
                <li key={f.matchId} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 sm:px-6">
                  <span className="flex w-44 shrink-0 items-center gap-2 text-[13px] text-ink-2">
                    <Calendar size={14} /> <LocalTime iso={f.date} withDay />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-medium">
                    <TeamLogo id={f.home.id} size={20} />
                    <span className="truncate">{f.home.name}</span>
                    <span className="text-ink-3">v</span>
                    <TeamLogo id={f.away.id} size={20} />
                    <span className="truncate">{f.away.name}</span>
                  </span>
                  <span className="text-[12px] text-ink-3">{f.competition}</span>
                  <span className="flex -space-x-2">
                    {f.players.map((p) => (
                      <Link key={p.id} href={`/players/${p.slug}`} title={p.name} aria-label={p.name}>
                        <PlayerAvatar id={p.id} name={p.name} size={28} ring />
                      </Link>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}

      {/* --------------------------------------------------------- Leagues */}
      <section className="container-page mt-20 sm:mt-28">
        <Reveal>
          <SectionHeader eyebrow="Where they play" title="Nine leagues. One story." description="Tap a league to see every Japanese player in it." />
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {leagues.map((l, i) => {
            const inLeague = cards.filter((c) => c.leagueId === l.id);
            return (
              <Reveal key={l.id} delay={(i % 5) * 0.04}>
                <Link
                  href={`/players?league=${l.id}`}
                  className="card group flex h-full flex-col p-5 transition-shadow duration-500 hover:shadow-lift"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-white p-1.5 shadow-[0_0_0_1px_var(--hairline)]">
                    <Image src={leagueLogo(l.id)} alt="" width={32} height={32} className="size-8 object-contain" />
                  </span>
                  <span className="mt-4 text-[15px] font-semibold">{l.name}</span>
                  <span className="text-[12.5px] text-ink-3">
                    {l.players} {l.players === 1 ? "player" : "players"} ·{" "}
                    {formatNumber(inLeague.reduce((n, c) => n + c.totals.ga, 0))} G+A
                  </span>
                  <span className="mt-4 flex -space-x-2">
                    {inLeague.slice(0, 5).map((c) => (
                      <PlayerAvatar key={c.id} id={c.id} name="" color={c.teamColor} size={26} ring />
                    ))}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </VideoProvider>
  );
}

function HeroLeader({ label, value, unit, player }: { label: string; value: number; unit: string; player: PlayerCardData }) {
  return (
    <Link
      href={`/players/${player.slug}`}
      className="card group relative flex h-full min-h-[360px] flex-col overflow-hidden p-6 transition-shadow duration-500 hover:shadow-lift sm:p-8"
    >
      <div
        aria-hidden
        className="absolute -right-16 -top-16 size-80 rounded-full opacity-60 blur-3xl"
        style={{ background: `radial-gradient(circle, color-mix(in oklab, ${player.teamColor} 45%, transparent), transparent 70%)` }}
      />
      <p className="relative text-[13px] font-medium text-ink-2">{label}</p>
      <p className="relative mt-2 font-display text-[96px] font-bold leading-[0.9] tracking-[-0.05em] tabular sm:text-[120px]">
        <CountUp value={value} />
      </p>
      <p className="relative text-[15px] text-ink-3">{unit} in all club competitions</p>
      <div className="relative mt-auto flex items-end justify-between gap-4 pt-10">
        <div>
          <p className="text-[24px] font-semibold tracking-[-0.02em]">{player.name}</p>
          {player.nameJa && <p className="font-jp text-[13px] text-ink-3">{player.nameJa}</p>}
          <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
            <TeamLogo id={player.teamId} size={18} /> {player.teamName}
          </p>
        </div>
        <span className="transition-transform duration-700 ease-(--ease-apple) group-hover:scale-105">
          <PlayerAvatar id={player.id} name={player.name} color={player.teamColor} size={120} />
        </span>
      </div>
    </Link>
  );
}

function MiniLeader({ label, value, player, note }: { label: string; value: string; player: PlayerCardData; note?: string }) {
  return (
    <Link
      href={`/players/${player.slug}`}
      className="card group flex h-full items-center justify-between gap-4 p-6 transition-shadow duration-500 hover:shadow-lift sm:p-8"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        <p className="mt-1 font-display text-[56px] font-semibold leading-none tracking-[-0.04em] tabular">{value}</p>
        <p className="mt-3 truncate text-[15px] font-semibold">{player.name}</p>
        <p className="truncate text-[12.5px] text-ink-3">
          {player.teamName}
          {note ? ` · ${note}` : ""}
        </p>
      </div>
      <PlayerAvatar id={player.id} name={player.name} color={player.teamColor} size={84} />
    </Link>
  );
}
