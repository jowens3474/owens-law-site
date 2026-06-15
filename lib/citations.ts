import { type Post } from "@/lib/posts";

// Recognized outlets. Order matters for longest-match precedence.
const OUTLETS: { name: string; url?: string }[] = [
  { name: "Mississippi Today", url: "https://mississippitoday.org" },
  { name: "Mississippi Free Press", url: "https://www.mississippifreepress.org" },
  { name: "Magnolia Tribune", url: "https://magnoliatribune.com" },
  { name: "Jackson Jambalaya", url: "https://www.jacksonjambalaya.com" },
  { name: "SuperTalk Mississippi", url: "https://www.supertalk.fm" },
  { name: "Clarion-Ledger", url: "https://www.clarionledger.com" },
  { name: "The Enterprise Journal", url: "https://www.enterprise-journal.com" },
  { name: "WLBT", url: "https://www.wlbt.com" },
  { name: "WJTV", url: "https://www.wjtv.com" },
  { name: "WLOX", url: "https://www.wlox.com" },
  { name: "Sun Herald", url: "https://www.sunherald.com" },
  { name: "Northside Sun", url: "https://www.northsidesun.com" },
  { name: "court filings", url: "https://www.courtlistener.com" },
  { name: "the docket", url: "https://www.courtlistener.com" },
  { name: "the indictment" },
  { name: "AOL" },
  { name: "the U.S. Supreme Court" },
  { name: "Mississippi Public Service Commission" },
];

// Return the sources cited in this post's body, in the order they first appear,
// deduplicated. Skip if the post has explicitly suppressed it.
export function extractCitations(post: Post): { name: string; url?: string }[] {
  const text = post.body.join(" ");
  const seen = new Map<string, { name: string; url?: string }>();
  // Sort by length descending so "Mississippi Today" matches before "Mississippi"
  const sorted = [...OUTLETS].sort((a, b) => b.name.length - a.name.length);
  // Walk through the text once and find the first occurrence position of each outlet.
  const positions: { name: string; url?: string; pos: number }[] = [];
  for (const outlet of sorted) {
    const escaped = outlet.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    const m = text.match(re);
    if (m && m.index !== undefined) {
      positions.push({ name: outlet.name, url: outlet.url, pos: m.index });
    }
  }
  positions.sort((a, b) => a.pos - b.pos);
  for (const p of positions) {
    if (!seen.has(p.name)) seen.set(p.name, { name: p.name, url: p.url });
  }
  return [...seen.values()];
}
