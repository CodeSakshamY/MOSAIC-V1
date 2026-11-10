import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components are on. Do not put signed-in or personal data behind "use cache".
  cacheComponents: true,
  partialPrefetching: true,
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
