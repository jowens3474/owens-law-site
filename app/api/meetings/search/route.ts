// JSON search over the Meeting Archive for the research desk and Pro tools.
// GET /api/meetings/search?q=...&body=...&limit=20
import type { NextRequest } from "next/server";
import { searchTranscripts, videoAt } from "@/lib/meetings";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  if (isRateLimited("meetings-search", clientIp(req), 30)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const q = (req.nextUrl.searchParams.get("q") || "").slice(0, 200);
  const body = req.nextUrl.searchParams.get("body") || "";
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 20, 1), 100);
  const { terms, hits } = searchTranscripts(q, { limit, body });
  return Response.json(
    {
      query: q,
      terms,
      hits: hits.map((h) => ({ ...h, video: videoAt(h.id, h.t), page: `https://www.thejacksonwire.com/meetings/${h.id}#t-${h.t}` })),
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
