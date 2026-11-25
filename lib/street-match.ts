// Matches what a reader types into the street box on /boil-water-notices
// against the addresses in JXN Water's notices. Pure, so
// `node --test lib/street-match.test.mjs` can run it.
//
// Readers write "Englewood Boulevard", "600 Seneca Ave." or "2850 Arbor Hills
// Dr, Jackson, MS 39212" where JXN Water writes "Englewood Blvd" and
// "[524-732] Seneca Ave", so both sides are reduced to the same short forms
// before they are compared.

// Kinds of street: long and short forms map to the short one.
const TYPES: Record<string, string> = {
  avenue: "ave",
  av: "ave",
  ave: "ave",
  boulevard: "blvd",
  blvd: "blvd",
  circle: "cir",
  cir: "cir",
  court: "ct",
  ct: "ct",
  cove: "cv",
  cv: "cv",
  crossing: "xing",
  xing: "xing",
  drive: "dr",
  dr: "dr",
  extension: "ext",
  ext: "ext",
  highway: "hwy",
  hwy: "hwy",
  lane: "ln",
  ln: "ln",
  parkway: "pkwy",
  pkwy: "pkwy",
  place: "pl",
  pl: "pl",
  road: "rd",
  rd: "rd",
  square: "sq",
  sq: "sq",
  street: "st",
  st: "st",
  terrace: "ter",
  ter: "ter",
  trail: "trl",
  trl: "trl",
  way: "way",
};

const DIRECTIONS: Record<string, string> = {
  north: "n",
  n: "n",
  south: "s",
  s: "s",
  east: "e",
  e: "e",
  west: "w",
  w: "w",
  northeast: "ne",
  ne: "ne",
  northwest: "nw",
  nw: "nw",
  southeast: "se",
  se: "se",
  southwest: "sw",
  sw: "sw",
};
const DIRECTION_SET = new Set(Object.values(DIRECTIONS));

// Words that end an address but are not part of the street.
const TRAILING = new Set(["jackson", "byram", "ms", "mississippi", "usa"]);
const UNIT = new Set(["apt", "apartment", "unit", "lot", "suite", "ste"]);

// The words as typed, lowercased, with apostrophes and periods dropped.
function rawWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\bmlk\b/g, "martin luther king")
    .replace(/['’.]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const isNumber = (word: string) => /^\d+[a-z]?$/.test(word);
// A word that names a street, rather than giving its kind, direction or number.
const isName = (word: string) => !(word in TYPES) && !(word in DIRECTIONS) && !isNumber(word);

const shorten = (word: string) =>
  word === "saint" ? "st" : (TYPES[word] ?? DIRECTIONS[word] ?? word);

// "St. Andrews Drive" -> ["st", "andrews", "dr"]
export function streetWords(text: string): string[] {
  return rawWords(text).map(shorten);
}

// The street's name with its kind left off and no spaces, so "Wood Glen Dr"
// and "Woodglen" compare equal, as do "South Haven Drive" and "Southhaven Dr".
function joinedName(raw: string[]): string {
  return raw.filter((w) => !(w in TYPES)).join("");
}

export interface StreetQuery {
  // A leading house number, when the reader typed one before a street name.
  number: number | null;
  words: string[];
  // The name run together, for streets spelled as one word or two.
  joined: string;
}

export function parseStreetQuery(text: string): StreetQuery {
  // Only the street part of "2850 Arbor Hills Dr, Jackson, MS 39212".
  // "#4" is a unit, not part of the street.
  let raw = rawWords(text.split(",")[0].replace(/#\s*\w+/g, " "));
  const unit = raw.findIndex((w, i) => i > 0 && UNIT.has(w));
  if (unit !== -1) raw = raw.slice(0, unit);
  // Drop a trailing city, state or ZIP, but only while a street name is left:
  // "200 Jackson" and "200 E Mississippi" are streets, not a city and a state.
  while (
    raw.length > 1 &&
    (TRAILING.has(raw.at(-1)!) || /^39\d{3}$/.test(raw.at(-1)!)) &&
    raw.slice(0, -1).some(isName)
  ) {
    raw = raw.slice(0, -1);
  }

  // A leading number is a house number when a street follows it: a name
  // ("600 Seneca"), or two or more words ("909 North Street"). A number and
  // one kind-of-street word is a route instead: "18 Hwy" is Highway 18.
  const rest = raw.slice(1);
  if (isNumber(raw[0] ?? "") && (rest.length >= 2 || rest.some(isName))) {
    return { number: parseInt(raw[0], 10), words: rest.map(shorten), joined: joinedName(rest) };
  }
  return { number: null, words: raw.map(shorten), joined: joinedName(raw) };
}

// Does the street named in `street` answer the reader's words?
function namesStreet(query: StreetQuery, street: string): boolean {
  const raw = rawWords(street);
  const words = raw.map(shorten);
  // A street called only by direction and kind words ("North Street",
  // "Court St", "Parkway Dr") has no name to search on, so the reader's words
  // must be the listing's words exactly. Otherwise "North Street" would also
  // find N West St.
  if (!query.words.some(isName)) {
    return words.length === query.words.length && words.every((w, i) => w === query.words[i]);
  }
  const hasDirection = words.some((w) => DIRECTION_SET.has(w));
  const byWord = query.words.every((q) => {
    // A direction the reader typed must agree with the street's, but a
    // street listed without one still matches.
    if (DIRECTION_SET.has(q)) return !hasDirection || words.includes(q);
    // Short words ("st", "dr", "ct") must match whole. Longer ones may be
    // the start of a word, so "kings" finds Kingswood.
    return q.length <= 2 ? words.includes(q) : words.some((w) => w.startsWith(q));
  });
  if (byWord) {
    // "West Capitol St" finds a street listed as plain "Capitol St", but
    // "West Glen Dr" is not Wood Glen Dr: when the reader's direction is not
    // in the listing, the rest of what they typed must be the whole name.
    const dropped = !hasDirection && query.words.some((q) => DIRECTION_SET.has(q));
    if (!dropped) return true;
    const typed = query.words.filter((q) => !DIRECTION_SET.has(q));
    const whole = words
      .filter((w) => !(w in TYPES))
      .every((w) => typed.some((q) => (q.length <= 2 ? w === q : w.startsWith(q))));
    if (whole) return true;
  }
  // "Woodglen" for Wood Glen, "South Haven" for Southhaven.
  const name = joinedName(raw);
  return query.joined.length >= 5 && name === query.joined;
}

export interface MatchArea {
  text: string;
  from?: string;
  to?: string;
  street?: string;
}

// "address":      a listed range on that street includes the house number.
// "out-of-range": the street is listed, every listing of it has a range, and
//                 none includes the house number.
// "street":       the street is named and there is nothing more to say: no
//                 house number was typed, or a listing of the street has no
//                 range to compare, or only the notice's heading names it.
// null:           the notice does not name the street.
export type StreetMatch = "address" | "out-of-range" | "street" | null;

export function matchNotice(
  query: StreetQuery,
  notice: { place: string; areas: MatchArea[] },
): StreetMatch {
  if (query.words.length === 0) return null;
  let listed = false;
  let uncompared = false;
  for (const area of notice.areas) {
    if (!namesStreet(query, area.street ?? area.text)) continue;
    listed = true;
    if (query.number === null) continue;
    const a = area.from === undefined ? NaN : parseInt(area.from, 10);
    const b = area.to === undefined ? NaN : parseInt(area.to, 10);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      uncompared = true;
      continue;
    }
    if (query.number >= Math.min(a, b) && query.number <= Math.max(a, b)) return "address";
  }
  if (listed) return query.number === null || uncompared ? "street" : "out-of-range";
  return namesStreet(query, notice.place) ? "street" : null;
}
