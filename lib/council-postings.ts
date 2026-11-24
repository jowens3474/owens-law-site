// The newest agendas and notices the City of Jackson has posted for the
// council, read from the city website's public feed for /city-council.
// Server-only. Cached an hour; fails soft to an empty list so the page
// always renders.

import { decodeEntities } from "./boil-water-parse";

const FEED =
  "https://jacksonms.gov/wp-json/wp/v2/agendameeting?per_page=8&_fields=date_gmt,link,title";
const UA = "TheJacksonWire/1.0 (+https://www.thejacksonwire.com)";

export interface CouncilPosting {
  title: string;
  url: string;
  // When the city posted it, as an ISO instant.
  posted: string;
}

interface FeedRow {
  date_gmt?: unknown;
  link?: unknown;
  title?: { rendered?: unknown };
}

export async function getCouncilPostings(): Promise<CouncilPosting[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(FEED, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) return [];
    const postings: CouncilPosting[] = [];
    for (const row of rows as FeedRow[]) {
      const title = typeof row?.title?.rendered === "string" ? row.title.rendered : "";
      const url = typeof row?.link === "string" ? row.link : "";
      const gmt = typeof row?.date_gmt === "string" ? row.date_gmt : "";
      // Only links to the city's own site, and only rows with a readable date.
      if (!title || !url.startsWith("https://jacksonms.gov/")) continue;
      const posted = new Date(`${gmt}Z`);
      if (Number.isNaN(posted.getTime())) continue;
      postings.push({
        title: decodeEntities(title.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim(),
        url,
        posted: posted.toISOString(),
      });
    }
    return postings;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
