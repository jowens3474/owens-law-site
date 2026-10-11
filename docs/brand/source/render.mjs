// Renders the brand images from the HTML files beside this script, at 2x:
//   og.html      -> app/opengraph-image.png (1200x630, the site's share image)
//   cover.html   -> docs/brand/jackson-wire-facebook-cover.png (1640x624)
//   profile.html -> docs/brand/jackson-wire-facebook-profile.png (720x720)
// Playwright is not a project dependency. Run from the repo root with it
// available, for example: npx -y -p playwright@1.56.1 node docs/brand/source/render.mjs
// (set PLAYWRIGHT_CHROMIUM to a Chromium binary if Playwright has none).
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(join(process.cwd(), "package.json"));
const { chromium } = require("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");

const jobs = [
  ["og.html", 600, 315, join(root, "app/opengraph-image.png")],
  ["cover.html", 820, 312, join(root, "docs/brand/jackson-wire-facebook-cover.png")],
  ["profile.html", 360, 360, join(root, "docs/brand/jackson-wire-facebook-profile.png")],
];

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
);
for (const [file, width, height, out] of jobs) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto("file://" + join(here, file));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out });
  await page.close();
  console.log(`${file} -> ${out}`);
}
await browser.close();
