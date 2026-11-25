import type { Team } from "./types";

const CDN = "https://images.fotmob.com/image_resources";

export const playerImage = (id: number) => `${CDN}/playerimages/${id}.png`;

export const teamLogo = (team: Pick<Team, "id" | "logo"> | number) =>
  typeof team === "number" ? `${CDN}/logo/teamlogo/${team}.png` : (team.logo ?? `${CDN}/logo/teamlogo/${team.id}.png`);

export const leagueLogo = (id: number, dark = false) => `${CDN}/logo/leaguelogo/${dark ? "dark/" : ""}${id}.png`;

export const youtubeEmbed = (videoId: string) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
