import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// This app lives in a subdirectory of a repo that also contains the Jackson
// Wire site (with its own lockfile at the root). Pin Turbopack's root here so
// it doesn't walk up and pick the parent directory.
const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root },
};

export default nextConfig;
