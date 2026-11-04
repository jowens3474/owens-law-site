// Lines printed around the sports headline lists. They live in their own
// module because both the client component (app/components/SportsHeadlines)
// and the server-rendered hub use them: a "use client" module's exports reach
// server components only as client references, and lib/sports.ts is too heavy
// (it imports every post) to load in the browser.
export const HEADLINES_NOTE =
  "Headlines link to the original outlets and refresh about once an hour. The Wire did not write these stories.";

export const NO_JS_NOTE = "Turn on JavaScript to see the latest headlines.";
