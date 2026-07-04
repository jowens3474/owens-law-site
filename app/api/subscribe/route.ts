// Newsletter signup endpoint. Adds the submitted email to the Resend
// audience used for The Jackson Wire's daily brief. Plain fetch against the
// Resend REST API -- no resend npm package.
//
// Requires RESEND_API_KEY and RESEND_AUDIENCE_ID as runtime environment
// variables on the site host (not just in GitHub Actions). See
// docs/NEWSLETTER-SETUP.md.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort, per-instance rate limit: a Map of ip -> attempt timestamps.
// This resets on every deploy/cold start and isn't shared across instances,
// so it's just a damper against naive bots, not a real rate limiter.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const attempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const history = (attempts.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  history.push(now);
  attempts.set(ip, history);
  return history.length > RATE_LIMIT_MAX;
}

function clientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  let email: unknown;
  try {
    const body = await req.json();
    email = body?.email;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return Response.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return Response.json(
      { error: "Newsletter signup is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), unsubscribed: false }),
      },
    );

    if (res.ok) {
      return Response.json({ ok: true });
    }

    // Resend's duplicate-contact response varies by API version -- treat it
    // as a successful (idempotent) signup rather than an error.
    let data: { message?: string; name?: string } | null = null;
    try {
      data = await res.json();
    } catch {
      // non-JSON error body; fall through to generic handling below
    }
    const message = (data?.message ?? "").toLowerCase();
    const alreadyExists =
      message.includes("already exists") || message.includes("already a contact");
    if (alreadyExists) {
      return Response.json({ ok: true });
    }

    console.error(
      `[subscribe] Resend contacts API error: HTTP ${res.status} ${data?.name ?? ""} ${data?.message ?? ""}`,
    );
    return Response.json(
      { error: "Couldn't complete signup right now. Try again shortly." },
      { status: 502 },
    );
  } catch (e) {
    console.error("[subscribe] Resend request failed:", (e as Error).message);
    return Response.json(
      { error: "Couldn't complete signup right now. Try again shortly." },
      { status: 502 },
    );
  }
}
