// Best-effort per-instance rate limiter shared by the form endpoints.
// Resets on cold start and is not shared across instances; it is a damper
// against naive bots, not a guarantee.
const WINDOW_MS = 60_000;
const buckets = new Map<string, Map<string, number[]>>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function isRateLimited(bucket: string, ip: string, max = 5): boolean {
  const now = Date.now();
  const b = buckets.get(bucket) ?? new Map<string, number[]>();
  buckets.set(bucket, b);
  for (const [k, times] of b) if (times.every((t) => now - t >= WINDOW_MS)) b.delete(k);
  const hist = (b.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hist.push(now);
  b.set(ip, hist);
  return hist.length > max;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
