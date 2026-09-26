// Stripe over plain fetch: Checkout Sessions for subscriptions, webhook
// signature verification, and a customer lookup. No SDK dependency.

import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.stripe.com/v1";

function key(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error("STRIPE_SECRET_KEY is not set");
  return k;
}

async function post<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
    cache: "no-store",
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${path}: ${data.error?.message ?? `HTTP ${res.status}`}`);
  return data;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${key()}` },
    cache: "no-store",
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${path}: ${data.error?.message ?? `HTTP ${res.status}`}`);
  return data;
}

export type Plan = "monthly" | "annual";

export function priceIdFor(plan: Plan): string | undefined {
  return plan === "annual" ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY;
}

export async function createCheckoutSession(opts: {
  plan: Plan;
  successUrl: string;
  cancelUrl: string;
  email?: string;
}): Promise<{ id: string; url: string }> {
  const price = priceIdFor(opts.plan);
  if (!price) throw new Error(`No Stripe price configured for ${opts.plan}`);
  const params: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    allow_promotion_codes: "true",
    "metadata[product]": "pipeline-pro",
    "metadata[plan]": opts.plan,
  };
  if (opts.email) params.customer_email = opts.email;
  return post<{ id: string; url: string }>("/checkout/sessions", params);
}

/** Find the newest Stripe customer with this email, if any. */
export async function findCustomerByEmail(email: string): Promise<string | null> {
  try {
    const r = await get<{ data?: { id: string }[] }>(`/customers?email=${encodeURIComponent(email)}&limit=1`);
    return r.data?.[0]?.id ?? null;
  } catch (e) {
    console.error(`[stripe] customer search failed: ${(e as Error).message}`);
    return null;
  }
}

/** Create a Billing Portal session where the member can cancel or update payment. */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const r = await post<{ url: string }>("/billing_portal/sessions", { customer: customerId, return_url: returnUrl });
  return r.url;
}

export async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const c = await get<{ email?: string | null }>(`/customers/${customerId}`);
    return c.email ?? null;
  } catch (e) {
    console.error(`[stripe] customer lookup failed: ${(e as Error).message}`);
    return null;
  }
}

/**
 * Verify a Stripe-Signature header against the raw request body.
 * Format: t=<unix>,v1=<hex>[,v1=<hex>...]. Tolerance 5 minutes.
 */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, toleranceSeconds = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i), kv.slice(i + 1)];
    }),
  ) as Record<string, string>;
  const t = Number(parts.t);
  if (!Number.isFinite(t)) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const candidates = header
    .split(",")
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => kv.slice(3));
  const e = Buffer.from(expected);
  return candidates.some((c) => {
    const b = Buffer.from(c);
    return b.length === e.length && timingSafeEqual(b, e);
  });
}
