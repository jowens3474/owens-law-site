#!/usr/bin/env node
// Autopilot — researches a fresh topic via Claude Opus 4.8 + integrated web
// search + CourtListener docket feed, writes a full article in the Wire's
// voice, appends it to lib/posts.ts, and pushes to main. Triggered by
// .github/workflows/autopilot.yml on a cron schedule.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { pingIndexNow } from "./lib/indexnow.mjs";

const POSTS_FILE = "lib/posts.ts";
const CATEGORIES = [
  "General News",
  "Commercial Real Estate",
  "Residential Real Estate",
  "Politics",
];

// Federal criminal case the Wire is tracking. The CourtListener lookup tries
// each docket-number variant in turn before falling back to a name search.
const OWENS_CASE = {
  label: "U.S. v. Owens, Lumumba, and Banks",
  court: "mssd", // Southern District of Mississippi
  docketNumberVariants: [
    "3:24-cr-00103",
    "3:24-cr-103",
    "24-cr-103",
    "24-103",
  ],
};

const SYSTEM_PROMPT = `You are an autopilot writer for The Jackson Wire — an independent news site covering Jackson, Mississippi: city and county politics, real estate, and the federal corruption case against DA Jody Owens, former Mayor Chokwe Antar Lumumba, and former Councilman Aaron Banks.

Your job: research a fresh, current topic on the Wire's beat, then draft a complete publishable article in the Wire's voice and submit it via the publish_article tool. Call publish_article exactly once.

RESEARCH ORDER — non-negotiable
1. Call get_owens_case_docket FIRST. If there is a new substantive docket entry in the last 7 days (a motion, ruling, order — not just a notice of appearance or routine filing), that is almost always your story.
2. If you find a substantive new entry, call read_court_filing to get the actual filing text. Write about what the filing SAYS — quote it directly, cite the docket entry number. Cross-check with web_search if you want context, but lead with the document.
3. Only if the docket has nothing of substance in the last 7 days do you fall back to web_search-driven topic selection.
4. If get_owens_case_docket errors (network or API issue), proceed with web_search.

PRIMARY SOURCES — use fetch_url to read documents directly
The Wire's differentiator is reading source documents instead of summarizing other outlets' summaries of them. When a story has an underlying public document, you should fetch and quote from it.

Use the fetch_url tool to read these directly. Find the current document URL via web_search first (e.g. "Jackson City Council agenda June 16 2026 site:jacksonms.gov"), then fetch_url it.

Sources worth checking, by beat:
- Jackson City Council agendas, packets, and minutes: jacksonms.gov (search for the meeting portal each session)
- Jackson Planning Board / zoning hearings: jacksonms.gov
- Hinds County Board of Supervisors agendas: hindscountyms.com
- Mississippi Public Service Commission dockets: psc.ms.gov (especially Docket 2026-AD-10 for data centers)
- Mississippi Legislature bills and committee actions: billstatus.ls.state.ms.us / legislature.ms.gov
- Mississippi Secretary of State business filings: sos.ms.gov
- Mississippi Department of Revenue, MDE, MDOC published reports
- Federal civil cases at courtlistener.com (use get_owens_case_docket for the Owens case; for others, search via web_search and fetch_url)

If web_search reveals an agenda or filing is available as a PDF, fetch_url that PDF directly — it works on PDFs.

Quote and cite by URL in the article. Example: "according to the city council agenda for June 16 (jacksonms.gov), item 7-B authorizes..."

BEAT ROTATION — required
The Wire is heavily over-indexed on Politics. To diversify the front page, follow these rules:
- If the last 3 published articles are all Politics, today's article MUST be Commercial Real Estate, Residential Real Estate, or General News (excluding the corruption case).
- If the last 5 published articles include 4 or more about the corruption case, today's article must be about something else — even if there is fresh docket activity. Use web_search to find a real estate, city hall, infrastructure, schools, healthcare, or state-government story.
- Use the recent-titles list provided in the user prompt to enforce this. Count categories yourself; do not assume.

VOICE — strict
- Short, declarative sentences. Active voice. Direct, observant, slightly literary.
- Lead with a thesis or a strong observation. Close with a forward-looking line.
- No hype, no editorial flourishes beyond what the facts support.

PUNCTUATION & RHYTHM — strict, anti-AI-tell
- DO NOT use em-dashes (—) or en-dashes (–) anywhere in the article. Use commas, periods, colons, or parentheses instead. This is not negotiable. Em-dashes are a known AI tell and readers spot them immediately.
- DO NOT open the article with a "For X months/years/days, the question wasn't Y, it was Z" construction. That cadence is overused in your prior pieces.
- DO NOT use the three-sentence opening rhythm where sentence 1 sets the scene, sentence 2 introduces a counter-fact, and sentence 3 sets up the rest. Vary how you open.
- DO NOT end every piece with a one-line punchy kicker. About every fourth piece can end that way. Others should end with a forward-looking paragraph, a question, an observation, or a concrete next-step.
- Avoid the construction "X has [done thing]. X has not [counter-thing]." It is also a tell.

ORIGINAL FRAMING — required
Every article must include AT LEAST ONE of:
- A historical parallel (compare to a prior Jackson, Mississippi, or federal case).
- A quantitative observation drawn from the facts (a count, a ratio, a comparison).
- A specific question that no other outlet has asked.
- A piece of context found in a court filing or primary source that other outlets have not surfaced.
Do not publish a pure summary of other outlets' coverage. The Wire's value-add is the framing.

STRUCTURE
- Headline: clear, specific, not clickbait. Under ~100 characters.
- Dek: one or two sentences summarizing the thesis. Do NOT repeat it as the first body paragraph.
- Body: 6–12 paragraphs, each 1–4 sentences.

FACT DISCIPLINE — non-negotiable
- Every concrete claim — names, dates, dollar figures, court rulings, quotes, events — MUST trace to a tool result you actually saw in this conversation.
- If you cannot verify a fact, leave it out. Do not paraphrase from training data.
- Attribute in-line by source ("according to WLBT", "the docket entry shows", "court filings say").
- Do not fabricate quotes. If you can't find a real quote, paraphrase and attribute.
- For stories naming Jody Owens, Chokwe Antar Lumumba, Aaron Banks, Kenny Stokes, John Horhn, or any other living public figure, every claim about them must trace to a tool result.

TAGS — required for hub pages
When you call publish_article, set the tags field as follows:
- If the article is about U.S. v. Owens, Lumumba, and Banks (the federal corruption case), include "corruption-case".
- If the article is about Mississippi data center development, AI infrastructure, utility-deregulation fights, or related zoning hearings (Saxum, Prado AI, AWS, Madison County projects, PSC dockets), include "data-centers".
- If the article is a profile, explainer, or background analysis piece (not breaking news), include "explainer".
- An article can have multiple tags. Leave tags as an empty array if none apply.

TOPIC SELECTION (when falling back to news search)
- Pick something timely. Search for news from the last 7 days first.
- Avoid duplicating topics already covered (you'll be given recent titles).

OUTPUT
- After research, call publish_article exactly ONCE with the final article.
- Do not narrate your process — go straight from research to publishing.`;

// --- Tool definitions (Anthropic format) ------------------------------------

const TOOLS = [
  { type: "web_search_20260209", name: "web_search" },
  {
    name: "fetch_url",
    description:
      "Fetch the text content of a public government, court, or news URL. Handles HTML pages (extracts visible text), PDF documents (extracts text — works on Council agendas, court orders, PSC filings), and JSON. Use to read primary-source documents directly: City Council agendas, Planning Commission packets, Mississippi PSC docket filings, Hinds County board agendas, state legislative bill text. Find the URL via web_search first, then fetch_url it. Do not use for paywalled sites or sites that require authentication.",
    input_schema: {
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
  {
    name: "get_owens_case_docket",
    description:
      "Get recent docket entries from the federal criminal case against Jody Owens, Chokwe Antar Lumumba, and Aaron Banks in the Southern District of Mississippi. Returns the most recent entries (motions, orders, filings). Call this FIRST every run, before web_search. Returns 'unavailable' if CourtListener can't be reached.",
    input_schema: {
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
  {
    name: "read_court_filing",
    description:
      "Read the full plain text of a specific court filing by its recap_document_id (from get_owens_case_docket). Use this to write about what the filing actually says, not just news coverage of it.",
    input_schema: {
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
  {
    name: "publish_article",
    description:
      "Submit the final, fully-researched and written article for immediate publication on The Jackson Wire. Call this exactly once, after research is complete.",
    input_schema: {
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
            enum: ["corruption-case", "explainer", "data-centers"],
          },
          description:
            "Hub-page tags. Include 'corruption-case' for any article about U.S. v. Owens. Include 'data-centers' for any article about Mississippi data center development, AI infrastructure, or related utility/zoning fights (Saxum, Prado AI, AWS, PSC dockets). Include 'explainer' for profile/background pieces. Empty array if none apply. An article can have multiple tags.",
        },
        body: {
          type: "array",
          items: { type: "string" },
          minItems: 6,
          description:
            "Article paragraphs as plain strings. 6–12 paragraphs. Curly quotes ('' \"\") where appropriate. No markdown.",
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
];

// --- CourtListener helpers --------------------------------------------------

const CL_BASE = "https://www.courtlistener.com/api/rest/v3";

function clHeaders() {
  const h = { Accept: "application/json" };
  if (process.env.COURTLISTENER_API_TOKEN) {
    h.Authorization = `Token ${process.env.COURTLISTENER_API_TOKEN}`;
  }
  return h;
}

let cachedOwensDocketId = null;

async function findOwensDocketId() {
  if (cachedOwensDocketId) return cachedOwensDocketId;
  for (const variant of OWENS_CASE.docketNumberVariants) {
    const url = `${CL_BASE}/dockets/?court=${OWENS_CASE.court}&docket_number=${encodeURIComponent(
      variant,
    )}`;
    console.log(`[autopilot] CourtListener search: ${variant}`);
    const res = await fetch(url, { headers: clHeaders() });
    if (!res.ok) {
      console.log(`[autopilot]  -> HTTP ${res.status}`);
      continue;
    }
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const docket = data.results[0];
      console.log(
        `[autopilot]  -> matched docket id=${docket.id} (${docket.docket_number})`,
      );
      cachedOwensDocketId = docket.id;
      return docket.id;
    }
  }
  const url = `${CL_BASE}/dockets/?court=${OWENS_CASE.court}&case_name__icontains=Owens`;
  console.log(`[autopilot] CourtListener search by name: Owens`);
  const res = await fetch(url, { headers: clHeaders() });
  if (res.ok) {
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const docket = data.results[0];
      console.log(
        `[autopilot]  -> matched docket id=${docket.id} (${docket.docket_number})`,
      );
      cachedOwensDocketId = docket.id;
      return docket.id;
    }
  }
  throw new Error("Owens case not found on CourtListener");
}

async function getOwensCaseDocket(daysBack = 7) {
  const docketId = await findOwensDocketId();
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const url = `${CL_BASE}/docket-entries/?docket=${docketId}&order_by=-date_filed&page_size=25`;
  const res = await fetch(url, { headers: clHeaders() });
  if (!res.ok) {
    throw new Error(`docket-entries HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const entries = (data.results || []).filter((e) => {
    if (!e.date_filed) return false;
    return new Date(e.date_filed) >= cutoff;
  });
  if (entries.length === 0) {
    return `No new docket entries in the last ${daysBack} days for ${OWENS_CASE.label} (docket ${docketId}).`;
  }
  const lines = [
    `=== ${OWENS_CASE.label} — Southern District of Mississippi ===`,
    `Docket entries filed in the last ${daysBack} days:`,
    "",
  ];
  for (const e of entries) {
    const docIds = (e.recap_documents || []).map((d) => d.id).filter(Boolean);
    lines.push(`[Entry #${e.entry_number ?? "?"}, filed ${e.date_filed}]`);
    lines.push(`${(e.description || "(no description)").slice(0, 800)}`);
    if (docIds.length) {
      lines.push(`recap_document_id(s): ${docIds.join(", ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function readCourtFiling(recapDocumentId) {
  const url = `${CL_BASE}/recap-documents/${recapDocumentId}/`;
  const res = await fetch(url, { headers: clHeaders() });
  if (!res.ok) {
    throw new Error(`recap-document HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data.plain_text || "";
  if (!text.trim()) {
    return `(no extracted text available for this filing — description: ${
      data.description || data.short_description || "n/a"
    })`;
  }
  return text.length > 15000 ? text.slice(0, 15000) + "\n\n[truncated]" : text;
}

// --- main loop --------------------------------------------------------------

function todayLocalIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const client = new Anthropic();

  const postsContent = readFileSync(POSTS_FILE, "utf8");
  const titleMatches = [...postsContent.matchAll(/title:\s*"([^"]+)"/g)];
  const categoryMatches = [...postsContent.matchAll(/category:\s*"([^"]+)"/g)];
  const tagsMatches = [
    ...postsContent.matchAll(/tags:\s*\[([^\]]*)\]/g),
  ];
  const recentTitles = titleMatches
    .slice(0, 12)
    .map((m) => m[1])
    .filter((t) => t !== "Headline As It Appears");
  const recentCategories = categoryMatches.slice(0, 12).map((m) => m[1]);
  const recentTags = tagsMatches.slice(0, 12).map((m) => m[1]);

  // Beat-rotation context: count how many of the last 5 are corruption-case
  // and how many of the last 7 are Politics.
  const last5Corruption = recentTags
    .slice(0, 5)
    .filter((t) => t.includes("corruption-case")).length;
  const last7Politics = recentCategories
    .slice(0, 7)
    .filter((c) => c === "Politics").length;
  const beatLine =
    `Beat-rotation context (be strict): of the last 5 articles, ${last5Corruption} were tagged corruption-case. ` +
    `Of the last 7 articles, ${last7Politics} were Politics. ` +
    (last5Corruption >= 4
      ? "RULE: You may NOT write about the corruption case today. Cover something else (real estate, city hall, infrastructure, schools, healthcare, state government). "
      : last7Politics >= 5
        ? "RULE: You may NOT pick Politics as today's category. "
        : "");

  const today = todayLocalIso();

  const userPrompt = `Today is ${today} (America/Chicago). Research and draft a new article for The Jackson Wire.

Recent articles already published (newest first) — do not duplicate these topics:
${recentTitles.map((t, i) => `${i + 1}. [${recentCategories[i] || "?"}] ${t}`).join("\n")}

${beatLine}

REMINDER: call get_owens_case_docket FIRST (unless the rotation rule above forbids corruption-case coverage today). Only fall back to web_search if the docket has nothing of substance.
Use date "${today}". Pick a category from: ${CATEGORIES.join(", ")}.`;

  console.log(
    `[autopilot] today=${today}, recent_titles=${recentTitles.length}`,
  );

  const messages = [{ role: "user", content: userPrompt }];

  let article = null;
  let iteration = 0;
  const MAX_ITERATIONS = 12;
  let container = null;

  while (iteration++ < MAX_ITERATIONS && !article) {
    console.log(`[autopilot] iteration ${iteration}: calling Claude...`);

    const requestParams = {
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    };
    if (container) {
      requestParams.container = container;
    }

    const response = await client.messages.create(requestParams);

    if (response.container?.id) {
      container = response.container.id;
    }

    console.log(
      `[autopilot] stop_reason=${response.stop_reason}, blocks=${response.content.length}`,
    );

    // Look for the publish_article tool_use first — it's terminal.
    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "publish_article") {
        article = block.input;
      }
    }
    if (article) break;

    // Otherwise, append the assistant turn and respond to any client tool calls.
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "pause_turn") {
      // Server-side tool (web_search) hit its iteration limit; re-send to resume.
      continue;
    }

    if (response.stop_reason === "end_turn") {
      console.error(
        "[autopilot] Model ended turn without calling publish_article.",
      );
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      console.error("[autopilot] Final text:", text.slice(0, 1000));
      process.exit(1);
    }

    if (response.stop_reason !== "tool_use") {
      console.error(`[autopilot] Unexpected stop_reason: ${response.stop_reason}`);
      process.exit(1);
    }

    // Handle each client-side tool_use block. Server tools (web_search) are
    // handled automatically by the server; their results are already in
    // response.content as server_tool_result blocks.
    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const name = block.name;

      if (name === "get_owens_case_docket") {
        const daysBack = Math.min(
          Math.max(block.input?.days_back ?? 7, 1),
          30,
        );
        console.log(`[autopilot] docket: last ${daysBack} days`);
        try {
          const content = await getOwensCaseDocket(daysBack);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content,
          });
        } catch (e) {
          console.error(`[autopilot] docket failed:`, e.message);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `CourtListener unavailable (${e.message}). Fall back to web_search.`,
            is_error: true,
          });
        }
      } else if (name === "read_court_filing") {
        console.log(`[autopilot] read filing: ${block.input?.recap_document_id}`);
        try {
          const content = await readCourtFiling(block.input.recap_document_id);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content,
          });
        } catch (e) {
          console.error(`[autopilot] read filing failed:`, e.message);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Could not read filing: ${e.message}`,
            is_error: true,
          });
        }
      } else if (name === "fetch_url") {
        console.log(`[autopilot] fetch_url: ${block.input?.url}`);
        try {
          const { contentType, text } = await fetchUrl(block.input.url);
          const truncated =
            text.length > 18000 ? text.slice(0, 18000) + "\n\n[truncated]" : text;
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `[${contentType}]\n${truncated}`,
          });
        } catch (e) {
          console.error(`[autopilot] fetch_url failed:`, e.message);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Fetch failed: ${e.message}`,
            is_error: true,
          });
        }
      } else if (name === "publish_article") {
        // already captured above; nothing more to do
      } else {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Unknown tool: ${name}`,
          is_error: true,
        });
      }
    }

    if (toolResults.length === 0) {
      // No client tools called this turn; just continue.
      continue;
    }

    messages.push({ role: "user", content: toolResults });
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

  const allowedTags = ["corruption-case", "explainer", "data-centers"];
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
  const commitMsg = `Autopilot: ${article.title}`.replace(/"/g, '\\"');
  execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });
  execSync(`git push origin HEAD:main`, { stdio: "inherit" });

  await pingIndexNow([
    `https://www.thejacksonwire.com/article/${article.slug}`,
    "https://www.thejacksonwire.com/",
    "https://www.thejacksonwire.com/sitemap.xml",
  ]);

  console.log(`[autopilot] ✓ Published "${article.title}".`);
}

main().catch((err) => {
  console.error("[autopilot] FAILED:", err?.message || err);
  process.exit(1);
});
