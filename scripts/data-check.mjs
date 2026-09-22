// Smoke-test the research desk's real-time data tools from a GitHub runner
// and print each result. Publishes nothing.
// Env: TOOL (optional: one tool name, default all), QUERY (optional),
// COURTLISTENER_API_TOKEN, EIA_API_KEY, BLS_API_KEY (optional).
import { DATA_TOOLS, runDataTool } from "./lib/data-tools.mjs";
import { createCourtListener } from "./lib/courtlistener.mjs";

const only = process.env.TOOL?.trim();
const query = process.env.QUERY?.trim();
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
