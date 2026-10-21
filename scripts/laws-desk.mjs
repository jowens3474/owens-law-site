#!/usr/bin/env node
// What Passed desk: drafts one plain-language law explainer and publishes it
// to lib/laws.ts (see /laws on the site).
//
// Usage:
//   BILL="SB 2588" node scripts/laws-desk.mjs
//   BILL="HB 1662" SOURCES="https://a|https://b" NOTES="hint" node scripts/laws-desk.mjs
//   node scripts/laws-desk.mjs            # next entry from data/laws-queue.json
//
// Requires DEEPSEEK_API_KEY. Web search uses TAVILY_API_KEY, then
// BRAVE_API_KEY, then DuckDuckGo with no key. DRY_RUN=1 writes the entry
// without committing. A queue entry that fails three runs is dropped so it
// cannot block the rest of the queue.
//
// A draft that fails validation gets one revision before it is rejected: the
// model is shown each failed rule with the numbers measured on its draft and
// sends one corrected publish_law call, checked by the same validator. If that
// fails too, the queue item moves to the back as before.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import OpenAI from "openai";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { webSearch } from "./lib/search.mjs";
import { pingIndexNow } from "./lib/indexnow.mjs";
import { MISSION_PROMPT } from "./lib/mission.mjs";
import { wellFormedMessages } from "./lib/well-formed-messages.mjs";

const LAWS_FILE = "lib/laws.ts";
const QUEUE_FILE = "data/laws-queue.json";
const MAX_ITERATIONS = 14;
// The revision pass may spend up to this many model turns getting one usable
// publish_law call (a declined search or a broken call uses a turn). Only one
// revised entry is ever checked.
const MAX_REVISION_TURNS = 3;
const MAX_QUEUE_ATTEMPTS = 3;
const SITE = "https://www.thejacksonwire.com";
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.DRY_RUN ?? "");

// Must match LAW_TOPICS in lib/laws.ts. The tsc gate before publishing
// catches drift: an off-list topic fails the type check and is not pushed.
const TOPICS = [
  "Taxes and budget",
  "Schools",
  "Health care",
  "Public safety",
  "Elections",
  "Business and jobs",
  "Housing and property",
  "Courts and families",
  "Local government",
  "Environment and outdoors",
  "Technology",
  "Transportation",
];
const BECAME_LAW = ["signed", "without signature", "veto overridden"];

const SYSTEM_PROMPT = `You are the research-desk writer for What Passed, the plain-language law section of The Jackson Wire (thejacksonwire.com), an independent business and economics news site in Jackson, Mississippi.

Your job: explain one Mississippi law so that a bright 12-year-old could follow it and an adult would still learn something. What it does, why it happened, what is behind it (who pushed, who fought, the politics and the money), what it costs and who pays, what changes for an ordinary household, what it means for Jackson, and what to watch for next. Readers come here to keep up without reading the bill or connecting the dots alone.

${MISSION_PROMPT}

RESEARCH
1. Read every source you were given first (fetch_url). Then web_search for the rest: the bill's own page or text (try "<bill> Mississippi 2026", policyrisk.com, fastdemocracy.com, billtrack50.com; the Legislature's billstatus site, legiplex.com and LegiScan refuse automated readers, so do not spend more than one try on them), the fiscal note or Legislative Budget Office estimate, the governor's action (governorreeves.ms.gov), and at least two news reports (Mississippi Today, Magnolia Tribune, Mississippi Free Press, WLBT, WLOX, WJTV, SuperTalk, Clarion Ledger, MPB, the Mississippi Independent). When a site refuses the connection, look for the same story on a syndication copy (desotocountynews.com, tippahnews.com, ourtupelo.com, starherald.net, sctonline.net).
2. Pin down: the bill number, what it changes in current law, the vote counts, the sponsor, who supported and who opposed and why, the dollar amounts (cost to the state, cost or savings to a household, fees, penalties), the effective date, the governor's action and its date, and any lawsuit.
3. Never invent a number, a name, a vote, a date, a hometown or a quote. Use only facts that appear in pages you fetched with fetch_url, and list every page you relied on in sources. If you cannot find something, say the Wire could not find it. A wrong fact is worse than a missing one.
4. If your research shows the bill did not become law (vetoed and not overridden, died in committee, or never passed), call report_not_law instead of publish_law.

WRITING RULES
- Reading level: a bright 12-year-old. Short sentences, most under 20 words and none over 40. One idea per sentence. No jargon without a one-line definition in the same sentence or the next ("A fiscal note is the Legislature's own estimate of what a bill will cost."). Define PERS, conference committee, appropriation, misdemeanor, felony and similar terms on first use.
- Concrete over abstract: "a family earning $50,000" beats "taxpayers"; "about $8 a month" beats "a modest increase".
- Say who: name the sponsor, the committee, the groups for and against, the governor.
- Be fair: give the strongest version of each side in a sentence or two, then the facts that test them.
- Your own inference or prediction is allowed only in a sentence that begins "The Wire's read:" and only where the facts support it.
- Scope every negative: "the Wire found no..." or "the Wire could not find..." rather than "there is no...".
- Attribute each fact in-line once ("according to the bill", "the Legislative Budget Office estimated", "WLBT reported").
- No em dashes or en dashes anywhere. Write ranges as "5 to 15 years" and "2012 to 2021". Use commas, periods, or colons. Straight quotes are fine; the site converts them.
- Dates as "March 16, 2026". Money as "$2,000" or "$1.2 million". Percentages as "12%".
- No markdown, no bullet characters, no headings inside paragraphs. Paragraphs are 1 to 4 sentences.

STRUCTURE (each section is an array of 1 to 3 short paragraphs)
- slug: 3 to 10 lowercase words joined by hyphens that say what the law does.
- title: a plain headline under 90 characters that says what the law does, with no bill number.
- oneSentence: the whole law in exactly one sentence of 8 to 30 words, no bill number. The desk counts words as the pieces of text separated by spaces, so "$2,000" is one word, "5 to 15 years" is four words, and "Sen. Hill" is two words. Aim for 20 to 25 words, count them before you submit, and cut it if the count is over 30: the desk rejects 31 words.
- whatItDoes: the rule change in plain words. Start with the single biggest change. Say what the old rule was, if a source says.
- whyItHappened: the problem or event that prompted it, with a number if there is one.
- whatsBehindIt: who pushed it, who fought it, the politics and money behind each side, how the vote went.
- whatItCosts: what it costs the state (the fiscal note if there is one), what it costs or saves a household or a business, who pays. If no one has published a cost, say so.
- whatChangesForYou: what a reader will actually notice, with examples, and, only where a source says so, what they can do: a deadline to meet, a right they have, or how to check their status.
- jackson: only if a source says something specific to Jackson or Hinds County; otherwise an empty array.
- watchFor: dates, deadlines, lawsuits, agencies writing rules, the next session.
- sources: every page you used, each with a name and the exact URL you fetched. Put the most official one first.
- note: a reporting note in the Wire's voice, without a label: what was read, what could not be read, where sources disagree, what the Wire did not do (for example, it did not contact the sponsor).

LENGTH (the desk counts words and rejects an entry outside its limits)
- Target about 600 to 700 words in all. The range is 450 to 800 words, and the desk rejects anything over 850 or under 420, so aim for the middle of the range and not for the ceiling. The mission does not raise this limit: cut background to fit a reader step.
- The count is oneSentence plus every paragraph of whatItDoes, whyItHappened, whatsBehindIt, whatItCosts, whatChangesForYou, jackson and watchFor. The title, sources and note are not counted.
- Plan about 100 words each for whatItDoes, whyItHappened, whatsBehindIt, whatItCosts, whatChangesForYou and watchFor, and under 60 for jackson. Add up your total before you submit. If it is over 700, cut.
- Cut background first: history, earlier versions of the bill, procedure (committee stages, readings), side details, a second example where one will do. Cut reader-facing facts last: what the law does, the amounts, the dates, who pays, and what changes for a household; keep the sponsor and the vote count.

Call publish_law exactly once, when the research is done.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for news and documents. Returns 5 result snippets with titles, URLs, and excerpts. Use several distinct queries.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Specific search query." } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Fetch the text of a public web page or PDF (news reports, bill trackers, fiscal notes, agency pages). Find the URL with web_search first. Only pages fetched with this tool may be listed as sources.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "Absolute https URL." } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "report_not_law",
      description:
        "Report that the bill did not become law (vetoed without an override, died, or never passed), with the evidence. Nothing is published.",
      parameters: {
        type: "object",
        properties: { reason: { type: "string", description: "One or two sentences with the source." } },
        required: ["reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_law",
      description: "Submit the finished entry for publication. Call exactly once, after research is complete. Aim for about 600 to 700 words in all (the desk rejects more than 850).",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: { type: "string", description: "3 to 10 lowercase words joined by hyphens, e.g. 'voter-citizenship-checks-shield-act'." },
          bill: { type: "string", description: 'Bill number like "SB 2588".' },
          title: { type: "string", description: "Plain headline under 90 characters, no bill number." },
          officialTitle: { type: "string", description: 'Short title as enacted if it has one (e.g. "SHIELD Act"), else empty string.' },
          session: { type: "string", description: 'e.g. "2026 Regular Session".' },
          becameLaw: { type: "string", enum: BECAME_LAW },
          signedOn: { type: "string", description: "ISO date (yyyy-mm-dd) of the governor's action, or empty string if not found." },
          effective: { type: "string", description: "ISO date (yyyy-mm-dd) the law takes effect." },
          effectiveNote: { type: "string", description: "One short sentence if parts start on other dates, else empty string." },
          topics: { type: "array", items: { type: "string", enum: TOPICS }, minItems: 1, maxItems: 3 },
          oneSentence: { type: "string", description: "Exactly one sentence of 8 to 30 words, counted as words separated by spaces. No bill number." },
          whatItDoes: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          whyItHappened: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          whatsBehindIt: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          whatItCosts: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          whatChangesForYou: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          jackson: { type: "array", items: { type: "string" }, maxItems: 3 },
          watchFor: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          sources: {
            type: "array",
            minItems: 2,
            items: {
              type: "object",
              properties: { name: { type: "string" }, url: { type: "string" } },
              required: ["name", "url"],
            },
          },
          note: { type: "string" },
        },
        required: [
          "slug", "bill", "title", "session", "becameLaw", "effective", "topics",
          "oneSentence", "whatItDoes", "whyItHappened", "whatsBehindIt",
          "whatItCosts", "whatChangesForYou", "watchFor", "sources", "note",
        ],
      },
    },
  },
];

function todayLocalIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}

const HAS_DASH = /[–—]/;
// Ranges first ("5–15" becomes "5 to 15", "$5–$10" becomes "$5 to $10"), then
// any dash left over becomes a comma.
function stripDashes(s) {
  return s
    .replace(/(\d)\s*[–—]\s*(\$?\d)/g, "$1 to $2")
    .replace(/\s*[–—]\s*/g, ", ");
}

function normalizeUrl(u) {
  try {
    const x = new URL(u);
    x.hash = "";
    return (x.origin + x.pathname.replace(/\/+$/, "") + x.search).toLowerCase();
  } catch {
    return String(u).trim().toLowerCase();
  }
}

const PARAGRAPH_FIELDS = ["whatItDoes", "whyItHappened", "whatsBehindIt", "whatItCosts", "whatChangesForYou", "watchFor"];

// Split prose into sentences without breaking at titles, months and
// initials ("Sen. Hill", "Oct. 1", "U.S.", "p.m.").
const ABBREVIATIONS = /\b(Sen|Rep|Gov|Dr|Mr|Mrs|Ms|Lt|Gen|Col|St|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec|No|vs|etc|Inc|Co|Corp|U\.S|a\.m|p\.m)\./g;
function splitSentences(p) {
  const guarded = p.replace(ABBREVIATIONS, (m) => m.replace(/\./g, "\u0001"));
  return guarded
    .split(/(?<=[.!?]['"]?)\s+(?=['"]?[A-Z$0-9])/)
    .map((x) => x.replace(/\u0001/g, "."))
    .filter(Boolean);
}

function wordCount(law) {
  const parts = [law.oneSentence, ...PARAGRAPH_FIELDS.flatMap((k) => law[k] ?? []), ...(law.jackson ?? [])];
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

// Returns a list of problems; an empty list means the entry can publish.
// Everything here is a hard rule: nothing publishes with a problem left.
// Its numbers are mirrored in LIMITS for the revision feedback; change both together.
function validate(law, lawsSource, fetched) {
  const errors = [];
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const str = (v) => typeof v === "string" ? v.trim() : "";
  if (!/^[a-z0-9]+(-[a-z0-9]+){2,9}$/.test(str(law.slug))) errors.push("slug must be 3 to 10 lowercase words joined by hyphens");
  if (lawsSource.includes(`slug: ${JSON.stringify(law.slug)}`)) errors.push(`slug "${law.slug}" already exists`);
  if (!/^(HB|SB|HC|SC) \d{1,4}$/.test(str(law.bill))) errors.push('bill must look like "SB 2588"');
  if (lawsSource.includes(`bill: ${JSON.stringify(law.bill)}`)) errors.push(`${law.bill} is already explained on the site`);
  if (!str(law.title) || law.title.length > 90) errors.push("title must be present and under 90 characters");
  if (/\b(HB|SB|HC|SC)\s?\d/i.test(str(law.title))) errors.push("title must not contain the bill number");
  if (!str(law.session)) errors.push("session is required");
  if (!BECAME_LAW.includes(law.becameLaw)) errors.push(`becameLaw must be one of: ${BECAME_LAW.join(", ")}`);
  if (!iso.test(str(law.effective))) errors.push("effective must be an ISO date");
  if (str(law.signedOn) && !iso.test(law.signedOn)) errors.push("signedOn must be an ISO date or empty");
  if (!Array.isArray(law.topics) || law.topics.length < 1 || law.topics.length > 3 || law.topics.some((t) => !TOPICS.includes(t))) {
    errors.push(`topics must be 1 to 3 of: ${TOPICS.join(", ")}`);
  }
  const oneWords = str(law.oneSentence).split(/\s+/).filter(Boolean).length;
  if (oneWords < 8 || oneWords > 30) errors.push("oneSentence must be one sentence of 8 to 30 words");
  if (/\b(HB|SB|HC|SC)\s?\d/i.test(str(law.oneSentence))) errors.push("oneSentence must not contain the bill number");
  for (const key of PARAGRAPH_FIELDS) {
    const v = law[key];
    if (!Array.isArray(v) || v.length < 1 || v.length > 3 || v.some((p) => typeof p !== "string" || p.trim().length < 40)) {
      errors.push(`${key} must be 1 to 3 paragraphs of real sentences`);
    }
  }
  if (law.jackson !== undefined && (!Array.isArray(law.jackson) || law.jackson.length > 3 || law.jackson.some((p) => typeof p !== "string"))) {
    errors.push("jackson must be 0 to 3 paragraphs");
  }
  if (!str(law.note) || law.note.trim().length < 60) errors.push("note must say what was read and not read");
  if (!Array.isArray(law.sources) || law.sources.length < 2 || law.sources.some((s) => !/^https?:\/\//.test(str(s?.url)) || !str(s?.name))) {
    errors.push("sources must list at least two entries with a name and an http(s) url");
  } else {
    const unread = law.sources.filter((s) => !fetched.has(normalizeUrl(s.url)));
    if (unread.length) errors.push(`sources not fetched with fetch_url, so they cannot be listed: ${unread.map((s) => s.url).join(", ")}`);
    const read = law.sources.length - unread.length;
    if (read < 2) errors.push("at least two listed sources must be pages you fetched");
  }
  const words = wordCount(law);
  if (words < 420) errors.push(`entry is too short (${words} words; aim for 450 to 800)`);
  if (words > 850) errors.push(`entry is too long (${words} words; aim for 450 to 800)`);
  for (const key of [...PARAGRAPH_FIELDS, "jackson"]) {
    for (const p of law[key] ?? []) {
      if (typeof p !== "string") continue;
      const sentences = splitSentences(p);
      if (sentences.length > 4) errors.push(`${key}: a paragraph has ${sentences.length} sentences (limit 4)`);
      const long = sentences.find((x) => x.split(/\s+/).length > 40);
      if (long) errors.push(`${key}: a sentence runs over 40 words ("${long.slice(0, 50)}...")`);
    }
  }
  const allText = JSON.stringify(law);
  if (/[*#`]{2}|\n- /.test(allText)) errors.push("no markdown in the text");
  if (HAS_DASH.test(allText)) errors.push("no em or en dashes; write ranges as '5 to 15'");
  return errors;
}

// The revision pass. When the first draft fails validate(), the model gets one
// message that lists each failed rule with the numbers measured on its draft,
// and one chance to send a corrected publish_law call. validate() stays the
// only judge of what publishes; nothing here loosens it.

// The numbers quoted back to the model. The limits mirror the ones inside
// validate(), so change them together. The aim figures (aimMinWords,
// aimMaxWords, aimWords, oneSentenceAim) are targets from the prompt, not
// limits that validate() enforces.
const LIMITS = {
  minWords: 420,
  aimMinWords: 450,
  aimMaxWords: 800,
  maxWords: 850,
  aimWords: 700,
  oneSentenceMin: 8,
  oneSentenceMax: 30,
  oneSentenceAim: 25,
  paragraphSentences: 4,
  sentenceWords: 40,
  titleChars: 90,
  paragraphChars: 40,
  noteChars: 60,
};

const textWords = (s) => (typeof s === "string" ? s : "").split(/\s+/).filter(Boolean).length;
const fmt = (n) => n.toLocaleString("en-US");
const opener = (s) => `"${s.trim().slice(0, 40)}..."`;

// Every paragraph of every body section, numbered the way a reader counts them.
function bodyParagraphs(law) {
  return [...PARAGRAPH_FIELDS, "jackson"].flatMap((key) =>
    (Array.isArray(law[key]) ? law[key] : []).flatMap((text, i) =>
      typeof text === "string" ? [{ key, number: i + 1, text }] : [],
    ),
  );
}

// "oneSentence 24, whatItDoes 190, ...": the same text wordCount() adds up.
function wordsBySection(law) {
  return ["oneSentence", ...PARAGRAPH_FIELDS, "jackson"]
    .map((key) => [key, [law[key]].flat().reduce((sum, p) => sum + textWords(p), 0)])
    .filter(([key, n]) => key !== "jackson" || n > 0)
    .map(([key, n]) => `${key} ${n}`)
    .join(", ");
}

// One entry per validator rule that has a number worth measuring, matched on
// the validator's own message. A "scan" rule reports every paragraph at fault
// in one pass, however often the validator repeated itself. A problem that
// matches no rule here goes through in the validator's own words.
const FEEDBACK_RULES = [
  {
    match: /^entry is too (long|short) /,
    lines: (law, error) => {
      const total = wordCount(law);
      const now = `Words now (the title, sources and note are not counted): ${wordsBySection(law)}.`;
      const aim = `aim for ${LIMITS.aimMinWords} to ${LIMITS.aimMaxWords}`;
      return error.startsWith("entry is too long")
        ? `Total words ${fmt(total)}, limit ${LIMITS.maxWords} (${aim}): cut ${fmt(total - LIMITS.aimMaxWords)} or more words, to reach ${LIMITS.aimMaxWords}, mostly background. Aim for about ${LIMITS.aimWords} so a small miscount does not fail it again. ${now}`
        : `Total words ${fmt(total)}, minimum ${LIMITS.minWords} (${aim}): add ${fmt(LIMITS.aimMinWords - total)} or more words, using only facts from pages you fetched. ${now}`;
    },
  },
  {
    match: /^oneSentence must be one sentence of /,
    lines: (law) => {
      const text = typeof law.oneSentence === "string" ? law.oneSentence.trim() : "";
      const n = textWords(text);
      const sentences = splitSentences(text).length;
      const size = n > LIMITS.oneSentenceMax
        ? `limit ${LIMITS.oneSentenceMax}: cut ${n - LIMITS.oneSentenceMax} or more words. Aim for ${LIMITS.oneSentenceAim} or fewer so a miscount does not fail it again`
        : `minimum ${LIMITS.oneSentenceMin}: add ${LIMITS.oneSentenceMin - n} or more words`;
      const several = sentences > 1 ? ` It reads as ${sentences} sentences now.` : "";
      return `oneSentence is ${n} words, ${size}. It must be one sentence of ${LIMITS.oneSentenceMin} to ${LIMITS.oneSentenceMax} words, counted as words separated by spaces.${several}`;
    },
  },
  {
    match: /: a paragraph has \d+ sentences/,
    scan: true,
    lines: (law) =>
      bodyParagraphs(law).flatMap(({ key, number, text }) => {
        const n = splitSentences(text).length;
        return n > LIMITS.paragraphSentences
          ? [`${key} paragraph ${number} has ${n} sentences, limit ${LIMITS.paragraphSentences} (it starts ${opener(text)}): cut ${n - LIMITS.paragraphSentences} or more sentences.`]
          : [];
      }),
  },
  {
    match: /: a sentence runs over \d+ words/,
    scan: true,
    lines: (law) =>
      bodyParagraphs(law).flatMap(({ key, number, text }) =>
        splitSentences(text)
          .map((s) => ({ s, n: s.split(/\s+/).length }))
          .filter(({ n }) => n > LIMITS.sentenceWords)
          .map(({ s, n }) => `${key} paragraph ${number} has a sentence of ${n} words, limit ${LIMITS.sentenceWords} (it starts ${opener(s)}): split it in two or cut it to ${LIMITS.sentenceWords} words or fewer.`),
      ),
  },
  {
    match: /^title must be present and under /,
    lines: (law) => {
      const n = typeof law.title === "string" ? law.title.trim().length : 0;
      return n === 0
        ? `title is missing: write a plain headline under ${LIMITS.titleChars} characters.`
        : `title is ${n} characters, limit ${LIMITS.titleChars}: cut ${n - LIMITS.titleChars} or more.`;
    },
  },
  {
    match: /^(\w+) must be 1 to 3 paragraphs of real sentences$/,
    lines: (law, error) => {
      const key = error.split(" ")[0];
      const v = law[key];
      if (!Array.isArray(v)) return `${error} (${key} was not a list of paragraphs).`;
      const weak = v.flatMap((p, i) => (typeof p === "string" && p.trim().length >= LIMITS.paragraphChars ? [] : [`paragraph ${i + 1}`]));
      return `${error} (it has ${v.length} paragraphs${weak.length ? `; under ${LIMITS.paragraphChars} characters or not text: ${weak.join(", ")}` : ""}).`;
    },
  },
  {
    match: /^note must say /,
    lines: (law) => {
      const n = typeof law.note === "string" ? law.note.trim().length : 0;
      return `note is ${n} characters, minimum ${LIMITS.noteChars}: say what was read, what could not be read and what the Wire did not do.`;
    },
  },
];

// The failed rules as lines of text, in the validator's order.
function failedRuleLines(law, errors) {
  const lines = [];
  const scanned = new Set();
  for (const error of errors) {
    const rule = FEEDBACK_RULES.find((r) => r.match.test(error));
    if (!rule) {
      lines.push(error);
      continue;
    }
    if (rule.scan) {
      if (scanned.has(rule)) continue;
      scanned.add(rule);
    }
    const out = [rule.lines(law, error)].flat();
    lines.push(...(out.length ? out : [error]));
  }
  return lines;
}

const REVISION_TERMS = [
  "You get one revision. Send one corrected publish_law call now: the whole entry again, with every rule above fixed.",
  "Keep the facts that are already right. Add no fact that is not in a page you fetched, and list only sources you already fetched.",
  "When you cut, cut background first: history, earlier versions of the bill, procedure (committee stages, readings), side details. Keep what a reader can use: what the law does, the amounts, the dates, who pays, and what changes for a household; keep the sponsor and the vote count.",
  "Do not call web_search or fetch_url. Research is closed for this step, and any such call is declined.",
  "The corrected entry goes through the same rules. If it fails again, the bill goes to the back of the queue.",
];

// Turns the validator's list of problems into the follow-up message for the
// revision pass. No problems, no message.
function revisionFeedback(law, errors) {
  if (!errors.length) return "";
  let lines;
  try {
    lines = failedRuleLines(law, errors);
  } catch {
    lines = errors; // measuring the draft must never block the revision itself
  }
  return [
    "Not published. The desk checked your draft against its rules. These failed, with the numbers measured on your draft:",
    ...lines.map((line, i) => `${i + 1}. ${line}`),
    "",
    ...REVISION_TERMS,
  ].join("\n");
}

function readQueue() {
  try {
    return JSON.parse(readFileSync(QUEUE_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + "\n");
}

function pickFromQueue(lawsSource) {
  const queue = readQueue();
  const idx = queue.findIndex((q) => !q.bill || !lawsSource.includes(`bill: ${JSON.stringify(q.bill)}`));
  if (idx === -1) return null;
  return { entry: queue[idx], idx, queue };
}

function gitCommit(files, message) {
  execSync('git config user.name "Jackson Wire Autopilot"', { stdio: "inherit" });
  execSync('git config user.email "autopilot@thejacksonwire.com"', { stdio: "inherit" });
  execSync(`git add ${files.join(" ")}`, { stdio: "inherit" });
  execSync("git commit -F -", { input: message, stdio: ["pipe", "inherit", "inherit"] });
  execSync("git push origin HEAD:main", { stdio: "inherit" });
}

// After a failed run, move the queue item back (or drop it after enough
// tries) and commit, so one stubborn bill never blocks the rest.
function retireQueueItem(queuePick, why, { drop = false } = {}) {
  if (!queuePick) return;
  const { queue, idx } = queuePick;
  const [item] = queue.splice(idx, 1);
  const attempts = (item.attempts ?? 0) + 1;
  let message;
  if (drop || attempts >= MAX_QUEUE_ATTEMPTS) {
    message = `Laws desk: dropped ${item.bill || "an unnumbered item"} from the queue (${why})`;
  } else {
    queue.push({ ...item, attempts, lastError: why.slice(0, 200) });
    message = `Laws desk: ${item.bill || "an unnumbered item"} moved to the back of the queue (${why.slice(0, 80)})`;
  }
  writeQueue(queue);
  console.log(`[laws-desk] ${message}`);
  if (!DRY_RUN) gitCommit([QUEUE_FILE], message);
}

function toTs(law, today) {
  const str = (s) => JSON.stringify(s);
  const arr = (a, indent) => `[\n${a.map((p) => `${indent}  ${str(p)},`).join("\n")}\n${indent}]`;
  const lines = [
    `  {`,
    `    slug: ${str(law.slug)},`,
    `    bill: ${str(law.bill)},`,
    `    title: ${str(law.title)},`,
  ];
  if (law.officialTitle) lines.push(`    officialTitle: ${str(law.officialTitle)},`);
  lines.push(`    session: ${str(law.session)},`);
  lines.push(`    becameLaw: ${str(law.becameLaw)},`);
  if (law.signedOn) lines.push(`    signedOn: ${str(law.signedOn)},`);
  lines.push(`    effective: ${str(law.effective)},`);
  if (law.effectiveNote) lines.push(`    effectiveNote: ${str(law.effectiveNote)},`);
  lines.push(`    topics: ${str(law.topics)},`);
  lines.push(`    oneSentence: ${str(law.oneSentence)},`);
  for (const key of ["whatItDoes", "whyItHappened", "whatsBehindIt", "whatItCosts", "whatChangesForYou"]) {
    lines.push(`    ${key}: ${arr(law[key], "    ")},`);
  }
  if (law.jackson?.length) lines.push(`    jackson: ${arr(law.jackson, "    ")},`);
  lines.push(`    watchFor: ${arr(law.watchFor, "    ")},`);
  lines.push(`    sources: [`);
  for (const s of law.sources) lines.push(`      { name: ${str(s.name)}, url: ${str(s.url)} },`);
  lines.push(`    ],`);
  lines.push(`    author: "Jackson Wire Staff",`);
  lines.push(`    date: ${str(today)},`);
  lines.push(`    note: ${str(law.note)},`);
  lines.push(`  },`);
  return lines.join("\n") + "\n";
}

function cleanArgs(args) {
  const out = { ...args };
  for (const key of Object.keys(out)) {
    if (typeof out[key] === "string") out[key] = stripDashes(out[key]).trim();
    if (Array.isArray(out[key]) && key !== "sources" && key !== "topics") {
      out[key] = out[key].map((p) => (typeof p === "string" ? stripDashes(p).trim() : p));
    }
  }
  if (Array.isArray(out.sources)) {
    out.sources = out.sources.map((s) => ({ name: stripDashes(String(s?.name ?? "")).trim(), url: String(s?.url ?? "").trim() }));
  }
  if (typeof out.note === "string") out.note = out.note.replace(/^reporting note:\s*/i, "");
  return out;
}

// One model turn. With forcePublish the only call the model may make is publish_law.
function askModel(client, messages, forcePublish) {
  return client.chat.completions.create({
    model: "deepseek-chat",
    messages: wellFormedMessages(messages),
    tools: TOOLS,
    tool_choice: forcePublish ? { type: "function", function: { name: "publish_law" } } : "auto",
    temperature: 0.3,
    max_tokens: 8000,
  });
}

const REVISION_REMINDER = "Call publish_law now with the corrected entry. Research is closed for this step.";

// The one revision pass. The first draft failed validate(). The model gets each
// failed rule with the numbers measured on that draft, in the same conversation,
// and one corrected publish_law call, which goes through the same validate()
// with the same list of fetched pages. Research is closed: any other tool call
// is declined. Returns { law, errors }: law is the corrected entry if it
// passed, errors is what the second validation found if it did not (empty when
// the model never produced a call to check, or the call failed).
async function reviseDraft(client, messages, rejected, lawsSource, fetched) {
  const request = revisionFeedback(rejected.candidate, rejected.errors);
  console.log(`[laws-desk] revision request sent to the model:\n${request}`);
  messages.push({ role: "user", content: request });

  for (let turn = 1; turn <= MAX_REVISION_TURNS; turn++) {
    let msg;
    try {
      const response = await askModel(client, messages, true);
      msg = response.choices[0].message;
      console.log(`[laws-desk] revision turn ${turn}: finish=${response.choices[0].finish_reason}, tool_calls=${msg.tool_calls?.length ?? 0}`);
    } catch (e) {
      // A failed revision call must not leave the bill stuck at the front of the queue.
      console.error(`[laws-desk] revision call failed: ${e?.message || e}`);
      return { law: null, errors: [] };
    }
    messages.push(msg);
    if (!msg.tool_calls?.length) {
      messages.push({ role: "user", content: REVISION_REMINDER });
      continue;
    }

    let candidate = null;
    for (const tc of msg.tool_calls) {
      if (tc.function.name !== "publish_law") {
        console.log(`[laws-desk] revision: declined ${tc.function.name}; research is closed`);
        messages.push({ role: "tool", tool_call_id: tc.id, content: `Declined. ${REVISION_REMINDER}` });
        continue;
      }
      let args;
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch {
        messages.push({ role: "tool", tool_call_id: tc.id, content: "Arguments were not valid JSON. Retry with valid JSON." });
        continue;
      }
      if (candidate) {
        messages.push({ role: "tool", tool_call_id: tc.id, content: "Declined. Only the first corrected call is checked." });
        continue;
      }
      candidate = cleanArgs(args);
      messages.push({ role: "tool", tool_call_id: tc.id, content: "Received." });
    }
    if (!candidate) continue;

    const errors = validate(candidate, lawsSource, fetched);
    if (errors.length) {
      console.log(`[laws-desk] validation 2 (revision): publish_law rejected: ${errors.join("; ")}`);
      return { law: null, errors };
    }
    console.log("[laws-desk] validation 2 (revision): passed");
    return { law: candidate, errors: [] };
  }
  console.log(`[laws-desk] revision: no usable publish_law call in ${MAX_REVISION_TURNS} turns.`);
  return { law: null, errors: [] };
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");

  const lawsSource = readFileSync(LAWS_FILE, "utf8");
  let bill = (process.env.BILL ?? "").trim();
  let sources = (process.env.SOURCES ?? "").split("|").map((s) => s.trim()).filter(Boolean);
  let notes = (process.env.NOTES ?? "").trim();
  let queuePick = null;

  if (!bill && !notes) {
    queuePick = pickFromQueue(lawsSource);
    if (!queuePick) {
      console.log("[laws-desk] Nothing to do: no BILL given and the queue is empty or fully covered.");
      return;
    }
    bill = queuePick.entry.bill ?? "";
    notes = queuePick.entry.hint ?? "";
    sources = Array.isArray(queuePick.entry.sources) ? queuePick.entry.sources : [];
    console.log(`[laws-desk] Queue pick: ${bill || "(no bill number)"}: ${notes.slice(0, 80)}`);
  }
  if (bill && lawsSource.includes(`bill: ${JSON.stringify(bill)}`)) {
    console.log(`[laws-desk] ${bill} is already on the site.`);
    if (queuePick) retireQueueItem(queuePick, "already on the site", { drop: true });
    return;
  }

  const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" });
  const today = todayLocalIso();
  const task = [
    `Today is ${today}.`,
    bill
      ? `Explain Mississippi bill ${bill} (2026 Regular Session unless the sources say otherwise).`
      : "Explain the Mississippi law described in the notes below; find its bill number first.",
    notes ? `Notes from the editor: ${notes}` : "",
    sources.length ? `Read these sources first, in order:\n${sources.map((s) => `- ${s}`).join("\n")}` : "",
    "Then research as instructed and call publish_law once, or report_not_law if it never became law.",
  ].filter(Boolean).join("\n\n");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: task },
  ];
  const fetched = new Set();
  let law = null;
  let lastErrors = [];
  let rejected = null; // the draft that failed validation, held for the one revision pass

  for (let iteration = 1; iteration <= MAX_ITERATIONS && !law && !rejected; iteration++) {
    const isFinal = iteration === MAX_ITERATIONS;
    if (isFinal) {
      messages.push({
        role: "user",
        content: "Research time is over. Using only the material gathered above, call publish_law now (or report_not_law). Where something is unknown, say the Wire could not find it.",
      });
    }
    const response = await askModel(client, messages, isFinal);
    const msg = response.choices[0].message;
    console.log(`[laws-desk] iteration ${iteration}: finish=${response.choices[0].finish_reason}, tool_calls=${msg.tool_calls?.length ?? 0}`);
    messages.push(msg);
    if (!msg.tool_calls?.length) {
      messages.push({ role: "user", content: "Keep going: use the tools to research, then call publish_law." });
      continue;
    }

    for (const tc of msg.tool_calls) {
      const name = tc.function.name;
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch {
        messages.push({ role: "tool", tool_call_id: tc.id, content: "Arguments were not valid JSON. Retry with valid JSON." });
        continue;
      }
      if (name === "web_search") {
        console.log(`[laws-desk] search: "${args.query}"`);
        try {
          messages.push({ role: "tool", tool_call_id: tc.id, content: await webSearch(args.query, { prefix: "laws-desk" }) });
        } catch (e) {
          messages.push({ role: "tool", tool_call_id: tc.id, content: `Search error: ${e.message}` });
        }
      } else if (name === "fetch_url") {
        console.log(`[laws-desk] fetch_url: ${args.url}`);
        try {
          const { contentType, text } = await fetchUrl(args.url);
          fetched.add(normalizeUrl(args.url));
          const truncated = text.length > 18000 ? text.slice(0, 18000) + "\n\n[truncated]" : text;
          messages.push({ role: "tool", tool_call_id: tc.id, content: `[${contentType}]\n${truncated}` });
        } catch (e) {
          messages.push({ role: "tool", tool_call_id: tc.id, content: `Fetch failed: ${e.message}. Try a syndication copy or another outlet.` });
        }
      } else if (name === "report_not_law") {
        console.log(`[laws-desk] Not a law: ${args.reason}`);
        retireQueueItem(queuePick, `did not become law: ${args.reason ?? ""}`, { drop: true });
        return;
      } else if (name === "publish_law") {
        const candidate = cleanArgs(args);
        const errors = validate(candidate, lawsSource, fetched);
        if (errors.length) {
          lastErrors = errors;
          rejected = { candidate, errors };
          console.log(`[laws-desk] validation 1 (first draft): publish_law rejected: ${errors.join("; ")}`);
          messages.push({ role: "tool", tool_call_id: tc.id, content: "Not published. The next message lists each rule this draft failed." });
        } else {
          law = candidate;
          console.log("[laws-desk] validation 1 (first draft): passed");
          messages.push({ role: "tool", tool_call_id: tc.id, content: "Received." });
        }
      } else {
        messages.push({ role: "tool", tool_call_id: tc.id, content: `Unknown tool ${name}.` });
      }
    }
  }

  // One revision pass, even when the first draft came on the last research
  // turn. If the corrected entry fails too, the item is rotated below as before.
  if (!law && rejected) {
    const revision = await reviseDraft(client, messages, rejected, lawsSource, fetched);
    law = revision.law;
    if (revision.errors.length) lastErrors = revision.errors;
  }

  if (!law) {
    const why = lastErrors.length ? lastErrors.join("; ") : "no publishable entry produced";
    console.error(`[laws-desk] No entry produced: ${why}`);
    retireQueueItem(queuePick, why);
    process.exit(1);
  }

  const entry = toTs(law, today);
  const updated = lawsSource.replace(/export const LAWS: Law\[\] = \[\n/, (m) => m + entry);
  if (updated === lawsSource) {
    console.error("[laws-desk] Could not find the LAWS array marker in lib/laws.ts.");
    process.exit(1);
  }
  writeFileSync(LAWS_FILE, updated);
  console.log(`[laws-desk] Drafted "${law.title}" (${law.bill}, ${wordCount(law)} words) -> /laws/${law.slug}`);

  // The type check is the last gate: a bad field never reaches main.
  try {
    execSync("npx tsc --noEmit", { stdio: "inherit" });
  } catch {
    writeFileSync(LAWS_FILE, lawsSource);
    console.error("[laws-desk] Type check failed; lib/laws.ts restored, nothing published.");
    retireQueueItem(queuePick, "entry failed the type check");
    process.exit(1);
  }

  const files = [LAWS_FILE];
  if (queuePick) {
    queuePick.queue.splice(queuePick.idx, 1);
    writeQueue(queuePick.queue);
    files.push(QUEUE_FILE);
  }

  if (DRY_RUN) {
    console.log("[laws-desk] DRY_RUN set; not committing.");
    return;
  }

  console.log("[laws-desk] Committing & pushing to main...");
  gitCommit(files, `What Passed: ${law.bill}: ${law.title}`);
  await pingIndexNow([`${SITE}/laws/${law.slug}`, `${SITE}/laws`, `${SITE}/sitemap.xml`]);
  console.log(`[laws-desk] Published ${law.bill}.`);
}

main().catch((err) => {
  console.error("[laws-desk] FAILED:", err?.message || err);
  process.exit(1);
});
