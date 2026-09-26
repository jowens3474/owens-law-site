#!/usr/bin/env node
// Pipeline Pro: same-day alerts. Checks the high-signal feeds, compares
// against data/pro-alerts-seen.json, and sends one broadcast per run if
// anything is new. No model in the loop; the alert is the record itself.
//
// Env: RESEND_API_KEY, RESEND_PRO_AUDIENCE_ID (required unless DRY_RUN=1),
// COURTLISTENER_API_TOKEN (optional). The workflow commits the seen-state.

import { readFileSync, writeFileSync } from "node:fs";
import { sendBroadcast, renderEmail, renderText } from "./lib/resend.mjs";

const STATE_FILE = "data/pro-alerts-seen.json";
const SITE = process.env.SITE_URL || "https://www.thejacksonwire.com";
const FROM = "Pipeline Pro <pro@thejacksonwire.com>";
const UA = "TheJacksonWire/1.0 (+https://www.thejacksonwire.com; capitolmain42@gmail.com)";
const AWARD_MIN = 250000;
const WATCHLIST = ["City of Jackson", "Hinds County", "JXN Water", "Entergy", "Madison County", "Ridgeland", "Richard's Disposal", "Trustmark", "Cal-Maine", "Jackson Public Schools", "Jackson Municipal Airport"];
const COUNTIES = { Hinds: "049", Madison: "089", Rankin: "121" };
const log = (m) => console.log(`[pro-alerts] ${m}`);

function iso(daysAgo) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}
async function getJson(url, init = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const res = await fetch(url, { ...init, headers: { "User-Agent": UA, Accept: "application/json", ...(init.headers || {}) }, signal: c.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}
function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { agendas: [], dockets: [], awards: [], filings: [] };
  }
}
function saveState(state) {
  for (const k of Object.keys(state)) state[k] = state[k].slice(-500);
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
}
const strip = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#8211;|&ndash;/g, "-").replace(/&#8217;/g, "'").replace(/\s+/g, " ").trim();

async function newAgendas(state) {
  const posts = await getJson("https://www.jacksonms.gov/wp-json/wp/v2/agendameeting?per_page=15&orderby=date&order=desc&_fields=title,link,date");
  const fresh = posts.filter((p) => p.link && !state.agendas.includes(p.link) && (p.date || "").slice(0, 10) >= iso(3));
  return fresh.map((p) => ({ key: p.link, text: `${(p.date || "").slice(0, 10)}: ${strip(p.title?.rendered)}`, url: p.link }));
}

async function newDockets(state) {
  const q = WATCHLIST.map((w) => `"${w}"`).join(" OR ");
  const headers = process.env.COURTLISTENER_API_TOKEN ? { Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}` } : {};
  const data = await getJson(`https://www.courtlistener.com/api/rest/v4/search/?type=r&q=${encodeURIComponent(q)}&court=mssd&filed_after=${iso(3)}&order_by=dateFiled%20desc`, { headers });
  const fresh = (data.results || []).filter((r) => !state.dockets.includes(String(r.docket_id ?? r.id)));
  return fresh.map((r) => ({
    key: String(r.docket_id ?? r.id),
    text: `${r.dateFiled}: ${r.caseName} (${r.docketNumber}${r.suitNature ? `, ${r.suitNature}` : ""}) filed in the Southern District of Mississippi.`,
    url: r.docket_absolute_url ? `https://www.courtlistener.com${r.docket_absolute_url}` : undefined,
  }));
}

async function newAwards(state) {
  const out = [];
  for (const [county, fips] of Object.entries(COUNTIES)) {
    for (const codes of [["A", "B", "C", "D"], ["02", "03", "04", "05"]]) {
      const data = await getJson("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: { time_period: [{ start_date: iso(10), end_date: iso(-1) }], place_of_performance_locations: [{ country: "USA", state: "MS", county: fips }], award_type_codes: codes },
          fields: ["Award ID", "Recipient Name", "Award Amount", "Description", "Start Date", "Awarding Agency"],
          page: 1,
          limit: 15,
          sort: "Start Date",
          order: "desc",
          subawards: false,
        }),
      });
      for (const r of data.results || []) {
        const id = String(r["Award ID"]);
        const amt = Number(r["Award Amount"] || 0);
        if (amt < AWARD_MIN || state.awards.includes(id)) continue;
        if ((r["Start Date"] || "") < iso(10)) continue;
        out.push({
          key: id,
          text: `$${Math.round(amt).toLocaleString("en-US")} to ${r["Recipient Name"]} from ${r["Awarding Agency"]}, ${county} County, start ${r["Start Date"]}. ${String(r.Description || "").slice(0, 160)}`,
          url: `https://www.usaspending.gov/search/?hash=`,
        });
      }
    }
  }
  return out.map((o) => ({ ...o, url: undefined }));
}

async function newFilings(state) {
  const data = await getJson(`https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent('"Jackson, Mississippi"')}&dateRange=custom&startdt=${iso(3)}&enddt=${iso(0)}&forms=8-K`);
  const hits = data.hits?.hits || [];
  const out = [];
  for (const h of hits) {
    const [adsh, file] = String(h._id).split(":");
    if (state.filings.includes(adsh)) continue;
    const s = h._source || {};
    const cik = (s.ciks || [])[0];
    out.push({
      key: adsh,
      text: `${s.file_date}: 8-K from ${(s.display_names || []).join("; ")}${s.file_description ? `, ${s.file_description}` : ""}.`,
      url: cik ? `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${adsh.replace(/-/g, "")}/${file}` : undefined,
    });
  }
  return out;
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_PRO_AUDIENCE_ID;
  const dryRun = process.env.DRY_RUN === "1";
  if ((!apiKey || !audienceId) && !dryRun) {
    log("Not configured (RESEND_API_KEY / RESEND_PRO_AUDIENCE_ID missing). Nothing sent. See docs/PRO-SETUP.md.");
    process.exit(0);
  }
  const state = loadState();
  const sections = [];
  const checks = [
    ["Council agendas and notices posted", "agendas", newAgendas],
    ["Federal awards over $250,000", "awards", newAwards],
    ["New federal cases on the watchlist", "dockets", newDockets],
    ["SEC 8-K filings mentioning Jackson", "filings", newFilings],
  ];
  const seenNow = {};
  for (const [heading, bucket, fn] of checks) {
    try {
      const items = await fn(state);
      log(`${bucket}: ${items.length} new`);
      seenNow[bucket] = items.map((i) => i.key);
      if (items.length) sections.push({ heading, items: items.map(({ text, url }) => ({ text, url })) });
    } catch (e) {
      log(`${bucket} failed: ${e.message}`);
    }
  }
  if (sections.length === 0) {
    log("Nothing new. No send.");
    return;
  }
  const count = sections.reduce((n, s) => n + s.items.length, 0);
  const lead = sections[0].items[0].text.slice(0, 80);
  const subject = `Pipeline Alert: ${count} new item${count === 1 ? "" : "s"} | ${lead}`;
  const payload = {
    kicker: "Pipeline Pro · Alert",
    title: `${count} new item${count === 1 ? "" : "s"} on the desk`,
    intro: "New public records since the last check. Documents are linked where the source provides one.",
    sections,
    footer: `Full desk: ${SITE}/pro/dashboard. Reply with a question. Not legal, investment, or brokerage advice.`,
  };
  const html = renderEmail(payload);
  const text = renderText(payload);
  log(`Subject: ${subject}`);
  if (dryRun) {
    console.log(text);
  } else {
    const id = await sendBroadcast({ apiKey, audienceId, from: FROM, subject, html, text, replyTo: "capitolmain42@gmail.com" });
    log(`Broadcast sent: ${id}`);
  }
  // Record what was sent (or, in a dry run, what would have been) so the
  // next run does not repeat it.
  for (const [bucket, keys] of Object.entries(seenNow)) state[bucket] = [...(state[bucket] || []), ...keys];
  saveState(state);
  log(`State saved to ${STATE_FILE}.`);
}

main().catch((e) => {
  console.error(`[pro-alerts] FAILED: ${e.message}`);
  process.exit(1);
});
