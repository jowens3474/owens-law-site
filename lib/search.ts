// Full-text search over published articles. Everything is in memory (a few
// hundred posts), so a query is a linear scan: cheap, and no index to keep
// in sync. Every term must appear somewhere in the story; matches in the
// headline count most, then the dek and tags, then the body.
import { getAllPosts, type Post } from "./posts";
import { norm, termPattern } from "./search-terms";

export interface SearchHit {
  post: Post;
  score: number;
  snippet: string;
}

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "did",
  "do", "does", "for", "from", "had", "has", "have", "he", "how", "if", "in",
  "into", "is", "it", "its", "me", "my", "no", "not", "of", "on", "or", "our",
  "she", "should", "so", "than", "that", "the", "their", "then", "there",
  "they", "this", "to", "up", "was", "we", "were", "what", "when", "where",
  "which", "who", "why", "will", "with", "would",
]);

const MAX_TERMS = 8;
const MAX_BODY_HITS = 5; // body mentions counted per term, so length does not dominate
const SNIPPET_CHARS = 220;
const SNIPPET_LEAD = 70; // characters shown before the first mention
const SNIPPET_NUDGE = 25; // how far the window may move to land on a word boundary

// Surrounding punctuation to strip from a typed word. Letters and digits in
// any script stay, as do a leading "$" and a trailing "%".
const EDGE_PUNCT = new RegExp("^[^\\p{L}\\p{N}$]+|[^\\p{L}\\p{N}%]+$", "gu");

// Split a query into search terms. A "quoted phrase" stays whole; other
// words lose surrounding punctuation, and very short or very common words
// are dropped. Numbers and dollar figures are kept as typed.
export function queryTerms(q: string): string[] {
  const phrases: string[] = [];
  const rest = norm(q).replace(/"([^"]{2,80})"/g, (_m, p: string) => {
    const t = p.trim().replace(/\s+/g, " ");
    if (t) phrases.push(t);
    return " ";
  });
  const words = rest
    .split(/\s+/)
    .map((w) => w.replace(EDGE_PUNCT, ""))
    .filter((w) => w.length >= 2 && (/\d/.test(w) || !STOP.has(w)));
  return [...new Set([...phrases, ...words])].slice(0, MAX_TERMS);
}

interface Matcher {
  term: string;
  once: RegExp; // test / first index
  every: RegExp; // global, for counting
}

function matchers(terms: string[]): Matcher[] {
  return terms.map((term) => {
    const src = termPattern(term);
    return { term, once: new RegExp(src), every: new RegExp(src, "g") };
  });
}

function countMatches(hay: string, re: RegExp, cap: number): number {
  let n = 0;
  re.lastIndex = 0;
  while (n < cap) {
    const m = re.exec(hay);
    if (!m) break;
    n++;
    if (m[0].length === 0) re.lastIndex++;
  }
  return n;
}

// The passage shown under a result: the paragraph that mentions the most
// terms, trimmed to a window around the first mention.
function makeSnippet(post: Post, body: string[], ms: Matcher[]): string {
  let best = -1;
  let bestCount = 0;
  body.forEach((p, i) => {
    let c = 0;
    for (const m of ms) if (m.once.test(p)) c++;
    if (c > bestCount) {
      bestCount = c;
      best = i;
    }
  });
  if (best === -1) return post.dek;

  const para = post.body[best];
  const lc = body[best];
  if (para.length <= SNIPPET_CHARS) return para;

  let first = -1;
  for (const m of ms) {
    const hit = m.once.exec(lc);
    if (hit && (first === -1 || hit.index < first)) first = hit.index;
  }
  let start = Math.max(0, first - SNIPPET_LEAD);
  if (start > 0) {
    const space = para.indexOf(" ", start);
    if (space !== -1 && space - start < SNIPPET_NUDGE) start = space + 1;
  }
  let end = Math.min(para.length, start + SNIPPET_CHARS);
  if (end < para.length) {
    const space = para.lastIndexOf(" ", end);
    if (space > start + SNIPPET_CHARS / 2) end = space;
  }
  return (
    (start > 0 ? "…" : "") +
    para.slice(start, end).trim() +
    (end < para.length ? "…" : "")
  );
}

export function searchPosts(
  q: string,
  { limit = 40 }: { limit?: number } = {},
): { terms: string[]; hits: SearchHit[] } {
  const terms = queryTerms(q);
  if (terms.length === 0) return { terms, hits: [] };
  const ms = matchers(terms);

  const hits: SearchHit[] = [];
  for (const post of getAllPosts()) {
    const title = norm(post.title);
    const dek = norm(post.dek);
    const meta = norm(
      [post.category, ...(post.categories ?? []), ...(post.tags ?? [])].join(
        " ",
      ),
    );
    const body = post.body.map(norm);

    let score = 0;
    let everyTermFound = true;
    for (const m of ms) {
      let s = 0;
      if (m.once.test(title)) s += 10;
      if (m.once.test(dek)) s += 5;
      if (m.once.test(meta)) s += 4;
      let inBody = 0;
      for (const p of body) {
        inBody += countMatches(p, m.every, MAX_BODY_HITS - inBody);
        if (inBody >= MAX_BODY_HITS) break;
      }
      s += inBody;
      if (s === 0) {
        everyTermFound = false;
        break;
      }
      score += s;
    }
    if (!everyTermFound) continue;
    hits.push({ post, score, snippet: makeSnippet(post, body, ms) });
  }

  hits.sort(
    (a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date),
  );
  return { terms, hits: hits.slice(0, limit) };
}

// Laws, searched the same way (every term must match; headline first).
import { getAllLaws, type Law } from "./laws";

export function searchLaws(
  q: string,
  { limit = 5 }: { limit?: number } = {},
): { terms: string[]; hits: Law[] } {
  const terms = queryTerms(q);
  if (terms.length === 0) return { terms, hits: [] };
  const ms = matchers(terms);
  const scored: { law: Law; score: number }[] = [];
  for (const law of getAllLaws()) {
    const head = norm(`${law.bill} ${law.title} ${law.officialTitle ?? ""}`);
    const summary = norm(`${law.oneSentence} ${law.topics.join(" ")}`);
    const body = norm(
      [
        ...law.whatItDoes,
        ...law.whyItHappened,
        ...law.whatsBehindIt,
        ...law.whatItCosts,
        ...law.whatChangesForYou,
        ...(law.jackson ?? []),
        ...law.watchFor,
      ].join(" "),
    );
    let score = 0;
    let everyTermFound = true;
    for (const m of ms) {
      let s = 0;
      if (m.once.test(head)) s += 10;
      if (m.once.test(summary)) s += 5;
      s += countMatches(body, m.every, MAX_BODY_HITS);
      if (s === 0) {
        everyTermFound = false;
        break;
      }
      score += s;
    }
    if (everyTermFound) scored.push({ law, score });
  }
  scored.sort(
    (a, b) => b.score - a.score || b.law.date.localeCompare(a.law.date),
  );
  return { terms, hits: scored.slice(0, limit).map((s) => s.law) };
}
