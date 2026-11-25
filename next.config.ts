import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // FotMob and YouTube already serve small, optimized images; skipping the
    // optimizer keeps hosting free of image-transformation quotas.
    unoptimized: true,
    remotePatterns: [
      new URL("https://images.fotmob.com/image_resources/**"),
      new URL("https://i.ytimg.com/vi/**"),
      new URL("https://media.api-sports.io/football/**"),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
