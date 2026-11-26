import type { Metadata } from "next";
import Link from "next/link";
import { ExtLink, LegalPage, Section } from "@/components/legal-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using Kaigai, an independent fan site.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Terms" title="Terms of use." intro="By using this site you agree to these simple terms.">
      <Section id="purpose" title="Informational use only">
        <p>
          Kaigai is a free fan site provided for personal, informational and non-commercial use. It is offered
          &ldquo;as is&rdquo;, without warranties of any kind, including accuracy, completeness or availability.
        </p>
      </Section>

      <Section id="content" title="Content you see here">
        <p>
          Statistics, ratings, images, logos and videos belong to their respective owners, as listed on the{" "}
          <Link className="link" href="/about#sources">
            About &amp; sources
          </Link>{" "}
          page. Please don&rsquo;t copy, scrape or republish that third-party content from this site; go to the
          original source instead.
        </p>
      </Section>

      <Section id="liability" title="Liability">
        <p>
          To the fullest extent permitted by law, the site&rsquo;s maintainer is not liable for any loss or damage
          arising from use of the site or reliance on its information. Nothing here is betting, financial or
          professional advice.
        </p>
      </Section>

      <Section id="links" title="Links to other sites">
        <p>
          Links and embedded videos lead to services we don&rsquo;t control, such as FotMob and YouTube. Their own terms
          and policies apply.
        </p>
      </Section>

      <Section id="changes" title="Changes">
        <p>
          These terms may change, and the date at the top will show when they last did. Questions or concerns:{" "}
          <ExtLink href={SITE.contactUrl}>{SITE.contactLabel}</ExtLink>.
        </p>
      </Section>
    </LegalPage>
  );
}
