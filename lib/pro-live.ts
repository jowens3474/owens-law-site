// Live feeds for the Pro desk page, cached 30 minutes. Server-only. These
// mirror the research desk's data tools (scripts/lib/data-tools.mjs) but
// return typed rows for rendering instead of text for a model. Every feed
// fails soft to an empty list so the page always renders.

import { unstable_cache } from "next/cache";
import { classifyNotice, noticeLabel } from "./notice-kinds.mjs";

const UA = "TheJacksonWire/1.0 (+https://www.thejacksonwire.com)";
const REVALIDATE = 1800;

const COUNTIES: Record<string, string> = { Hinds: "049", Madison: "089", Rankin: "121" };
const WATCHLIST = [
  "City of Jackson",
  "Hinds County",
  "JXN Water",
  "Entergy",
  "Madison County",
  "Ridgeland",
  "Richard's Disposal",
  "Trustmark",
  "Cal-Maine",
];

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, Accept: "application/json", ...(init.headers || {}) },
      signal: c.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export interface AwardRow {
  county: string;
  amount: number;
  recipient: string;
  agency: string;
  start: string;
  description: string;
  id: string;
  url: string;
}

async function fetchAwards(days: number): Promise<AwardRow[]> {
  const rows: AwardRow[] = [];
  for (const [county, fips] of Object.entries(COUNTIES)) {
    for (const codes of [["A", "B", "C", "D"], ["02", "03", "04", "05"]]) {
      try {
        const data = await getJson<{ results?: Record<string, string | number | null>[] }>(
          "https://api.usaspending.gov/api/v2/search/spending_by_award/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filters: {
                time_period: [{ start_date: iso(days), end_date: iso(0) }],
                place_of_performance_locations: [{ country: "USA", state: "MS", county: fips }],
                award_type_codes: codes,
              },
              fields: ["Award ID", "Recipient Name", "Award Amount", "Description", "Start Date", "Awarding Agency", "generated_internal_id"],
              page: 1,
              limit: 8,
              sort: "Start Date",
              order: "desc",
              subawards: false,
            }),
          },
        );
        for (const r of data.results || []) {
          rows.push({
            county,
            amount: Number(r["Award Amount"] ?? 0),
            recipient: String(r["Recipient Name"] ?? ""),
            agency: String(r["Awarding Agency"] ?? ""),
            start: String(r["Start Date"] ?? ""),
            description: String(r.Description ?? "").slice(0, 160),
            id: String(r["Award ID"] ?? ""),
            url: r.generated_internal_id ? `https://www.usaspending.gov/award/${r.generated_internal_id}` : "",
          });
        }
      } catch (e) {
        console.error(`[pro-live] awards ${county}: ${(e as Error).message}`);
      }
    }
  }
  return rows.sort((a, b) => b.start.localeCompare(a.start)).slice(0, 20);
}

export interface DocketRow {
  filed: string;
  caseName: string;
  number: string;
  url: string;
  nature: string;
}

async function fetchDockets(days: number): Promise<DocketRow[]> {
  const q = WATCHLIST.map((w) => `"${w}"`).join(" OR ");
  const headers: Record<string, string> = {};
  if (process.env.COURTLISTENER_API_TOKEN) headers.Authorization = `Token ${process.env.COURTLISTENER_API_TOKEN}`;
  try {
    const data = await getJson<{ results?: Record<string, string | number | null>[] }>(
      `https://www.courtlistener.com/api/rest/v4/search/?type=r&q=${encodeURIComponent(q)}&court=mssd&filed_after=${iso(days)}&order_by=dateFiled%20desc`,
      { headers },
    );
    return (data.results || []).slice(0, 20).map((r) => ({
      filed: String(r.dateFiled ?? ""),
      caseName: String(r.caseName ?? ""),
      number: String(r.docketNumber ?? ""),
      url: r.docket_absolute_url ? `https://www.courtlistener.com${r.docket_absolute_url}` : "",
      nature: String(r.suitNature ?? ""),
    }));
  } catch (e) {
    console.error(`[pro-live] dockets: ${(e as Error).message}`);
    return [];
  }
}

export interface AgendaRow {
  date: string;
  title: string;
  link: string;
}

function strip(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAgendas(): Promise<AgendaRow[]> {
  try {
    const posts = await getJson<{ date?: string; link?: string; title?: { rendered?: string } }[]>(
      "https://www.jacksonms.gov/wp-json/wp/v2/agendameeting?per_page=12&orderby=date&order=desc&_fields=title,link,date",
    );
    return posts.map((p) => ({ date: (p.date || "").slice(0, 10), title: strip(p.title?.rendered || ""), link: p.link || "" }));
  } catch (e) {
    console.error(`[pro-live] agendas: ${(e as Error).message}`);
    return [];
  }
}

export interface NoticeRow {
  date: string;
  title: string;
  link: string;
  kind: string;
}

async function fetchNotices(): Promise<NoticeRow[]> {
  try {
    const posts = await getJson<{ date?: string; link?: string; title?: { rendered?: string } }[]>(
      "https://www.jacksonms.gov/wp-json/wp/v2/bid-opportunity?per_page=15&orderby=date&order=desc&_fields=title,link,date",
    );
    return posts.map((p) => {
      const title = strip(p.title?.rendered || "");
      return { date: (p.date || "").slice(0, 10), title, link: p.link || "", kind: noticeLabel(classifyNotice(title)) };
    });
  } catch (e) {
    console.error(`[pro-live] notices: ${(e as Error).message}`);
    return [];
  }
}

export interface FuelRow {
  grade: string;
  today: string;
  weekAgo: string;
  monthAgo: string;
  yearAgo: string;
}

function parseAaa(text: string): FuelRow[] {
  const start = text.search(/Current Avg\./);
  if (start < 0) return [];
  const block = text.slice(start, start + 1200);
  const rows = ["Current Avg.", "Yesterday Avg.", "Week Ago Avg.", "Month Ago Avg.", "Year Ago Avg."];
  const values: Record<string, string[]> = {};
  for (let i = 0; i < rows.length; i++) {
    const a = block.indexOf(rows[i]);
    if (a < 0) return [];
    const b = i + 1 < rows.length ? block.indexOf(rows[i + 1], a) : block.indexOf("highest recorded", a);
    values[rows[i]] = (block.slice(a, b < 0 ? undefined : b).match(/\$\d+\.\d+/g) || []).map((x) => x.slice(1));
  }
  const n = values["Current Avg."].length;
  const grades = n >= 5 ? ["Regular", "Mid", "Premium", "Diesel", "E85"] : ["Regular", "Mid", "Premium", "Diesel"];
  const out: FuelRow[] = [];
  grades.forEach((grade, g) => {
    const cells = rows.map((r) => values[r][g]);
    if (cells.every(Boolean)) out.push({ grade, today: cells[0], weekAgo: cells[2], monthAgo: cells[3], yearAgo: cells[4] });
  });
  return out;
}

async function fetchFuel(): Promise<{ mississippi: FuelRow[]; us: FuelRow[] }> {
  const out = { mississippi: [] as FuelRow[], us: [] as FuelRow[] };
  for (const [k, url] of [["mississippi", "https://gasprices.aaa.com/?state=MS"], ["us", "https://gasprices.aaa.com/"]] as const) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
      const html = await res.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, "\n");
      out[k] = parseAaa(text);
    } catch (e) {
      console.error(`[pro-live] fuel ${k}: ${(e as Error).message}`);
    }
  }
  return out;
}

export const getRecentAwards = unstable_cache(() => fetchAwards(14), ["pro-live-awards"], { revalidate: REVALIDATE });
export const getRecentDockets = unstable_cache(() => fetchDockets(7), ["pro-live-dockets"], { revalidate: REVALIDATE });
export const getJacksonAgendas = unstable_cache(() => fetchAgendas(), ["pro-live-agendas"], { revalidate: REVALIDATE });
export const getJacksonNotices = unstable_cache(() => fetchNotices(), ["pro-live-notices"], { revalidate: REVALIDATE });
export const getFuelPrices = unstable_cache(() => fetchFuel(), ["pro-live-fuel"], { revalidate: REVALIDATE });
