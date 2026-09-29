// County and state feeds for the research desk: the Hinds and Madison
// County supervisors, MDEQ's recently issued environmental permits, and
// the Public Service Commission's monthly dockets. Each tool returns a
// string for the model. Registered in data-tools.mjs.

import { fetchUrl } from "./fetch-url.mjs";

const UA = "TheJacksonWire/1.0 (+https://www.thejacksonwire.com; capitolmain42@gmail.com)";
const TIMEOUT_MS = 20000;
const METRO = /\b(hinds|madison|rankin|jackson|ridgeland|madison|canton|flowood|pearl|brandon|clinton|byram|richland|gluckstadt|raymond)\b/i;

async function getText(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" }, signal: c.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
    return text;
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

async function pdfText(url, cap = 12000) {
  const { text } = await fetchUrl(url);
  return String(text || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, cap);
}

// --- Hinds County Board of Supervisors ----------------------------------------------
//
// co.hinds.ms.us/pgs/Boardroom/Boardroom.asp lists every meeting of the
// year with its agenda PDF, minutes PDF, and Lifesize video links. The
// county's newer site (hindscountyms.com) only links here.

export const HINDS_BOARDROOM = "https://www.co.hinds.ms.us/pgs/Boardroom/Boardroom.asp";

const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

function longDateIso(s) {
  const m = s.match(/([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return "";
  const mo = MONTHS[m[1].toLowerCase()];
  return mo ? `${m[3]}-${String(mo).padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
}

/** Rows of the Boardroom listing: [{date, type, agenda, minutes, videos}]. */
export function parseHindsBoardroom(html) {
  const rows = [];
  // Each meeting is a table row; split on the date cells.
  const chunks = html.split(/(?=<tr)/i);
  for (const c of chunks) {
    const text = strip(c);
    const date = longDateIso(text);
    if (!date) continue;
    const agenda = c.match(/href="([^"]*\/BoardAgenda\/docs\/[^"]+\.pdf)"/i)?.[1] || null;
    const minutes = c.match(/href="([^"]*\/BoardMinutes\/docs\/[^"]+\.pdf)"/i)?.[1] || null;
    const videos = [...c.matchAll(/href="(https:\/\/playback\.lifesize\.com\/[^"]+)"/gi)].map((m) => m[1]);
    const type = text.replace(/^.*?\d{4}\s*/, "").replace(/\b(View Video \d|No Video|No Minutes)\b.*$/i, "").trim() || "Meeting";
    rows.push({ date, type, agenda: agenda ? encodeURI(decodeURI(agenda)) : null, minutes: minutes ? encodeURI(decodeURI(minutes)) : null, videos });
  }
  // Newest first, unique by date+type.
  const seen = new Set();
  return rows
    .filter((r) => !seen.has(r.date + r.type) && seen.add(r.date + r.type))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function hindsSupervisors({ limit = 8, read = "agenda" } = {}) {
  const html = await getText(HINDS_BOARDROOM);
  const rows = parseHindsBoardroom(html).slice(0, Math.min(Math.max(limit, 3), 20));
  if (!rows.length) return "hinds_supervisors unavailable: no meetings parsed from the Boardroom page.";
  const out = [`Hinds County Board of Supervisors meetings (${HINDS_BOARDROOM}), newest first:`];
  for (const r of rows) {
    out.push(`- ${r.date} | ${r.type}${r.agenda ? ` | agenda: ${r.agenda}` : ""}${r.minutes ? ` | minutes: ${r.minutes}` : ""}${r.videos.length ? ` | video: ${r.videos[0]}` : ""}`);
  }
  // Read the newest document of the requested kind so the model sees the items.
  const want = read === "minutes" ? "minutes" : "agenda";
  const doc = rows.find((r) => r[want]);
  if (doc) {
    try {
      const text = await pdfText(doc[want], 9000);
      out.push("", `Newest ${want} (${doc.date} ${doc.type}), text:`, text || "(no text layer)");
    } catch (e) {
      out.push("", `Could not read the newest ${want}: ${e.message}`);
    }
  }
  out.push("", "Agendas list claims, contracts, tax matters, and resolutions; minutes record the votes. Fetch any other PDF above with fetch_url. Meeting video is on Lifesize and is not transcribed.");
  return out.join("\n");
}

// --- Madison County Board of Supervisors --------------------------------------------
//
// tools.madison-co.net prints the upcoming agenda as a plain page; the
// minutes archive lives on madison-co.com as PDFs.

export const MADISON_AGENDA = "https://tools.madison-co.net/elected-offices/board-of-supervisors/print-agenda.php";
export const MADISON_MINUTES = "https://www.madison-co.com/elected-offices/board-of-supervisors/board-minutes";

export function parseMadisonAgenda(html) {
  // Keep the block structure: headings are upper-case lines ending in a colon.
  const text = String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return text.join("\n");
}

export async function madisonSupervisors() {
  const out = [];
  const errors = [];
  try {
    const agenda = parseMadisonAgenda(await getText(MADISON_AGENDA));
    out.push(`Madison County Board of Supervisors, upcoming agenda (${MADISON_AGENDA}):`, agenda.slice(0, 9000), "");
  } catch (e) {
    errors.push(`agenda: ${e.message}`);
  }
  try {
    // The page carries every county PDF in its sidebar; keep only the
    // minutes themselves (hosted under tools.madison-co.net or named as such).
    const html = await getText(MADISON_MINUTES);
    const pdfs = [...new Set(
      [...html.matchAll(/<a[^>]+href="([^"]+\.pdf)"[^>]*>([^<]*)<\/a>/gi)]
        .filter((m) => /minute/i.test(m[1] + " " + m[2]) || /tools\.madison-co\.net/i.test(m[1]))
        .map((m) => new URL(m[1], MADISON_MINUTES).href),
    )].slice(0, 8);
    if (pdfs.length) out.push("Recent minutes PDFs (madison-co.com):", ...pdfs.map((u) => `- ${u}`), "");
    else out.push(`Minutes are searchable by date and keyword at ${MADISON_MINUTES} (fetch_url the search result pages).`, "");
  } catch (e) {
    errors.push(`minutes: ${e.message}`);
  }
  if (!out.length) return `madison_supervisors unavailable: ${errors.join(" | ")}`;
  out.push("Watch for: tax abatements and fee-in-lieu agreements (data centers), urban renewal bonds, road and utility agreements with Ridgeland, Canton, and Gluckstadt, and MDA grant acknowledgments. Fetch any minutes PDF with fetch_url.");
  if (errors.length) out.push(`(partial: ${errors.join(" | ")})`);
  return out.join("\n");
}

// --- MDEQ recently issued permits ---------------------------------------------------
//
// enSearch's "Recently Issued Permits & Certifications" report is a plain
// ASP.NET table: facility, permit type, action, city, county.

export const MDEQ_REPORT = "https://opcgis.deq.state.ms.us/ensearchonline/report_permits.aspx";

export function parseMdeqReport(html) {
  const rows = [];
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => strip(c[1]));
    if (cells.length < 4) continue;
    const link = m[1].match(/href="(ai_info\.aspx\?ai=\d+)"/i)?.[1];
    if (!link) continue;
    rows.push({ cells, link: `https://opcgis.deq.state.ms.us/ensearchonline/${link}` });
  }
  return rows;
}

export async function mdeqPermits({ county = "", limit = 30 } = {}) {
  const html = await getText(MDEQ_REPORT);
  const rows = parseMdeqReport(html);
  if (!rows.length) return "mdeq_permits unavailable: no rows parsed from the enSearch report.";
  const re = county ? new RegExp(`\\b${county}\\b`, "i") : METRO;
  const hits = rows.filter((r) => re.test(r.cells.join(" "))).slice(0, Math.min(Math.max(limit, 5), 60));
  const out = [
    `MDEQ recently issued permits and certifications (${MDEQ_REPORT}), ${rows.length} statewide, ${hits.length} in ${county || "the Jackson metro"}:`,
  ];
  for (const r of hits) out.push(`- ${r.cells.join(" | ")} | ${r.link}`);
  if (!hits.length) out.push("(none in the metro on the current report)");
  out.push(
    "",
    "Water permits (NPDES, stormwater construction coverage, pretreatment) show new subdivisions, plants, and site work; air construction permits show industrial expansions; solid waste permits show landfill changes. Open the facility link for the permit history and the responsible company.",
  );
  return out.join("\n");
}

// --- Public Service Commission monthly dockets ----------------------------------------
//
// psc.ms.gov posts a Utility Docket and a Consent Docket PDF for each
// monthly meeting; each lists the docket numbers, utilities, and matters.

export const PSC_DOCKETS = "https://www.psc.ms.gov/exec-sec/dockets";

export function parsePscDocketLinks(html) {
  const links = [...new Set([...html.matchAll(/(\/sites\/default\/files\/[^"'\s<>]+\.pdf)/gi)].map((m) => `https://www.psc.ms.gov${m[1]}`))];
  return links.filter((u) => /docket/i.test(u));
}

export async function pscDockets({ keyword = "" } = {}) {
  const html = await getText(PSC_DOCKETS);
  const links = parsePscDocketLinks(html);
  if (!links.length) return "psc_dockets unavailable: no docket PDFs found on the dockets page.";
  const out = [`Mississippi Public Service Commission monthly dockets (${PSC_DOCKETS}), newest first:`, ...links.slice(0, 6).map((u) => `- ${u}`), ""];
  const kw = keyword ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : /entergy|jackson|hinds|madison|rankin|data center|prado|atmos|jxn|ridgeland|canton|byram|clinton|pearl|flowood|brandon/i;
  for (const u of links.slice(0, 2)) {
    try {
      const text = await pdfText(u, 60000);
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const hits = [];
      lines.forEach((l, i) => {
        if (kw.test(l)) hits.push(lines.slice(Math.max(0, i - 1), i + 2).join(" "));
      });
      out.push(`${u.split("/").pop()}: ${lines.length} lines, ${hits.length} matching ${keyword || "metro utilities"}:`);
      for (const h of [...new Set(hits)].slice(0, 25)) out.push(`  - ${h.slice(0, 300)}`);
      out.push("");
    } catch (e) {
      out.push(`Could not read ${u}: ${e.message}`, "");
    }
  }
  out.push("Docket numbers look like 2026-UN-12 (UN = utility, AD = administrative). Rate cases, certificates for new plants or lines, and large-load service agreements appear here before any press release. Cite as 'the Commission's docket for <month>'.");
  return out.join("\n");
}

// --- Rankin County Board of Supervisors (CivicClerk) -----------------------------------
//
// rankincoms.portal.civicclerk.com is a JavaScript app over an OData API
// that is open to anyone. Events are pre-scheduled a year out, so only
// meetings up to a week ahead are useful; published files are the agenda
// packet and minutes, streamed by file id.

export const RANKIN_API = "https://rankincoms.api.civicclerk.com/v1";
export const RANKIN_PORTAL = "https://rankincoms.portal.civicclerk.com";

async function getJson(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: c.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(t);
  }
}

export function rankinFileUrl(fileId, plainText = false) {
  return `${RANKIN_API}/Meetings/GetMeetingFileStream(fileId=${fileId},plainText=${plainText})`;
}

export async function rankinSupervisors({ limit = 8 } = {}) {
  const horizon = new Date(Date.now() + 7 * 86400000).toISOString();
  const url = `${RANKIN_API}/Events?$filter=startDateTime le ${horizon}&$orderby=startDateTime desc&$top=${Math.min(Math.max(limit, 3), 20)}`;
  const data = await getJson(url);
  const events = Array.isArray(data.value) ? data.value : [];
  if (!events.length) return "rankin_supervisors unavailable: the CivicClerk API returned no events.";
  const out = [`Rankin County meetings from CivicClerk (${RANKIN_PORTAL}), newest first:`];
  let newestAgenda = null;
  for (const e of events) {
    const date = String(e.startDateTime || "").slice(0, 10);
    const files = (e.publishedFiles || []).map((f) => ({ name: f.name || f.fileName || `file ${f.fileId}`, id: f.fileId ?? f.id, type: f.type || "" }));
    const fileText = files.map((f) => `${f.name} (${rankinFileUrl(f.id)})`).join("; ");
    out.push(`- ${date} | ${String(e.eventName || e.categoryName || "").trim()}${e.youtubeVideoId ? ` | video: https://www.youtube.com/watch?v=${e.youtubeVideoId}` : ""}${fileText ? ` | files: ${fileText}` : ""}`);
    if (!newestAgenda) {
      const agenda = files.find((f) => /agenda/i.test(f.name)) || files[0];
      if (agenda) newestAgenda = { date, name: String(e.eventName || "").trim(), file: agenda };
    }
  }
  if (newestAgenda) {
    try {
      const text = await pdfText(rankinFileUrl(newestAgenda.file.id), 9000);
      out.push("", `Newest file (${newestAgenda.date} ${newestAgenda.name}, ${newestAgenda.file.name}), text:`, text || "(no text layer)");
    } catch (e) {
      out.push("", `Could not read the newest agenda: ${e.message}`);
    }
  }
  out.push("", "Rankin County hosts Flowood, Pearl, Brandon, and the airport corridor; watch for tax abatements, industrial park deals, and road agreements. Fetch any file URL above with fetch_url.");
  return out.join("\n");
}

// --- registration ---------------------------------------------------------------------

export const COUNTY_TOOLS = [
  {
    spec: {
      type: "function",
      function: {
        name: "hinds_supervisors",
        description:
          "Hinds County Board of Supervisors: the year's meetings with agenda and minutes PDFs, plus the full text of the newest agenda (or minutes). Use for county contracts, tax matters, the jail, roads, and any county share of a city project (TIFs, interlocal agreements). Call once per run alongside jackson_meetings.",
        parameters: {
          type: "object",
          properties: {
            read: { type: "string", enum: ["agenda", "minutes"], description: "Which newest document to read in full (default agenda)." },
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
        name: "madison_supervisors",
        description:
          "Madison County Board of Supervisors: the upcoming agenda in full (consent items, contracts, tax abatements, bonds, MDA grants) and links to recent minutes. Madison County hosts the Amazon data centers, the Ridgeland conference center, and most of the metro's growth; call it for any Development or Economy run.",
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
          "Rankin County Board of Supervisors and other county boards from the county's CivicClerk agenda system: recent and upcoming meetings with agenda packets and minutes, plus the text of the newest agenda. Rankin hosts Flowood, Pearl, Brandon, and the airport corridor. Call for Development or Economy runs.",
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
          "Environmental permits and certifications MDEQ issued recently, filtered to the Jackson metro (or one county): stormwater and NPDES water permits for new subdivisions and plants, air construction permits for industrial expansions, solid waste permits for landfills. The earliest public sign that dirt is about to move. Call for Development runs.",
        parameters: {
          type: "object",
          properties: {
            county: { type: "string", description: "Optional county or city name to filter on, e.g. 'Hinds', 'Madison', 'Rankin', 'Jackson'." },
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
          "Mississippi Public Service Commission monthly Utility and Consent dockets: rate cases, certificates for new plants and lines, large-load agreements (data centers), and Entergy, Atmos, and water utility matters, with the lines mentioning metro utilities pulled from the newest two docket PDFs. Call for Economy or data-center runs.",
        parameters: {
          type: "object",
          properties: { keyword: { type: "string", description: "Optional word to search the dockets for, e.g. 'Entergy', 'Prado', 'data center'." } },
        },
      },
    },
    run: (args) => pscDockets({ keyword: args.keyword || "" }),
  },
];
