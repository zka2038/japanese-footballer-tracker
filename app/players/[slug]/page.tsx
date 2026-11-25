import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, Calendar, ChevronRight } from "@/components/icons";
import { LocalTime } from "@/components/local-time";
import { Reveal } from "@/components/motion";
import { PlayerSeason } from "@/components/player-season";
import { Chip, SectionHeader, TeamLogo } from "@/components/ui";
import { VideoProvider, VideoThumb } from "@/components/video";
import {
  competition,
  playerBySlug,
  playerCard,
  playerPerformances,
  players,
  snapshot,
  team,
  teamName,
  totals,
} from "@/lib/data";
import { formatDay, formatFullDate, formatMoney } from "@/lib/format";
import { leagueLogo, playerImage } from "@/lib/images";
import { aggregate } from "@/lib/stats";

/** "Early December 2026" → "early December 2026" */
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const KIND_ORDER = { league: 0, europe: 1, cup: 2, other: 3, national: 4 } as const;

export function generateStaticParams() {
  return players().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/players/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = playerBySlug(slug);
  if (!p) return {};
  const t = totals(p, "club");
  return {
    title: p.name,
    description: `${p.name} (${p.nameJa ?? ""}) at ${team(p.teamId).name}: ${t.apps} appearances, ${t.goals} goals, ${t.assists} assists${
      t.avgRating ? `, ${t.avgRating.toFixed(2)} average rating` : ""
    } this season.`,
  };
}

export default function PlayerPage({ params }: PageProps<"/players/[slug]">) {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <PlayerContent params={params} />
    </Suspense>
  );
}

function PlayerSkeleton() {
  return (
    <div className="container-page animate-pulse pt-6" aria-busy="true" aria-label="Loading player">
      <div className="h-4 w-32 rounded-full bg-surface-2" />
      <div className="mt-8 grid items-center gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <div className="h-3 w-28 rounded-full bg-surface-2" />
          <div className="mt-4 h-14 w-3/4 rounded-2xl bg-surface-2" />
          <div className="mt-3 h-6 w-40 rounded-full bg-surface-2" />
          <div className="mt-8 h-10 w-full max-w-xl rounded-2xl bg-surface-2" />
        </div>
        <div className="size-56 justify-self-center rounded-full bg-surface-2 sm:size-64" />
      </div>
      <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card h-28" />
        ))}
      </div>
    </div>
  );
}

async function PlayerContent({ params }: { params: PageProps<"/players/[slug]">["params"] }) {
  const { slug } = await params;
  const p = playerBySlug(slug);
  if (!p) notFound();

  const snap = snapshot();
  const club = team(p.teamId);
  const league = competition(p.leagueId);
  const perfs = playerPerformances(p);
  const card = playerCard(p);
  const highlights = perfs.filter((x) => x.highlight && x.goals + x.assists > 0);
  const nm = p.nextMatch && new Date(p.nextMatch.date) > new Date(snap.generatedAt) ? p.nextMatch : null;

  const facts: { label: string; value: string }[] = [
    { label: "Age", value: p.age ? `${p.age}` : "–" },
    { label: "Height", value: p.heightCm ? `${p.heightCm} cm` : "–" },
    { label: "Foot", value: p.preferredFoot ?? "–" },
    { label: "Shirt", value: p.shirtNumber ? `#${p.shirtNumber}` : "–" },
    { label: "Market value", value: formatMoney(p.marketValueEur) },
    { label: "Contract", value: p.contractEnd ? `Until ${p.contractEnd.slice(0, 4)}` : "–" },
  ];

  const compIds = [...new Set(perfs.filter((x) => !x.unusedSub).map((x) => x.competitionId))];
  const byComp = compIds
    .map((id) => ({
      id,
      name: competition(id).name,
      kind: competition(id).kind,
      t: aggregate(perfs.filter((x) => x.competitionId === id)),
    }))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.t.apps - a.t.apps);

  const groupName = { GK: "goalkeepers", DEF: "defenders", MID: "midfielders", FWD: "forwards" }[p.positionGroup];

  return (
    <VideoProvider>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
          style={{
            background: `radial-gradient(60% 70% at 75% 20%, color-mix(in oklab, ${club.color} 30%, transparent), transparent 70%)`,
          }}
        />
        <div className="container-page relative pt-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-ink-3">
            <Link href="/players" className="hover:text-ink">
              Players
            </Link>
            <ChevronRight size={12} />
            <span className="text-ink-2">{p.name}</span>
          </nav>

          <div className="mt-6 grid items-center gap-8 sm:mt-8 md:grid-cols-[1fr_auto] md:gap-10">
            <Reveal>
              <p className="eyebrow">
                {p.position}
                {p.shirtNumber ? ` · #${p.shirtNumber}` : ""}
              </p>
              <h1 className="display-lg mt-3">{p.name}</h1>
              {p.nameJa && <p className="mt-2 font-jp text-[22px] font-medium tracking-[0.04em] text-ink-2">{p.nameJa}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
                <span className="flex items-center gap-2 font-medium">
                  <TeamLogo id={club.id} logo={club.logo} size={24} /> {club.name}
                  {p.onLoan && <Chip>On loan</Chip>}
                </span>
                <Link href={`/players?league=${league.id}`} className="flex items-center gap-2 text-ink-2 hover:text-ink">
                  <span className="grid size-6 place-items-center rounded-md bg-white p-0.5 shadow-[0_0_0_1px_var(--hairline)]">
                    <Image src={leagueLogo(league.id)} alt="" width={20} height={20} className="size-5 object-contain" />
                  </span>
                  {league.name}
                </Link>
              </div>

              {p.injury && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--r-poor)_14%,transparent)] px-3.5 py-1.5 text-[13px] font-medium text-[color-mix(in_oklab,var(--r-poor)_75%,var(--ink))]">
                  <span className="size-1.5 rounded-full bg-[var(--r-poor)]" />
                  {p.injury.name}
                  {p.injury.expectedReturn ? ` · expected back ${p.injury.expectedReturn}` : ""}
                </p>
              )}

              <dl className="mt-8 grid max-w-xl grid-cols-3 gap-x-6 gap-y-5 sm:grid-cols-6">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[11.5px] text-ink-3">{f.label}</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold tabular">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={0.1} className="order-first justify-self-start md:order-none md:justify-self-end">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-[-18%] rounded-full blur-3xl"
                  style={{ background: `radial-gradient(circle, color-mix(in oklab, ${club.color} 40%, transparent), transparent 70%)` }}
                />
                <div
                  className="relative size-36 overflow-hidden rounded-full sm:size-56 lg:size-64"
                  style={{
                    background: `radial-gradient(120% 90% at 50% 110%, color-mix(in oklab, ${club.color} 60%, transparent), color-mix(in oklab, ${club.color} 14%, var(--surface)) 70%)`,
                    boxShadow: "0 30px 80px -20px rgb(0 0 0 / 0.35), inset 0 0 0 1px var(--hairline)",
                  }}
                >
                  <Image
                    src={playerImage(p.id)}
                    alt={p.name}
                    width={256}
                    height={256}
                    priority
                    className="absolute inset-0 size-full object-cover object-top"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 grid size-11 place-items-center rounded-full bg-surface p-2 shadow-lift sm:bottom-2 sm:right-2 sm:size-14 sm:p-2.5">
                  <TeamLogo id={club.id} logo={club.logo} size={30} />
                </span>
              </div>
            </Reveal>
          </div>

          {nm && (
            <Reveal delay={0.15}>
              <div className="card mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 sm:px-6">
                <span className="flex items-center gap-2 text-[13px] font-medium text-accent">
                  <Calendar size={15} /> Next match
                </span>
                <span className="flex flex-1 items-center gap-2 text-[15px] font-medium">
                  <TeamLogo id={nm.homeId} size={20} /> {teamName(nm.homeId, nm.homeName)}
                  <span className="text-ink-3">v</span>
                  <TeamLogo id={nm.awayId} size={20} /> {teamName(nm.awayId, nm.awayName)}
                </span>
                <span className="text-[13px] text-ink-2">
                  {competition(nm.competitionId).shortName || nm.competitionName} · <LocalTime iso={nm.date} withDay />
                </span>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <PlayerSeason
        performances={perfs}
        season={snap.season}
        isKeeper={p.positionGroup === "GK"}
        emptyNote={
          p.injury
            ? `${p.firstName || p.name} is out with a ${p.injury.name.toLowerCase()}${
                p.injury.expectedReturn ? ` and is expected back ${lowerFirst(p.injury.expectedReturn)}` : ""
              }.`
            : `${p.name} hasn't featured in a tracked match since the season started.`
        }
      />

      {/* ---------------------------------------------------- By competition */}
      {byComp.length > 1 && (
        <section className="container-page mt-4">
          <div className="card overflow-hidden">
            <p className="title px-5 pb-3 pt-6 sm:px-8">By competition</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-y border-hairline text-left text-[11.5px] text-ink-3">
                    <th className="py-2.5 pl-5 font-medium sm:pl-8">Competition</th>
                    <th className="px-2 py-2.5 text-right font-medium">Apps</th>
                    <th className="hidden px-2 py-2.5 text-right font-medium sm:table-cell">Min</th>
                    <th className="px-2 py-2.5 text-right font-medium">G</th>
                    <th className="px-2 py-2.5 text-right font-medium">A</th>
                    <th className="py-2.5 pl-2 pr-5 text-right font-medium sm:pr-8">Avg rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline tabular">
                  {byComp.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 pl-5 sm:pl-8">
                        <span className="flex items-center gap-2.5">
                          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white p-0.5 shadow-[0_0_0_1px_var(--hairline)]">
                            <Image src={leagueLogo(c.id)} alt="" width={20} height={20} className="size-5 object-contain" />
                          </span>
                          {c.name}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right">{c.t.apps}</td>
                      <td className="hidden px-2 py-3 text-right text-ink-2 sm:table-cell">{c.t.minutes.toLocaleString("en-GB")}</td>
                      <td className="px-2 py-3 text-right font-semibold">{c.t.goals}</td>
                      <td className="px-2 py-3 text-right font-semibold">{c.t.assists}</td>
                      <td className="py-3 pl-2 pr-5 text-right sm:pr-8">{c.t.avgRating?.toFixed(2) ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------- Profile chart */}
      {p.traits.length > 0 && (
        <section className="container-page mt-16">
          <Reveal>
            <SectionHeader
              eyebrow="Player profile"
              title="Versus the league."
              description={`Percentile rank against other ${groupName} in the same league, from FotMob.`}
            />
          </Reveal>
          <Reveal>
            <div className="card grid gap-x-10 gap-y-5 p-6 sm:grid-cols-2 sm:p-8">
              {p.traits.map((tr) => {
                const pct = Math.round(tr.value * 100);
                return (
                  <div key={tr.key}>
                    <div className="mb-2 flex items-baseline justify-between text-[14px]">
                      <span className="font-medium">{tr.title}</span>
                      <span className="text-ink-2 tabular">{pct}th</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(3, pct)}%`,
                          background: `color-mix(in oklab, var(--accent) ${40 + pct * 0.6}%, var(--surface-3))`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>
      )}

      {/* ------------------------------------------------------- Highlights */}
      {highlights.length > 0 && (
        <section className="container-page mt-16">
          <Reveal>
            <SectionHeader eyebrow="Highlights" title="Goals and assists." />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.slice(0, 6).map((h, i) => {
              const homeName = h.home ? h.teamName : h.opponentName;
              const awayName = h.home ? h.opponentName : h.teamName;
              const score = h.home ? `${h.goalsFor}–${h.goalsAgainst}` : `${h.goalsAgainst}–${h.goalsFor}`;
              const what = [
                h.goals ? `${h.goals > 1 ? `${h.goals} goals` : "Goal"}${h.goalMinutes.length ? ` ${h.goalMinutes.map((m) => `${m}′`).join(", ")}` : ""}` : "",
                h.assists ? `${h.assists > 1 ? `${h.assists} assists` : "Assist"}${h.assistMinutes.length ? ` ${h.assistMinutes.map((m) => `${m}′`).join(", ")}` : ""}` : "",
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Reveal key={h.matchId} delay={(i % 3) * 0.05}>
                  <VideoThumb
                    videoId={h.highlight!.videoId}
                    thumbnail={h.highlight!.thumbnail}
                    title={`${homeName} ${score} ${awayName}`}
                    subtitle={`${h.competition} · ${formatDay(h.date)} · ${what}`}
                    className="aspect-video"
                  >
                    <span className="block text-[12px] text-white/70">
                      {h.competition} · {formatDay(h.date)}
                    </span>
                    <span className="block text-[16px] font-semibold">
                      {homeName} {score} {awayName}
                    </span>
                    <span className="block text-[12.5px] text-white/80">{what}</span>
                  </VideoThumb>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      <section className="container-page mt-16">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-3">
          <span>
            {card.totals.ratedApps} rated club matches · data updated {formatFullDate(snap.generatedAt)}
          </span>
          <a
            className="link inline-flex items-center gap-0.5"
            href={`https://www.fotmob.com/players/${p.id}/${p.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Full profile on FotMob <ArrowUpRight size={12} />
          </a>
        </p>
      </section>
    </VideoProvider>
  );
}
