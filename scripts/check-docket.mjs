// Ad-hoc docket check for U.S. v. Owens (3:24-cr-103, S.D. Miss.).
// Prints the latest docket entries to stdout so an operator (or agent)
// can read them from the workflow log. Publishes nothing.
//
// Env: COURTLISTENER_API_TOKEN (required), DAYS_BACK (optional, default 14).
// Run via .github/workflows/docket-check.yml (workflow_dispatch).

const CL_BASE = "https://www.courtlistener.com/api/rest/v3";

const OWENS_CASE = {
  label: "U.S. v. Owens, Lumumba, and Banks",
  court: "mssd",
  docketNumberVariants: [
    "3:24-cr-00103",
    "3:24-cr-103",
    "24-cr-103",
    "24-103",
  ],
};

if (!process.env.COURTLISTENER_API_TOKEN) {
  console.error("[docket-check] FAILED: Missing COURTLISTENER_API_TOKEN");
  process.exit(1);
}

const daysBack = Number(process.env.DAYS_BACK || 14);

function clHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}`,
  };
}

async function findOwensDocketId() {
  for (const variant of OWENS_CASE.docketNumberVariants) {
    const url = `${CL_BASE}/dockets/?court=${OWENS_CASE.court}&docket_number=${encodeURIComponent(
      variant,
    )}`;
    console.log(`[docket-check] CourtListener search: ${variant}`);
    const res = await fetch(url, { headers: clHeaders() });
    if (!res.ok) {
      console.log(`[docket-check]  -> HTTP ${res.status}`);
      continue;
    }
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const docket = data.results[0];
      console.log(
        `[docket-check]  -> matched docket id=${docket.id} (${docket.docket_number})`,
      );
      return docket.id;
    }
  }
  const url = `${CL_BASE}/dockets/?court=${OWENS_CASE.court}&case_name__icontains=Owens`;
  console.log(`[docket-check] CourtListener search by name: Owens`);
  const res = await fetch(url, { headers: clHeaders() });
  if (res.ok) {
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const docket = data.results[0];
      console.log(
        `[docket-check]  -> matched docket id=${docket.id} (${docket.docket_number})`,
      );
      return docket.id;
    }
  }
  throw new Error("Owens case not found on CourtListener");
}

async function main() {
  const docketId = await findOwensDocketId();
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const url = `${CL_BASE}/docket-entries/?docket=${docketId}&order_by=-date_filed&page_size=50`;
  const res = await fetch(url, { headers: clHeaders() });
  if (!res.ok) {
    throw new Error(`docket-entries HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const entries = (data.results || []).filter(
    (e) => e.date_filed && new Date(e.date_filed) >= cutoff,
  );

  console.log("");
  console.log(`=== ${OWENS_CASE.label} — docket ${docketId} ===`);
  console.log(`Entries filed in the last ${daysBack} days: ${entries.length}`);
  console.log("");

  for (const e of entries) {
    const docIds = (e.recap_documents || []).map((d) => d.id).filter(Boolean);
    console.log(`[Entry #${e.entry_number ?? "?"}, filed ${e.date_filed}]`);
    console.log((e.description || "(no description)").slice(0, 1200));
    if (docIds.length) {
      console.log(`recap_document_id(s): ${docIds.join(", ")}`);
    }
    console.log("");
  }

  if (entries.length === 0) {
    console.log("(No entries in the window. Try a larger DAYS_BACK.)");
  }
  console.log("[docket-check] Done.");
}

main().catch((e) => {
  console.error(`[docket-check] FAILED: ${e.message}`);
  process.exit(1);
});
