// Typographic quotes for display. Articles are written with straight quotes
// in lib/posts.ts, which is what keyboards produce; the site shows curly
// quotes so the serif body reads like print. Only quote characters change:
// nothing else in the text is touched, and anything that looks like a URL is
// left alone.
import type { Post } from "./posts";

const APOS = "’"; // ’
const LSQ = "‘"; // ‘
const RSQ = "’"; // ’
const LDQ = "“"; // “
const RDQ = "”"; // ”

function smartenWord(w: string): string {
  if (w.indexOf("'") === -1 && w.indexOf('"') === -1) return w;
  // Apostrophes inside words: don't, Wire's, O'Neal, rock'n'roll.
  w = w.replace(/([A-Za-z0-9])'(?=[A-Za-z0-9])/g, `$1${APOS}`);
  // Decades: '90s, '90's.
  w = w.replace(/^'(?=\d\d(?:s|’s)\b)/, APOS);
  // Opening quotes sit at the start of a word or after an opening bracket or
  // another opening quote. Doubles first so a "'nested' quote" resolves.
  w = w.replace(/(^|[(\[{'‘])"(?=\S)/g, `$1${LDQ}`);
  w = w.replace(/(^|[(\[{“])'(?=\S)/g, `$1${LSQ}`);
  // Everything left closes.
  return w.replace(/'/g, RSQ).replace(/"/g, RDQ);
}

export function smarten(text: string): string {
  if (!text || (text.indexOf("'") === -1 && text.indexOf('"') === -1)) {
    return text;
  }
  return text
    .split(/(\s+)/)
    .map((tok) =>
      /^\s*$/.test(tok) || tok.includes("://") || tok.startsWith("www.")
        ? tok
        : smartenWord(tok),
    )
    .join("");
}

const memo = new WeakMap<Post, Post>();

// A copy of the post with curly quotes in every reader-facing text field.
// Memoized per source object, so the work happens once per process.
export function smartenPost(post: Post): Post {
  const hit = memo.get(post);
  if (hit) return hit;
  const out: Post = {
    ...post,
    title: smarten(post.title),
    dek: smarten(post.dek),
    body: post.body.map(smarten),
  };
  if (post.note) out.note = smarten(post.note);
  if (post.imageAlt) out.imageAlt = smarten(post.imageAlt);
  if (post.timeline) {
    out.timeline = post.timeline.map((section) => ({
      ...section,
      heading: smarten(section.heading),
      entries: section.entries.map((e) => ({ ...e, text: smarten(e.text) })),
    }));
  }
  memo.set(post, out);
  return out;
}
