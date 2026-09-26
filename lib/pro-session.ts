// Signed, expiring tokens for the Pro member area. One secret
// (PRO_SESSION_SECRET) signs both the magic-link token and the session
// cookie; the two differ only in lifetime and purpose.

import { createHmac, timingSafeEqual } from "node:crypto";

export const PRO_COOKIE = "jw_pro";
const LINK_TTL_MS = 30 * 60 * 1000; // magic links: 30 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // sessions: 30 days

export interface ProToken {
  email: string;
  exp: number; // ms since epoch
  purpose: "link" | "session";
}

function secret(): string {
  const s = process.env.PRO_SESSION_SECRET;
  if (!s) throw new Error("PRO_SESSION_SECRET is not set");
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueToken(email: string, purpose: ProToken["purpose"]): string {
  const ttl = purpose === "link" ? LINK_TTL_MS : SESSION_TTL_MS;
  const body: ProToken = { email: email.trim().toLowerCase(), exp: Date.now() + ttl, purpose };
  const payload = b64url(JSON.stringify(body));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined, purpose: ProToken["purpose"]): ProToken | null {
  if (!token || !process.env.PRO_SESSION_SECRET) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ProToken;
    if (body.purpose !== purpose) return null;
    if (typeof body.exp !== "number" || body.exp < Date.now()) return null;
    if (typeof body.email !== "string" || !body.email.includes("@")) return null;
    return body;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
