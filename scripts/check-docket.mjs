// Ad-hoc docket check for U.S. v. Owens (3:24-cr-103, S.D. Miss.).
// Prints the latest docket entries to stdout so an operator (or agent)
// can read them from the workflow log. Publishes nothing.
//
// Env: COURTLISTENER_API_TOKEN (required), DAYS_BACK (optional, default 14).
// Run via .github/workflows/docket-check.yml (workflow_dispatch).

import { createCourtListener, OWENS_CASE } from "./lib/courtlistener.mjs";

if (!process.env.COURTLISTENER_API_TOKEN) {
  console.error("[docket-check] FAILED: Missing COURTLISTENER_API_TOKEN");
  process.exit(1);
}

const daysBack = Number(process.env.DAYS_BACK || 14);
const cl = createCourtListener({ prefix: "docket-check" });

async function main() {
  const { docketId, entries } = await cl.recentEntries(daysBack, 50);
  console.log("");
  console.log(`=== ${OWENS_CASE.label} — docket ${docketId} ===`);
  console.log(`Entries filed in the last ${daysBack} days: ${entries.length}`);
  console.log("");
  console.log(cl.formatEntries(entries, docketId, daysBack, 1200));
  if (entries.length === 0) {
    console.log("(No entries in the window. Try a larger DAYS_BACK.)");
  }
  console.log("[docket-check] Done.");
}

main().catch((e) => {
  console.error(`[docket-check] FAILED: ${e.message}`);
  process.exit(1);
});
