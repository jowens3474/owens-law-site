// Shared CourtListener client for the Wire's scripts.
//
// CourtListener is retiring its v3 REST API; requests from newer accounts
// come back 403 there. Every call tries v4 first and falls back to v3 so the
// scripts keep working either way, and non-OK responses log the body so an
// auth or permission problem is visible in the workflow log.

const BASES = [
  "https://www.courtlistener.com/api/rest/v4",
  "https://www.courtlistener.com/api/rest/v3",
];

export const OWENS_CASE = {
  label: "U.S. v. Owens, Lumumba, and Banks",
  court: "mssd", // Southern District of Mississippi
  docketNumberVariants: [
    "3:24-cr-00103",
    "3:24-cr-103",
    "24-cr-103",
    "24-103",
  ],
};

export function createCourtListener({
  prefix = "cl",
  token = process.env.COURTLISTENER_API_TOKEN,
  fetchImpl = fetch,
} = {}) {
  const log = (m) => console.log(`[${prefix}] ${m}`);

  function headers() {
    const h = { Accept: "application/json" };
    if (token) h.Authorization = `Token ${token}`;
    return h;
  }

  // GET `path` (e.g. "/dockets/?court=mssd") against v4, then v3.
  // Returns the parsed JSON or throws with every status seen.
  async function getJson(path) {
    const seen = [];
    for (const base of BASES) {
      const res = await fetchImpl(`${base}${path}`, { headers: headers() });
      if (res.ok) return res.json();
      const body = (await res.text()).replace(/\s+/g, " ").slice(0, 200);
      const v = base.endsWith("v4") ? "v4" : "v3";
      log(` -> ${v} HTTP ${res.status}${body ? `: ${body}` : ""}`);
      seen.push(`${v} ${res.status}`);
    }
    throw new Error(`CourtListener ${path.split("?")[0]} failed (${seen.join(", ")})`);
  }

  let cachedDocketId = null;

  async function findDocketId() {
    if (cachedDocketId) return cachedDocketId;
    for (const variant of OWENS_CASE.docketNumberVariants) {
      log(`CourtListener search: ${variant}`);
      try {
        const data = await getJson(
          `/dockets/?court=${OWENS_CASE.court}&docket_number=${encodeURIComponent(variant)}`,
        );
        if (data.results?.length) {
          const d = data.results[0];
          log(` -> matched docket id=${d.id} (${d.docket_number})`);
          cachedDocketId = d.id;
          return d.id;
        }
      } catch (e) {
        log(e.message);
      }
    }
    log("CourtListener search by name: Owens");
    try {
      const data = await getJson(
        `/dockets/?court=${OWENS_CASE.court}&case_name__icontains=Owens`,
      );
      if (data.results?.length) {
        const d = data.results[0];
        log(` -> matched docket id=${d.id} (${d.docket_number})`);
        cachedDocketId = d.id;
        return d.id;
      }
    } catch (e) {
      log(e.message);
    }
    throw new Error("Owens case not found on CourtListener");
  }

  async function recentEntries(daysBack, pageSize = 25) {
    const docketId = await findDocketId();
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const data = await getJson(
      `/docket-entries/?docket=${docketId}&order_by=-date_filed&page_size=${pageSize}`,
    );
    const entries = (data.results || []).filter(
      (e) => e.date_filed && new Date(e.date_filed) >= cutoff,
    );
    return { docketId, entries };
  }

  function formatEntries(entries, docketId, daysBack, descLimit = 800) {
    if (entries.length === 0) {
      return `No new docket entries in the last ${daysBack} days for ${OWENS_CASE.label} (docket ${docketId}).`;
    }
    const lines = [
      `=== ${OWENS_CASE.label} — Southern District of Mississippi ===`,
      `Docket entries filed in the last ${daysBack} days:`,
      "",
    ];
    for (const e of entries) {
      const docIds = (e.recap_documents || []).map((d) => d.id).filter(Boolean);
      lines.push(`[Entry #${e.entry_number ?? "?"}, filed ${e.date_filed}]`);
      lines.push((e.description || "(no description)").slice(0, descLimit));
      if (docIds.length) lines.push(`recap_document_id(s): ${docIds.join(", ")}`);
      lines.push("");
    }
    return lines.join("\n");
  }

  /** Text summary of recent docket entries, for the model. */
  async function getOwensCaseDocket(daysBack = 7) {
    const { docketId, entries } = await recentEntries(daysBack);
    return formatEntries(entries, docketId, daysBack);
  }

  /** Plain text of one RECAP document, for the model. */
  async function readCourtFiling(recapDocumentId) {
    const data = await getJson(`/recap-documents/${recapDocumentId}/`);
    const text = data.plain_text || "";
    if (!text.trim()) {
      return `(no extracted text available for this filing — description: ${
        data.description || data.short_description || "n/a"
      })`;
    }
    return text.length > 15000 ? text.slice(0, 15000) + "\n\n[truncated]" : text;
  }

  return {
    findDocketId,
    recentEntries,
    formatEntries,
    getOwensCaseDocket,
    readCourtFiling,
  };
}
