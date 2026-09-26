#!/usr/bin/env node
// Autopilot — researches a fresh topic via DeepSeek + Tavily web search +
// CourtListener docket feed, writes a full article in the Wire's voice,
// appends it to lib/posts.ts, and pushes to main. Triggered by
// .github/workflows/autopilot.yml on a cron schedule.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import OpenAI from "openai";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { webSearch } from "./lib/search.mjs";
import { createCourtListener } from "./lib/courtlistener.mjs";
import { DATA_TOOLS, DATA_TOOL_NAMES, runDataTool } from "./lib/data-tools.mjs";
import { pingIndexNow } from "./lib/indexnow.mjs";

const POSTS_FILE = "lib/posts.ts";
const CATEGORIES = [
  "Business",
  "Economy",
  "Development",
  "Real Estate",
  "Politics",
  "General News",
];
// Sections that count toward the money-beat quota in the rotation rule.
const MONEY_BEATS = new Set(["Business", "Economy", "Development"]);

// The federal criminal case is looked up through scripts/lib/courtlistener.mjs.
const courtListener = createCourtListener({ prefix: "autopilot" });
const { getOwensCaseDocket, readCourtFiling } = courtListener;

const SYSTEM_PROMPT = `You are the research-desk writer for The Jackson Wire, an independent business and economics news site covering Jackson, Mississippi and its metro (Hinds, Madison, and Rankin counties).

The Wire's promise to readers is simple: information they would not otherwise obtain, ahead of the crowd, and a clear view of what is coming. You are not a rewrite desk. You are a research arm. Your job: find something in a document, dataset, or agenda that has not been reported, or a decision that is coming that readers should know about, then draft a complete publishable article in the Wire's voice and submit it via the publish_article tool. Call publish_article exactly once.

BEAT PRIORITY
- About three of every four articles must be Business, Economy, or Development. Real Estate, Politics, and General News fill the rest, and even those are told through the money: who pays, who profits, what it costs, what it changes.
- Politics is not a category for horse-race or personality coverage. Use it only when a vote, appointment, or fight has a dollar consequence you can name.
- The federal corruption case (Owens, Lumumba, Banks) is an archive beat now. All defendants have pleaded guilty. Cover it only when a substantive new order, sentencing filing, or ruling lands, and only if the rotation rule permits.

WHAT COUNTS AS A WIRE STORY, in order of value
1. AHEAD OF THE CROWD: something in a filing, agenda item, permit, contract, bond document, lease, incentive agreement, or dataset that has not yet been reported. A story that begins with a document nobody has written about beats any rewrite of a press release.
2. WHAT IS COMING: a project, vote, rate change, incentive, hiring, closure, opening, or deadline that will happen in the next 1 to 18 months, with the date and the decision-maker named.
3. BY THE NUMBERS: a public dataset read closely (sales-tax diversions, employment, permits, assessments, budgets, bond disclosures) with a finding the reader could not get anywhere else.
4. FOLLOW THE MONEY: who benefits from a public decision, by how much, and who pays.
5. Everything else, only with a primary document in hand.

REAL-TIME DATA TOOLS, use before web_search
These read primary sources directly, cost nothing, and have no quota. Start every run with them:
1. news_feed("Jackson Mississippi", 24), jackson_meetings(), and public_notices(): what happened overnight, what is on the calendar this week, and every bid, RFP, and zoning ad the city has posted, with links to fetch_url.
2. Then pick by beat: federal_awards (money arriving in Hinds, Madison, or Rankin County before it is announced), court_search (new suits and contract fights in S.D. Miss.), bankruptcies (Chapter 11s and business Chapter 7s in the S.D. Miss. bankruptcy court), sec_filings (Cal-Maine, Trustmark, Cadence Bank, Entergy Mississippi, Atmos, or "Jackson, Mississippi"), federal_register (EPA, HUD, DOT, and FEMA actions naming Mississippi or Jackson), bls_series (jobs and unemployment for a By-the-Numbers piece), eia_fuel_prices (any fuel, trucking, or farm-cost story).
3. A result from one of these tools is a primary source. Cite it as such ("according to USASpending.gov records", "a Sept. 19 8-K filed with the SEC", "the BLS series for the Jackson metro").

RESEARCH ORDER
1. Start with the real-time data tools above (news_feed, jackson_meetings, then the beat tools). Then run web_search queries aimed at primary sources: agendas, minutes, permits, bond resolutions, PSC dockets, Secretary of State filings, MDA announcements, WARN notices, sales-tax reports, federal awards, court dockets. Use site: filters (for example "site:jacksonms.gov agenda", "site:sos.ms.gov", "site:mdes.ms.gov WARN", "site:emma.msrb.org Jackson Mississippi").
2. When a search turns up a document, fetch_url it and read it. Quote it. Cite the URL. fetch_url works on PDFs.
3. Call get_owens_case_docket once. Write about it only if a substantive order, ruling, or sentencing filing landed in the last 7 days AND the rotation rule permits. Otherwise note it and move on.
4. Cross-check with news coverage for context and attribution, but never let another outlet's story be the spine of yours.
5. If the day's best document is thin, pick the strongest WHAT IS COMING angle: a scheduled vote, hearing, rate change, bond sale, or deadline in the next 90 days, and explain what is at stake.

SOURCES (find the current URL with web_search, then fetch_url)
Money and business:
- Mississippi Secretary of State business filings (new LLCs, name changes, registered agents, foreign registrations): sos.ms.gov
- Mississippi Development Authority project announcements and incentive agreements: mississippi.org
- MDES WARN notices (layoffs and closures, often before they are reported): mdes.ms.gov
- Mississippi Department of Revenue monthly sales-tax diversions by city: dor.ms.gov
- BLS Jackson MSA employment and wages: bls.gov; MDES labor-market reports
- Census Building Permits Survey; City of Jackson and county permit portals
- USASpending.gov and SAM.gov for federal contracts and grants to Hinds, Madison, and Rankin County recipients
- EMMA (emma.msrb.org) for municipal bond official statements and continuing disclosures from Jackson, JXN Water, Hinds County, Madison County, JPS, Jackson airport
- SEC EDGAR for public companies with Jackson operations (Cal-Maine, Trustmark, Cadence, Entergy, Atmos, Ergon-related filings)
- Hinds County land records and tax assessor: hindscountyms.com
Government and development:
- Jackson City Council agendas, packets, minutes; Planning Board; Zoning: jacksonms.gov
- Hinds, Madison, and Rankin County boards; Ridgeland, Flowood, Clinton, Pearl, Brandon, Madison, Byram city agendas
- Jackson Redevelopment Authority; Capitol Complex Improvement District; JXN Water rate filings and the federal receivership docket
- Mississippi Public Service Commission dockets (psc.ms.gov), especially data centers and utility rate cases
- Mississippi Legislature bills, fiscal notes, PEER reports: legislature.ms.gov, peer.ms.gov
- Mississippi State Auditor reports; Department of Finance and Administration; Mississippi Home Corporation
- Federal court dockets on CourtListener for business litigation and bankruptcies

Quote and cite by URL in the article. Example: "according to the bond resolution on the Sept. 8 agenda (hindscountyms.com), the county would borrow..."

STORY REQUIREMENTS, all mandatory
- End every article with a "What's next" section of one or two paragraphs that names the next date, the decision-maker, and what readers should watch. If a date is not public, say so and say what would set it.
- Include at least one number the Wire computed or pulled from a document (a ratio, a per-resident figure, a comparison to a prior year, a share of a budget), not just a figure repeated from another outlet.
- When a public dollar is involved, name who pays and who profits.
- Prefer a specific, checkable claim over a broad one. "The council votes Tuesday on a $4.2 million lease" beats "the city is weighing a lease."

BEAT ROTATION, required
- The user prompt gives you the last several categories. If fewer than four of the last six articles were Business, Economy, or Development, today's category MUST be one of those three.
- If two or more of the last five were tagged corruption-case, you may not write about the case today.
- If three or more of the last seven were Politics, you may not pick Politics today.
- Count the categories yourself from the list. Do not assume.

VOICE, strict
- Short, declarative sentences. Active voice. Direct, observant, slightly literary.
- Lead with the finding or the strongest observation. Close with the "What's next" section.
- No hype, no editorial flourishes beyond what the facts support.

PUNCTUATION AND RHYTHM, strict, anti-AI-tell
- DO NOT use em-dashes or en-dashes anywhere in the article. Use commas, periods, colons, or parentheses instead. This is not negotiable.
- DO NOT open the article with a "For X months/years/days, the question wasn't Y, it was Z" construction.
- DO NOT use the three-sentence opening rhythm where sentence 1 sets the scene, sentence 2 introduces a counter-fact, and sentence 3 sets up the rest. Vary how you open.
- Do not end with a one-line punchy kicker. End with the "What's next" section.
- Avoid the construction "X has [done thing]. X has not [counter-thing]." It is a tell.

ORIGINAL FRAMING, required
Every article must include AT LEAST ONE of:
- A detail from a primary document that other outlets have not surfaced.
- A quantitative observation the Wire computed from the facts.
- A historical parallel (a prior Jackson, Mississippi, or comparable-city deal or decision).
- A specific question that no other outlet has asked, with the name of who could answer it.
Do not publish a pure summary of other outlets' coverage.

STRUCTURE
- Headline: clear, specific, not clickbait. Under 100 characters. Numbers and proper nouns welcome.
- Dek: one or two sentences with the finding. Do NOT repeat it as the first body paragraph.
- Body: 7 to 12 paragraphs, each 1 to 4 sentences. The final one or two paragraphs are the "What's next" section. Exactly one paragraph in the article begins with the words "What's next:"; if you use a second closing paragraph, do not repeat the label.

FACT DISCIPLINE, non-negotiable
- Every concrete claim (names, dates, dollar figures, votes, quotes, rulings) MUST trace to a tool result you actually saw in this conversation.
- If you cannot verify a fact, leave it out. Do not paraphrase from training data.
- Attribute in-line by source ("according to the council packet", "the bond resolution states", "WLBT reported").
- Do not fabricate quotes. If you cannot find a real quote, paraphrase and attribute.
- For any living person named in the article, every claim about them must trace to a tool result.

TAGS, required for hub pages
- "pipeline": any article about a specific development project, bond issue, rate case, incentive package, lease, ballot measure, or scheduled decision that the Wire should track on its Pipeline page. Most Development and many Economy stories carry this tag.
- "data-centers": Mississippi data center development, AI infrastructure, related utility, water, or zoning fights.
- "corruption-case": U.S. v. Owens, Lumumba, and Banks.
- "explainer": profile, background, or reference pieces rather than news.
An article can carry several tags. Leave tags empty if none apply.

TOPIC SELECTION
- Pick something timely: a document filed or a decision scheduled within the last 7 days or the next 90.
- Do not duplicate topics already covered (you will be given recent titles). A genuinely new document about a covered project is fine; a second summary is not.

OUTPUT
- After research, call publish_article exactly ONCE with the final article.
- Do not narrate your process. Go straight from research to publishing.`;

// --- Tool definitions (OpenAI format) ----------------------------------------

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
              "Specific search query, like a news search. Use multiple distinct queries to triangulate.",
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
        "Fetch the text content of a public government, court, or news URL. Handles HTML pages (extracts visible text), PDF documents (extracts text — works on Council agendas, court orders, PSC filings), and JSON. Use to read primary-source documents directly: City Council agendas, Planning Commission packets, Mississippi PSC docket filings, Hinds County board agendas, state legislative bill text. Find the URL via web_search first, then fetch_url it. Do not use for paywalled sites or sites that require authentication.",
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
        "Get recent docket entries from the federal criminal case against Jody Owens, Chokwe Antar Lumumba, and Aaron Banks in the Southern District of Mississippi. Returns the most recent entries (motions, orders, filings). Call this once, after your first money-beat web_search queries; it only sets the day's story if a substantive order or ruling landed and the rotation rule allows it. Returns 'unavailable' if CourtListener can't be reached.",
      parameters: {
        type: "object",
        properties: {
          days_back: {
            type: "integer",
            description: "How many days back to look. Default 7. Maximum 30.",
            minimum: 1,
            maximum: 30,
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
        "Read the full plain text of a specific court filing by its recap_document_id (from get_owens_case_docket). Use this to write about what the filing actually says, not just news coverage of it.",
      parameters: {
        type: "object",
        properties: {
          recap_document_id: {
            type: "integer",
            description:
              "The recap_document_id returned by get_owens_case_docket.",
          },
        },
        required: ["recap_document_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_article",
      description:
        "Submit the final, fully-researched and written article for immediate publication on The Jackson Wire. Call this exactly once, after research is complete.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: {
            type: "string",
            description:
              "URL slug: lowercase, hyphens only, no leading/trailing hyphens, no other punctuation.",
          },
          title: { type: "string", description: "Article headline." },
          dek: {
            type: "string",
            description:
              "One or two sentences summarizing the article. Shown italicized under the headline; do not repeat it as the first body paragraph.",
          },
          category: {
            type: "string",
            enum: CATEGORIES,
            description: "Primary section.",
          },
          categories: {
            type: "array",
            items: { type: "string", enum: CATEGORIES },
            description:
              "Optional cross-file sections (e.g. ['General News']). Empty array if none.",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
              enum: ["pipeline", "data-centers", "corruption-case", "explainer"],
            },
            description:
              "Hub-page tags. Include 'pipeline' for any article about a specific development project, bond issue, rate case, incentive package, lease, ballot measure, or scheduled decision. Include 'data-centers' for Mississippi data center development, AI infrastructure, or related utility/water/zoning fights. Include 'corruption-case' for U.S. v. Owens. Include 'explainer' for profile/background pieces. Empty array if none apply. An article can have multiple tags.",
          },
          body: {
            type: "array",
            items: { type: "string" },
            minItems: 7,
            description:
              "Article paragraphs as plain strings. 7 to 12 paragraphs; the last one or two form the What's next section; exactly one paragraph (the first of those) begins with the words \"What's next:\". Curly quotes where appropriate. No markdown.",
          },
        },
        required: [
          "slug",
          "title",
          "dek",
          "category",
          "categories",
          "tags",
          "body",
        ],
      },
    },
  },
  ...DATA_TOOLS,
];

// --- main loop --------------------------------------------------------------

function todayLocalIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }
  if (!process.env.TAVILY_API_KEY && !process.env.BRAVE_API_KEY) {
    console.log(
      "[autopilot] No TAVILY_API_KEY or BRAVE_API_KEY; web_search will rely on DuckDuckGo.",
    );
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const postsContent = readFileSync(POSTS_FILE, "utf8");
  // Walk the POSTS array in file order (newest first). Each entry is parsed
  // on its own so a post without a tags line cannot shift the others, and
  // Morning Briefs are left out: they are a daily digest, not a beat pick,
  // and counting them would distort the rotation.
  const recent = [];
  for (const block of postsContent.split(/\n  \{\n/).slice(1)) {
    const title = block.match(/\n    title:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
    const category = block.match(/\n    category:\s*"([^"]+)"/)?.[1];
    const tags = block.match(/\n    tags:\s*\[([^\]]*)\]/)?.[1] ?? "";
    if (!title || !category || title === "Headline As It Appears") continue;
    if (tags.includes("morning-brief")) continue;
    recent.push({ title, category, tags });
    if (recent.length >= 12) break;
  }
  const recentTitles = recent.map((r) => r.title);
  const recentCategories = recent.map((r) => r.category);
  const recentTags = recent.map((r) => r.tags);

  // Beat-rotation context. The Wire leans business, economics, and
  // development: at least four of the last six articles should be money
  // beats, the corruption case is capped, and Politics is capped.
  const last6Money = recentCategories
    .slice(0, 6)
    .filter((c) => MONEY_BEATS.has(c)).length;
  const last5Corruption = recentTags
    .slice(0, 5)
    .filter((t) => t.includes("corruption-case")).length;
  const last7Politics = recentCategories
    .slice(0, 7)
    .filter((c) => c === "Politics").length;
  const rules = [];
  if (last6Money < 4) {
    rules.push(
      "RULE: today's category MUST be Business, Economy, or Development.",
    );
  }
  if (last5Corruption >= 2) {
    rules.push("RULE: you may NOT write about the corruption case today.");
  }
  if (last7Politics >= 3) {
    rules.push("RULE: you may NOT pick Politics as today's category.");
  }
  const beatLine =
    `Beat-rotation context (be strict): of the last 6 articles, ${last6Money} were Business, Economy, or Development. ` +
    `Of the last 5, ${last5Corruption} were tagged corruption-case. ` +
    `Of the last 7, ${last7Politics} were Politics. ` +
    rules.join(" ");

  const today = todayLocalIso();

  const userPrompt = `Today is ${today} (America/Chicago). Research and draft a new article for The Jackson Wire.

Recent articles already published (newest first) — do not duplicate these topics:
${recentTitles.map((t, i) => `${i + 1}. [${recentCategories[i] || "?"}] ${t}`).join("\n")}

${beatLine}

REMINDER: call news_feed("Jackson Mississippi"), jackson_meetings(), and public_notices() first, then the beat data tools (federal_awards, court_search, bankruptcies, sec_filings, federal_register, bls_series, eia_fuel_prices), then document-oriented web_search queries on the money beat (agendas, bond documents, permits, filings, WARN notices, rate cases), fetch_url the best document, and build the story from it. Check get_owens_case_docket once; it only wins the day with a substantive new filing and only if the rules above allow it. End the article with a "What's next:" section.
Use date "${today}". Pick a category from: ${CATEGORIES.join(", ")}.`;

  console.log(
    `[autopilot] today=${today}, recent_titles=${recentTitles.length}`,
  );

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  let article = null;
  let iteration = 0;
  const MAX_ITERATIONS = 16;
  // DeepSeek keeps researching if allowed. After this many iterations, tell
  // it to write with what it has; on the final iteration, force the call.
  const WRAP_UP_AT = 12;

  while (iteration++ < MAX_ITERATIONS && !article) {
    console.log(`[autopilot] iteration ${iteration}: calling DeepSeek...`);

    if (iteration === WRAP_UP_AT) {
      console.log("[autopilot] research window closed; instructing model to write.");
      messages.push({
        role: "user",
        content:
          "Research time is over. Using only the material gathered above, call publish_article now with the strongest story you can support. Do not call any other tool. Only if the sourcing genuinely cannot support any article, reply with the exact text NO_ARTICLE and nothing else.",
      });
    }
    const isFinal = iteration === MAX_ITERATIONS;

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      tools: TOOLS,
      tool_choice: isFinal
        ? { type: "function", function: { name: "publish_article" } }
        : "auto",
      temperature: 0.3,
      max_tokens: 8000,
    });

    const msg = response.choices[0].message;
    console.log(
      `[autopilot] finish=${response.choices[0].finish_reason}, tool_calls=${msg.tool_calls?.length ?? 0}`,
    );

    // Check for publish_article in tool calls before pushing the message.
    let publishParseError = false;
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        if (tc.function.name === "publish_article") {
          try {
            article = JSON.parse(tc.function.arguments);
          } catch (e) {
            console.error("[autopilot] Failed to parse publish_article args:", e.message);
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
    if (article) break;
    if (publishParseError) continue;

    // Push the full assistant message (OpenAI format).
    messages.push(msg);

    if (response.choices[0].finish_reason !== "tool_calls") {
      if (response.choices[0].finish_reason === "stop") {
        // A deliberate NO_ARTICLE after the wrap-up instruction is a clean
        // slow-news-day exit, not a failure.
        if ((msg.content || "").trim() === "NO_ARTICLE") {
          console.log("[autopilot] Model reports no publishable story today. Exiting cleanly.");
          process.exit(0);
        }
        console.error(
          "[autopilot] Model ended turn without calling publish_article.",
        );
        console.error("[autopilot] Final text:", (msg.content || "").slice(0, 1000));
        // Nudge the model to use a tool.
        messages.push({
          role: "user",
          content:
            "You must call either a research tool or the publish_article tool. Do not respond with text only.",
        });
        continue;
      }
      console.error(`[autopilot] Unexpected finish_reason: ${response.choices[0].finish_reason}`);
      process.exit(1);
    }

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.error("[autopilot] finish_reason=tool_calls but no tool_calls present.");
      process.exit(1);
    }

    // Handle each tool call.
    for (const tc of msg.tool_calls) {
      const name = tc.function.name;
      let args;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch (e) {
        console.error(`[autopilot] Failed to parse arguments for ${name}:`, e.message);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: `Error parsing arguments: ${e.message}. Please retry with valid JSON.`,
        });
        continue;
      }

      if (name === "web_search") {
        console.log(`[autopilot] search: "${args.query}"`);
        try {
          const results = await webSearch(args.query, { prefix: "autopilot" });
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: results,
          });
        } catch (e) {
          console.error(`[autopilot] Search failed for "${args.query}": ${e.message}`);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `Search error: ${e.message}`,
          });
        }
      } else if (name === "get_owens_case_docket") {
        const daysBack = Math.min(
          Math.max(args?.days_back ?? 7, 1),
          30,
        );
        console.log(`[autopilot] docket: last ${daysBack} days`);
        try {
          const content = await getOwensCaseDocket(daysBack);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content,
          });
        } catch (e) {
          console.error(`[autopilot] docket failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `CourtListener unavailable (${e.message}). Fall back to web_search.`,
          });
        }
      } else if (name === "read_court_filing") {
        console.log(`[autopilot] read filing: ${args?.recap_document_id}`);
        try {
          const content = await readCourtFiling(args.recap_document_id);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content,
          });
        } catch (e) {
          console.error(`[autopilot] read filing failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `Could not read filing: ${e.message}`,
          });
        }
      } else if (name === "fetch_url") {
        console.log(`[autopilot] fetch_url: ${args?.url}`);
        try {
          const { contentType, text } = await fetchUrl(args.url);
          const truncated =
            text.length > 18000 ? text.slice(0, 18000) + "\n\n[truncated]" : text;
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `[${contentType}]\n${truncated}`,
          });
        } catch (e) {
          console.error(`[autopilot] fetch_url failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `Fetch failed: ${e.message}`,
          });
        }
      } else if (name === "publish_article") {
        // already captured above; push a placeholder tool response
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: "Article received.",
        });
      } else if (DATA_TOOL_NAMES.has(name)) {
        const content = await runDataTool(name, args, {
          prefix: "autopilot",
          cl: courtListener,
        });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: content ?? `Unknown data tool ${name}.`,
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

  if (!article) {
    console.error("[autopilot] Exhausted iterations without article.");
    process.exit(1);
  }

  article.slug = String(article.slug)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!article.slug) {
    console.error("[autopilot] Empty slug after sanitization.");
    process.exit(1);
  }

  if (postsContent.includes(`slug: "${article.slug}"`)) {
    console.error(
      `[autopilot] Slug "${article.slug}" already exists in posts.ts.`,
    );
    process.exit(1);
  }

  console.log(`[autopilot] Drafted: "${article.title}" (${article.slug})`);
  console.log(`[autopilot] Category: ${article.category}`);
  console.log(`[autopilot] Body: ${article.body.length} paragraphs`);

  const crossFiles = Array.isArray(article.categories)
    ? article.categories.filter((c) => c && c !== article.category)
    : [];
  const categoriesLine = crossFiles.length
    ? `\n    categories: ${JSON.stringify(crossFiles)},`
    : "";

  const allowedTags = ["pipeline", "data-centers", "corruption-case", "explainer"];
  const tags = Array.isArray(article.tags)
    ? article.tags.filter((t) => allowedTags.includes(t))
    : [];
  const tagsLine = tags.length
    ? `\n    tags: ${JSON.stringify(tags)},`
    : "";

  const articleObj = `  {
    slug: ${JSON.stringify(article.slug)},
    title: ${JSON.stringify(article.title)},
    dek: ${JSON.stringify(article.dek)},
    category: ${JSON.stringify(article.category)},${categoriesLine}${tagsLine}
    author: "Jackson Wire Staff",
    date: ${JSON.stringify(today)},
    views: 0,
    body: [
${article.body.map((p) => `      ${JSON.stringify(p)},`).join("\n")}
    ],
  },
`;

  const updated = postsContent.replace(
    /const POSTS: Post\[\] = \[\n/,
    (m) => m + articleObj,
  );

  if (updated === postsContent) {
    console.error("[autopilot] Could not find POSTS array marker in posts.ts.");
    process.exit(1);
  }

  writeFileSync(POSTS_FILE, updated);
  console.log(`[autopilot] Wrote ${POSTS_FILE}.`);

  console.log("[autopilot] Committing & pushing to main...");
  execSync(`git config user.name "Jackson Wire Autopilot"`, {
    stdio: "inherit",
  });
  execSync(`git config user.email "autopilot@thejacksonwire.com"`, {
    stdio: "inherit",
  });
  execSync(`git add ${POSTS_FILE}`, { stdio: "inherit" });
  const commitMsg = `Autopilot: ${article.title}`;
  // Pass the message on stdin: headlines contain $ and quotes that a shell
  // would otherwise expand or break on.
  execSync("git commit -F -", { input: commitMsg, stdio: ["pipe", "inherit", "inherit"] });
  execSync(`git push origin HEAD:main`, { stdio: "inherit" });

  await pingIndexNow([
    `https://www.thejacksonwire.com/article/${article.slug}`,
    "https://www.thejacksonwire.com/",
    "https://www.thejacksonwire.com/sitemap.xml",
  ]);

  console.log(`[autopilot] Published "${article.title}".`);
}

main().catch((err) => {
  console.error("[autopilot] FAILED:", err?.message || err);
  process.exit(1);
});
