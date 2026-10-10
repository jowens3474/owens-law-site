// Checks the short search title (seoTitle) the autopilot asks the model for.
// The article page uses it for the browser tab and search results while the
// page itself shows the full headline (see Post.seoTitle in lib/posts.ts). A
// bad one is dropped and the page falls back to the full title; it is never a
// reason to reject the article.

export const SEO_TITLE_MAX = 60;

// Figure dash, en dash, em dash, and horizontal bar (U+2012 to U+2015), built
// from their code points so this file contains none of them itself.
const DASHES = String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015);

// Returns { ok: true, value } with the whitespace tidied, or
// { ok: false, reason } when the title is missing, empty, too long, or has a
// dash in it.
export function checkSeoTitle(raw) {
  if (typeof raw !== "string") return { ok: false, reason: "missing" };
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return { ok: false, reason: "empty" };
  const length = [...value].length;
  if (length > SEO_TITLE_MAX) {
    return {
      ok: false,
      reason: `too long (${length} characters, limit ${SEO_TITLE_MAX})`,
    };
  }
  if ([...value].some((c) => DASHES.includes(c))) {
    return { ok: false, reason: "contains an em or en dash" };
  }
  return { ok: true, value };
}
