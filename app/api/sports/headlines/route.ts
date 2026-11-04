import { buildSportsHeadlines } from "@/lib/sports-feeds.mjs";

// ISR: the handler runs at most once an hour and only the small processed JSON
// is cached. Feeds are read with node:https (not fetch), so raw feed bodies
// never enter Next's Data Cache. force-static is what makes a GET handler
// cacheable; it is safe here because nothing in it uses fetch or request data.
export const revalidate = 3600;
export const dynamic = "force-static";

export async function GET() {
  try {
    // The diagnostic report stays out of the public JSON.
    const { updated, sections } = await buildSportsHeadlines();
    return Response.json({ updated, sections });
  } catch {
    return Response.json({
      updated: new Date().toISOString(),
      sections: { "ms-college": [], "ms-high-school": [], national: [], sec: [], nil: [] },
    });
  }
}
