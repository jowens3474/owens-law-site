// County and state feeds for the research desk: the Hinds, Madison, and
// Rankin County supervisors, Hinds County land records, MDEQ's recently
// issued permits, and the Public Service Commission's monthly dockets.
// Each tool returns a string for the model, capped so a call stays well
// under 15k characters. Registered in data-tools.mjs. Every source below was
// probed from a GitHub runner on Sept. 29, 2026; comments say what was seen.

import { fetchUrl } from "./fetch-url.mjs";

const UA = "Mozilla/5.0 (X11; Linux x86_64) TheJacksonWire/1.0 (+https://www.thejacksonwire.com; capitolmain42@gmail.com)";
const TIMEOUT_MS = 20000;

/** Integer argument with bounds and a default; strings and NaN fall back. */
function clampInt(v, lo, hi, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(Math.max(Math.round(n), lo), hi);
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * One fetch skeleton for every source: timeout, browser-like agent, an
 * optional cookie jar (a Map by cookie name, merged from Set-Cookie so a
 * later cookie never drops the session), and a JSON mode.
 */
async function request(url, { accept = "text/html,application/xhtml+xml,*/*", jar = null, json = false } = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT_MS);
  try {
    const headers = { "User-Agent": UA, Accept: json ? "application/json" : accept, "Accept-Language": "en-US,en;q=0.9" };
    if (jar && jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(url, { headers, signal: c.signal, redirect: "follow" });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
    if (jar) {
      const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [res.headers.get("set-cookie")].filter(Boolean);
      for (const line of set) {
        const [pair] = line.split(";");
        const i = pair.indexOf("=");
        if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
      }
    }
    return json ? JSON.parse(text) : text;
  } finally {
    clearTimeout(t);
  }
}

function strip(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeEncode(href) {
  try {
    return encodeURI(decodeURI(href));
  } catch {
    return href;
  }
}

async function pdfText(url, cap = 9000) {
  const { text } = await fetchUrl(url);
  const clean = String(text || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { text: clean.slice(0, cap), truncated: clean.length > cap };
}

function cut(s, n) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// --- Hinds County Board of Supervisors ----------------------------------------------
//
// co.hinds.ms.us/pgs/Boardroom/Boardroom.asp lists the year's meetings with
// an agenda PDF, a minutes PDF, and Lifesize video links per row. Seen on
// the runner: agendas are scanned images with no text layer; minutes are
// typed text; the page footer carries today's date with no documents.

export const HINDS_BOARDROOM = "https://www.co.hinds.ms.us/pgs/Boardroom/Boardroom.asp";

const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

function longDateIso(s) {
  const m = s.match(/([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return "";
  const mo = MONTHS[m[1].toLowerCase()];
  return mo ? `${m[3]}-${String(mo).padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
}

/** Rows of the Boardroom listing: [{date, type, agenda, minutes, videos}], newest first. */
export function parseHindsBoardroom(html) {
  const rows = [];
  for (const c of html.split(/(?=<tr)/i)) {
    const text = strip(c);
    const date = longDateIso(text);
    if (!date) continue;
    const agenda = c.match(/href="([^"]*\/BoardAgenda\/docs\/[^"]+\.pdf)"/i)?.[1] || null;
    const minutes = c.match(/href="([^"]*\/BoardMinutes\/docs\/[^"]+\.pdf)"/i)?.[1] || null;
    const videos = [...c.matchAll(/href="(https:\/\/playback\.lifesize\.com\/[^"]+)"/gi)].map((m) => m[1]);
    if (!agenda && !minutes && !videos.length) continue; // the footer date
    const type = text.replace(/^.*?\d{4}\s*/, "").replace(/\b(View Video \d|No Video|No Minutes)\b.*$/i, "").trim() || "Meeting";
    rows.push({ date, type, agenda: agenda ? safeEncode(agenda) : null, minutes: minutes ? safeEncode(minutes) : null, videos });
  }
  const seen = new Set();
  return rows
    .filter((r) => !seen.has(r.date + r.type) && seen.add(r.date + r.type))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function hindsSupervisors({ limit = 8, read = "minutes" } = {}) {
  const n = clampInt(limit, 3, 20, 8);
  const rows = parseHindsBoardroom(await request(HINDS_BOARDROOM)).slice(0, n);
  if (!rows.length) return "hinds_supervisors unavailable: no meetings parsed from the Boardroom page.";
  const out = [`Hinds County Board of Supervisors meetings (${HINDS_BOARDROOM}), newest first:`];
  for (const r of rows) {
    out.push(`- ${r.date} | ${cut(r.type, 60)}${r.agenda ? ` | agenda: ${r.agenda}` : ""}${r.minutes ? ` | minutes: ${r.minutes}` : ""}${r.videos.length ? ` | video: ${r.videos[0]}` : ""}`);
  }
  // Minutes first (typed), agendas second (scanned), up to three of each.
  const order = read === "agenda" ? ["agenda", "minutes"] : ["minutes", "agenda"];
  let shown = false;
  for (const want of order) {
    for (const doc of rows.filter((r) => r[want]).slice(0, 3)) {
      try {
        const { text, truncated } = await pdfText(doc[want], 9000);
        const body = text.replace(/--- page \d+ ---\s*/g, "").trim();
        if (body.length < 200) {
          out.push("", `${doc.date} ${doc.type} ${want} has no text layer (scanned): ${doc[want]}`);
          continue;
        }
        out.push("", `Newest readable ${want} (${doc.date} ${doc.type})${truncated ? ", first 9,000 characters" : ""}:`, body);
        shown = true;
        break;
      } catch (e) {
        out.push("", `Could not read the ${doc.date} ${want}: ${e.message}`);
      }
    }
    if (shown) break;
  }
  out.push("", "Minutes record what was approved; agendas are scanned images. Fetch any PDF above with fetch_url. Meeting video is on Lifesize and is not transcribed.");
  return out.join("\n");
}

// --- Madison County Board of Supervisors --------------------------------------------
//
// tools.madison-co.net prints the upcoming agenda as plain HTML (seen:
// consent items, engineering permits, MDA letters). The minutes page on
// madison-co.com lists site-wide PDFs; minutes themselves sit behind the
// county's search-by-date and search-by-keyword pages.

export const MADISON_AGENDA = "https://tools.madison-co.net/elected-offices/board-of-supervisors/print-agenda.php";
export const MADISON_MINUTES = "https://www.madison-co.com/elected-offices/board-of-supervisors/board-minutes";

export function parseMadisonAgenda(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export async function madisonSupervisors() {
  const out = [];
  const errors = [];
  try {
    const agenda = parseMadisonAgenda(await request(MADISON_AGENDA));
    out.push(`Madison County Board of Supervisors, upcoming agenda (${MADISON_AGENDA})${agenda.length > 9000 ? ", first 9,000 characters" : ""}:`, agenda.slice(0, 9000), "");
  } catch (e) {
    errors.push(`agenda: ${e.message}`);
  }
  try {
    const html = await request(MADISON_MINUTES);
    const pdfs = [...new Set(
      [...html.matchAll(/<a[^>]+href="([^"]+\.pdf)"[^>]*>([^<]*)<\/a>/gi)]
        .filter((m) => /minute/i.test(m[1] + " " + m[2]))
        .map((m) => new URL(m[1], MADISON_MINUTES).href),
    )].slice(0, 8);
    if (pdfs.length) out.push("Minutes PDFs linked from the county site:", ...pdfs.map((u) => `- ${u}`), "");
    else out.push(`Minutes are searchable by date and keyword from ${MADISON_MINUTES} (fetch_url the search pages).`, "");
  } catch (e) {
    errors.push(`minutes: ${e.message}`);
  }
  if (!out.length) return `madison_supervisors unavailable: ${errors.join(" | ")}`;
  out.push("Consent items name contracts, change orders, utility permits by road, right-of-way payments by parcel, and state grant letters. Fetch any PDF with fetch_url.");
  if (errors.length) out.push(`(partial: ${errors.join(" | ")})`);
  return out.join("\n");
}

// --- Rankin County (CivicClerk) ---------------------------------------------------------
//
// rankincoms.portal.civicclerk.com is a JavaScript app over an OData API
// that answers anonymous requests. Events are pre-scheduled a year out;
// the ones that have happened carry publishedFiles (seen: Agenda, Agenda
// Packet, Minutes) streamed by file id. Minutes and agendas are typed text.

export const RANKIN_API = "https://rankincoms.api.civicclerk.com/v1";
export const RANKIN_PORTAL = "https://rankincoms.portal.civicclerk.com";

export function rankinFileUrl(fileId, plainText = false) {
  return `${RANKIN_API}/Meetings/GetMeetingFileStream(fileId=${encodeURIComponent(fileId)},plainText=${plainText})`;
}

export async function rankinSupervisors({ limit = 8 } = {}) {
  const n = clampInt(limit, 3, 20, 8);
  const horizon = new Date(Date.now() + 7 * 86400000).toISOString();
  const data = await request(`${RANKIN_API}/Events?$filter=startDateTime le ${horizon}&$orderby=startDateTime desc&$top=${n}`, { json: true });
  const events = Array.isArray(data.value) ? data.value : [];
  if (!events.length) return "rankin_supervisors unavailable: the CivicClerk API returned no events.";
  const out = [`Rankin County meetings from CivicClerk (${RANKIN_PORTAL}), newest first:`];
  let newest = null;
  for (const e of events) {
    const date = String(e.startDateTime || "").slice(0, 10);
    const files = (e.publishedFiles || []).slice(0, 4).map((f) => ({ name: cut(f.name || f.fileName || `file ${f.fileId}`, 40), id: f.fileId ?? f.id }));
    const fileText = files.map((f) => `${f.name}: ${rankinFileUrl(f.id)}`).join("; ");
    out.push(`- ${date} | ${cut(String(e.eventName || e.categoryName || "").trim(), 80)}${fileText ? ` | ${fileText}` : ""}`);
    if (!newest) {
      const agenda = files.find((f) => /^agenda$/i.test(f.name)) || files.find((f) => /agenda/i.test(f.name)) || files[0];
      if (agenda) newest = { date, name: String(e.eventName || "").trim(), file: agenda };
    }
  }
  if (newest) {
    try {
      const { text, truncated } = await pdfText(rankinFileUrl(newest.file.id), 9000);
      out.push("", `Newest file (${newest.date} ${newest.name}, ${newest.file.name})${truncated ? ", first 9,000 characters" : ""}:`, text || "(no text layer)");
    } catch (e) {
      out.push("", `Could not read the newest file: ${e.message}`);
    }
  }
  out.push("", "Agendas carry budget amendments, contracts, and grant items; minutes record the votes. Fetch any file URL above with fetch_url.");
  return out.join("\n");
}

// --- MDEQ recently issued permits ---------------------------------------------------
//
// enSearch's "Recently Issued Permits & Certifications" report is a plain
// ASP.NET table: facility, permit type, action, city, county. Jackson
// County on the coast shares the city's name, so filtering is by column.

export const MDEQ_REPORT = "https://opcgis.deq.state.ms.us/ensearchonline/report_permits.aspx";
const METRO_COUNTIES = /^(hinds|madison|rankin)$/i;

/** Rows: [{facility, type, action, city, county, link}] in column order, blanks kept. */
export function parseMdeqReport(html) {
  const rows = [];
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const link = m[1].match(/href="(ai_info\.aspx\?ai=\d+)"/i)?.[1];
    if (!link) continue;
    const cells = [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => strip(c[1]));
    if (cells.length < 5) continue;
    // The facility link sits in the first non-empty cell; the last four
    // cells are type, action, city, county.
    const [type, action, city, county] = cells.slice(-4);
    const facility = cells.slice(0, -4).find(Boolean) || "";
    rows.push({ facility, type, action, city, county, link: `https://opcgis.deq.state.ms.us/ensearchonline/${link}` });
  }
  return rows;
}

export async function mdeqPermits({ county = "", limit = 30 } = {}) {
  const n = clampInt(limit, 5, 60, 30);
  const rows = parseMdeqReport(await request(MDEQ_REPORT));
  if (!rows.length) return "mdeq_permits unavailable: no rows parsed from the enSearch report.";
  const want = county ? new RegExp(`^${escapeRe(county.trim())}$`, "i") : null;
  const hits = rows.filter((r) => (want ? want.test(r.county) || want.test(r.city) : METRO_COUNTIES.test(r.county))).slice(0, n);
  const out = [`MDEQ recently issued permits and certifications (${MDEQ_REPORT}), ${rows.length} statewide, ${hits.length} in ${county || "Hinds, Madison, and Rankin counties"}:`];
  for (const r of hits) out.push(`- ${cut(r.facility, 90)} | ${cut(r.type, 50)} | ${cut(r.action, 40)} | ${cut(r.city, 30)} | ${cut(r.county, 20)} | ${r.link}`);
  if (!hits.length) out.push("(none on the current report)");
  out.push("", "Water permits (NPDES, stormwater, pretreatment) precede subdivisions and plants; air construction permits precede industrial expansions; solid waste permits cover landfills. Open the facility link for the permit history.");
  return out.join("\n");
}

// --- Public Service Commission monthly dockets ----------------------------------------
//
// psc.ms.gov links a Utility Docket and a Consent Docket PDF for each
// monthly meeting. The PDF text arrives one page per line; every item
// starts with a docket number such as 2026-UA-26 or 2025-AD-61.

export const PSC_DOCKETS = "https://www.psc.ms.gov/exec-sec/dockets";
const DOCKET_NO = /\d{4}-[A-Z]{2}-\d{1,4}/;

export function parsePscDocketLinks(html) {
  const links = [...new Set([...html.matchAll(/(\/sites\/default\/files\/[^"'\s<>]+\.pdf)/gi)].map((m) => `https://www.psc.ms.gov${m[1]}`))];
  return links.filter((u) => /docket/i.test(u));
}

/** Docket items from one PDF's text: split where a docket number starts an item (after a page marker, a line start, or the previous item's end). */
export function splitDocketItems(text) {
  const flat = text.replace(/--- page \d+ ---/g, "\n");
  // A docket number preceded by whitespace or "CONTINUED" starts an item;
  // one preceded by "No." or "Docket" is a cross-reference and stays put.
  return flat
    .replace(new RegExp(`(?:^|\\s)(?<!(?:No\\.|Docket|DOCKET|NO\\.)\\s)(${DOCKET_NO.source})`, "g"), "\n$1")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => new RegExp(`^${DOCKET_NO.source}`).test(l));
}

export async function pscDockets({ keyword = "" } = {}) {
  const links = parsePscDocketLinks(await request(PSC_DOCKETS));
  if (!links.length) return "psc_dockets unavailable: no docket PDFs found on the dockets page.";
  const out = [`Mississippi Public Service Commission monthly dockets (${PSC_DOCKETS}), newest first:`, ...links.slice(0, 6).map((u) => `- ${u}`), ""];
  const kw = keyword.trim() ? new RegExp(escapeRe(keyword.trim()), "i") : /entergy|jackson|hinds|madison|rankin|data center|prado|atmos|jxn|ridgeland|canton|byram|clinton|pearl|flowood|brandon/i;
  for (const u of links.slice(0, 2)) {
    try {
      const { text, truncated } = await pdfText(u, 80000);
      const items = splitDocketItems(text);
      const hits = [...new Set(items.filter((l) => kw.test(l)))];
      out.push(`${u.split("/").pop()}: ${items.length} docket items${truncated ? " (long docket, first 80,000 characters read)" : ""}, ${hits.length} matching ${keyword.trim() || "metro utilities"}:`);
      for (const h of hits.slice(0, 25)) out.push(`  - ${cut(h, 400)}`);
      out.push("");
    } catch (e) {
      out.push(`Could not read ${u}: ${e.message}`, "");
    }
  }
  out.push("Docket numbers look like 2026-UA-26 or 2025-AD-61. Rate cases, certificates for new plants and lines, and large-load service agreements appear here before any press release. Cite as 'the Commission's docket for <month>'.");
  return out.join("\n");
}

// --- Hinds County land records (general index) ------------------------------------------
//
// The chancery clerk's general index at co.hinds.ms.us lists every recorded
// instrument. Queried with an empty name and a date range (sn1=3, sn2=3 for
// both parties and both books) it returns the whole window: grantor,
// grantee, instrument code, book-page, date. Seen on the runner: a week is
// "more than 100 records" over 34 pages; later pages come from
// gindex_list.asp?SS1=1&ScrollAction=Page+N with the ASP session cookie.
// The page's own legend defines DT, QCD, REL, WD, and LIS PENS.

export const HINDS_GINDEX = "https://www.co.hinds.ms.us/pgs/apps/gindex_list.asp";

export const INSTRUMENT_LABELS = {
  WD: "warranty deed",
  QCD: "quitclaim deed",
  DT: "deed of trust",
  REL: "release",
  "LIS PENS": "lis pendens",
};

const BUSINESS = /\b(P?LLC|L\.L\.C|INC|CORP|CORPORATION|LP|LLP|LTD|HOLDINGS|PROPERTIES|PROPERTY|PARTNERS|PARTNERSHIP|ASSOCIATES|DEVELOPMENT|INVESTMENTS?|VENTURES|GROUP|COMPANY|HOMES|BUILDERS|ENTERPRISES|REALTY|REAL ESTATE|CAPITAL|TRUST|CHURCH|AUTHORITY|CITY OF|COUNTY|STATE OF|BANK|MORTGAGE|UNIVERSITY|HOSPITAL|FOUNDATION)\b/i;

export function hindsIndexUrl(start, end, name = "") {
  const [sy, sm, sd] = start.split("-");
  const [ey, em, ed] = end.split("-");
  return `${HINDS_GINDEX}?sn0=${encodeURIComponent(name)}&sn1=3&sn2=3&Start_Date_m=${sm}&Start_Date_d=${sd}&Start_Date_y=${sy}&End_Date_m=${em}&End_Date_d=${ed}&End_Date_y=${ey}`;
}

/**
 * Rows of a result page: [{grantor, grantee, type, book, date}] plus the
 * page count and the site's "more than N records" flag. Seen on the runner:
 * each row has three cells: grantor and grantee as two links separated by
 * <br>, the instrument code and book-page separated by <br>, and the date.
 * Each instrument appears twice (once per indexed party); the caller dedupes.
 */
export function parseHindsIndex(html) {
  const rows = [];
  const lines = (cell) =>
    cell
      .replace(/^[^>]*>/, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .split("\n")
      .map((l) => strip(l))
      .filter(Boolean);
  for (const chunk of String(html || "").split(/<tr\b/i).slice(1)) {
    const cells = chunk.split(/<td\b/i).slice(1).map(lines);
    // Find the cell whose first line is the date; the two cells before it
    // hold the parties and the instrument.
    const di = cells.findIndex((c) => /^\d{2}-\d{2}-\d{4}$/.test(c[0] || ""));
    if (di < 2) continue;
    const [grantor = "", grantee = ""] = cells[di - 2];
    const [type = "", book = ""] = cells[di - 1];
    if (!grantor || !type || !book) continue;
    const [mm, dd, yyyy] = cells[di][0].split("-");
    rows.push({ grantor, grantee, type: type.toUpperCase(), book, date: `${yyyy}-${mm}-${dd}` });
  }
  const pages = Number(html.match(/Page\s+\d+\s+of\s+(\d+)/i)?.[1] || 1);
  const more = /more than \d+ records/i.test(html);
  const noRecords = /No Records Found/i.test(html);
  return { rows, pages, more, noRecords };
}

export async function hindsLandRecords({ days = 3, types = "WD,QCD", business_only = true, pages: maxPages = 6, name = "" } = {}) {
  const span = clampInt(days, 1, 60, 3);
  const cap = clampInt(maxPages, 1, 20, 6);
  const iso = (d) => d.toISOString().slice(0, 10);
  const start = iso(new Date(Date.now() - span * 86400000));
  const end = iso(new Date());
  const who = String(name || "").trim().slice(0, 60);
  const wanted = new Set(String(types ?? "").toUpperCase().split(",").map((t) => t.trim()).filter(Boolean));

  const jar = new Map();
  const seen = new Set();
  const all = [];
  const take = (parsed) => {
    for (const r of parsed.rows) {
      const key = [r.grantor, r.grantee, r.type, r.book].join("|");
      if (!seen.has(key)) {
        seen.add(key);
        all.push(r);
      }
    }
  };
  const firstHtml = await request(hindsIndexUrl(start, end, who), { jar });
  let parsed = parseHindsIndex(firstHtml);
  if (!parsed.rows.length) {
    if (parsed.noRecords) return `hinds_land_records: no instruments recorded for ${start} to ${end}${who ? ` matching "${who}"` : ""}.`;
    const peek = strip(firstHtml).replace(/^.*?General Index/i, "").slice(0, 300);
    return `hinds_land_records unavailable: the index answered but no rows parsed (${hindsIndexUrl(start, end, who)}). Page said: "${peek}"`;
  }
  take(parsed);
  const pages = parsed.pages;
  const more = parsed.more; // the site's own truncation flag, printed on page 1
  for (let page = 2; page <= Math.min(pages, cap) && parsed.rows.length; page++) {
    parsed = parseHindsIndex(await request(`${HINDS_GINDEX}?SS1=1&ScrollAction=${encodeURIComponent(`Page ${page}`)}`, { jar }));
    take(parsed);
  }

  const picked = all.filter((r) => (!wanted.size || wanted.has(r.type)) && (!business_only || BUSINESS.test(r.grantor) || BUSINESS.test(r.grantee)));
  const partial = pages > cap || more;
  const out = [
    `Hinds County land records, ${start} to ${end}${who ? `, party "${who}"` : ""} (${HINDS_GINDEX}): ${all.length} instruments read from ${Math.min(pages, cap)} of ${pages} pages, ${picked.length} shown${wanted.size ? ` of type ${[...wanted].join("/")}` : ""}${business_only ? ", business party only" : ""}.${partial ? " PARTIAL: the index holds more pages than were read; narrow the window or set a name." : ""}`,
  ];
  for (const r of picked.slice(0, 50)) out.push(cut(`- ${r.date} | ${INSTRUMENT_LABELS[r.type] || r.type} | ${r.grantor} → ${r.grantee} | book-page ${r.book}`, 200));
  if (picked.length > 50) out.push(`(${picked.length - 50} more not shown; narrow with types or name)`);
  out.push(
    "",
    "Codes are the index's own: WD and QCD convey ownership (grantor to grantee), DT is a loan against the property, REL is a paid-off loan, LIS PENS is a lien notice. A deed to a business, or one buyer taking several parcels, is a development lead: check the buyer in the Record and the Pipeline. Amounts and parcels are not in the index; the book-page locates the instrument at the chancery clerk.",
  );
  return out.join("\n");
}

// --- registration ---------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Secretary of State tax-forfeited land inventory (Hinds County)
//
// Land that went to the county tax sale, was never redeemed, and matured to
// the State is sold by the Secretary of State's Public Lands Division. The
// public inventory app (tflgis.sos.ms.gov) draws from hosted ArcGIS layers on
// the state GIS server; the statewide web map is private, but the Hinds
// County export is a public feature service with one polygon per active
// parcel, joined to the county landroll. Query it by bounding box, street,
// zip, or owner, and link each hit to the SOS parcel page and application.
// ---------------------------------------------------------------------------
const SOS_TFL_LAYER =
  "https://gisserver.its.ms.gov/arcgis/rest/services/Hosted/Hinds_Tax_Forfeit_Properties_May_2026/FeatureServer/0";
const SOS_TFL_APP = "https://tflgis.sos.ms.gov/";
const HINDS_LANDROLL_DETAIL = "https://www.co.hinds.ms.us/pgs/apps/landroll_detail.asp?ID=";
// Rough neighborhood envelopes (west, south, east, north), WGS84.
const SOS_TFL_AREAS = {
  fondren: { bbox: [-90.19, 32.326, -90.158, 32.356], note: "Woodrow Wilson to Northside Drive, the rail line to I-55" },
  belhaven: { bbox: [-90.185, 32.308, -90.165, 32.328], note: "Fortification to Woodrow Wilson, Jefferson St to I-55" },
  midtown: { bbox: [-90.196, 32.316, -90.184, 32.33], note: "Fortification to Woodrow Wilson, west of the rail line" },
  downtown: { bbox: [-90.195, 32.29, -90.17, 32.31], note: "Pearl River to Fortification" },
  eastover: { bbox: [-90.158, 32.33, -90.13, 32.356], note: "I-55 to Ridgewood Road, Lakeland to Northside" },
};

function sosTflWhere({ street, zip, owner, min_value, blighted }) {
  const parts = ["status = 'Active'"];
  const lit = (v) => String(v).replace(/'/g, "''").toUpperCase();
  if (street) parts.push(`(UPPER(property_address) LIKE '%${lit(street)}%' OR UPPER(legal_description) LIKE '%${lit(street)}%')`);
  if (zip) parts.push(`property_address LIKE '%${String(zip).replace(/\D/g, "")}%'`);
  if (owner) parts.push(`UPPER(assessed_owner) LIKE '%${lit(owner)}%'`);
  if (min_value) parts.push(`market_value >= ${clampInt(min_value, 0, 100000000, 0)}`);
  if (blighted === true) parts.push("blighted = 'TRUE'");
  if (blighted === false) parts.push("blighted = 'FALSE'");
  return parts.join(" AND ");
}

async function sosTflQuery(params) {
  const q = new URLSearchParams({ f: "json", outFields: "*", returnGeometry: "false", ...params });
  const url = `${SOS_TFL_LAYER}/query?${q}`;
  const data = await request(url, { json: true });
  if (data.error) throw new Error(`ArcGIS ${data.error.code}: ${data.error.message}`);
  return data;
}

function money(n) {
  return n == null || Number.isNaN(Number(n)) ? "n/a" : `$${Number(n).toLocaleString("en-US")}`;
}

function sosTflRow(a) {
  const addr = (a.property_address || "").replace(/\s+/g, " ").trim() || "(no address on file)";
  const owner = (a.assessed_owner || "").replace(/\s+/g, " ").trim();
  const sub = [a.subdivision, a.lot ? `lot ${a.lot}` : "", a.block && a.block !== "-" ? `blk ${a.block}` : ""].filter(Boolean).join(" ");
  const size = a.acres_1 && Number(a.acres_1) > 0 ? `${a.acres_1} ac` : a.dimension || "";
  const flags = [a.blighted === "TRUE" ? "blighted" : "", a.bid_property === "TRUE" ? "bid property" : "", a.web === "FALSE" ? "not on web" : ""].filter(Boolean).join(", ");
  const link = a.link ? `https://${String(a.link).replace(/^https?:\/\//, "")}` : `${SOS_TFL_APP} (search PPIN ${a.ppin})`;
  return [
    `- ${addr} | ${money(a.market_value)} | ${size || "size n/a"} | tax sale ${a.sale_date || "n/a"} | last owner ${owner || "n/a"}`,
    `  ${sub || a.legal_description || ""}${flags ? ` | ${flags}` : ""}`,
    `  Hinds parcel ${a.parcel_no_ || "n/a"}${a.parcel_no_ ? ` (${HINDS_LANDROLL_DETAIL}${encodeURIComponent(a.parcel_no_)})` : ""} | SOS id ${a.parcel_id} | ${link}`,
  ].join("\n");
}

export async function sosTaxForfeited({ area = "", bbox = "", street = "", zip = "", owner = "", min_value = 0, blighted, sort = "value", limit = 60 } = {}) {
  const cap = clampInt(limit, 1, 400, 60);
  const key = String(area || "").trim().toLowerCase();
  let env = null;
  let envNote = "";
  if (bbox) {
    const nums = String(bbox).split(",").map((x) => Number(x.trim()));
    if (nums.length !== 4 || nums.some((n) => Number.isNaN(n))) return "sos_tax_forfeited unavailable: bbox must be 'west,south,east,north' in decimal degrees.";
    env = nums;
    envNote = `bbox ${nums.join(",")}`;
  } else if (key) {
    if (!SOS_TFL_AREAS[key]) return `sos_tax_forfeited unavailable: unknown area "${area}". Known areas: ${Object.keys(SOS_TFL_AREAS).join(", ")}; or pass bbox.`;
    env = SOS_TFL_AREAS[key].bbox;
    envNote = `${key} (${SOS_TFL_AREAS[key].note})`;
  }
  const where = sosTflWhere({ street, zip, owner, min_value, blighted });
  const geo = env
    ? { geometry: env.join(","), geometryType: "esriGeometryEnvelope", inSR: "4326", spatialRel: "esriSpatialRelIntersects" }
    : {};
  const orderBy = sort === "address" ? "property_address ASC" : sort === "sale" ? "sale_date ASC" : "market_value DESC";
  let total;
  let countAll;
  let rows;
  try {
    [total, countAll, rows] = await Promise.all([
      sosTflQuery({ where, ...geo, returnCountOnly: "true" }).then((d) => d.count),
      sosTflQuery({ where: "1=1", returnCountOnly: "true" }).then((d) => d.count),
      sosTflQuery({ where, ...geo, orderByFields: orderBy, resultRecordCount: String(cap) }).then((d) => d.features || []),
    ]);
  } catch (e) {
    return `sos_tax_forfeited unavailable: ${e.message} (${SOS_TFL_LAYER})`;
  }
  const filters = [envNote, street ? `street "${street}"` : "", zip ? `zip ${zip}` : "", owner ? `owner "${owner}"` : "", min_value ? `value >= ${money(min_value)}` : "", blighted === true ? "blighted only" : blighted === false ? "not blighted" : ""].filter(Boolean);
  const head =
    `Mississippi Secretary of State tax-forfeited inventory, Hinds County (${countAll} active parcels statewide layer export dated May 12, 2026; source ${SOS_TFL_LAYER}). ` +
    `${total} match${filters.length ? ` ${filters.join(", ")}` : ""}; ${Math.min(total, rows.length)} shown, sorted by ${sort === "address" ? "address" : sort === "sale" ? "oldest tax sale" : "market value, highest first"}.` +
    (total > rows.length ? ` PARTIAL: raise limit (max 400) or narrow the filter.` : "");
  const notes =
    "Market value is the county assessor's figure carried in the SOS export, not an asking price; the SOS sets its own price after an application and appraisal. " +
    "Tax sale date is when the county sold the lien; the owner's two-year redemption ran out and the land matured to the State. " +
    "Anyone may apply to buy through the SOS Tax-Forfeited Land Search (Public Lands Division, 601-359-6393); the city or county can also request a parcel. " +
    "Addresses come from the chancery clerk's certificate and can be a street name only. Cite as 'Secretary of State tax-forfeited inventory'.";
  if (!rows.length) return `${head}\n\n${notes}`;
  return `${head}\n\n${rows.map((f) => sosTflRow(f.attributes)).join("\n")}\n\n${notes}`;
}

export const COUNTY_TOOLS = [
  {
    spec: {
      type: "function",
      function: {
        name: "sos_tax_forfeited",
        description:
          "Mississippi Secretary of State inventory of tax-forfeited land in Hinds County: parcels sold at the county tax sale, never redeemed, and matured to the State, now for sale by the Public Lands Division. One row per active parcel with address, assessor market value, lot size, tax sale date, last owner, blight flag, Hinds parcel number, and the SOS parcel link. Filter by neighborhood preset (fondren, belhaven, midtown, downtown, eastover), a bbox, street, zip, or owner. Cite as 'Secretary of State tax-forfeited inventory'.",
        parameters: {
          type: "object",
          properties: {
            area: { type: "string", description: "Neighborhood preset: fondren, belhaven, midtown, downtown, or eastover." },
            bbox: { type: "string", description: "Custom envelope 'west,south,east,north' in decimal degrees; overrides area." },
            street: { type: "string", description: "Street name fragment matched against the address and legal description, e.g. 'DULING'." },
            zip: { type: "string", description: "ZIP code fragment, e.g. '39216'." },
            owner: { type: "string", description: "Last assessed owner fragment." },
            min_value: { type: "integer", description: "Minimum assessor market value in dollars." },
            blighted: { type: "boolean", description: "true for parcels the city flagged as blighted, false to exclude them." },
            sort: { type: "string", enum: ["value", "address", "sale"], description: "Order: market value high to low (default), address, or oldest tax sale first." },
            limit: { type: "integer", minimum: 1, maximum: 400, description: "Rows to return (default 60)." },
          },
        },
      },
    },
    run: (args) => sosTaxForfeited(args),
  },
  {
    spec: {
      type: "function",
      function: {
        name: "hinds_supervisors",
        description:
          "Hinds County Board of Supervisors: the year's meetings with agenda and minutes PDFs and video links, plus the first 9,000 characters of the newest readable minutes (agendas are scanned images without text). Use for county contracts, tax matters, the jail, roads, and the county side of city projects. Call once per run alongside jackson_meetings.",
        parameters: {
          type: "object",
          properties: {
            read: { type: "string", enum: ["minutes", "agenda"], description: "Which document to try first (default minutes)." },
            limit: { type: "integer", minimum: 3, maximum: 20, description: "Meetings to list (default 8)." },
          },
        },
      },
    },
    run: (args) => hindsSupervisors({ read: args.read, limit: args.limit }),
  },
  {
    spec: {
      type: "function",
      function: {
        name: "hinds_land_records",
        description:
          "Instruments recorded with the Hinds County chancery clerk in the last N days, from the general index: warranty deeds (WD), quitclaim deeds (QCD), deeds of trust (DT), releases (REL), lis pendens. Default keeps deeds with a business, trust, bank, or government party, which is how land assemblies surface before permits. A week runs to about 34 pages, so keep the window short, raise pages, or set a name. Cite as 'Hinds County land records'.",
        parameters: {
          type: "object",
          properties: {
            days: { type: "integer", minimum: 1, maximum: 60, description: "Lookback window (default 3; a week runs to about 34 pages)." },
            pages: { type: "integer", minimum: 1, maximum: 20, description: "Result pages to read (default 6). A page holds about 15 rows, each instrument listed twice, so about 8 instruments." },
            types: { type: "string", description: "Comma-separated codes to keep: WD, QCD, DT, REL, LIS PENS (default 'WD,QCD'; '' for all)." },
            business_only: { type: "boolean", description: "Keep only instruments with a business-looking party (default true)." },
            name: { type: "string", description: "Optional party name to search instead of the whole window, e.g. 'STATE STREET'." },
          },
        },
      },
    },
    run: (args) => hindsLandRecords({ days: args.days, pages: args.pages, types: args.types ?? "WD,QCD", business_only: args.business_only ?? true, name: args.name || "" }),
  },
  {
    spec: {
      type: "function",
      function: {
        name: "madison_supervisors",
        description:
          "Madison County Board of Supervisors: the upcoming agenda (first 9,000 characters: consent items, contracts, change orders, utility permits, right-of-way payments, state grant letters) and where the minutes are. Call for Development or Economy runs touching Madison County, Ridgeland, Canton, or Gluckstadt.",
        parameters: { type: "object", properties: {} },
      },
    },
    run: () => madisonSupervisors(),
  },
  {
    spec: {
      type: "function",
      function: {
        name: "rankin_supervisors",
        description:
          "Rankin County meetings from the county's CivicClerk agenda system: recent meetings with agenda, agenda packet, and minutes files, plus the first 9,000 characters of the newest agenda. Call for Development or Economy runs touching Rankin County, Flowood, Pearl, or Brandon.",
        parameters: { type: "object", properties: { limit: { type: "integer", minimum: 3, maximum: 20, description: "Meetings to list (default 8)." } } },
      },
    },
    run: (args) => rankinSupervisors({ limit: args.limit }),
  },
  {
    spec: {
      type: "function",
      function: {
        name: "mdeq_permits",
        description:
          "Environmental permits and certifications MDEQ issued recently, filtered to Hinds, Madison, and Rankin counties (or one county or city): water permits for subdivisions and plants, air construction permits for industrial expansions, solid waste permits for landfills. The earliest public sign that dirt is about to move. Call for Development runs.",
        parameters: {
          type: "object",
          properties: {
            county: { type: "string", description: "Optional county or city name to filter on exactly, e.g. 'Hinds', 'Madison', 'Rankin', 'Canton', 'Ridgeland'." },
            limit: { type: "integer", minimum: 5, maximum: 60, description: "Rows to return (default 30)." },
          },
        },
      },
    },
    run: (args) => mdeqPermits({ county: args.county || "", limit: args.limit }),
  },
  {
    spec: {
      type: "function",
      function: {
        name: "psc_dockets",
        description:
          "Mississippi Public Service Commission monthly Utility and Consent dockets: rate cases, certificates for new plants and lines, and Entergy, Atmos, and water utility matters, with the items mentioning metro utilities pulled from the newest two docket PDFs. Call for Economy or data-center runs.",
        parameters: {
          type: "object",
          properties: { keyword: { type: "string", description: "Optional word to search the dockets for, e.g. 'Entergy', 'Prado', 'data center'." } },
        },
      },
    },
    run: (args) => pscDockets({ keyword: args.keyword || "" }),
  },
];
