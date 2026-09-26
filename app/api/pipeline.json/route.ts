// JSON export of the Pipeline tracker for the research desk scripts
// (the weekly Pro briefing reads it from the live site).
import { PROJECTS, MILESTONES } from "@/lib/pipeline";

export const revalidate = 600;

export function GET() {
  return Response.json(
    { generated: new Date().toISOString(), projects: PROJECTS, milestones: MILESTONES },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } },
  );
}
