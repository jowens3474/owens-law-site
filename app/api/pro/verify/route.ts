// Exchanges a magic-link token for a 30-day session cookie.
import { cookies } from "next/headers";
import { absoluteUrl } from "@/lib/markdown";
import { issueToken, verifyToken, PRO_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/pro-session";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? undefined;
  const link = verifyToken(token, "link");
  if (!link) {
    return Response.redirect(absoluteUrl("/pro/dashboard?login=expired"), 303);
  }
  const jar = await cookies();
  jar.set(PRO_COOKIE, issueToken(link.email, "session"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return Response.redirect(absoluteUrl("/pro/dashboard"), 303);
}
