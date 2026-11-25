import type { Metadata } from "next";
import { HighlightsGallery } from "@/components/highlights-gallery";
import { Reveal } from "@/components/motion";
import { VideoProvider } from "@/components/video";
import { highlightFeed, snapshot } from "@/lib/data";

export const metadata: Metadata = {
  title: "Highlights",
  description: "Official match highlights from every game where a Japanese player scored or assisted in Europe this season.",
};

export default function HighlightsPage() {
  const snap = snapshot();
  const items = highlightFeed();
  return (
    <VideoProvider>
      <div className="container-page pt-14 sm:pt-20">
        <Reveal>
          <p className="eyebrow">{snap.season.replace("/20", "/")} season</p>
          <h1 className="display-lg mt-3">Highlights.</h1>
          <p className="mt-4 max-w-2xl text-[19px] leading-relaxed text-ink-2">
            {items.length} matches where a Japanese player scored or set one up. Official highlights from the leagues and
            broadcasters, played right here.
          </p>
        </Reveal>
        <div className="mt-10">
          <HighlightsGallery items={items} />
        </div>
      </div>
    </VideoProvider>
  );
}
