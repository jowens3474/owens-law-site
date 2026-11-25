// Live read of JXN Water's boil-water notices for /boil-water-notices.
// Server-only.
//
// Freshness matters more here than speed, so this does not use the Next.js
// data cache: that cache hands back a stale copy while it refreshes, and a
// page nobody opened overnight would greet its first morning reader with
// last night's list. Instead the page is rendered on request, and each
// server instance keeps its last read in memory for a few minutes, so a
// burst of readers (or a crawler) shares one request to JXN Water and no
// reader is shown a read more than MAX_AGE_MS old. The page prints the time
// of the read.

import { parseBoilWaterPage, type BoilNotice } from "./boil-water-parse";

export const BOIL_WATER_SOURCE = "https://jxnwater.com/boil-water-notices/";
export const JXN_WATER_PHONE = "601-500-5200";

const UA = "TheJacksonWire/1.0 (+https://www.thejacksonwire.com)";
const MAX_AGE_MS = 5 * 60 * 1000;
// After a failed read, wait a minute before asking JXN Water again.
const RETRY_AFTER_MS = 60 * 1000;
const TIMEOUT_MS = 8000;
// JXN Water's page is about 200,000 characters. Anything far larger is not it.
const MAX_PAGE_CHARS = 2_000_000;

export type BoilWaterResult =
  | {
      ok: true;
      checkedAt: string;
      active: BoilNotice[];
      resolved: BoilNotice[];
      // Text on JXN Water's page the parser did not recognize.
      other: string[];
    }
  | { ok: false; checkedAt: string };

let last: { at: number; result: BoilWaterResult } | null = null;
// A read that is under way, shared by every request that arrives meanwhile.
let reading: Promise<BoilWaterResult> | null = null;

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
    const html = await res.text();
    if (html.length > MAX_PAGE_CHARS) return { ok: false, checkedAt };
    const list = parseBoilWaterPage(html);
    if (!list) return { ok: false, checkedAt };
    return {
      ok: true,
      checkedAt,
      active: list.active,
      resolved: list.resolved,
      other: list.other,
    };
  } catch {
    return { ok: false, checkedAt };
  } finally {
    clearTimeout(timer);
  }
}

export async function getBoilWaterNotices(): Promise<BoilWaterResult> {
  if (last) {
    const age = Date.now() - last.at;
    if (age < (last.result.ok ? MAX_AGE_MS : RETRY_AFTER_MS)) return last.result;
  }
  if (!reading) {
    reading = read()
      .then((result) => {
        last = { at: Date.now(), result };
        return result;
      })
      .finally(() => {
        reading = null;
      });
  }
  return reading;
}
