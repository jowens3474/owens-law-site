// Newsletter signup endpoint. Adds the submitted email to the Resend
// segment used for The Jackson Wire's daily brief. Plain fetch against the
// Resend REST API -- no resend npm package.
//
// Requires RESEND_API_KEY and a segment ID as runtime environment variables
// on the site host (not just in GitHub Actions). The segment ID is read from
// RESEND_SEGMENT_ID, falling back to RESEND_AUDIENCE_ID (its name from before
// Resend renamed Audiences to Segments; same value). See
// docs/NEWSLETTER-SETUP.md.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_API_BASE = "https://api.resend.com";

// Best-effort, per-instance rate limit: a Map of ip -> attempt timestamps.
// This resets on every deploy/cold start and isn't shared across instances,
// so it's just a damper against naive bots, not a real rate limiter.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const attempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Evict every IP whose window has fully expired so the map stays bounded
  // by recent traffic instead of growing for the life of the instance.
  for (const [key, times] of attempts) {
    if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
      attempts.delete(key);
    }
  }
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

interface ResendResult {
  ok: boolean;
  status: number;
  data: { message?: string; name?: string } | null;
}

async function resendPost(
  apiKey: string,
  path: string,
  body?: unknown,
): Promise<ResendResult> {
  const res = await fetch(`${RESEND_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: ResendResult["data"] = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON error body; callers fall through to generic handling
  }
  return { ok: res.ok, status: res.status, data };
}

function mentionsAlready(r: ResendResult): boolean {
  return (r.data?.message ?? "").toLowerCase().includes("already");
}

function logResendError(step: string, r: ResendResult) {
  console.error(
    `[subscribe] Resend ${step} error: HTTP ${r.status} ${r.data?.name ?? ""} ${r.data?.message ?? ""}`,
  );
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
  const segmentId =
    process.env.RESEND_SEGMENT_ID || process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !segmentId) {
    return Response.json(
      { error: "Newsletter signup is not configured yet." },
      { status: 503 },
    );
  }

  const address = email.trim();
  const failed = () =>
    Response.json(
      { error: "Couldn't complete signup right now. Try again shortly." },
      { status: 502 },
    );

  try {
    // `unsubscribed` is deliberately not sent. Resend contacts are global
    // to the team now, not per list, so `unsubscribed: false` here could
    // re-subscribe someone who opted out of everything, or a Pipeline Pro
    // lead that app/api/pro/interest stores as unsubscribed on purpose.
    // New contacts are subscribed by default.
    const created = await resendPost(apiKey, "/contacts", {
      email: address,
      segments: [{ id: segmentId }],
    });
    if (created.ok) {
      return Response.json({ ok: true });
    }

    // The email is already a contact (an earlier signup, or a contact from
    // another segment). Resend doesn't document whether create still adds
    // the segment in that case, so add it explicitly. Adding a contact
    // that is already in the segment counts as success (idempotent signup).
    if (created.status === 409 || mentionsAlready(created)) {
      const added = await resendPost(
        apiKey,
        `/contacts/${encodeURIComponent(address)}/segments/${encodeURIComponent(segmentId)}`,
      );
      if (added.ok || mentionsAlready(added)) {
        return Response.json({ ok: true });
      }
      logResendError("add-contact-to-segment", added);
      return failed();
    }

    logResendError("create-contact", created);
    return failed();
  } catch (e) {
    console.error("[subscribe] Resend request failed:", (e as Error).message);
    return failed();
  }
}
