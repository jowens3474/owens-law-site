// Real-time data tools for the research desk. Each one reads a primary
// source directly (no web search in the loop) and returns plain text for
// the model. All are keyless except where an optional key unlocks more
// (EIA_API_KEY, BLS_API_KEY). Every tool catches its own errors and
// returns a short "unavailable" message instead of throwing.

import { fetchUrl } from "./fetch-url.mjs";
import { listReports, readReport, mergeReport, renderMonthTable, loadDataset, monthLabel } from "./sales-tax.mjs";

const UA = "TheJacksonWire/1.0 (+https://www.thejacksonwire.com; capitolmain42@gmail.com)";
const TIMEOUT_MS = 20000;

const METRO_COUNTIES = {
  hinds: "049",
  madison: "089",
  rankin: "121",
};

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

async function getText(url, init = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, Accept: "*/*", ...(init.headers || {}) },
      signal: c.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);
    return text;
  } finally {
    clearTimeout(t);
  }
}
async function getJson(url, init = {}) {
  return JSON.parse(await getText(url, { ...init, headers: { Accept: "application/json", ...(init.headers || {}) } }));
}

function strip(html) {
  return (html || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n ?? "");
  return "$" + Math.round(v).toLocaleString("en-US");
}

// --- news_feed ---------------------------------------------------------------

export function parseRssItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const pick = (tag) => {
      const mm = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return mm ? strip(mm[1]) : "";
    };
    items.push({
      title: pick("title"),
      link: pick("link"),
      pubDate: pick("pubDate"),
      source: pick("source"),
    });
  }
  return items;
}

async function newsFeed({ query = "Jackson Mississippi", hours = 24 } = {}) {
  const lines = [];
  const errors = [];
  const days = Math.max(1, Math.ceil(hours / 24));

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${days}d`)}&hl=en-US&gl=US&ceid=US:en`;
    const items = parseRssItems(await getText(url)).slice(0, 15);
    if (items.length) {
      lines.push(`Google News headlines for "${query}" (last ${days}d, newest first):`);
      for (const it of items) {
        lines.push(`- ${it.pubDate} | ${it.source || "?"} | ${it.title}`);
      }
      lines.push("(Google News links are redirects; search the headline with web_search or fetch the outlet directly.)", "");
    }
  } catch (e) {
    errors.push(`Google News: ${e.message}`);
  }

  try {
    const q = /\s/.test(query) ? `"${query}"` : query;
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&format=json&timespan=${hours}h&maxrecords=15&sort=datedesc`;
    let data;
    try {
      data = await getJson(url);
    } catch (e) {
      if (!/HTTP 429/.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, 5500)); // GDELT allows one call per 5s
      data = await getJson(url);
    }
    const arts = data.articles || [];
    if (arts.length) {
      lines.push(`GDELT articles for ${q} (last ${hours}h, direct links):`);
      for (const a of arts) {
        lines.push(`- ${a.seendate} | ${a.domain} | ${a.title}\n  ${a.url}`);
      }
    }
  } catch (e) {
    errors.push(`GDELT: ${e.message}`);
  }

  if (lines.length === 0) return `news_feed unavailable: ${errors.join(" | ")}`;
  if (errors.length) lines.push("", `(partial: ${errors.join(" | ")})`);
  return lines.join("\n");
}

// --- jackson_meetings ----------------------------------------------------------

async function jacksonMeetings({ limit = 15 } = {}) {
  const out = [];
  const errors = [];
  const n = Math.min(Math.max(limit, 5), 30);

  // City of Jackson runs WordPress with a custom "agendameeting" post type
  // for agendas and packets. Read it dated, newest first; fall back to the
  // site-wide search (undated) if the type is unavailable.
  let gotAgendas = false;
  try {
    const posts = await getJson(
      `https://www.jacksonms.gov/wp-json/wp/v2/agendameeting?per_page=${n}&orderby=date&order=desc&_fields=title,link,date`,
    );
    if (Array.isArray(posts) && posts.length) {
      gotAgendas = true;
      out.push("City of Jackson agendas and packets (jacksonms.gov), newest first:");
      for (const p of posts) out.push(`- ${(p.date || "").slice(0, 10)} | ${strip(p.title?.rendered)} | ${p.link}`);
      out.push("");
    }
  } catch (e) {
    errors.push(`jacksonms.gov agendas: ${e.message}`);
  }
  if (!gotAgendas) {
    try {
      const hits = await getJson(
        `https://www.jacksonms.gov/wp-json/wp/v2/search?search=agenda&per_page=${n}&_fields=title,url,subtype`,
      );
      if (Array.isArray(hits) && hits.length) {
        out.push("City of Jackson, pages matching \"agenda\" (undated; open with fetch_url for the packet):");
        for (const h of hits) out.push(`- ${strip(h.title)} [${h.subtype}] | ${h.url}`);
        out.push("");
      }
    } catch (e) {
      errors.push(`jacksonms.gov search: ${e.message}`);
    }
  }
  try {
    const posts = await getJson(
      `https://www.jacksonms.gov/wp-json/wp/v2/posts?per_page=8&orderby=date&order=desc&_fields=title,link,date`,
    );
    if (Array.isArray(posts) && posts.length) {
      out.push("City of Jackson news posts, newest first:");
      for (const p of posts) out.push(`- ${(p.date || "").slice(0, 10)} | ${strip(p.title?.rendered)} | ${p.link}`);
      out.push("");
    }
  } catch (e) {
    errors.push(`jacksonms.gov posts: ${e.message}`);
  }
  // Hinds County's site is a menu-driven CMS with agendas as PDFs; point
  // the model at the page rather than dumping the navigation.
  out.push(
    "Hinds County Board of Supervisors: agendas and minutes are PDFs linked from https://www.hindscountyms.com/elected-offices/board-supervisors/board-meetings (fetch_url that page, then the newest agenda PDF; do not guess other paths on that site).",
    "",
  );

  if (out.length === 0) {
    return `jackson_meetings unavailable: ${errors.join(" | ")}. Fall back to fetch_url https://www.jacksonms.gov/meetings/`;
  }
  out.push("Fetch any agenda packet PDF linked from these pages with fetch_url to read the items.");
  if (errors.length) out.push(`(partial: ${errors.join(" | ")})`);
  return out.join("\n");
}

// --- public_notices --------------------------------------------------------------

/** Classify a City of Jackson bid-opportunity post by its title. */
export function classifyNotice(title) {
  const t = title.toLowerCase();
  if (/\b(rz|up|var|rezon|zoning|pud|variance|use permit|planning)\b/.test(t)) return "zoning";
  if (/\b(rfp|rfq|request for (proposals?|qualifications)|proposal)\b/.test(t)) return "rfp";
  if (/\b(ifb|invitation|bid|bids)\b/.test(t)) return "bid";
  if (/\b(meeting|hearing|notice)\b/.test(t)) return "meeting";
  return "other";
}

async function publicNotices({ days = 14, limit = 25 } = {}) {
  const since = isoDaysAgo(days);
  const out = [];
  const errors = [];
  try {
    const posts = await getJson(
      `https://www.jacksonms.gov/wp-json/wp/v2/bid-opportunity?per_page=${Math.min(limit, 50)}&orderby=date&order=desc&_fields=title,link,date,excerpt`,
    );
    const rows = (Array.isArray(posts) ? posts : [])
      .map((p) => ({
        date: (p.date || "").slice(0, 10),
        title: strip(p.title?.rendered || ""),
        link: p.link || "",
        kind: classifyNotice(strip(p.title?.rendered || "")),
        excerpt: strip(p.excerpt?.rendered || "").slice(0, 200),
      }))
      .filter((r) => r.date >= since);
    if (rows.length) {
      out.push(`City of Jackson bids, RFPs, and zoning publication ads posted since ${since} (jacksonms.gov, newest first):`);
      for (const r of rows) out.push(`- ${r.date} | ${r.kind.toUpperCase()} | ${r.title} | ${r.link}${r.excerpt ? `\n  ${r.excerpt}` : ""}`);
      out.push("");
    } else {
      out.push(`No City of Jackson bid or zoning notices posted since ${since}.`, "");
    }
  } catch (e) {
    errors.push(`jacksonms.gov bid-opportunity: ${e.message}`);
  }
  if (out.length === 0) return `public_notices unavailable: ${errors.join(" | ")}`;
  out.push("Zoning ads (RZ = rezoning, UP = use permit, VAR = variance) name the parcel and the hearing date inside the post; fetch_url the link to read it. RFPs and IFBs carry the bid deadline in the post.");
  if (errors.length) out.push(`(partial: ${errors.join(" | ")})`);
  return out.join("\n");
}

// --- federal_awards ------------------------------------------------------------

async function usaSpending(body) {
  return getJson("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function federalAwards({ keyword = "", county = "hinds", days = 30, limit = 12 } = {}) {
  const fips = METRO_COUNTIES[String(county).toLowerCase()] || METRO_COUNTIES.hinds;
  const filters = {
    time_period: [{ start_date: isoDaysAgo(days), end_date: today() }],
    place_of_performance_locations: [{ country: "USA", state: "MS", county: fips }],
  };
  if (keyword) filters.keywords = [keyword];
  const fields = [
    "Award ID",
    "Recipient Name",
    "Award Amount",
    "Description",
    "Start Date",
    "Awarding Agency",
    "Awarding Sub Agency",
    "Place of Performance City Name",
    "generated_internal_id",
  ];
  const groups = [
    { label: "Contracts", codes: ["A", "B", "C", "D"] },
    { label: "Grants", codes: ["02", "03", "04", "05"] },
  ];
  const out = [
    `Federal awards with place of performance in ${county[0].toUpperCase() + county.slice(1)} County, MS, with award activity since ${isoDaysAgo(days)}, newest start date first (USASpending.gov):`,
  ];
  const errors = [];
  for (const g of groups) {
    try {
      const data = await usaSpending({
        filters: { ...filters, award_type_codes: g.codes },
        fields,
        page: 1,
        limit,
        sort: "Start Date",
        order: "desc",
        subawards: false,
      });
      const rows = data.results || [];
      out.push("", `${g.label}: ${rows.length}${rows.length >= limit ? "+" : ""}`);
      for (const r of rows) {
        out.push(
          `- ${money(r["Award Amount"])} | ${r["Recipient Name"]} | ${r["Awarding Agency"]}${r["Awarding Sub Agency"] && r["Awarding Sub Agency"] !== r["Awarding Agency"] ? ` / ${r["Awarding Sub Agency"]}` : ""} | start ${r["Start Date"]}${r["Place of Performance City Name"] ? ` | ${r["Place of Performance City Name"]}` : ""}\n  ${(r.Description || "").slice(0, 220)} | id ${r["Award ID"]}${r.generated_internal_id ? `\n  https://www.usaspending.gov/award/${r.generated_internal_id}` : ""}`,
        );
      }
    } catch (e) {
      errors.push(`${g.label}: ${e.message}`);
    }
  }
  if (errors.length) out.push("", `(errors: ${errors.join(" | ")})`);
  return out.join("\n");
}

// --- bls_series ----------------------------------------------------------------

const BLS_DEFAULT = {
  LAUMT282714000000003: "Jackson MSA unemployment rate (%)",
  LAUMT282714000000005: "Jackson MSA employment (persons)",
  SMU28271400000000001: "Jackson MSA total nonfarm jobs (thousands)",
  LASST280000000000003: "Mississippi unemployment rate (%)",
};

async function blsSeries({ series_ids } = {}) {
  const ids = (series_ids && series_ids.length ? series_ids : Object.keys(BLS_DEFAULT)).slice(0, 6);
  const key = process.env.BLS_API_KEY;
  const out = ["BLS latest observations (not seasonally adjusted unless the series says otherwise):"];
  try {
    let series = [];
    if (key) {
      const data = await getJson("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesid: ids, latest: false, registrationkey: key }),
      });
      series = data.Results?.series || [];
    } else {
      for (const id of ids.slice(0, 4)) {
        const data = await getJson(`https://api.bls.gov/publicAPI/v1/timeseries/data/${id}`);
        series.push(...(data.Results?.series || []));
      }
    }
    for (const s of series) {
      const label = BLS_DEFAULT[s.seriesID] || s.seriesID;
      const pts = (s.data || []).slice(0, 13);
      if (pts.length === 0) {
        out.push(`- ${label}: no data`);
        continue;
      }
      const latest = pts[0];
      const yearAgo = pts.find((p) => p.year === String(Number(latest.year) - 1) && p.period === latest.period);
      out.push(
        `- ${label} [${s.seriesID}]: ${latest.periodName} ${latest.year} = ${latest.value}` +
          (yearAgo ? ` (year earlier ${yearAgo.value})` : "") +
          ` | last 6: ${pts.slice(0, 6).map((p) => `${p.periodName.slice(0, 3)} ${p.value}`).join(", ")}`,
      );
    }
    if (series.length === 0) out.push("(no series returned)");
  } catch (e) {
    return `bls_series unavailable: ${e.message}`;
  }
  return out.join("\n");
}

// --- eia_fuel_prices -----------------------------------------------------------

async function eiaFuelPrices() {
  const key = process.env.EIA_API_KEY;
  if (key) {
    try {
      const url =
        `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${key}&frequency=weekly&data[0]=value` +
        `&facets[duoarea][]=NUS&facets[duoarea][]=R30&facets[product][]=EPD2D&facets[product][]=EPMR` +
        `&sort[0][column]=period&sort[0][direction]=desc&length=24`;
      const data = await getJson(url);
      const rows = data.response?.data || [];
      const out = ["EIA weekly retail prices ($/gal), newest first:"];
      const byKey = {};
      for (const r of rows) {
        const k = `${r.product === "EPD2D" ? "Diesel" : "Regular gasoline"} | ${r.duoarea === "NUS" ? "U.S." : "Gulf Coast (PADD 3)"}`;
        (byKey[k] ||= []).push(`${r.period} ${r.value}`);
      }
      for (const [k, v] of Object.entries(byKey)) out.push(`- ${k}: ${v.slice(0, 6).join(", ")}`);
      return out.join("\n");
    } catch (e) {
      return `eia_fuel_prices unavailable (API): ${e.message}`;
    }
  }
  // Keyless path: AAA's daily state and national averages (regular, mid,
  // premium, diesel, and E85 nationally) for today, yesterday, a week, a
  // month, and a year ago.
  const out = ["AAA daily average prices, $/gal (no EIA_API_KEY set):"];
  const errors = [];
  for (const [label, url] of [
    ["Mississippi", "https://gasprices.aaa.com/?state=MS"],
    ["U.S.", "https://gasprices.aaa.com/"],
  ]) {
    try {
      const { text } = await fetchUrl(url);
      const parsed = parseAaaPrices(text);
      if (!parsed) throw new Error("could not parse the price table");
      out.push(`${label}:`, ...parsed, "");
    } catch (e) {
      errors.push(`${label}: ${e.message}`);
    }
  }
  if (out.length === 1) {
    return `eia_fuel_prices unavailable: ${errors.join(" | ")}. Add EIA_API_KEY (free at eia.gov/opendata) for structured weekly data.`;
  }
  out.push("Source: AAA (gasprices.aaa.com). For EIA's weekly on-highway series, add EIA_API_KEY (free) or fetch_url https://www.eia.gov/petroleum/gasdiesel/");
  if (errors.length) out.push(`(partial: ${errors.join(" | ")})`);
  return out.join("\n");
}

// Parse the text of an AAA state or national page into labeled rows.
// Exported for tests.
export function parseAaaPrices(text) {
  const start = text.search(/Current Avg\./);
  if (start < 0) return null;
  const block = text.slice(start, start + 1200);
  const rows = ["Current Avg.", "Yesterday Avg.", "Week Ago Avg.", "Month Ago Avg.", "Year Ago Avg."];
  const values = {};
  for (let i = 0; i < rows.length; i++) {
    const a = block.indexOf(rows[i]);
    if (a < 0) return null;
    const b = i + 1 < rows.length ? block.indexOf(rows[i + 1], a) : block.indexOf("highest recorded", a);
    const nums = (block.slice(a, b < 0 ? undefined : b).match(/\$\d+\.\d+/g) || []).map((x) => x.slice(1));
    values[rows[i]] = nums;
  }
  const n = values["Current Avg."].length;
  if (n < 4) return null;
  const grades = n >= 5 ? ["Regular", "Mid", "Premium", "Diesel", "E85"] : ["Regular", "Mid", "Premium", "Diesel"];
  const lines = [];
  for (let g = 0; g < grades.length; g++) {
    const cells = rows.map((r) => values[r][g]).filter(Boolean);
    if (cells.length < 5) continue;
    lines.push(
      `- ${grades[g]}: today ${cells[0]}, yesterday ${cells[1]}, week ago ${cells[2]}, month ago ${cells[3]}, year ago ${cells[4]}`,
    );
  }
  const rec = text.slice(start).match(/Diesel\s+\$(\d+\.\d+)\s+(\d{1,2}\/\d{1,2}\/\d{2})/);
  if (rec) lines.push(`- Record diesel average: $${rec[1]} on ${rec[2]}`);
  return lines.length ? lines : null;
}

// --- sec_filings ---------------------------------------------------------------

async function secFilings({ query = "Jackson, Mississippi", days = 30, forms = "" } = {}) {
  try {
    const url =
      `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${query}"`)}` +
      `&dateRange=custom&startdt=${isoDaysAgo(days)}&enddt=${today()}` +
      (forms ? `&forms=${encodeURIComponent(forms)}` : "");
    const data = await getJson(url);
    const hits = data.hits?.hits || [];
    if (hits.length === 0) return `No SEC filings mention "${query}" since ${isoDaysAgo(days)}.`;
    const out = [`SEC EDGAR full-text hits for "${query}" since ${isoDaysAgo(days)} (${data.hits.total?.value ?? hits.length} total):`];
    for (const h of hits.slice(0, 15)) {
      const s = h._source || {};
      const [adsh, file] = String(h._id).split(":");
      const cik = (s.ciks || [])[0];
      const link = cik && adsh ? `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${adsh.replace(/-/g, "")}/${file}` : "";
      const form = s.form || (s.root_forms || [])[0] || s.form_type || "";
      out.push(`- ${s.file_date} | ${form} | ${(s.display_names || []).join("; ")} | ${s.file_description || ""}${link ? `\n  ${link}` : ""}`);
    }
    return out.join("\n");
  } catch (e) {
    return `sec_filings unavailable: ${e.message}`;
  }
}

// --- federal_register ------------------------------------------------------------

async function federalRegister({ query = "Mississippi", days = 30 } = {}) {
  try {
    const url =
      `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=${encodeURIComponent(query)}` +
      `&conditions[publication_date][gte]=${isoDaysAgo(days)}&order=newest&per_page=15`;
    const data = await getJson(url);
    const docs = data.results || [];
    if (docs.length === 0) return `No Federal Register documents matching "${query}" since ${isoDaysAgo(days)}.`;
    const out = [`Federal Register documents matching "${query}" since ${isoDaysAgo(days)} (${data.count} total):`];
    for (const d of docs) {
      out.push(`- ${d.publication_date} | ${d.type} | ${(d.agencies || []).map((a) => a.name).join(", ")} | ${d.title}\n  ${d.html_url}${d.abstract ? `\n  ${d.abstract.slice(0, 220)}` : ""}`);
    }
    return out.join("\n");
  } catch (e) {
    return `federal_register unavailable: ${e.message}`;
  }
}

// --- registry ------------------------------------------------------------------

export const DATA_TOOLS = [
  {
    type: "function",
    function: {
      name: "news_feed",
      description:
        "Real-time headlines from Google News and GDELT for a query, newest first. Use at the start of every run with 'Jackson Mississippi' (and again for a beat: 'Hinds County', 'Ridgeland Mississippi', 'Mississippi Development Authority', 'JXN Water'). No key, no quota.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search phrase, e.g. 'Jackson Mississippi'." },
          hours: { type: "integer", description: "Lookback window in hours (default 24, max 168).", minimum: 1, maximum: 168 },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "jackson_meetings",
      description:
        "Newest meeting notices and agenda posts from the City of Jackson and Hinds County websites, with links to agenda packets. Call once per run to see what is on the calendar this week.",
      parameters: { type: "object", properties: { limit: { type: "integer", minimum: 5, maximum: 30 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "federal_awards",
      description:
        "Federal contracts and grants (USASpending.gov) with place of performance in Hinds, Madison, or Rankin County, MS, that started in the last N days. Surfaces money arriving before it is announced.",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Optional keyword filter (e.g. 'water', 'airport', 'housing')." },
          county: { type: "string", enum: ["hinds", "madison", "rankin"], description: "Default hinds." },
          days: { type: "integer", minimum: 7, maximum: 365, description: "Default 30." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bls_series",
      description:
        "Latest Bureau of Labor Statistics values for Jackson MSA unemployment, employment, nonfarm jobs, and Mississippi unemployment, with year-earlier comparison. Pass series_ids to override.",
      parameters: {
        type: "object",
        properties: { series_ids: { type: "array", items: { type: "string" }, description: "Optional BLS series IDs (max 6)." } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "eia_fuel_prices",
      description:
        "EIA weekly retail diesel and gasoline prices for the U.S. and the Gulf Coast, newest first. Use for any fuel, energy, trucking, or farm-cost story.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "sec_filings",
      description:
        "SEC EDGAR full-text search of recent filings for a phrase (a company name or 'Jackson, Mississippi'). Use for Cal-Maine, Trustmark, Cadence Bank, Entergy Mississippi, Atmos, and any public company with Jackson operations.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          days: { type: "integer", minimum: 1, maximum: 365 },
          forms: { type: "string", description: "Optional comma-separated form types, e.g. '8-K,10-Q'." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "federal_register",
      description:
        "Federal Register documents (rules, notices, grants, consent decrees) matching a phrase, newest first. Try 'Jackson, Mississippi', 'JXN Water', 'Mississippi' with a beat word.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, days: { type: "integer", minimum: 1, maximum: 365 } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "court_search",
      description:
        "New federal dockets in the Southern District of Mississippi (CourtListener RECAP) matching a query, newest first: business litigation, civil rights suits against the city, contract fights. Use '*' for everything recent. Set court to 'mssb' to search the bankruptcy court instead.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          days: { type: "integer", minimum: 1, maximum: 365 },
          court: { type: "string", enum: ["mssd", "mssb"], description: "mssd = district court (default), mssb = bankruptcy court." },
        },
        required: ["query"],
      },
    },
  },
];

DATA_TOOLS.push({
  type: "function",
  function: {
    name: "sales_tax_diversions",
    description:
      "The newest Mississippi Department of Revenue report of sales tax diversions paid to cities: the month's payment to Jackson and each metro city, the same month a year earlier, the percent change, and fiscal-year-to-date totals. The closest thing to a monthly economic indicator for each city. Cite as 'Department of Revenue diversion reports'.",
    parameters: { type: "object", properties: {} },
  },
});
DATA_TOOLS.push({
  type: "function",
  function: {
    name: "public_notices",
    description:
      "Public notices posted by the City of Jackson in the last N days: invitations for bids, requests for proposals, zoning publication ads (rezonings, use permits, variances, with hearing dates), and public meeting notices. Each is a dated, future event with a document. Call once per run alongside jackson_meetings.",
    parameters: {
      type: "object",
      properties: { days: { type: "integer", minimum: 1, maximum: 90, description: "Default 14." } },
    },
  },
});
DATA_TOOLS.push({
  type: "function",
  function: {
    name: "bankruptcies",
    description:
      "Business-looking bankruptcy cases filed in the Southern District of Mississippi bankruptcy court in the last N days: every Chapter 11, plus Chapter 7 cases and adversary proceedings with a business name. Newest first, with docket links. Use for a Business story or the watch list; confirm the debtor's address before naming it.",
    parameters: {
      type: "object",
      properties: { days: { type: "integer", minimum: 1, maximum: 90, description: "Default 14." } },
    },
  },
});

export const DATA_TOOL_NAMES = new Set(DATA_TOOLS.map((t) => t.function.name));

/**
 * Run a data tool by name. Returns a string for the model. `cl` is a
 * CourtListener client from createCourtListener(), used by court_search.
 */
export async function runDataTool(name, args = {}, { prefix = "data", cl } = {}) {
  const log = (m) => console.log(`[${prefix}] ${name}: ${m}`);
  try {
    switch (name) {
      case "news_feed":
        log(`"${args.query}" ${args.hours ?? 24}h`);
        return await newsFeed({ query: args.query, hours: Math.min(Math.max(args.hours ?? 24, 1), 168) });
      case "jackson_meetings":
        log("fetch");
        return await jacksonMeetings({ limit: args.limit ?? 15 });
      case "federal_awards":
        log(`${args.county ?? "hinds"} ${args.days ?? 30}d ${args.keyword ?? ""}`);
        return await federalAwards({ keyword: args.keyword, county: args.county ?? "hinds", days: args.days ?? 30 });
      case "bls_series":
        log("fetch");
        return await blsSeries({ series_ids: args.series_ids });
      case "eia_fuel_prices":
        log("fetch");
        return await eiaFuelPrices();
      case "sec_filings":
        log(`"${args.query}" ${args.days ?? 30}d`);
        return await secFilings({ query: args.query, days: args.days ?? 30, forms: args.forms ?? "" });
      case "federal_register":
        log(`"${args.query}" ${args.days ?? 30}d`);
        return await federalRegister({ query: args.query, days: args.days ?? 30 });
      case "court_search":
        log(`"${args.query}" ${args.days ?? 30}d ${args.court ?? "mssd"}`);
        if (!cl) return "court_search unavailable: no CourtListener client.";
        return await cl.searchDockets(args.query || "*", { days: args.days ?? 30, court: args.court === "mssb" ? "mssb" : "mssd" });
      case "sales_tax_diversions": {
        log("fetch");
        const reports = await listReports();
        if (!reports.length) return "sales_tax_diversions unavailable: no reports found on the DOR listing page.";
        const d = loadDataset();
        const newest = reports[0];
        if (!d.reports[newest.month]) {
          const { rows } = await readReport(newest.url);
          mergeReport(d, newest.month, rows, newest.url, { revised: newest.revised });
        }
        return `Newest report: ${monthLabel(newest.month)}.\n` + renderMonthTable(d, newest.month) + "\nThe Wire's tracker with history: https://www.thejacksonwire.com/economy/sales-tax";
      }
      case "public_notices":
        log(`${args.days ?? 14}d`);
        return await publicNotices({ days: Math.min(Math.max(args.days ?? 14, 1), 90) });
      case "bankruptcies":
        log(`${args.days ?? 14}d`);
        if (!cl) return "bankruptcies unavailable: no CourtListener client.";
        return (await cl.businessBankruptcies({ days: Math.min(Math.max(args.days ?? 14, 1), 90) })).text;
      default:
        return null;
    }
  } catch (e) {
    log(`failed: ${e.message}`);
    return `${name} unavailable: ${e.message}`;
  }
}
