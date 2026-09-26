// Classifies a City of Jackson bid-opportunity post by its title. Shared by
// the research desk's data tools (Node) and the Pro desk page (Next.js), so
// a keyword change lands in both.

export const NOTICE_KINDS = [
  { kind: "zoning", label: "Zoning", re: /\b(rz|up|var|rezon\w*|zoning|pud|variance|use permit|planning)\b/i },
  { kind: "rfp", label: "RFP", re: /\b(rfp|rfq|request for (proposals?|qualifications)|proposal)\b/i },
  { kind: "bid", label: "Bid", re: /\b(ifb|invitation|bids?)\b/i },
  { kind: "meeting", label: "Meeting", re: /\b(meeting|hearing|notice)\b/i },
];

/** Machine key: "zoning" | "rfp" | "bid" | "meeting" | "other". */
export function classifyNotice(title) {
  const t = String(title || "");
  for (const k of NOTICE_KINDS) if (k.re.test(t)) return k.kind;
  return "other";
}

/** Display label for a kind key. */
export function noticeLabel(kind) {
  return NOTICE_KINDS.find((k) => k.kind === kind)?.label ?? "Notice";
}
