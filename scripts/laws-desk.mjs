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
// without committing.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import OpenAI from "openai";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { webSearch } from "./lib/search.mjs";
import { pingIndexNow } from "./lib/indexnow.mjs";

const LAWS_FILE = "lib/laws.ts";
const QUEUE_FILE = "data/laws-queue.json";
const MAX_ITERATIONS = 14;
const SITE = "https://www.thejacksonwire.com";

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

const SYSTEM_PROMPT = `You are the research-desk writer for What Passed, the plain-language law section of The Jackson Wire (thejacksonwire.com), an independent business and economics news site in Jackson, Mississippi.

Your job: explain one Mississippi law so that a bright 12-year-old could follow it and an adult would still learn something. What it does, why it happened, what is behind it (who pushed, who fought, the politics and the money), what it costs and who pays, what changes for an ordinary household, what it means for Jackson, and what to watch for next. Readers come here to keep up without reading the bill or connecting the dots alone.

RESEARCH
1. Read every source you were given first (fetch_url). Then web_search for the rest: the bill's own page or text (try "<bill> Mississippi 2026", legiplex.com, policyrisk.com, fastdemocracy.com, billtrack50.com; the Legislature's billstatus site and LegiScan refuse automated readers, so do not spend more than one try on them), the fiscal note or Legislative Budget Office estimate, the governor's action (governorreeves.ms.gov), and at least two news reports (Mississippi Today, Magnolia Tribune, Mississippi Free Press, WLBT, WLOX, WJTV, SuperTalk, Clarion Ledger, MPB, the Mississippi Independent). When a site refuses the connection, look for the same story on a syndication copy (desotocountynews.com, tippahnews.com, ourtupelo.com, starherald.net, sctonline.net).
2. Pin down: the bill number, what it changes in current law, the vote counts, the sponsor, who supported and who opposed and why, the dollar amounts (cost to the state, cost or savings to a household, fees, penalties), the effective date, the governor's action and its date, and any lawsuit.
3. Never invent a number, a name, a vote, a date, or a quote. If you cannot find something, say the Wire could not find it. A wrong fact is worse than a missing one.

WRITING RULES
- Reading level: a bright 12-year-old. Short sentences, most under 20 words. One idea per sentence. No jargon without a one-line definition in the same sentence or the next ("A fiscal note is the Legislature's own estimate of what a bill will cost.").
- Concrete over abstract: "a family earning $50,000" beats "taxpayers"; "about $8 a month" beats "a modest increase".
- Say who: name the sponsor, the committee, the groups for and against, the governor.
- Be fair: give the strongest version of each side in a sentence or two, then the facts that test them.
- Analysis is allowed only in a sentence that begins "The Wire's read:" and only where the facts support it.
- Scope every universal negative: "the Wire found no..." rather than "there is no...".
- Attribute each fact in-line once ("according to the bill", "the Legislative Budget Office estimated", "WLBT reported").
- No em dashes or en dashes anywhere. Use commas, periods, or colons. Straight quotes are fine; the site converts them.
- Dates as "March 16, 2026". Money as "$2,000" or "$1.2 million". Percentages as "12%".
- No markdown, no bullet characters, no headings inside paragraphs.

STRUCTURE (every section is an array of 1 to 3 short paragraphs of 1 to 4 sentences; the whole entry runs 450 to 800 words)
- title: a plain headline under 90 characters that says what the law does, with no bill number.
- oneSentence: the whole law in one plain sentence under 30 words, no bill number.
- whatItDoes: the rule change in plain words. Start with the single biggest change. Say what the old rule was.
- whyItHappened: the problem or event that prompted it, with a number if there is one.
- whatsBehindIt: who pushed it, who fought it, the politics and money behind each side, how the vote went.
- whatItCosts: what it costs the state (the fiscal note if there is one), what it costs or saves a household or a business, who pays. If no one has published a cost, say so.
- whatChangesForYou: what a reader will actually notice, with examples.
- jackson: only if there is something specific to Jackson or Hinds County; otherwise an empty array.
- watchFor: dates, deadlines, lawsuits, agencies writing rules, the next session.
- sources: every source you used, each with a name and the exact URL you read. Put the most official one first.
- note: a reporting note in the Wire's voice: what was read, what could not be read, what the Wire did not do (for example, it did not contact the sponsor).

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
        properties: {
          query: { type: "string", description: "Specific search query." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Fetch the text of a public web page or PDF (news reports, bill trackers, fiscal notes, agency pages). Find the URL with web_search first.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Absolute https URL." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_law",
      description:
        "Submit the finished entry for publication. Call exactly once, after research is complete.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: {
            type: "string",
            description:
              "URL slug: lowercase words and hyphens only, 3 to 8 words that say what the law does, e.g. 'voter-citizenship-checks-shield-act'.",
          },
          bill: { type: "string", description: 'Bill number like "SB 2588".' },
          title: { type: "string", description: "Plain headline under 90 characters, no bill number." },
          officialTitle: {
            type: "string",
            description: 'Short title as enacted if it has one (e.g. "SHIELD Act"), else empty string.',
          },
          session: { type: "string", description: 'e.g. "2026 Regular Session".' },
          becameLaw: {
            type: "string",
            enum: ["signed", "without signature", "veto overridden"],
          },
          signedOn: {
            type: "string",
            description: "ISO date (yyyy-mm-dd) of the governor's action, or empty string if not found.",
          },
          effective: { type: "string", description: "ISO date (yyyy-mm-dd) the law takes effect." },
          effectiveNote: {
            type: "string",
            description: "One short sentence if parts start on other dates, else empty string.",
          },
          topics: {
            type: "array",
            items: { type: "string", enum: TOPICS },
            minItems: 1,
            maxItems: 3,
          },
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
              properties: {
                name: { type: "string" },
                url: { type: "string" },
              },
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

const DASHES = /[–—]/g;
function stripDashes(s) {
  return s.replace(/\s*[–—]\s*/g, ", ");
}

function wordCount(law) {
  const parts = [
    law.oneSentence,
    ...law.whatItDoes, ...law.whyItHappened, ...law.whatsBehindIt,
    ...law.whatItCosts, ...law.whatChangesForYou, ...(law.jackson ?? []), ...law.watchFor,
  ];
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

// Returns a list of problems; an empty list means the entry can publish.
function validate(law, lawsSource) {
  const errors = [];
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!/^[a-z0-9]+(-[a-z0-9]+){2,9}$/.test(law.slug ?? "")) errors.push("slug must be 3 to 10 lowercase words joined by hyphens");
  if (lawsSource.includes(`slug: ${JSON.stringify(law.slug)}`)) errors.push(`slug "${law.slug}" already exists`);
  if (!/^(HB|SB|HC|SC) \d{1,4}$/.test(law.bill ?? "")) errors.push('bill must look like "SB 2588"');
  if (lawsSource.includes(`bill: ${JSON.stringify(law.bill)}`)) errors.push(`${law.bill} is already explained on the site`);
  if (!law.title || law.title.length > 90) errors.push("title must be under 90 characters");
  if (/\b(HB|SB)\s?\d/.test(law.title ?? "")) errors.push("title must not contain the bill number");
  if (!iso.test(law.effective ?? "")) errors.push("effective must be an ISO date");
  if (law.signedOn && !iso.test(law.signedOn)) errors.push("signedOn must be an ISO date or empty");
  if (!Array.isArray(law.topics) || law.topics.length === 0 || law.topics.some((t) => !TOPICS.includes(t))) errors.push(`topics must be 1 to 3 of: ${TOPICS.join(", ")}`);
  if (!law.oneSentence || law.oneSentence.split(/\s+/).length > 34) errors.push("oneSentence must be under 30 words");
  for (const key of ["whatItDoes", "whyItHappened", "whatsBehindIt", "whatItCosts", "whatChangesForYou", "watchFor"]) {
    const v = law[key];
    if (!Array.isArray(v) || v.length < 1 || v.length > 3 || v.some((p) => typeof p !== "string" || p.trim().length < 40)) {
      errors.push(`${key} must be 1 to 3 paragraphs of real sentences`);
    }
  }
  if (law.jackson && (!Array.isArray(law.jackson) || law.jackson.length > 3)) errors.push("jackson must be 0 to 3 paragraphs");
  if (!Array.isArray(law.sources) || law.sources.length < 2 || law.sources.some((s) => !/^https?:\/\//.test(s?.url ?? "") || !s?.name)) {
    errors.push("sources must list at least two entries with a name and an http(s) url");
  }
  const words = wordCount(law);
  if (words < 380) errors.push(`entry is too short (${words} words; aim for 450 to 800)`);
  if (words > 950) errors.push(`entry is too long (${words} words; aim for 450 to 800)`);
  const allText = JSON.stringify(law);
  if (/[*#`]{2}|\n- /.test(allText)) errors.push("no markdown in the text");
  return errors;
}

function pickFromQueue(lawsSource) {
  let queue = [];
  try {
    queue = JSON.parse(readFileSync(QUEUE_FILE, "utf8"));
  } catch {
    return null;
  }
  const idx = queue.findIndex((q) => !q.bill || !lawsSource.includes(`bill: ${JSON.stringify(q.bill)}`));
  if (idx === -1) return null;
  return { entry: queue[idx], idx, queue };
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
  if (law.note) lines.push(`    note: ${str(law.note)},`);
  lines.push(`  },`);
  return lines.join("\n") + "\n";
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
    return;
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const today = todayLocalIso();
  const task = [
    `Today is ${today}.`,
    bill ? `Explain Mississippi bill ${bill} (2026 Regular Session unless the sources say otherwise).` : "Explain the Mississippi law described in the notes below; find its bill number first.",
    notes ? `Notes from the editor: ${notes}` : "",
    sources.length ? `Read these sources first, in order:\n${sources.map((s) => `- ${s}`).join("\n")}` : "",
    "Then research as instructed and call publish_law once.",
  ].filter(Boolean).join("\n\n");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: task },
  ];

  let law = null;
  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    const isFinal = iteration === MAX_ITERATIONS;
    if (isFinal) {
      messages.push({
        role: "user",
        content: "Research time is over. Using only the material gathered above, call publish_law now. Where something is unknown, say the Wire could not find it.",
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
          const truncated = text.length > 18000 ? text.slice(0, 18000) + "\n\n[truncated]" : text;
          messages.push({ role: "tool", tool_call_id: tc.id, content: `[${contentType}]\n${truncated}` });
        } catch (e) {
          messages.push({ role: "tool", tool_call_id: tc.id, content: `Fetch failed: ${e.message}. Try a syndication copy or another outlet.` });
        }
      } else if (name === "publish_law") {
        // Dashes are fixed quietly; everything else goes back for a retry.
        for (const key of Object.keys(args)) {
          if (typeof args[key] === "string") args[key] = stripDashes(args[key]);
          if (Array.isArray(args[key])) args[key] = args[key].map((p) => (typeof p === "string" ? stripDashes(p) : p));
        }
        if (Array.isArray(args.sources)) args.sources = args.sources.map((s) => ({ name: stripDashes(String(s.name ?? "")), url: String(s.url ?? "") }));
        const errors = validate(args, lawsSource);
        if (errors.length && !isFinal) {
          console.log(`[laws-desk] publish_law rejected: ${errors.join("; ")}`);
          messages.push({ role: "tool", tool_call_id: tc.id, content: `Not published. Fix these and call publish_law again:\n- ${errors.join("\n- ")}` });
        } else {
          if (errors.length) console.log(`[laws-desk] publishing with warnings: ${errors.join("; ")}`);
          law = args;
          messages.push({ role: "tool", tool_call_id: tc.id, content: "Received." });
        }
      } else {
        messages.push({ role: "tool", tool_call_id: tc.id, content: `Unknown tool ${name}.` });
      }
    }
    if (law) break;
  }

  if (!law) {
    console.error("[laws-desk] No entry produced.");
    process.exit(1);
  }
  if (DASHES.test(JSON.stringify(law))) {
    console.error("[laws-desk] Dashes survived the cleanup; refusing to publish.");
    process.exit(1);
  }
  const hardErrors = validate(law, lawsSource).filter((e) => /already|slug must|bill must|must be an ISO|sources must/.test(e));
  if (hardErrors.length) {
    console.error(`[laws-desk] Cannot publish: ${hardErrors.join("; ")}`);
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

  const files = [LAWS_FILE];
  if (queuePick) {
    queuePick.queue.splice(queuePick.idx, 1);
    writeFileSync(QUEUE_FILE, JSON.stringify(queuePick.queue, null, 2) + "\n");
    files.push(QUEUE_FILE);
  }

  if (process.env.DRY_RUN) {
    console.log("[laws-desk] DRY_RUN set; not committing.");
    return;
  }

  console.log("[laws-desk] Committing & pushing to main...");
  execSync('git config user.name "Jackson Wire Autopilot"', { stdio: "inherit" });
  execSync('git config user.email "autopilot@thejacksonwire.com"', { stdio: "inherit" });
  execSync(`git add ${files.join(" ")}`, { stdio: "inherit" });
  execSync("git commit -F -", { input: `What Passed: ${law.bill}: ${law.title}`, stdio: ["pipe", "inherit", "inherit"] });
  execSync("git push origin HEAD:main", { stdio: "inherit" });

  await pingIndexNow([`${SITE}/laws/${law.slug}`, `${SITE}/laws`, `${SITE}/sitemap.xml`]);
  console.log(`[laws-desk] Published ${law.bill}.`);
}

main().catch((err) => {
  console.error("[laws-desk] FAILED:", err?.message || err);
  process.exit(1);
});
