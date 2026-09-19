#!/usr/bin/env node
// Morning Brief autopilot — a daily 5-item summary of what Jackson needs to
// know this morning. Different format from the standard autopilot article:
// shorter items, broader topic mix, no single-topic deep dive. Runs early
// in the morning Central time so the brief lands at breakfast.
// Uses DeepSeek + Tavily web search.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import OpenAI from "openai";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { webSearch } from "./lib/search.mjs";
import { createCourtListener } from "./lib/courtlistener.mjs";
import { pingIndexNow } from "./lib/indexnow.mjs";

const POSTS_FILE = "lib/posts.ts";

// The federal criminal case is looked up through scripts/lib/courtlistener.mjs.
const courtListener = createCourtListener({ prefix: "brief" });
const { getOwensCaseDocket, readCourtFiling } = courtListener;

const SYSTEM_PROMPT = `You are the morning brief writer for The Jackson Wire, an independent business and economics news site covering Jackson, Mississippi and its metro.

Your job: produce the day's Morning Brief, a punchy summary of the FIVE things Jackson's business and civic readers most need to know this morning. The brief is the Wire's daily front-door product. It should make a reader who runs a company, owns property, or sits on a board feel current on Jackson by 7 a.m. Central, and it should tell them at least one thing that is coming that they did not know about.

FORMAT — strict
- Five items. Exactly five.
- Each item is ONE self-contained body string with this exact structure:
    "Short headline phrase: Body paragraph text..."
- The HEADLINE PHRASE is 3 to 9 words, no terminal period, written to stand alone as a sub-headline (e.g. "Saxum rezoning vote looms", "Court strikes jurors for cause", "Lumumba calls for water-board overhaul"). It is followed by a colon and a single space, then the body.
- The BODY is 70 to 130 words of context, attribution, and stakes, written in the Wire's voice.
- Items must be ordered by news weight: biggest first. Item 1 should hook the reader. Item 5 can be lighter.
- Do not number the items yourself; the site renders the number.

TOPIC MIX, required
- At least THREE of the five items must be business, economy, or development: a company, a deal, a hiring or layoff, a budget or tax action, a rate case, a bond, a permit, a project, or a vote with money attached.
- At least ONE item must be forward-looking: a vote, hearing, deadline, bond sale, rate change, groundbreaking, or opening scheduled in the next 30 days, with the date named.
- The remaining items can be politics, infrastructure, courts, schools, or community, told through their cost or consequence where possible.
- Include a corruption-case item only if a substantive filing landed in the last 24 to 48 hours. Otherwise skip it.

RESEARCH ORDER
1. Call web_search 4 to 6 times on the money beat first: metro Jackson business news, development and permits, budgets and taxes, utilities and rates, jobs and layoffs, bonds and incentives. Then one or two searches for the rest of the city.
2. When a city, county, or state meeting is happening today or this week, find the agenda or notice URL with web_search and call fetch_url to read it directly. Quote from the agenda. Agenda items with dollar figures make the best forward-looking entries.
3. Call get_owens_case_docket once. Include an item only if there is a substantive filing in the last 24 to 48 hours.
4. Build the 5-item lineup, ordered by news weight, with the money items carrying the top of the brief.

PRIMARY SOURCES (use fetch_url for these)
- Jackson City Council, Planning Board, Zoning hearings: jacksonms.gov
- Hinds, Madison, and Rankin County boards; Ridgeland, Flowood, Clinton, Pearl, Brandon agendas
- Mississippi PSC dockets (data centers, rate cases): psc.ms.gov
- Mississippi Development Authority announcements: mississippi.org
- MDES WARN layoff notices: mdes.ms.gov
- Municipal bond documents: emma.msrb.org
- Mississippi Legislature bill text and fiscal notes: legislature.ms.gov
- Mississippi Secretary of State business filings: sos.ms.gov
Find the URL via web_search first ("Jackson City Council agenda this week site:jacksonms.gov"), then fetch_url.

VOICE — strict
- Direct, observant. Shorter sentences than the longer articles.
- Lead with the most newsworthy fact, not a setup.
- Attribute every concrete claim in-line ("Mississippi Today reported", "court records show", "the city's agenda lists").
- No em-dashes or en-dashes anywhere. Use commas, periods, colons, or parentheses.
- Do not open the brief with "For X months/years..." or similar autopilot cadences.
- Do not end every item with a punchy one-line kicker. Vary how items close.

ORIGINAL FRAMING — at least one item must include either:
- A quantitative comparison (a number, ratio, or trend)
- A historical or cross-jurisdictional parallel
- A specific question worth watching
- A primary-source detail other outlets haven't surfaced

FACT DISCIPLINE — non-negotiable
- Every claim traces to a tool result you actually saw in this conversation.
- No fabricated quotes. Paraphrase if you can't find a real quote.
- For stories naming Owens, Lumumba, Banks, Horhn, Stokes, or any living public figure, every claim must trace to a tool result.

OUTPUT
- Call publish_brief once with the final five items.
- Title format: 'Morning Brief: [Date in "Mon DD" form] · [punchy summary of the day's biggest story]'. Example: 'Morning Brief: Jun 16 · Pretrial Conference Lands; Saxum Vote Looms'.
- Dek: ONE sentence summarizing the biggest item. Do not repeat as the first item.
- Body: 5 paragraphs, one per item. Each starts with a fact-dense lead sentence.
- Category: "General News"
- Tags: ["morning-brief"]`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current news and information. Returns 5 result snippets with titles, URLs, and content excerpts.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Specific search query. Use multiple distinct queries to cover different beats.",
          },
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
        "Fetch the text content of a public government, court, or news URL. Handles HTML, PDF agendas, and JSON. Use to read primary-source documents directly: Council agendas, PSC filings, county board notices, legislative bill text. Find the URL via web_search first, then fetch_url it.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Absolute https/http URL of a public document or page.",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_owens_case_docket",
      description:
        "Get recent docket entries from the federal criminal case against Jody Owens, Chokwe Antar Lumumba, and Aaron Banks. Returns the most recent entries (motions, orders, filings). Call this once, after the money-beat searches; include an item only for a substantive filing in the last 24 to 48 hours. Returns 'unavailable' if CourtListener can't be reached.",
      parameters: {
        type: "object",
        properties: {
          days_back: {
            type: "integer",
            description: "How many days back to look. Default 3 for the brief.",
            minimum: 1,
            maximum: 14,
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_court_filing",
      description:
        "Read the full plain text of a specific court filing by its recap_document_id. Use sparingly in the brief — only when the filing is genuinely the lead.",
      parameters: {
        type: "object",
        properties: {
          recap_document_id: { type: "integer" },
        },
        required: ["recap_document_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_brief",
      description:
        "Submit the final Morning Brief for immediate publication. Call this exactly once after research is complete.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: {
            type: "string",
            description:
              "URL slug: lowercase, hyphens only. Include the date: e.g. 'morning-brief-2026-06-16'.",
          },
          title: {
            type: "string",
            description:
              "Headline. Format: 'Morning Brief: Jun 16 · [punchy summary]'.",
          },
          dek: {
            type: "string",
            description:
              "One sentence summarizing the biggest item. Shown italicized under the headline.",
          },
          body: {
            type: "array",
            items: { type: "string" },
            minItems: 5,
            maxItems: 5,
            description:
              "Exactly five strings, one per item, in news-weight order. Each string MUST start with a 3-9 word headline phrase (no terminal period) followed by ': ' and then a 70-130 word body paragraph. Example: 'Saxum rezoning vote looms: The Planning Board reconvenes Tuesday at 5 p.m. ...'",
          },
        },
        required: ["slug", "title", "dek", "body"],
      },
    },
  },
];

// --- main -------------------------------------------------------------------

function todayLocalIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

function todayPretty() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }
  if (!process.env.TAVILY_API_KEY && !process.env.BRAVE_API_KEY) {
    console.log(
      "[brief] No TAVILY_API_KEY or BRAVE_API_KEY; web_search will rely on DuckDuckGo.",
    );
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const postsContent = readFileSync(POSTS_FILE, "utf8");
  const recentTitles = [...postsContent.matchAll(/title:\s*"([^"]+)"/g)]
    .slice(0, 8)
    .map((m) => m[1])
    .filter((t) => t !== "Headline As It Appears");

  const today = todayLocalIso();
  const pretty = todayPretty();

  const userPrompt = `Today is ${today} (${pretty}, America/Chicago). Build the Morning Brief for The Jackson Wire.

Recent articles already published (do not duplicate exact stories):
${recentTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Process:
1. Call web_search 4-6 times, money beat first: business, development, budgets and taxes, utilities and rates, jobs, bonds. Then politics, infrastructure, courts, schools.
2. Check get_owens_case_docket once. Include a corruption-case item ONLY if there's a substantive filing in the last 2-3 days.
3. Compose 5 items: at least three business/economy/development, at least one forward-looking with a date, news-weight order.
4. Call publish_brief with slug "morning-brief-${today}", title format "Morning Brief: ${pretty} · [punchy summary]".`;

  console.log(`[brief] today=${today} (${pretty})`);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  let brief = null;
  let iteration = 0;
  const MAX_ITERATIONS = 14;

  while (iteration++ < MAX_ITERATIONS && !brief) {
    console.log(`[brief] iteration ${iteration}: calling DeepSeek...`);

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 8000,
    });

    const msg = response.choices[0].message;
    console.log(
      `[brief] finish=${response.choices[0].finish_reason}, tool_calls=${msg.tool_calls?.length ?? 0}`,
    );

    // Check for publish_brief in tool calls before pushing the message.
    let publishParseError = false;
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        if (tc.function.name === "publish_brief") {
          try {
            brief = JSON.parse(tc.function.arguments);
          } catch (e) {
            console.error("[brief] Failed to parse publish_brief args:", e.message);
            publishParseError = true;
            messages.push(msg);
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: "Arguments were not valid JSON — please retry with valid JSON.",
            });
          }
        }
      }
    }
    if (brief) break;
    if (publishParseError) continue;

    // Push the full assistant message (OpenAI format).
    messages.push(msg);

    if (response.choices[0].finish_reason !== "tool_calls") {
      if (response.choices[0].finish_reason === "stop") {
        console.error("[brief] Model ended turn without calling publish_brief.");
        const text = (msg.content || "").slice(0, 1000);
        console.error("[brief] Final text:", text);
        messages.push({
          role: "user",
          content:
            "You must call either a research tool or the publish_brief tool. Do not respond with text only.",
        });
        continue;
      }
      console.error(`[brief] Unexpected finish_reason: ${response.choices[0].finish_reason}`);
      process.exit(1);
    }

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.error("[brief] finish_reason=tool_calls but no tool_calls present.");
      process.exit(1);
    }

    // Handle each tool call.
    for (const tc of msg.tool_calls) {
      const name = tc.function.name;
      let args;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch (e) {
        console.error(`[brief] Failed to parse arguments for ${name}:`, e.message);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: `Error parsing arguments: ${e.message}. Please retry with valid JSON.`,
        });
        continue;
      }

      if (name === "web_search") {
        console.log(`[brief] search: "${args.query}"`);
        try {
          const results = await webSearch(args.query, { prefix: "brief" });
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: results,
          });
        } catch (e) {
          console.error(`[brief] Search failed for "${args.query}": ${e.message}`);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `Search error: ${e.message}`,
          });
        }
      } else if (name === "get_owens_case_docket") {
        const daysBack = Math.min(Math.max(args?.days_back ?? 3, 1), 14);
        console.log(`[brief] docket: last ${daysBack} days`);
        try {
          const content = await getOwensCaseDocket(daysBack);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content,
          });
        } catch (e) {
          console.error(`[brief] docket failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `CourtListener unavailable (${e.message}). Skip corruption-case item.`,
          });
        }
      } else if (name === "read_court_filing") {
        console.log(`[brief] read filing: ${args?.recap_document_id}`);
        try {
          const content = await readCourtFiling(args.recap_document_id);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content,
          });
        } catch (e) {
          console.error(`[brief] read filing failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `Could not read filing: ${e.message}`,
          });
        }
      } else if (name === "fetch_url") {
        console.log(`[brief] fetch_url: ${args?.url}`);
        try {
          const { contentType, text } = await fetchUrl(args.url);
          const truncated =
            text.length > 12000 ? text.slice(0, 12000) + "\n\n[truncated]" : text;
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `[${contentType}]\n${truncated}`,
          });
        } catch (e) {
          console.error(`[brief] fetch_url failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `Fetch failed: ${e.message}`,
          });
        }
      } else if (name === "publish_brief") {
        // already captured above; push a placeholder tool response
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: "Brief received.",
        });
      } else {
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: `Unknown tool: ${name}`,
        });
      }
    }
  }

  if (!brief) {
    console.error("[brief] Exhausted iterations without brief.");
    process.exit(1);
  }

  brief.slug = String(brief.slug)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!brief.slug) {
    console.error("[brief] Empty slug after sanitization.");
    process.exit(1);
  }

  if (postsContent.includes(`slug: "${brief.slug}"`)) {
    console.error(`[brief] Slug "${brief.slug}" already exists. Aborting.`);
    process.exit(1);
  }

  if (!Array.isArray(brief.body) || brief.body.length !== 5) {
    console.error(
      `[brief] Brief must have exactly 5 items, got ${brief.body?.length}.`,
    );
    process.exit(1);
  }

  console.log(`[brief] Drafted: "${brief.title}" (${brief.slug})`);

  const articleObj = `  {
    slug: ${JSON.stringify(brief.slug)},
    title: ${JSON.stringify(brief.title)},
    dek: ${JSON.stringify(brief.dek)},
    category: "General News",
    tags: ["morning-brief"],
    author: "Jackson Wire Staff",
    date: ${JSON.stringify(today)},
    views: 0,
    body: [
${brief.body.map((p) => `      ${JSON.stringify(p)},`).join("\n")}
    ],
  },
`;

  const updated = postsContent.replace(
    /const POSTS: Post\[\] = \[\n/,
    (m) => m + articleObj,
  );

  if (updated === postsContent) {
    console.error("[brief] Could not find POSTS array marker.");
    process.exit(1);
  }

  writeFileSync(POSTS_FILE, updated);
  console.log(`[brief] Wrote ${POSTS_FILE}.`);

  console.log("[brief] Committing & pushing to main...");
  execSync(`git config user.name "Jackson Wire Autopilot"`, {
    stdio: "inherit",
  });
  execSync(`git config user.email "autopilot@thejacksonwire.com"`, {
    stdio: "inherit",
  });
  execSync(`git add ${POSTS_FILE}`, { stdio: "inherit" });
  const commitMsg = `Morning Brief: ${brief.title}`.replace(/"/g, '\\"');
  execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });
  execSync(`git push origin HEAD:main`, { stdio: "inherit" });

  await pingIndexNow([
    `https://www.thejacksonwire.com/article/${brief.slug}`,
    "https://www.thejacksonwire.com/",
    "https://www.thejacksonwire.com/sitemap.xml",
    "https://www.thejacksonwire.com/news-sitemap.xml",
  ]);

  console.log(`[brief] Published "${brief.title}".`);
}

main().catch((err) => {
  console.error("[brief] FAILED:", err?.message || err);
  process.exit(1);
});
