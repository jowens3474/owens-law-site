import { site } from "@/lib/site";

// Lead-capture endpoint shared by the contact intake form and the attorney
// referral form. It is intentionally provider-agnostic and degrades
// gracefully: it delivers leads through whichever channels are configured via
// environment variables, and never silently drops one.
//
//   LEAD_NOTIFY_EMAIL  – inbox that should receive leads (e.g. the firm).
//   LEAD_FROM_EMAIL    – verified sender address for Resend.
//   RESEND_API_KEY     – Resend API key (https://resend.com). Optional.
//   LEAD_WEBHOOK_URL   – optional generic webhook (Zapier / CRM / Slack).
//
// If NO delivery channel is configured (local dev / first preview deploy), the
// lead is logged to the server and the request still succeeds so the forms are
// fully functional out of the box.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadType = "case" | "referral";

interface LeadPayload {
  type?: LeadType;
  [key: string]: unknown;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  firm: "Firm / Practice",
  barNumber: "Bar Number",
  phone: "Phone",
  email: "Email",
  date: "Date of incident",
  clientName: "Injured client",
  caseType: "Case type",
  details: "Details",
};

function clean(value: unknown): string {
  return String(value ?? "")
    .trim()
    .slice(0, 5000);
}

function formatLead(type: LeadType, data: LeadPayload): { subject: string; text: string } {
  const heading =
    type === "referral"
      ? "New ATTORNEY REFERRAL"
      : "New case inquiry (Free Case Review)";

  const lines = Object.entries(data)
    .filter(([key]) => key !== "type")
    .map(([key, val]) => `${FIELD_LABELS[key] ?? key}: ${clean(val)}`);

  const who = clean(data.name) || "Unknown";
  return {
    subject: `[${site.shortName}] ${heading} — ${who}`,
    text: `${heading}\n\n${lines.join("\n")}\n\nReceived: ${new Date().toISOString()}`,
  };
}

async function sendViaResend(subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!apiKey || !to || !from) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, reply_to: site.email }),
  });
  if (!res.ok) {
    console.error("Resend delivery failed:", res.status, await res.text());
    throw new Error("email_failed");
  }
  return true;
}

async function sendViaWebhook(type: LeadType, data: LeadPayload): Promise<boolean> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return false;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...data, receivedAt: new Date().toISOString() }),
  });
  if (!res.ok) {
    console.error("Webhook delivery failed:", res.status);
    throw new Error("webhook_failed");
  }
  return true;
}

export async function POST(req: Request) {
  let body: LeadPayload;
  try {
    body = (await req.json()) as LeadPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const type: LeadType = body.type === "referral" ? "referral" : "case";

  // Minimal validation: we need a way to reach the person back.
  const name = clean(body.name);
  const phone = clean(body.phone);
  const email = clean(body.email);
  const details = clean(body.details);
  if (!name || (!phone && !email) || !details) {
    return Response.json(
      { ok: false, error: "Please include your name, a phone or email, and a few details." },
      { status: 422 },
    );
  }

  const { subject, text } = formatLead(type, body);

  try {
    const delivered = await Promise.all([
      sendViaResend(subject, text),
      sendViaWebhook(type, body),
    ]);

    // No channel configured yet — log so nothing is lost, and still succeed.
    if (!delivered.some(Boolean)) {
      console.log("LEAD (no delivery channel configured):\n", text);
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, error: "We couldn't submit your message. Please call us instead." },
      { status: 502 },
    );
  }
}
