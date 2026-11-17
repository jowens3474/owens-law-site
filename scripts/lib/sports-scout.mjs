// The sports desk's idea scout (scripts/sports-desk.mjs). Before the desk
// researches, one model call reads the day's tips (scripts/lib/sports-tips.mjs:
// Bluesky posts, the insider podcasts, Mississippi search trends) next to the
// headlines other outlets already ran, and pitches story ideas the Wire could
// have first. The desk then picks one it can verify, checks nobody has
// written it, and researches it like any other story.
//
// The scout has no tools and states no facts: its pitches carry the tips'
// claims as unconfirmed, with what the desk must confirm and where.

export const SCOUT_KINDS = ["original", "data", "explainer", "news"];
const MAX_IDEAS = 6;

export const SCOUT_SYSTEM_PROMPT = `You are the idea scout for the sports desk of The Jackson Wire, an independent news site in Jackson, Mississippi. You do not write stories. You read what people are talking about and pitch story ideas the Wire could have that other outlets do not.

THE BEAT
- Mississippi college sports. Ole Miss and Mississippi State first (football, men's and women's basketball, baseball); Southern Miss, Jackson State, Alcorn State, Mississippi Valley State, Delta State and the state's other colleges when the idea is strong.

WHAT MAKES A GOOD IDEA
- It is not already a headline in the list of what outlets have published. Original means a question, angle, development or piece of evidence those headlines do not have.
- Good kinds:
  original: a development the tips mention that no outlet in the headlines has reported (a staff firing, a recruiting flip, a facility plan), to be confirmed from official sources or a news report before anything is written.
  data: a question fans are arguing about that published numbers can settle (attendance, a defense's yards allowed over several seasons, a home record), where the school's or ESPN's official numbers state each figure.
  explainer: what a coming decision or deadline means (a coaching decision, a bowl or tournament path, a conference rule), built from official facts.
  news: the day's biggest straight news story, so the desk can weigh it against the originals.
- Prefer ideas a reader in Mississippi would want to click and could not read anywhere else today.

RULES
- Everything in the tips is unconfirmed: posts and podcasts are opinion, rumor and chatter. Pitch ideas, not facts. Never present a tip's claim as true.
- Each idea must be checkable today from pages already published: say exactly what the desk must confirm and where (the school's site, stats or box scores, the conference, the NCAA, ESPN data, published public records such as board agendas, a named news outlet). The desk only reads the web: it cannot call, email, interview, ask for comment or file a records request, so never pitch an idea that needs one.
- A data idea works only when the sources print every figure the story needs. The desk may not add, average or compare numbers itself, so pitch the figures a source states, not math to be done.
- No ideas about betting or odds, about a fan or other private person, or that rest on a single anonymous post. A sensitive incident (racism, a crime, a death) is an idea only if a news outlet has reported it, and the pitch must say which outlet to check.
- At most one idea of kind news.

OUTPUT
Reply with JSON only, no prose, in this shape:
{"ideas": [{"pitch": "one sentence: the story", "school": "Ole Miss", "sport": "football", "kind": "original", "whyNew": "what the outlets' headlines do not have", "verify": ["what to confirm and where", "..."], "tips": ["P5", "B3"]}]}
Give ${MAX_IDEAS - 1} or ${MAX_IDEAS} ideas, best first. "tips" lists the ids of the tips behind the idea (empty for news).`;

/** The scout's user message. */
export function scoutUserPrompt({ today, weekday, recentTitles = [], leads = [], pressers = [], tipsText = "" }) {
  return [
    `Today is ${today} (${weekday}, America/Chicago).`,
    "",
    "THE WIRE'S RECENT SPORTS STORIES (do not pitch these again without something new):",
    ...(recentTitles.length ? recentTitles.map((t, i) => `${i + 1}. ${t}`) : ["(none yet)"]),
    "",
    "WHAT OUTLETS HAVE ALREADY PUBLISHED (headlines, newest first):",
    ...(leads.length ? leads.map((h) => `- ${h.date.slice(0, 10)} | ${h.outlet} | ${h.title}`) : ["(the headline feeds did not load)"]),
    "",
    "RECENT PRESS CONFERENCES (the desk can read their transcripts):",
    ...(pressers.length ? pressers.map((v) => `- ${v.published.slice(0, 10)} | ${v.school} | ${v.title}`) : ["(none)"]),
    "",
    "TIPS (unconfirmed):",
    tipsText || "(no tips today)",
  ].join("\n");
}

const text = (v, max) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * The scout's reply as checked ideas. Malformed ideas are dropped; a reply
 * that is not JSON gives no ideas.
 * @returns {{ pitch: string, school: string, sport: string, kind: string, whyNew: string, verify: string[], tips: string[] }[]}
 */
export function parseScoutIdeas(content) {
  let data;
  try {
    const raw = String(content ?? "").trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const list = Array.isArray(data?.ideas) ? data.ideas : [];
  const ideas = [];
  for (const it of list) {
    const pitch = text(it?.pitch, 300);
    if (!pitch) continue;
    const kind = SCOUT_KINDS.includes(it?.kind) ? it.kind : "original";
    ideas.push({
      pitch,
      school: text(it?.school, 60),
      sport: text(it?.sport, 40),
      kind,
      whyNew: text(it?.whyNew, 300),
      verify: (Array.isArray(it?.verify) ? it.verify : []).map((v) => text(v, 200)).filter(Boolean).slice(0, 5),
      tips: (Array.isArray(it?.tips) ? it.tips : []).map((v) => text(v, 6)).filter((v) => /^[BPT]\d{1,3}$/.test(v)).slice(0, 6),
    });
    if (ideas.length >= MAX_IDEAS) break;
  }
  return ideas;
}

/**
 * The ideas as numbered lines, for the desk's prompt and the run summary.
 * `tipLabel(id)` gives a short line for a tip id (or "" to leave it out).
 */
export function formatIdeas(ideas, tipLabel = () => "") {
  return ideas.flatMap((d, i) => [
    `${i + 1}. [${d.kind}] ${d.school || "?"} ${d.sport || ""}`.trimEnd() + `: ${d.pitch}`,
    ...(d.whyNew ? [`   New: ${d.whyNew}`] : []),
    ...(d.verify.length ? [`   Confirm: ${d.verify.join("; ")}`] : []),
    ...d.tips.map((id) => tipLabel(id)).filter(Boolean).map((t) => `   Tip (unconfirmed): ${t}`),
  ]);
}

/** Short labels for tip ids, numbered the way formatTips numbers them. */
export function tipLabels({ bluesky = [], podcasts = [], trends = [] }) {
  const labels = new Map();
  bluesky.forEach((p, i) => labels.set(`B${i + 1}`, `Bluesky post by @${p.author}: ${p.text.slice(0, 160)}`));
  podcasts.forEach((p, i) => labels.set(`P${i + 1}`, `${p.show} episode "${p.title}"`));
  trends.forEach((t, i) => labels.set(`T${i + 1}`, `Mississippi search trend "${t.title}"`));
  return (id) => labels.get(id) || "";
}
