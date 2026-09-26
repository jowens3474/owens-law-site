// Minimal Resend REST client shared by the Pro routes. Plain fetch; no SDK.

const BASE = "https://api.resend.com";

function key(): string {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error("RESEND_API_KEY is not set");
  return k;
}

async function call<T = unknown>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    // non-JSON body
  }
  return { ok: res.ok, status: res.status, data };
}

export interface ResendContact {
  id?: string;
  email?: string;
  unsubscribed?: boolean;
  first_name?: string;
  last_name?: string;
}

/** Create or update a contact in an audience. Idempotent on email. */
export async function upsertContact(
  audienceId: string,
  email: string,
  fields: { unsubscribed?: boolean; first_name?: string; last_name?: string } = {},
): Promise<boolean> {
  const created = await call<{ message?: string }>(`/audiences/${audienceId}/contacts`, {
    method: "POST",
    body: JSON.stringify({ email, ...fields }),
  });
  if (created.ok) return true;
  const msg = (created.data?.message ?? "").toLowerCase();
  if (msg.includes("already")) {
    const updated = await call(`/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      body: JSON.stringify(fields),
    });
    return updated.ok;
  }
  console.error(`[resend] upsertContact HTTP ${created.status}: ${created.data?.message ?? ""}`);
  return false;
}

export async function getContact(audienceId: string, email: string): Promise<ResendContact | null> {
  const r = await call<ResendContact>(`/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`);
  return r.ok ? r.data : null;
}

export async function setUnsubscribed(audienceId: string, email: string, unsubscribed: boolean): Promise<boolean> {
  const r = await call(`/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`, {
    method: "PATCH",
    body: JSON.stringify({ unsubscribed }),
  });
  return r.ok;
}

export async function sendEmail(msg: { from: string; to: string | string[]; subject: string; text: string; html?: string; reply_to?: string }): Promise<boolean> {
  const r = await call<{ id?: string; message?: string }>("/emails", { method: "POST", body: JSON.stringify(msg) });
  if (!r.ok) console.error(`[resend] sendEmail HTTP ${r.status}: ${r.data?.message ?? ""}`);
  return r.ok;
}
