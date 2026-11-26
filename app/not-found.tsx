import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="display-lg mt-3">Offside.</h1>
        <p className="mx-auto mt-4 max-w-md text-[19px] text-ink-2">
          That page doesn&rsquo;t exist — or the player has left the leagues we track.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-white hover:brightness-110">
            Back to overview
          </Link>
          <Link href="/players" className="rounded-full px-6 py-3 text-[15px] font-medium text-link hover:bg-surface">
            Browse players
          </Link>
        </div>
      </div>
    </div>
  );
}
