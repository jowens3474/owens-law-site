// Smoke-test the research desk's real-time data tools from a GitHub runner
// and print each result. Publishes nothing.
// Env: TOOL (optional: one tool name, default all), QUERY (optional),
// COURTLISTENER_API_TOKEN, EIA_API_KEY, BLS_API_KEY (optional).
import { DATA_TOOLS, runDataTool } from "./lib/data-tools.mjs";
import { createCourtListener } from "./lib/courtlistener.mjs";
import { fetchUrl } from "./lib/fetch-url.mjs";

const only = process.env.TOOL?.trim();
const query = process.env.QUERY?.trim();

// TOOL=probe QUERY="url1|url2": print each page's links and a text excerpt
// so a new source can be understood from a runner before a tool is written.
if (only === "probe") {
  for (const spec of (query || "").split("|").map((u) => u.trim()).filter(Boolean)) {
    // "url#regex" prints only links whose href or text matches the regex.
    const hash = spec.indexOf("#");
    const url = hash > 0 ? spec.slice(0, hash) : spec;
    const filter = hash > 0 ? new RegExp(spec.slice(hash + 1), "i") : null;
    console.log(`\n===== PROBE ${url}${filter ? ` (links matching ${filter})` : ""} =====`);
    try {
      // A browser-like agent: some state sites answer bots with a 404 page.
      const headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TheJacksonWire/1.0",
        Accept: "text/html,application/xhtml+xml,application/json,application/pdf,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      };
      if (/courtlistener\.com/.test(url) && process.env.COURTLISTENER_API_TOKEN) headers.Authorization = `Token ${process.env.COURTLISTENER_API_TOKEN}`;
      const res = await fetch(url, { headers });
      const ct = res.headers.get("content-type") || "";
      console.log(`HTTP ${res.status} ${ct} final=${res.url}`);
      if (/pdf/.test(ct) || /\.pdf(\?|$)/i.test(url)) {
        const { text } = await fetchUrl(url).catch((e) => ({ text: `fetchUrl failed: ${e.message}` }));
        console.log(`--- pdf text (${text.length} chars) ---`);
        console.log(text.slice(0, 5000));
        continue;
      }
      if (/json/.test(ct)) {
        const body = await res.text();
        console.log(body.slice(0, 6000));
        continue;
      }
      const html = await res.text();
      const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
        .map((m) => [m[1], m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()])
        .filter(([h, t]) => (t || filter) && !/^(#|javascript:)/.test(h))
        .filter(([h, t]) => !filter || filter.test(h) || filter.test(t));
      console.log(`links: ${links.length}`);
      for (const [h, t] of links.slice(0, filter ? 400 : 120)) console.log(`  ${t.slice(0, 80)} -> ${h}`);
      for (const fr of html.matchAll(/<(?:frame|iframe)\b[^>]*src=["']([^"']+)["']/gi)) console.log("frame:", fr[1]);
      if (links.length < 5) {
        console.log("--- raw html head ---");
        console.log(html.slice(0, 2500));
      }
      const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map((m) => m[0]);
      for (const f of forms.slice(0, 4)) {
        console.log("form:", (f.match(/<form\b[^>]*>/i) || [""])[0].slice(0, 300));
        for (const inp of f.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) console.log("   ", inp[0].slice(0, 200));
      }
      const { text } = await fetchUrl(url).catch(() => ({ text: "" }));
      console.log("--- text excerpt ---");
      console.log(text.slice(0, 2500));
    } catch (e) {
      console.log(`probe failed: ${e.message}`);
    }
  }
  process.exit(0);
}
const cl = createCourtListener({ prefix: "data-check" });

const DEFAULT_ARGS = {
  news_feed: { query: query || "Jackson Mississippi", hours: 48 },
  jackson_meetings: { limit: 10 },
  federal_awards: { county: "hinds", days: 45, keyword: query || "" },
  bls_series: {},
  eia_fuel_prices: {},
  sec_filings: { query: query || "Jackson, Mississippi", days: 60 },
  federal_register: { query: query || "Jackson, Mississippi", days: 60 },
  court_search: { query: query || "*", days: 30 },
  bankruptcies: { days: 21 },
  public_notices: { days: 30 },
  sales_tax_diversions: {},
};

let failures = 0;
for (const t of DATA_TOOLS) {
  const name = t.function.name;
  if (only && only !== name) continue;
  const started = Date.now();
  const out = await runDataTool(name, DEFAULT_ARGS[name] || {}, { prefix: "data-check", cl });
  const ms = Date.now() - started;
  const bad = /unavailable|failed/i.test(out.split("\n")[0]);
  if (bad) failures++;
  console.log(`\n===== ${name} (${ms} ms) ${bad ? "FAIL" : "OK"} =====`);
  console.log(out.length > 3500 ? out.slice(0, 3500) + "\n[truncated]" : out);
}
console.log(`\n[data-check] ${failures} tool(s) unavailable.`);
