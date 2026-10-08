import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next only allows localhost by default. Without these hosts it refuses the
  // CSS, scripts and HMR socket, so the preview stays as an unstyled page.
  allowedDevOrigins: ["127.0.0.1", "*.agent.cvm.dev"],
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
