// IndexNow integration — pings Bing/Yandex/Naver/Seznam to re-crawl URLs the
// moment they publish. Free. No registration. Single key file served from the
// site root verifies ownership.
//
// Usage in autopilot:
//   import { pingIndexNow } from "./lib/indexnow.mjs";
//   await pingIndexNow(["https://www.thejacksonwire.com/article/foo"]);

// Deterministic per-domain key. The matching key file is committed at
// public/<KEY>.txt. To rotate, change both.
const INDEXNOW_KEY = "9f3c8a4e2b1d4c7e8f6a5b3d2c1e9f4a";
const HOST = "www.thejacksonwire.com";

export async function pingIndexNow(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;
  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // 200, 202 are success; 422 is "no URLs accepted" which we treat as a
    // soft warning.
    console.log(`[indexnow] ${res.status} for ${urls.length} URL(s)`);
  } catch (e) {
    console.error("[indexnow] ping failed:", e?.message || e);
  }
}
