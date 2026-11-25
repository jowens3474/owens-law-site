// Where the compact newsletter sign-up box goes inside a story.
//
// The box sits after the third paragraph of a story with at least six
// paragraphs. It must not split a paragraph that introduces a list from the
// list, or cut into a "First ... Second ..." run. When the third-paragraph
// slot would do that, the slot after the second paragraph is tried; when that
// would too, the story gets no mid-story box (every story still ends with the
// full sign-up block).

export const MID_SIGNUP_MIN_PARAGRAPHS = 6;
const PREFERRED_SLOTS = [3, 2];

// A paragraph that sets up what follows: it ends with a colon, or its last
// sentence is a short count such as "A few things worth noting from the call."
const COUNT_LEAD_IN =
  /\b(?:a few|several|two|three|four|five|six)\s+(?:things|reasons|ways|questions|points|takeaways|numbers|facts)\b[^.?!]*[.:]$/i;

// A paragraph that continues a numbered run begun earlier.
const CONTINUES_RUN = /^(?:First|Second|Third|Fourth|Fifth|Finally|One more)\b/;

function lastSentence(paragraph: string): string {
  const parts = paragraph.trim().split(/(?<=[.?!])\s+/);
  return parts[parts.length - 1] ?? "";
}

function splitsARun(before: string, after: string): boolean {
  const lead = before.trim();
  if (lead.endsWith(":")) return true;
  if (COUNT_LEAD_IN.test(lastSentence(lead))) return true;
  return CONTINUES_RUN.test(after.trim());
}

// Returns N when the box belongs right after the Nth paragraph (1-based), or
// null when the story should have no mid-story box.
export function midSignupAfter(body: string[]): number | null {
  if (body.length < MID_SIGNUP_MIN_PARAGRAPHS) return null;
  for (const slot of PREFERRED_SLOTS) {
    if (!splitsARun(body[slot - 1], body[slot])) return slot;
  }
  return null;
}
