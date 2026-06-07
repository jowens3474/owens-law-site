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
  async redirects() {
    return [
      // Renamed slug: keep the old URLs (HTML, Markdown, /markdown) working
      // with permanent (301) redirects so links and search results update.
      {
        source: "/article/no-deals-no-dismissals-jackson-gets-trial",
        destination: "/article/jackson-corruption-recording-fight",
        permanent: true,
      },
      {
        source: "/article/no-deals-no-dismissals-jackson-gets-trial.md",
        destination: "/article/jackson-corruption-recording-fight.md",
        permanent: true,
      },
      {
        source: "/article/no-deals-no-dismissals-jackson-gets-trial/markdown",
        destination: "/article/jackson-corruption-recording-fight/markdown",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
