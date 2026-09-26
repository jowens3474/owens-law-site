#!/usr/bin/env node
// Monthly sales tax diversions story. Checks the Department of Revenue for
// a report the dataset has not seen, backfills history on the first run,
// updates data/sales-tax-diversions.json (which feeds /economy/sales-tax),
// has DeepSeek write a By the Numbers story from the parsed table under
// strict fact discipline, and publishes it the same way the autopilot does.
//
// Env: DEEPSEEK_API_KEY (required to publish). DRY_RUN=1 updates the data
// file and prints the story without committing. FORCE=1 rewrites the story
// for the newest report even if it was already processed.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import OpenAI from "openai";
import { pingIndexNow } from "./lib/indexnow.mjs";
import {
  listReports,
  backfill,
  loadDataset,
  saveDataset,
  renderMonthTable,
  citySeries,
  monthLabel,
  shiftMonth,
  money,
  pct,
  DATA_FILE,
} from "./lib/sales-tax.mjs";

const POSTS_FILE = "lib/posts.ts";
const SITE = "https://www.thejacksonwire.com";
const log = (m) => console.log(`[sales-tax] ${m}`);
const dryRun = process.env.DRY_RUN === "1";
const force = process.env.FORCE === "1";

function todayLocalIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

async function main() {
  const d = loadDataset();
  const before = new Set(Object.keys(d.reports));
  const reports = await listReports();
  if (!reports.length) throw new Error("No reports found on the DOR listing page.");
  const newest = reports[0];
  log(`newest report on DOR: ${newest.month} (${newest.url})`);

  const added = await backfill(d, { limit: 14, log });
  if (added.length) {
    saveDataset(d);
    log(`dataset updated: added ${added.join(", ")}; ${Object.keys(d.reports).length} reports on file`);
  }
  const isNew = !before.has(newest.month);
  if (!isNew && !force) {
    log(`Report for ${newest.month} already processed. Nothing to publish.`);
    return;
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    log("Missing DEEPSEEK_API_KEY; dataset updated but no story written.");
    return;
  }

  // --- assemble the numbers the story may use
  const month = newest.month;
  const prior = shiftMonth(month, -12);
  const table = renderMonthTable(d, month);
  const jackson = citySeries(d, "Jackson");
  const last24 = jackson.slice(-24);
  const jNow = d.months[month]?.Jackson;
  const jThen = d.months[prior]?.Jackson;
  const series = last24.map((p) => `${p.month}: ${money(p.amount)}`).join("; ");
  // Metro total for the month and a year earlier, for the cities present both times.
  let metroNow = 0;
  let metroThen = 0;
  for (const city of d.cities) {
    const a = d.months[month]?.[city]?.amount;
    const b = d.months[prior]?.[city]?.amount;
    if (typeof a === "number" && typeof b === "number") {
      metroNow += a;
      metroThen += b;
    }
  }
  const metroLine = metroThen ? `Metro total (cities with both months): ${money(metroNow)} vs ${money(metroThen)} (${pct(metroNow, metroThen) >= 0 ? "+" : ""}${pct(metroNow, metroThen).toFixed(1)}%)` : "";
  const ranking = [...last24].sort((a, b) => b.amount - a.amount);
  const rankLine = jNow
    ? `Jackson's ${monthLabel(month)} payment ranks ${ranking.findIndex((p) => p.month === month) + 1} of the last ${last24.length} months on file (highest: ${monthLabel(ranking[0].month)} ${money(ranking[0].amount)}; lowest: ${monthLabel(ranking[ranking.length - 1].month)} ${money(ranking[ranking.length - 1].amount)}).`
    : "";

  const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" });
  const system = `You write the monthly "By the Numbers" sales tax story for The Jackson Wire, a business and economics news site for Jackson, Mississippi. Sales tax diversions are the share of state sales tax the Department of Revenue pays back to the city where the sale happened, so the monthly check is a direct read on retail activity in each city.

RULES, non-negotiable
- Every number, city, month, and comparison must come from the DATA below. Do not add facts from memory: no population figures, no store openings, no budget figures, no explanations of why a number moved unless the data itself shows it (for example, the month is the highest on file).
- No em-dashes or en-dashes. Use commas, periods, colons, or parentheses.
- Short declarative sentences. Lead with Jackson's number and the change. Then the suburbs, ranked. Then fiscal-year-to-date. Then the 24-month context.
- Percentages to one decimal. Dollars rounded to the nearest dollar, or to the nearest thousand when a sentence has more than two figures.
- 6 to 9 paragraphs, each 1 to 4 sentences. Exactly one paragraph, the last, begins with "What's next:" and says the next monthly report from the Department of Revenue is due around the middle of next month and what to watch in it (for example, whether a city's streak continues), using only the data.
- Headline under 100 characters, specific, with Jackson's dollar figure and the direction of change. Dek: one or two sentences with the finding.

Return JSON: {"slug": "jackson-sales-tax-diversions-<month>-<year>", "title": "...", "dek": "...", "body": ["...", "..."]}. The slug must be lowercase letters, digits, and hyphens.`;

  const user = `DATA

Report month: ${monthLabel(month)} (compared with ${monthLabel(prior)}). Mississippi's fiscal year began July 1.

${table}

${metroLine}

Jackson, monthly diversion, oldest to newest (last ${last24.length} months on file): ${series}

${rankLine}

Jackson fiscal-year-to-date: ${jNow?.fytd != null ? money(jNow.fytd) : "n/a"} vs ${jThen?.fytd != null ? money(jThen.fytd) : "n/a"} a year earlier.

Tracker page (link it once, in the body): ${SITE}/economy/sales-tax`;

  log("calling DeepSeek...");
  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  let article;
  try {
    article = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    throw new Error(`DeepSeek returned non-JSON: ${e.message}`);
  }
  const clean = (s) => String(s || "").replace(/[—–]/g, ", ").replace(/\s,/g, ",");
  article.title = clean(article.title).slice(0, 140);
  article.dek = clean(article.dek);
  article.body = (article.body || []).map(clean).filter(Boolean);
  const [y] = month.split("-");
  const monthWord = monthLabel(month).split(" ")[0].toLowerCase();
  article.slug = `jackson-sales-tax-diversions-${monthWord}-${y}`;
  if (article.body.length < 5) throw new Error("Story too short.");
  if (!/^What's next:/.test(article.body[article.body.length - 1])) {
    article.body.push(`What's next: The Department of Revenue's next diversion report, covering ${monthLabel(shiftMonth(month, 1))}, is due around the middle of next month. The Wire's tracker at ${SITE}/economy/sales-tax updates the same day.`);
  }
  log(`Drafted: "${article.title}" (${article.slug})`);
  const today = todayLocalIso();
  const note = `Data: Mississippi Department of Revenue, Diversions to Cities from Sales Tax Collections, ${monthLabel(month)} report (${newest.url}). Figures are the state's monthly diversion payments to each municipality; percent changes and the metro total are Wire calculations from the reports. Full history: ${SITE}/economy/sales-tax.`;

  if (dryRun) {
    console.log("\n" + article.title + "\n" + article.dek + "\n\n" + article.body.join("\n\n") + "\n\n" + note);
    log("DRY_RUN: not published.");
    return;
  }

  const postsContent = readFileSync(POSTS_FILE, "utf8");
  if (postsContent.includes(`slug: ${JSON.stringify(article.slug)}`)) {
    log(`A story with slug ${article.slug} already exists. Not publishing again.`);
    return;
  }
  const articleObj = `  {
    slug: ${JSON.stringify(article.slug)},
    title: ${JSON.stringify(article.title)},
    dek: ${JSON.stringify(article.dek)},
    category: "Economy",
    categories: ["Business"],
    tags: ["by-the-numbers"],
    author: "Jackson Wire Staff",
    date: ${JSON.stringify(today)},
    views: 0,
    body: [
${article.body.map((p) => `      ${JSON.stringify(p)},`).join("\n")}
    ],
    note: ${JSON.stringify(note)},
  },
`;
  const updated = postsContent.replace(/const POSTS: Post\[\] = \[\n/, (mk) => mk + articleObj);
  if (updated === postsContent) throw new Error("Could not find POSTS array marker in posts.ts.");
  writeFileSync(POSTS_FILE, updated);
  log(`Wrote ${POSTS_FILE}.`);

  execSync(`git config user.name "Jackson Wire Autopilot"`, { stdio: "inherit" });
  execSync(`git config user.email "autopilot@thejacksonwire.com"`, { stdio: "inherit" });
  execSync(`git add ${POSTS_FILE} ${DATA_FILE}`, { stdio: "inherit" });
  execSync("git commit -F -", { input: `Sales tax: ${article.title}`, stdio: ["pipe", "inherit", "inherit"] });
  let pushed = false;
  for (let i = 0; i < 3 && !pushed; i++) {
    try {
      execSync("git push origin HEAD:main", { stdio: "inherit" });
      pushed = true;
    } catch {
      log(`push rejected (attempt ${i + 1}); rebasing`);
      execSync("git pull --rebase origin main", { stdio: "inherit" });
    }
  }
  if (!pushed) throw new Error("Could not push after 3 attempts.");
  await pingIndexNow([`${SITE}/article/${article.slug}`, `${SITE}/economy/sales-tax`, `${SITE}/`]);
  log(`Published "${article.title}".`);
}

main().catch((e) => {
  console.error(`[sales-tax] FAILED: ${e.message}`);
  process.exit(1);
});
