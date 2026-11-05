import { buildSportsHeadlines } from "@/lib/sports-feeds.mjs";

// ISR: the handler runs at most once an hour and only the small processed JSON
// is cached. Feeds are read with node:https (not fetch), so raw feed bodies
// never enter Next's Data Cache. force-static is what makes a GET handler
// cacheable; it is safe here because nothing in it uses fetch or request data.
// `next build` prerenders this route, so every build makes the same 54 reads.
export const revalidate = 3600;
export const dynamic = "force-static";
// The reads stop at a 20 second deadline (lib/sports-feeds.mjs). Say how long
// the function may run rather than rely on the plan's default, which can be
// shorter than that.
export const maxDuration = 30;

// When most feeds fail during a refresh, throw: Next keeps serving the last
// good copy and tries again on a later request, instead of caching empty
// lists for an hour. During `next build` there is no earlier copy, and a throw
// would fail the deploy, so the build keeps whatever it got.
const MIN_READABLE_SHARE = 0.5;

export async function GET() {
  const { updated, sections, report } = await buildSportsHeadlines();
  const readable = report.filter((r) => r.ok).length;
  if (
    readable < report.length * MIN_READABLE_SHARE &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error(
      `Sports headlines: only ${readable} of ${report.length} feeds readable; keeping the last good copy.`,
    );
  }
  // The diagnostic report stays out of the public JSON.
  return Response.json({ updated, sections });
}
