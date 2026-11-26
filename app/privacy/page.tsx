import type { Metadata } from "next";
import { ExtLink, LegalPage, Section } from "@/components/legal-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Kaigai does and doesn't collect: no accounts, no analytics, no advertising cookies.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy policy."
      intro="Short version: no accounts, no analytics, no advertising and no tracking cookies of our own."
    >
      <Section id="collect" title="What we collect">
        <p>
          Kaigai does not ask for, collect or store personal information. There are no sign-ups, forms, comments or
          analytics tools, and the site sets no cookies of its own.
        </p>
      </Section>

      <Section id="device" title="Stored on your device">
        <p>
          If you switch between light and dark mode, that choice is saved in your browser&rsquo;s local storage so it
          is remembered next time. It never leaves your device. You can clear it at any time through your browser
          settings.
        </p>
      </Section>

      <Section id="third-parties" title="Third-party services">
        <p>Some parts of a page load directly from other services, which then receive your IP address and browser details:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">Hosting:</strong> the site is served by{" "}
            <ExtLink href="https://vercel.com/legal/privacy-notice">Vercel</ExtLink>, which may keep short-lived server logs
            for security and reliability.
          </li>
          <li>
            <strong className="text-ink">Images:</strong> player photos and crests load from FotMob (
            <ExtLink href="https://www.fotmob.com/privacy_fotmob.html">privacy policy</ExtLink>), and video thumbnails from YouTube.
          </li>
          <li>
            <strong className="text-ink">Videos:</strong> highlights use YouTube&rsquo;s privacy-enhanced mode
            (youtube-nocookie.com), so the player loads only when you press play. Once a video plays, Google&rsquo;s{" "}
            <ExtLink href="https://policies.google.com/privacy">privacy policy</ExtLink> applies, and YouTube may set
            cookies.
          </li>
          <li>
            <strong className="text-ink">Fonts:</strong> self-hosted with the site; no requests go to Google Fonts.
          </li>
        </ul>
      </Section>

      <Section id="changes" title="Changes and contact">
        <p>
          If the site ever adds analytics or advertising, this page will be updated first. Questions:{" "}
          <ExtLink href={SITE.contactUrl}>{SITE.contactLabel}</ExtLink>.
        </p>
      </Section>
    </LegalPage>
  );
}
