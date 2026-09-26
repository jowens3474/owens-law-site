// Magic-link login for the Pro desk. Only active (subscribed) contacts in
// the Pro audience get a link; the response is the same either way so the
// endpoint does not reveal who is a member.
import { pro, resendProConfigured, sessionConfigured } from "@/lib/pro";
import { absoluteUrl } from "@/lib/markdown";
import { getContact, sendEmail } from "@/lib/resend";
import { issueToken } from "@/lib/pro-session";
import { clientIp, isRateLimited, EMAIL_RE } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (isRateLimited("pro-login", ip, 5)) {
    return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }
  let email = "";
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!resendProConfigured() || !sessionConfigured()) {
    return Response.json({ error: "Member sign-in is not configured yet." }, { status: 503 });
  }
  const contact = await getContact(process.env.RESEND_PRO_AUDIENCE_ID as string, email);
  if (contact && contact.unsubscribed === false) {
    const token = issueToken(email, "link");
    const link = absoluteUrl(`/api/pro/verify?token=${encodeURIComponent(token)}`);
    await sendEmail({
      from: pro.from,
      to: email,
      subject: `Your ${pro.name} sign-in link`,
      text: [`Open this link to sign in to the ${pro.name} desk. It expires in 30 minutes.`, "", link, "", "If you did not request this, ignore it."].join("\n"),
    });
  }
  return Response.json({ ok: true });
}
