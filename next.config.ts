import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles so /article/<slug>.md is rewritten before the [slug] page matches it.
      beforeFiles: [
        { source: "/article/:slug.md", destination: "/article/:slug/markdown" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
