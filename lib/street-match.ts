// Matches what a reader types into the street box on /boil-water-notices
// against the address ranges in JXN Water's notices. Pure, so
// `node --test lib/street-match.test.mjs` can run it.
//
// Readers write "Englewood Boulevard" or "600 Seneca Ave." where JXN Water
// writes "Englewood Blvd" and "[524-732] Seneca Ave", so both sides are
// reduced to the same short forms before they are compared.

// One spelling for each street word. Long and short forms map to the short one.
const SHORT: Record<string, string> = {
  avenue: "ave",
  av: "ave",
  boulevard: "blvd",
  circle: "cir",
  court: "ct",
  cove: "cv",
  crossing: "xing",
  drive: "dr",
  extension: "ext",
  highway: "hwy",
  lane: "ln",
  parkway: "pkwy",
  place: "pl",
  road: "rd",
  saint: "st",
  square: "sq",
  street: "st",
  terrace: "ter",
  trail: "trl",
  north: "n",
  south: "s",
  east: "e",
  west: "w",
  northeast: "ne",
  northwest: "nw",
  southeast: "se",
  southwest: "sw",
};

// "St. Andrews Drive" -> ["st", "andrews", "dr"]
export function streetWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’.]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => SHORT[word] ?? word);
}

export interface StreetQuery {
  // A leading house number, when the reader typed one before a street name.
  number: number | null;
  words: string[];
}

export function parseStreetQuery(text: string): StreetQuery {
  const words = streetWords(text);
  if (words.length > 1 && /^\d+[a-z]?$/.test(words[0])) {
    return { number: parseInt(words[0], 10), words: words.slice(1) };
  }
  return { number: null, words };
}

// Every word the reader typed starts some word of the street's name.
function wordsMatch(query: string[], street: string[]): boolean {
  return query.every((q) => street.some((s) => s.startsWith(q)));
}

export interface MatchArea {
  text: string;
  from?: string;
  to?: string;
  street?: string;
}

// "address": a listed range on that street includes the house number.
// "street":  the street is named, and either no number was typed or the
//            listed range does not include it.
// null:      the notice does not name the street.
export type StreetMatch = "address" | "street" | null;

export function matchNotice(
  query: StreetQuery,
  notice: { place: string; areas: MatchArea[] },
): StreetMatch {
  if (query.words.length === 0) return null;
  let named = wordsMatch(query.words, streetWords(notice.place));
  for (const area of notice.areas) {
    if (!wordsMatch(query.words, streetWords(area.street ?? area.text))) continue;
    named = true;
    if (query.number === null || area.from === undefined || area.to === undefined) continue;
    const a = parseInt(area.from, 10);
    const b = parseInt(area.to, 10);
    if (Number.isNaN(a) || Number.isNaN(b)) continue;
    if (query.number >= Math.min(a, b) && query.number <= Math.max(a, b)) return "address";
  }
  return named ? "street" : null;
}
