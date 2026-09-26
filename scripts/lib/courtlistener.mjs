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
      const docs = e.recap_documents || [];
      lines.push(`[Entry #${e.entry_number ?? "?"}, filed ${e.date_filed}]`);
      // v4 often leaves the entry description empty and puts the text on
      // the document, so fall back to the documents' descriptions.
      const desc =
        e.description ||
        docs
          .map((d) => d.description || d.short_description)
          .filter(Boolean)
          .join(" / ") ||
        "(no description)";
      lines.push(desc.slice(0, descLimit));
      for (const d of docs) {
        if (!d.id) continue;
        const bits = [
          `recap_document_id: ${d.id}`,
          d.document_number ? `doc #${d.document_number}` : null,
          d.page_count ? `${d.page_count} pp` : null,
          d.is_available === false ? "not yet in RECAP" : null,
          d.is_sealed ? "sealed" : null,
        ].filter(Boolean);
        lines.push(`  ${bits.join(", ")}`);
      }
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

  /**
   * Search recent RECAP dockets in a court (default S.D. Miss.; "mssb" is
   * the bankruptcy court) for new business litigation, bankruptcies, and
   * other filings. Returns text.
   */
  async function searchDockets(query, { days = 30, court = OWENS_CASE.court } = {}) {
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const q = encodeURIComponent(query || "*");
    const data = await getJson(
      `/search/?type=r&q=${q}&court=${court}&filed_after=${since}&order_by=dateFiled%20desc`,
    );
    const results = data.results || [];
    if (results.length === 0) {
      return `No dockets matching "${query}" filed in ${court} since ${since}.`;
    }
    const lines = [`Dockets in ${court} matching "${query}" filed since ${since} (newest first):`, ""];
    for (const r of results.slice(0, 20)) {
      const bits = [
        r.dateFiled || "?",
        r.caseName || "(no name)",
        r.docketNumber || "",
        `docket_id ${r.docket_id ?? r.id ?? "?"}`,
      ];
      if (r.chapter) bits.push(`Chapter ${r.chapter}`);
      if (r.trustee_str) bits.push(`trustee ${r.trustee_str}`);
      if (r.suitNature) bits.push(r.suitNature);
      if (r.docket_absolute_url) bits.push(`https://www.courtlistener.com${r.docket_absolute_url}`);
      lines.push(`- ${bits.join(" | ")}`);
    }
    return lines.join("\n");
  }

  const BUSINESS_RE = /\b(LLC|L\.L\.C\.|Inc\.?|Incorporated|Corp\.?|Corporation|Co\.|Company|L\.?P\.?|LLP|PLLC|Enterprises?|Group|Holdings?|Partners|Properties|Ventures|Farms?|Trucking|Logistics|Construction|Restaurants?|Hospitality|Development|Investments?|Realty|Services|Industries|Church|Foundation|Clinic|Hospital|Pharmacy|Motors|Homes)\b/i;

  /**
   * New bankruptcy cases in the Southern District of Mississippi that look
   * like businesses: every Chapter 11, plus Chapter 7 and adversary
   * proceedings whose parties carry a business suffix. Returns structured
   * rows for the alerts and desk, and a text rendering for the model.
   */
  async function businessBankruptcies({ days = 14, limit = 25 } = {}) {
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const rows = [];
    let cursorUrl = `/search/?type=r&q=*&court=mssb&filed_after=${since}&order_by=dateFiled%20desc`;
    for (let page = 0; page < 3 && cursorUrl; page++) {
      const data = await getJson(cursorUrl.replace(/^https:\/\/www\.courtlistener\.com\/api\/rest\/v[34]/, ""));
      for (const r of data.results || []) {
        const parties = (r.party || []).join("; ");
        const name = r.caseName || "";
        const business = BUSINESS_RE.test(name) || BUSINESS_RE.test(parties);
        const adversary = /\bv\.\s/.test(name);
        if (r.chapter === "11" || (business && (r.chapter === "7" || adversary || !r.chapter))) {
          rows.push({
            id: String(r.docket_id ?? r.id),
            filed: r.dateFiled || "",
            caseName: name,
            number: r.docketNumber || "",
            chapter: r.chapter || (adversary ? "adversary" : ""),
            trustee: r.trustee_str || "",
            judge: r.assignedTo || "",
            parties,
            url: r.docket_absolute_url ? `https://www.courtlistener.com${r.docket_absolute_url}` : "",
          });
        }
      }
      cursorUrl = data.next || null;
      // Stop paging once results are older than the window; the API is
      // sorted newest first.
      const last = (data.results || []).slice(-1)[0];
      if (!last || (last.dateFiled || "") < since) break;
    }
    const seen = new Set();
    const unique = rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true))).slice(0, limit);
    const text = unique.length
      ? [
          `Business-looking bankruptcy cases filed in the S.D. Miss. bankruptcy court since ${since} (newest first):`,
          "",
          ...unique.map(
            (r) =>
              `- ${r.filed} | ${r.caseName} | ${r.number} | ${r.chapter === "adversary" ? "adversary proceeding" : `Chapter ${r.chapter}`}${r.trustee ? ` | trustee ${r.trustee}` : ""}${r.judge ? ` | Judge ${r.judge}` : ""}${r.url ? ` | ${r.url}` : ""}`,
          ),
          "",
          "Chapter 11 is a business reorganization; Chapter 7 with a business name is usually a liquidation; an adversary proceeding is a lawsuit inside a bankruptcy case. Confirm the debtor's address and business before naming it.",
        ].join("\n")
      : `No business-looking bankruptcy cases found in mssb since ${since}.`;
    return { rows: unique, text };
  }

  return {
    searchDockets,
    businessBankruptcies,
    findDocketId,
    recentEntries,
    formatEntries,
    getOwensCaseDocket,
    readCourtFiling,
  };
}
