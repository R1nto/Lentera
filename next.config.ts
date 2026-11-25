import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standard App Router rendering for authenticated runtime routes.
  cacheComponents: false,
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
