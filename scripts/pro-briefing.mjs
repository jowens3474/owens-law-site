#!/usr/bin/env node
// Pipeline Pro: the Monday briefing. Gathers the week ahead from the live
// Pipeline, the past week's data feeds, and the Wire's own stories, asks
// DeepSeek to write the analytical sections under strict fact discipline,
// renders the email, and sends it as a Resend broadcast to the Pro
// audience. Publishes nothing to the site.
//
// Env: RESEND_API_KEY, RESEND_PRO_AUDIENCE_ID, DEEPSEEK_API_KEY (required);
// COURTLISTENER_API_TOKEN, EIA_API_KEY, BLS_API_KEY (optional); DRY_RUN=1
// prints the email instead of sending. SITE_URL overrides the site.

import OpenAI from "openai";
import { runDataTool } from "./lib/data-tools.mjs";
import { createCourtListener } from "./lib/courtlistener.mjs";
import { sendBroadcast, renderEmail, renderText } from "./lib/resend.mjs";

const SITE = process.env.SITE_URL || "https://www.thejacksonwire.com";
const FROM = "Pipeline Pro <pro@thejacksonwire.com>";
const REPLY_TO = "capitolmain42@gmail.com";
const log = (m) => console.log(`[pro-briefing] ${m}`);

function todayLocalIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}
function pretty(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const sameYear = y === Number(todayLocalIso().slice(0, 4));
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "TheJacksonWire/1.0" } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

function parseFeed(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const b = m[1];
    const pick = (t) => (b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`)) || [, ""])[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    items.push({ title: pick("title"), link: pick("link"), dek: pick("description").replace(/<[^>]+>/g, ""), pubDate: pick("pubDate") });
  }
  return items;
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_PRO_AUDIENCE_ID;
  const dryRun = process.env.DRY_RUN === "1";
  if ((!apiKey || !audienceId) && !dryRun) {
    log("Not configured (RESEND_API_KEY / RESEND_PRO_AUDIENCE_ID missing). Nothing sent. See docs/PRO-SETUP.md.");
    process.exit(0);
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    log("Missing DEEPSEEK_API_KEY. Nothing sent.");
    process.exit(0);
  }

  const today = todayLocalIso();
  const weekEnd = addDays(today, 7);
  log(`today=${today} week through ${weekEnd}`);

  // 1. The calendar and the tracker from the live site.
  const pipeline = await fetchJson(`${SITE}/api/pipeline.json`);
  const week = (pipeline.milestones || []).filter((m) => m.date >= today && m.date <= weekEnd).sort((a, b) => a.date.localeCompare(b.date));
  const later = (pipeline.milestones || []).filter((m) => m.date > weekEnd).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  log(`milestones this week: ${week.length}, later: ${later.length}`);

  // 2. The Wire's stories from the past 7 days.
  const feed = parseFeed(await (await fetch(`${SITE}/feed.xml`)).text());
  const since = new Date(Date.now() - 7 * 86400000);
  const stories = feed.filter((i) => new Date(i.pubDate) >= since && !/^Morning Brief/.test(i.title)).slice(0, 10);

  // 3. The data feeds.
  const cl = createCourtListener({ prefix: "pro-briefing" });
  const opts = { prefix: "pro-briefing", cl };
  const feeds = {};
  for (const [name, args] of [
    ["federal_awards_hinds", ["federal_awards", { county: "hinds", days: 7 }]],
    ["federal_awards_madison", ["federal_awards", { county: "madison", days: 7 }]],
    ["federal_awards_rankin", ["federal_awards", { county: "rankin", days: 7 }]],
    ["court_search", ["court_search", { query: '"City of Jackson" OR "Hinds County" OR "JXN Water" OR Entergy OR "Madison County" OR Ridgeland', days: 7 }]],
    ["bankruptcies", ["bankruptcies", { days: 7 }]],
    ["sec_filings", ["sec_filings", { query: "Jackson, Mississippi", days: 7 }]],
    ["federal_register", ["federal_register", { query: "Mississippi", days: 7 }]],
    ["jackson_meetings", ["jackson_meetings", {}]],
    ["eia_fuel_prices", ["eia_fuel_prices", {}]],
    ["bls_series", ["bls_series", {}]],
  ]) {
    feeds[name] = await runDataTool(args[0], args[1], opts);
  }

  // 4. DeepSeek writes the analytical sections from the feeds.
  const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" });
  const system = `You write the Monday briefing for Pipeline Pro, the paid intelligence product of The Jackson Wire, for developers, brokers, lenders, lawyers, and lobbyists in metro Jackson, Mississippi. Readers pay for specifics: dates, dollar figures, names, document links. No throat-clearing, no hype, no em-dashes or en-dashes. Every claim must come from the data provided below; do not add facts from memory. If a feed is empty or unavailable, say so in one line and move on.

Return JSON with this shape:
{
  "subject": "Pipeline Pro: <week of date> | <the single most important item, under 70 characters>",
  "lede": "Two or three sentences on what matters most this week and why, for someone whose money is on the line.",
  "sections": [
    {"heading": "Money moving", "items": [{"text": "...", "url": "..."}]},
    {"heading": "Filings and cases", "items": [...]},
    {"heading": "By the numbers", "items": [...]},
    {"heading": "Watch list", "items": [...]}
  ]
}
Rules for items: 1 to 3 sentences each, lead with the dollar figure or the name, include the url field when the feed gives one, 3 to 7 items per section, and omit a section entirely if there is nothing worth a reader's time. "Money moving" covers federal awards and grants (skip routine sub-$50,000 items unless the recipient is notable). "Filings and cases" covers court dockets, bankruptcy cases (name the chapter; a Chapter 11 by a local business leads the section), SEC filings, and Federal Register documents that touch the metro. "By the numbers" reads the fuel and labor series and states the change. "Watch list" names two to four things that are not yet scheduled but are coming, drawn from the feeds and the tracker.`;

  const user = `Today is ${today}. Week ahead: ${today} to ${weekEnd}.

=== PIPELINE MILESTONES THIS WEEK ===
${week.map((m) => `- ${m.date}${m.approx ? " (approx)" : ""} | ${m.kind} | ${m.text}${m.slug ? ` | ${SITE}/article/${m.slug}` : ""}`).join("\n") || "(none)"}

=== TRACKED PROJECTS ===
${(pipeline.projects || []).map((p) => `- ${p.name} [${p.stage}] ${p.status} Next: ${p.next || "n/a"}`).join("\n")}

=== FEDERAL AWARDS, HINDS ===
${feeds.federal_awards_hinds}

=== FEDERAL AWARDS, MADISON ===
${feeds.federal_awards_madison}

=== FEDERAL AWARDS, RANKIN ===
${feeds.federal_awards_rankin}

=== NEW FEDERAL DOCKETS ===
${feeds.court_search}

=== NEW BANKRUPTCY CASES (business-looking) ===
${feeds.bankruptcies}

=== SEC FILINGS ===
${feeds.sec_filings}

=== FEDERAL REGISTER ===
${feeds.federal_register}

=== JACKSON MEETINGS ===
${feeds.jackson_meetings}

=== FUEL ===
${feeds.eia_fuel_prices}

=== LABOR ===
${feeds.bls_series}`;

  // Every URL the model may cite must have appeared in its inputs. Models
  // will otherwise invent plausible article slugs and award pages.
  const allowedUrls = new Set((user.match(/https?:\/\/[^\s"'<>)\]]+/g) || []).map((u) => u.replace(/[.,;]+$/, "")));
  log(`allowed urls in inputs: ${allowedUrls.size}`);
  log("calling DeepSeek...");
  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });
  let draft;
  try {
    draft = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    throw new Error(`DeepSeek returned non-JSON: ${e.message}`);
  }
  const clean = (s) => String(s || "").replace(/[—–]/g, ", ").replace(/\s,/g, ",");

  // 5. Assemble: calendar first (from the tracker, not the model), then the
  // model's sections, then the Wire's stories.
  const sections = [];
  sections.push({
    heading: "This week's decisions",
    note: week.length ? undefined : "Nothing dated on the tracker this week. The watch list below has what is pending.",
    items: week.map((m) => ({ text: `${fmtDate(m.date)}${m.approx ? " (approx.)" : ""}: ${m.text}`, url: m.slug ? `${SITE}/article/${m.slug}` : undefined })),
  });
  for (const s of draft.sections || []) {
    const items = (s.items || [])
      .filter((it) => it && it.text)
      .map((it) => {
        const url = typeof it.url === "string" ? it.url.trim().replace(/[.,;]+$/, "") : "";
        return { text: clean(it.text), url: url && allowedUrls.has(url) ? url : undefined };
      });
    if (items.length) sections.push({ heading: clean(s.heading), items });
  }
  if (later.length) {
    sections.push({ heading: "Further out", items: later.map((m) => ({ text: `${fmtDate(m.date)}${m.approx ? " (approx.)" : ""}: ${m.text}`, url: m.slug ? `${SITE}/article/${m.slug}` : undefined })) });
  }
  if (stories.length) {
    sections.push({ heading: "This week on the Wire", items: stories.map((s) => ({ text: clean(s.title), url: s.link })) });
  }
  const subject = clean(draft.subject || `Pipeline Pro: week of ${pretty(today)}`).slice(0, 120);
  const payload = {
    kicker: `Pipeline Pro · Week of ${pretty(today)}`,
    title: subject.replace(/^Pipeline Pro:\s*/i, ""),
    intro: clean(draft.lede),
    sections: sections.filter((s) => s.items.length || s.note),
    footer: "Pipeline Pro is edited by J. Edward Owens for The Jackson Wire. Reply to this email with a question; a researcher answers within one business day. Not legal, investment, or brokerage advice.",
  };
  const html = renderEmail(payload);
  const text = renderText(payload);
  log(`Subject: ${subject}`);
  if (dryRun) {
    console.log(text);
    return;
  }
  const id = await sendBroadcast({ apiKey, audienceId, from: FROM, subject, html, text, replyTo: REPLY_TO });
  log(`Broadcast sent: ${id}`);
}

main().catch((e) => {
  console.error(`[pro-briefing] FAILED: ${e.message}`);
  process.exit(1);
});
