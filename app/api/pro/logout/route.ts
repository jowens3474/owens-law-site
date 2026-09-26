import { cookies } from "next/headers";
import { absoluteUrl } from "@/lib/markdown";
import { PRO_COOKIE } from "@/lib/pro-session";

export async function POST() {
  const jar = await cookies();
  jar.delete(PRO_COOKIE);
  return Response.redirect(absoluteUrl("/pro"), 303);
}
