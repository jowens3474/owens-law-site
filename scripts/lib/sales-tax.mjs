// Sales tax diversions to cities, from the Mississippi Department of
// Revenue's monthly "Diversions to Cities from Sales Tax Collections"
// report. Each report lists, for every city, the diversion for the month,
// the same month a year earlier, and fiscal-year-to-date totals for both
// years (Mississippi's fiscal year starts July 1).
//
// DOR posts the reports as PDF and XLSX under
// https://www.dor.ms.gov/forms-resources/statistics-publications/diversions-cities-sales-tax-collections
// with file names like stats_div0826_0.pdf (MMYY plus an occasional suffix).

import { readFileSync, writeFileSync } from "node:fs";
import { fetchUrl } from "./fetch-url.mjs";

export const DOR_LISTING =
  "https://www.dor.ms.gov/forms-resources/statistics-publications/diversions-cities-sales-tax-collections";
const DOR_ORIGIN = "https://www.dor.ms.gov";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TheJacksonWire/1.0";

// Metro cities in the order the tracker shows them. Names must match the
// report's spelling (case-insensitive).
export const METRO_CITIES = [
  "Jackson",
  "Ridgeland",
  "Madison",
  "Flowood",
  "Pearl",
  "Brandon",
  "Clinton",
  "Byram",
  "Canton",
  "Richland",
  "Florence",
  "Raymond",
  "Terry",
  "Edwards",
  "Bolton",
  "Pelahatchie",
];

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-08" -> "August 2026" */
export function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Shift "2026-08" by n months. */
export function shiftMonth(ym, n) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Read the DOR listing page and return every report link, newest first:
 * [{ month: "2026-08", url, revised }]. When a month has several files
 * (revisions), the one whose name says "revised" or has the highest suffix
 * wins.
 */
export async function listReports() {
  const res = await fetch(DOR_LISTING, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`DOR listing HTTP ${res.status}`);
  const html = await res.text();
  const byMonth = new Map();
  for (const m of html.matchAll(/href=["']([^"']*stats_div(\d{2})(\d{2})[^"']*\.pdf)["']/gi)) {
    const href = m[1];
    const mm = Number(m[2]);
    const yy = Number(m[3]);
    if (mm < 1 || mm > 12) continue;
    const month = `20${String(yy).padStart(2, "0")}-${String(mm).padStart(2, "0")}`;
    const url = href.startsWith("http") ? href : `${DOR_ORIGIN}${href}`;
    const revised = /revis|rev\b|_\d\.pdf$/i.test(decodeURIComponent(href));
    const prev = byMonth.get(month);
    // Prefer a revised file over the original for the same month.
    if (!prev || (revised && !prev.revised)) byMonth.set(month, { month, url, revised });
  }
  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
}

const NUM = String.raw`\$?\s*\(?-?[\d,]+\.\d{2}\)?(?:\s*\$)?`;

function toNumber(s) {
  const neg = /\(/.test(s) || /-/.test(s);
  const v = Number(String(s).replace(/[^\d.]/g, ""));
  return neg ? -v : v;
}

/**
 * Parse the text of one report into { city: { month, priorYear, fytd,
 * fytdPrior } } for the metro cities. The PDF text runs every city on one
 * long line per page, separated by runs of spaces, with "$" markers on the
 * first row. A city name must be followed directly by four money values,
 * which keeps "Jackson" from matching "Jackson State University".
 */
export function parseReport(text, cities = METRO_CITIES) {
  const out = {};
  const flat = text.replace(/\r/g, "").replace(/\s+/g, " ");
  for (const city of cities) {
    const name = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(String.raw`(?:^|\s)${name}\s+(${NUM})\s+(${NUM})\s+(${NUM})\s+(${NUM})(?=\s|$)`, "i");
    const m = flat.match(re);
    if (!m) continue;
    out[city] = {
      month: toNumber(m[1]),
      priorYear: toNumber(m[2]),
      fytd: toNumber(m[3]),
      fytdPrior: toNumber(m[4]),
    };
  }
  return out;
}

/** The report month named in the text ("August"), if present. */
export function reportMonthName(text) {
  const m = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+July 1 to Date/);
  return m ? m[1] : null;
}

/** Fetch a report PDF and parse it. */
export async function readReport(url, cities = METRO_CITIES) {
  const { text } = await fetchUrl(url);
  const rows = parseReport(text, cities);
  if (!rows.Jackson) {
    throw new Error(`Could not find Jackson in ${url} (text ${text.length} chars)`);
  }
  return { rows, text };
}

export function pct(now, before) {
  if (!before) return null;
  return ((now - before) / before) * 100;
}

export function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// --- dataset ---------------------------------------------------------------------


export const DATA_FILE = "data/sales-tax-diversions.json";

export function loadDataset(file = DATA_FILE) {
  try {
    const d = JSON.parse(readFileSync(file, "utf8"));
    d.cities = d.cities || METRO_CITIES;
    d.months = d.months || {};
    d.reports = d.reports || {};
    return d;
  } catch {
    return { updated: null, cities: METRO_CITIES, months: {}, reports: {} };
  }
}

export function saveDataset(d, file = DATA_FILE) {
  const months = Object.fromEntries(Object.entries(d.months).sort(([a], [b]) => a.localeCompare(b)));
  const reports = Object.fromEntries(Object.entries(d.reports).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(file, JSON.stringify({ ...d, months, reports }, null, 2) + "\n");
}

/**
 * Merge one parsed report into the dataset. The report's month gets amount
 * and fiscal-year-to-date for every city; the same month a year earlier
 * gets its amount (and FYTD) filled in when no report of its own has been
 * read yet.
 */
export function mergeReport(d, month, rows, url, { revised = false, fetched = new Date().toISOString().slice(0, 10) } = {}) {
  const prior = shiftMonth(month, -12);
  d.months[month] = d.months[month] || {};
  d.months[prior] = d.months[prior] || {};
  for (const [city, r] of Object.entries(rows)) {
    d.months[month][city] = { amount: r.month, fytd: r.fytd };
    if (!d.reports[prior]) d.months[prior][city] = { amount: r.priorYear, fytd: r.fytdPrior };
  }
  d.reports[month] = { url, fetched, revised };
  d.updated = fetched;
  return d;
}

/** Sorted list of months the dataset has an amount for a city. */
export function citySeries(d, city) {
  return Object.keys(d.months)
    .filter((ym) => d.months[ym][city] && typeof d.months[ym][city].amount === "number")
    .sort()
    .map((ym) => ({ month: ym, amount: d.months[ym][city].amount, fytd: d.months[ym][city].fytd ?? null }));
}

/**
 * Fetch every report the dataset is missing, newest first, up to `limit`
 * reports. Returns the months that were added.
 */
export async function backfill(d, { limit = 14, log = () => {} } = {}) {
  const reports = await listReports();
  const added = [];
  for (const r of reports) {
    if (added.length >= limit) break;
    const have = d.reports[r.month];
    if (have && (have.revised || !r.revised)) continue;
    log(`reading ${r.month} ${r.url}`);
    try {
      const { rows } = await readReport(r.url);
      mergeReport(d, r.month, rows, r.url, { revised: r.revised });
      added.push(r.month);
    } catch (e) {
      log(`skip ${r.month}: ${e.message}`);
    }
  }
  return added;
}

/** The metro table for one month, with year-over-year changes, as text. */
export function renderMonthTable(d, month) {
  const prior = shiftMonth(month, -12);
  const lines = [
    `Sales tax diversions paid to metro Jackson cities, ${monthLabel(month)} vs ${monthLabel(prior)} (Mississippi Department of Revenue):`,
    "",
  ];
  const rows = [];
  for (const city of d.cities) {
    const now = d.months[month]?.[city];
    const then = d.months[prior]?.[city];
    if (!now) continue;
    const change = then ? pct(now.amount, then.amount) : null;
    rows.push({ city, now, then, change });
  }
  rows.sort((a, b) => b.now.amount - a.now.amount);
  for (const r of rows) {
    const fy = r.now.fytd != null && r.then?.fytd != null ? ` | FYTD ${money(r.now.fytd)} vs ${money(r.then.fytd)} (${pct(r.now.fytd, r.then.fytd).toFixed(1)}%)` : "";
    lines.push(`- ${r.city}: ${money(r.now.amount)}${r.then ? ` vs ${money(r.then.amount)} a year earlier (${r.change >= 0 ? "+" : ""}${r.change.toFixed(1)}%)` : ""}${fy}`);
  }
  const src = d.reports[month]?.url;
  if (src) lines.push("", `Source: ${src}`);
  return lines.join("\n");
}
