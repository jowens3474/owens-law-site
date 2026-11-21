#!/usr/bin/env node
// Self-hosted fonts: downloads the site's four Google fonts once and writes
// them into the repo, so `next build` never contacts Google Fonts.
//
// Why: next/font/google fetched the font CSS from Google on every build.
// Google sometimes answers with extensionless
// `fonts.gstatic.com/l/font?kit=…&skey=…&v=…` URLs instead of the usual
// `/s/<family>/<version>/<hash>.woff2` ones, and Next 16.2's next/font/google
// cannot parse them ("next/font/google queries have exactly one entry",
// vercel/next.js#99114). That failed about 1 in 5 production deploys in
// November 2026 and left desk stories unpublished until the next deploy.
// Next 16.4.3 fixed that parsing bug, but next/font/google still downloads
// from Google on every build, so any Google hiccup could still fail a deploy.
// Self-hosting takes Google out of the build entirely.
//
// What it writes (commit all three):
//   public/fonts/*.woff2   the exact files Google serves to next/font/google,
//                          named <family>-<subset>[-italic]-<sha256 prefix>
//   app/fonts.css          Google's @font-face rules unchanged except for the
//                          URLs, the size-adjusted fallback faces next/font
//                          generated, and the --font-* variables the site uses
//   app/font-preloads.ts   the latin files next/font/google preloaded
//
// The output reproduces what next/font/google produced, so the rendered fonts
// do not change. Run it again only to change fonts, weights or styles: edit
// FAMILIES below, run `node scripts/self-host-fonts.mjs`, and commit the
// result. It refuses a Google response with /l/font URLs.

import { createHash } from "node:crypto";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT_DIR = path.join(ROOT, "public", "fonts");
const CSS_FILE = path.join(ROOT, "app", "fonts.css");
const PRELOADS_FILE = path.join(ROOT, "app", "font-preloads.ts");
const PUBLIC_PATH = "/fonts";

// The User-Agent next/font/google sends (Next 16.2.6). Google picks the file
// format and subsets by User-Agent; this one gets the same woff2 files the
// site served before self-hosting.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36";

// Subsets to preload, as next/font/google's `subsets` option did.
const PRELOAD_SUBSETS = new Set(["latin"]);

// `query` is the css2 `family=` value next/font/google requested for the
// options the site used. `fallback` is the size-adjusted fallback face
// next/font/google generated, which keeps layout steady while the web font
// loads. For a new family, get its values from the helper Next ships:
//   node -e 'console.log(require("next/dist/compiled/@next/font/dist/google/get-fallback-font-override-metrics.js").getFallbackFontOverrideMetrics("Bodoni Moda"))'
const FAMILIES = [
  {
    // Display/headline face: the high-contrast "Postoni" serif that defines
    // the Washington Post look.
    family: "Bodoni Moda",
    slug: "bodoni-moda",
    variable: "--font-display",
    query: "Bodoni+Moda:wght@400;600;700;900",
    fallback: {
      local: "Times New Roman",
      ascent: "98.5%",
      descent: "35.02%",
      lineGap: "0%",
      sizeAdjust: "114.22%",
    },
  },
  {
    // UI/sans face: kickers, nav, metadata, decks. Stands in for Franklin
    // Gothic, the Post's house sans.
    family: "Libre Franklin",
    slug: "libre-franklin",
    variable: "--font-body",
    query: "Libre+Franklin:wght@400;500;600;700",
    fallback: {
      local: "Arial",
      ascent: "92.61%",
      descent: "23.58%",
      lineGap: "0%",
      sizeAdjust: "104.31%",
    },
  },
  {
    family: "JetBrains Mono",
    slug: "jetbrains-mono",
    variable: "--font-jbmono",
    query: "JetBrains+Mono:wght@100..800",
    fallback: {
      local: "Arial",
      ascent: "75.79%",
      descent: "22.29%",
      lineGap: "0%",
      sizeAdjust: "134.59%",
    },
  },
  {
    // Long-form article body only; headlines and UI stay on the sans stack.
    family: "Source Serif 4",
    slug: "source-serif-4",
    variable: "--font-article",
    query: "Source+Serif+4:ital,wght@0,400;0,600;1,400;1,600",
    fallback: {
      local: "Times New Roman",
      ascent: "87.87%",
      descent: "28.41%",
      lineGap: "0%",
      sizeAdjust: "117.91%",
    },
  },
];

const STATIC_FONT_URL = /^https:\/\/fonts\.gstatic\.com\/s\/[^?#&]+\.woff2$/;
const ATTEMPTS = 5;

async function fetchOk(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

// Splits Google's css2 response into its `/* subset */ @font-face {…}` blocks.
function parseFaces(css, family) {
  const faces = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  for (const [, subset, block] of css.matchAll(re)) {
    const url = block.match(/src:\s*url\(([^)]+)\)/)?.[1];
    const style = block.match(/font-style:\s*([^;]+);/)?.[1].trim();
    const fam = block.match(/font-family:\s*'([^']+)'/)?.[1];
    if (!url || !style || fam !== family) {
      throw new Error(`Unexpected @font-face block for ${family}:\n${block}`);
    }
    faces.push({ subset, style, url, block });
  }
  const count = (css.match(/@font-face/g) ?? []).length;
  if (faces.length === 0 || faces.length !== count) {
    throw new Error(`Parsed ${faces.length} of ${count} @font-face blocks for ${family}`);
  }
  return faces;
}

// Google occasionally serves the /l/font URL shape this script exists to
// avoid; ask again rather than writing it into the repo.
async function fetchFaces({ family, query }) {
  const url = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const css = await (await fetchOk(url)).text();
    const faces = parseFaces(css, family);
    const bad = faces.filter((f) => !STATIC_FONT_URL.test(f.url));
    if (bad.length === 0) return { url, faces };
    console.warn(`${family}: ${bad.length} non-static font URLs (attempt ${attempt}), retrying`);
  }
  throw new Error(`${family}: Google kept returning non-static font URLs`);
}

async function main() {
  await mkdir(FONT_DIR, { recursive: true });
  const written = new Set();
  const preloads = [];
  const sections = [];

  for (const font of FAMILIES) {
    const { url: cssUrl, faces } = await fetchFaces(font);
    const localByUrl = new Map();
    for (const face of faces) {
      if (localByUrl.has(face.url)) continue;
      const bytes = Buffer.from(await (await fetchOk(face.url)).arrayBuffer());
      if (bytes.subarray(0, 4).toString("latin1") !== "wOF2") {
        throw new Error(`${face.url} is not a woff2 file`);
      }
      const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
      const italic = face.style === "italic" ? "-italic" : "";
      const name = `${font.slug}-${face.subset}${italic}-${hash}.woff2`;
      await writeFile(path.join(FONT_DIR, name), bytes);
      written.add(name);
      localByUrl.set(face.url, `${PUBLIC_PATH}/${name}`);
      if (PRELOAD_SUBSETS.has(face.subset)) preloads.push(`${PUBLIC_PATH}/${name}`);
    }

    const blocks = faces.map(
      (f) => `/* ${f.subset} */\n${f.block.replace(f.url, localByUrl.get(f.url))}`,
    );
    const fb = font.fallback;
    blocks.push(
      [
        "/* size-adjusted fallback shown while the web font loads */",
        "@font-face {",
        `  font-family: '${font.family} Fallback';`,
        `  src: local("${fb.local}");`,
        `  ascent-override: ${fb.ascent};`,
        `  descent-override: ${fb.descent};`,
        `  line-gap-override: ${fb.lineGap};`,
        `  size-adjust: ${fb.sizeAdjust};`,
        "}",
      ].join("\n"),
    );
    sections.push(`/* ${font.family}: ${cssUrl} */\n${blocks.join("\n")}`);
  }

  // Drop font files the new CSS no longer references.
  for (const name of await readdir(FONT_DIR)) {
    if (name.endsWith(".woff2") && !written.has(name)) await rm(path.join(FONT_DIR, name));
  }

  const vars = FAMILIES.map(
    (f) => `  ${f.variable}: '${f.family}', '${f.family} Fallback';`,
  ).join("\n");
  const css = [
    "/* Generated by scripts/self-host-fonts.mjs. Do not edit by hand. */",
    "/* Google Fonts' own @font-face rules with the files served from /fonts. */",
    "",
    sections.join("\n\n"),
    "",
    "/* Read by the font stacks in globals.css. */",
    `:root {\n${vars}\n}`,
    "",
  ].join("\n");
  await writeFile(CSS_FILE, css);

  const ts = [
    "// Generated by scripts/self-host-fonts.mjs. Do not edit by hand.",
    "// The latin font files, preloaded by app/layout.tsx as next/font/google did.",
    "export const fontPreloads = [",
    ...preloads.map((p) => `  "${p}",`),
    "] as const;",
    "",
  ].join("\n");
  await writeFile(PRELOADS_FILE, ts);

  console.log(
    `Wrote ${written.size} font files, ${path.relative(ROOT, CSS_FILE)}, ${path.relative(ROOT, PRELOADS_FILE)} (${preloads.length} preloads).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
