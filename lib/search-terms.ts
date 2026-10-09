// Shared by the search ranking (lib/search.ts) and the result highlighter
// (app/components/Highlight.tsx) so both agree on what a term matches.

// Lower-case and fold curly quotes to straight ones so a typed apostrophe
// matches the typographic one the site displays. Each replacement is one
// code unit for one, so offsets line up with the original text.
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Regex source for one term against norm()ed text. Words of four or more
// characters match anywhere ("water" finds "wastewater"); shorter words must
// start at a word boundary, and one- or two-character words must end at one
// too, so "ai" finds AI without lighting up "said" and "plainly".
export function termPattern(t: string): string {
  const esc = escapeRegExp(t);
  if (t.length >= 4 || !/^[a-z0-9]+$/.test(t)) return esc;
  return "(?<![a-z0-9])" + esc + (t.length <= 2 ? "(?![a-z0-9])" : "");
}
