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

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import OpenAI from "openai";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { webSearch } from "./lib/search.mjs";
import { pingIndexNow } from "./lib/indexnow.mjs";

const LAWS_FILE = "lib/laws.ts";
const QUEUE_FILE = "data/laws-queue.json";
const MAX_ITERATIONS = 14;
const MAX_QUEUE_ATTEMPTS = 3;
const SITE = "https://www.thejacksonwire.com";
const DRY_RUN = Boolean(process.env.DRY_RUN) && process.env.DRY_RUN !== "0";

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

STRUCTURE (each section is an array of 1 to 3 short paragraphs; the whole entry runs 450 to 800 words)
- slug: 3 to 10 lowercase words joined by hyphens that say what the law does.
- title: a plain headline under 90 characters that says what the law does, with no bill number.
- oneSentence: the whole law in one plain sentence under 30 words, no bill number.
- whatItDoes: the rule change in plain words. Start with the single biggest change. Say what the old rule was, if a source says.
- whyItHappened: the problem or event that prompted it, with a number if there is one.
- whatsBehindIt: who pushed it, who fought it, the politics and money behind each side, how the vote went.
- whatItCosts: what it costs the state (the fiscal note if there is one), what it costs or saves a household or a business, who pays. If no one has published a cost, say so.
- whatChangesForYou: what a reader will actually notice, with examples.
- jackson: only if a source says something specific to Jackson or Hinds County; otherwise an empty array.
- watchFor: dates, deadlines, lawsuits, agencies writing rules, the next session.
- sources: every page you used, each with a name and the exact URL you fetched. Put the most official one first.
- note: a reporting note in the Wire's voice, without a label: what was read, what could not be read, where sources disagree, what the Wire did not do (for example, it did not contact the sponsor).

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
      description: "Submit the finished entry for publication. Call exactly once, after research is complete.",
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
          oneSentence: { type: "string" },
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

function wordCount(law) {
  const parts = [law.oneSentence, ...PARAGRAPH_FIELDS.flatMap((k) => law[k] ?? []), ...(law.jackson ?? [])];
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

// Returns a list of problems; an empty list means the entry can publish.
// Everything here is a hard rule: nothing publishes with a problem left.
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
  const allText = JSON.stringify(law);
  if (/[*#`]{2}|\n- /.test(allText)) errors.push("no markdown in the text");
  if (HAS_DASH.test(allText)) errors.push("no em or en dashes; write ranges as '5 to 15'");
  return errors;
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

  for (let iteration = 1; iteration <= MAX_ITERATIONS && !law; iteration++) {
    const isFinal = iteration === MAX_ITERATIONS;
    if (isFinal) {
      messages.push({
        role: "user",
        content: "Research time is over. Using only the material gathered above, call publish_law now (or report_not_law). Where something is unknown, say the Wire could not find it.",
      });
    }
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      tools: TOOLS,
      tool_choice: isFinal ? { type: "function", function: { name: "publish_law" } } : "auto",
      temperature: 0.3,
      max_tokens: 8000,
    });
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
          console.log(`[laws-desk] publish_law rejected: ${errors.join("; ")}`);
          messages.push({ role: "tool", tool_call_id: tc.id, content: `Not published. Fix these and call publish_law again:\n- ${errors.join("\n- ")}` });
        } else {
          law = candidate;
          messages.push({ role: "tool", tool_call_id: tc.id, content: "Received." });
        }
      } else {
        messages.push({ role: "tool", tool_call_id: tc.id, content: `Unknown tool ${name}.` });
      }
    }
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
