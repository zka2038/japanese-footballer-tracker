import type { Metadata } from "next";
import Link from "next/link";
import { ExtLink, LegalPage, Section } from "@/components/legal-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "About & sources",
  description: "Where Kaigai's statistics, ratings, images and videos come from, and how to request a correction or removal.",
};

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="About"
      title="About & sources."
      intro="Kaigai is an independent, non-commercial fan project that follows Japanese footballers playing in Europe."
    >
      <Section id="about" title="What this is">
        <p>
          The site collects publicly available match information about Japanese players in Europe&rsquo;s top
          divisions and presents it in one place. It is updated automatically several times a day. It carries no
          advertising and does not sell anything.
        </p>
      </Section>

      <Section id="sources" title="Sources and attribution">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">Statistics, match ratings and fixtures:</strong> ©{" "}
            <ExtLink href="https://www.fotmob.com">FotMob</ExtLink> and its data partners. FotMob ratings are FotMob&rsquo;s own
            and are shown with credit. For full match data, visit FotMob.
          </li>
          <li>
            <strong className="text-ink">Highlight videos:</strong> embedded from YouTube using its official player in
            privacy-enhanced mode. Every video stays hosted on, and owned by, the channel that published it, usually
            the league, club or rights-holding broadcaster.
          </li>
          <li>
            <strong className="text-ink">Player photos, club crests and competition logos:</strong> the property of their
            respective owners, displayed for identification only and served from FotMob&rsquo;s image service.
          </li>
          <li>
            <strong className="text-ink">Japanese names:</strong> from <ExtLink href="https://www.wikidata.org">Wikidata</ExtLink>{" "}
            (CC0).
          </li>
        </ul>
      </Section>

      <Section id="disclaimer" title="No affiliation">
        <p>
          Kaigai is not affiliated with, endorsed by or sponsored by FotMob, YouTube, the Japan Football Association,
          UEFA, any league, any club or any player. Club, league and competition names, crests and logos are trademarks
          of their respective owners and are used only to identify them.
        </p>
      </Section>

      <Section id="accuracy" title="Accuracy">
        <p>
          Data is gathered automatically and may be incomplete, delayed or occasionally wrong. Ratings and advanced
          metrics such as xG are estimates. Nothing here should be relied on for betting, scouting, financial or other
          decisions. If you spot a mistake, please <ExtLink href={SITE.contactUrl}>{SITE.contactLabel}</ExtLink>.
        </p>
      </Section>

      <Section id="takedown" title="Removal requests">
        <p>
          If you own content that appears on this site — a photo, logo, video or data — and would like it removed or
          credited differently, please <ExtLink href={SITE.contactUrl}>{SITE.contactLabel}</ExtLink> with a link to the
          page and a short description. Valid requests are handled promptly, normally within a few days, and the
          content will be removed or replaced.
        </p>
        <p>
          Players or their representatives who would prefer not to be listed can make the same request.
        </p>
      </Section>

      <Section id="source-code" title="Source code">
        <p>
          The site&rsquo;s code is open on <ExtLink href={SITE.repo}>GitHub</ExtLink>. See also the{" "}
          <Link className="link" href="/privacy">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link className="link" href="/terms">
            terms of use
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
