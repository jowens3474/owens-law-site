// JSON export of the Pipeline tracker for the research desk scripts
// (the weekly Pro briefing reads it from the live site).
import { PROJECTS, MILESTONES } from "@/lib/pipeline";

// Refresh at most daily; deploys rebuild it sooner. Each refresh is a billed
// cache write on Vercel.
export const revalidate = 86400;

export function GET() {
  return Response.json(
    { generated: new Date().toISOString(), projects: PROJECTS, milestones: MILESTONES },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } },
  );
}
