// Live read of JXN Water's boil-water notices for /boil-water-notices.
// Server-only.
//
// Freshness matters more here than speed, so this does not use the Next.js
// data cache: that cache hands back a stale copy while it refreshes, and a
// page nobody opened overnight would greet its first morning reader with
// last night's list. Instead the page is rendered on request and this module
// keeps the last read in memory for a few minutes, so a burst of readers (or
// a crawler) costs JXN Water one request, and no reader is ever shown a list
// older than MAX_AGE_MS without being told when it was read.

import { parseBoilWaterPage, type BoilNotice } from "./boil-water-parse";

export const BOIL_WATER_SOURCE = "https://jxnwater.com/boil-water-notices/";
export const JXN_WATER_PHONE = "601-500-5200";

const UA = "TheJacksonWire/1.0 (+https://www.thejacksonwire.com)";
const MAX_AGE_MS = 5 * 60 * 1000;
// After a failed read, wait a minute before asking JXN Water again.
const RETRY_AFTER_MS = 60 * 1000;
const TIMEOUT_MS = 8000;

export type BoilWaterResult =
  | { ok: true; checkedAt: string; active: BoilNotice[]; resolved: BoilNotice[] }
  | { ok: false; checkedAt: string };

let last: { at: number; result: BoilWaterResult } | null = null;

async function read(): Promise<BoilWaterResult> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BOIL_WATER_SOURCE, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, checkedAt };
    const list = parseBoilWaterPage(await res.text());
    if (!list) return { ok: false, checkedAt };
    return { ok: true, checkedAt, active: list.active, resolved: list.resolved };
  } catch {
    return { ok: false, checkedAt };
  } finally {
    clearTimeout(timer);
  }
}

export async function getBoilWaterNotices(): Promise<BoilWaterResult> {
  const now = Date.now();
  if (last) {
    const age = now - last.at;
    if (age < (last.result.ok ? MAX_AGE_MS : RETRY_AFTER_MS)) return last.result;
  }
  const result = await read();
  last = { at: now, result };
  return result;
}
