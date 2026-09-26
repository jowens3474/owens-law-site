// Founding-member interest form for Pipeline Pro. Records the lead as an
// unsubscribed contact in the Pro audience (so it never receives paid
// mail until the editor flips it on) and notifies the newsroom.
import { site } from "@/lib/site";
import { pro, resendProConfigured } from "@/lib/pro";
import { sendEmail, upsertContact } from "@/lib/resend";
import { clientIp, isRateLimited, EMAIL_RE } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (isRateLimited("pro-interest", ip)) {
    return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const company = typeof body.company === "string" ? body.company.trim().slice(0, 120) : "";
  const role = typeof body.role === "string" ? body.role.trim().slice(0, 120) : "";
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!resendProConfigured()) {
    return Response.json({ error: "not_configured", mailto: site.email }, { status: 503 });
  }
  const audienceId = process.env.RESEND_PRO_AUDIENCE_ID as string;
  const [first, ...rest] = name.split(/\s+/);
  const saved = await upsertContact(audienceId, email, {
    unsubscribed: true,
    first_name: first || undefined,
    last_name: rest.join(" ") || (company ? `(${company})` : undefined),
  });
  await sendEmail({
    from: pro.from,
    to: site.email,
    reply_to: email,
    subject: `Pipeline Pro founding-member request: ${name || email}`,
    text: [
      `Email: ${email}`,
      `Name: ${name || "(none)"}`,
      `Company: ${company || "(none)"}`,
      `Role: ${role || "(none)"}`,
      "",
      `Contact saved in the Pro audience as unsubscribed: ${saved ? "yes" : "NO (check Resend)"}`,
      "To activate: mark the contact subscribed in Resend after payment or invoice.",
    ].join("\n"),
  });
  return Response.json({ ok: true });
}
