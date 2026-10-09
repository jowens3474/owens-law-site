// Full-text search over published articles. Everything is in memory (a few
// hundred posts), so a query is a linear scan: cheap, and no index to keep
// in sync. Every term must appear somewhere in the story; matches in the
// headline count most, then the dek and tags, then the body.
import { getAllPosts, type Post } from "./posts";

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
const SNIPPET_CHARS = 220;

// Lower-case and fold curly quotes to straight ones so a typed apostrophe
// matches the typographic one the site displays. Every replacement is one
// character for one, so offsets line up with the original text.
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

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
    .map((w) => w.replace(/^[^a-z0-9$]+|[^a-z0-9%]+$/g, ""))
    .filter((w) => w.length >= 2 && (/\d/.test(w) || !STOP.has(w)));
  return [...new Set([...phrases, ...words])].slice(0, MAX_TERMS);
}

function occurrences(hay: string, needle: string, cap: number): number {
  let n = 0;
  let i = hay.indexOf(needle);
  while (i !== -1 && n < cap) {
    n++;
    i = hay.indexOf(needle, i + needle.length);
  }
  return n;
}

// The passage shown under a result: the paragraph that mentions the most
// terms, trimmed to a window around the first mention.
function makeSnippet(post: Post, body: string[], terms: string[]): string {
  let best = -1;
  let bestCount = 0;
  body.forEach((p, i) => {
    let c = 0;
    for (const t of terms) if (p.includes(t)) c++;
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
  for (const t of terms) {
    const i = lc.indexOf(t);
    if (i !== -1 && (first === -1 || i < first)) first = i;
  }
  let start = Math.max(0, first - 70);
  if (start > 0) {
    const space = para.indexOf(" ", start);
    if (space !== -1 && space - start < 25) start = space + 1;
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
    for (const t of terms) {
      let s = 0;
      if (title.includes(t)) s += 10;
      if (dek.includes(t)) s += 5;
      if (meta.includes(t)) s += 4;
      let inBody = 0;
      for (const p of body) {
        inBody += occurrences(p, t, 5 - inBody);
        if (inBody >= 5) break;
      }
      s += inBody;
      if (s === 0) {
        everyTermFound = false;
        break;
      }
      score += s;
    }
    if (!everyTermFound) continue;
    hits.push({ post, score, snippet: makeSnippet(post, body, terms) });
  }

  hits.sort(
    (a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date),
  );
  return { terms, hits: hits.slice(0, limit) };
}
