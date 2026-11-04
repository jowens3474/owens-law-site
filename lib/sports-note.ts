// The attribution line under the sports headline lists. It lives in its own
// module because both the client component (app/components/SportsHeadlines)
// and the server-rendered hub use it: a "use client" module's exports reach
// server components only as client references, and lib/sports.ts is too heavy
// (it imports every post) to load in the browser.
export const HEADLINES_NOTE =
  "Headlines link to the original outlets and refresh about once an hour. The Wire did not write these stories.";
