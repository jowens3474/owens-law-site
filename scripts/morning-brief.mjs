#!/usr/bin/env node
// Morning Brief autopilot — a daily 5-item summary of what Jackson needs to
// know this morning. Different format from the standard autopilot article:
// shorter items, broader topic mix, no single-topic deep dive. Runs early
// in the morning Central time so the brief lands at breakfast.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { pingIndexNow } from "./lib/indexnow.mjs";

const POSTS_FILE = "lib/posts.ts";

const OWENS_CASE = {
  label: "U.S. v. Owens, Lumumba, and Banks",
  court: "mssd",
  docketNumberVariants: [
    "3:24-cr-00103",
    "3:24-cr-103",
    "24-cr-103",
    "24-103",
  ],
};

const SYSTEM_PROMPT = `You are the morning brief writer for The Jackson Wire — an independent news site covering Jackson, Mississippi.

Your job: produce the day's Morning Brief, a punchy summary of the FIVE things Jackson residents most need to know this morning. The brief is the Wire's daily front-door product. It should make readers feel current on Jackson by 7 a.m. Central.

FORMAT — strict
- Five items. Exactly five.
- Each item is ONE self-contained body string with this exact structure:
    "Short headline phrase: Body paragraph text..."
- The HEADLINE PHRASE is 3 to 9 words, no terminal period, written to stand alone as a sub-headline (e.g. "Saxum rezoning vote looms", "Court strikes jurors for cause", "Lumumba calls for water-board overhaul"). It is followed by a colon and a single space, then the body.
- The BODY is 70 to 130 words of context, attribution, and stakes, written in the Wire's voice.
- Items must be ordered by news weight: biggest first. Item 1 should hook the reader. Item 5 can be lighter.
- Do not number the items yourself; the site renders the number.

TOPIC MIX — required
- Across the five items, cover a MIX of beats. Do NOT make all five about the corruption case.
- Typical mix: 1 corruption-case item (only if there's real news), 1 city or county politics item, 1 real estate / business / development item, 1 infrastructure / utilities / regulatory item, 1 cultural / school / community item.
- If the corruption case has nothing new in the last 24 hours, replace it with another beat.

RESEARCH ORDER
1. Call get_owens_case_docket FIRST to check for new substantive filings in the last 24 hours. Include only if there's real news (motion, ruling, order, not a routine notice).
2. Call web_search 3 to 6 times across the Wire's beats to find news from the last 24 hours. Vary your searches across topics.
3. When a city/county/state meeting is happening today or this week, use web_search to find the agenda or notice URL, then call fetch_url to read it directly. Quote from the agenda. This is what differentiates the Wire from competitors.
4. Build the 5-item lineup, ordered by news weight.

PRIMARY SOURCES (use fetch_url for these)
- Jackson City Council, Planning Board, Zoning hearings: jacksonms.gov
- Hinds County Board of Supervisors: hindscountyms.com
- Mississippi PSC dockets (especially 2026-AD-10 data center): psc.ms.gov
- Mississippi Legislature bill text: legislature.ms.gov
- Mississippi Secretary of State filings: sos.ms.gov
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
- Title format: 'Morning Brief: [Date in "Mon DD" form] — [punchy summary of the day's biggest story]'. Example: 'Morning Brief: Jun 16 — Pretrial Conference Lands; Saxum Vote Looms'.
- Dek: ONE sentence summarizing the biggest item. Do not repeat as the first item.
- Body: 5 paragraphs, one per item. Each starts with a fact-dense lead sentence.
- Category: "General News"
- Tags: ["morning-brief"]`;

const TOOLS = [
  { type: "web_search_20260209", name: "web_search" },
  {
    name: "fetch_url",
    description:
      "Fetch the text content of a public government, court, or news URL. Handles HTML, PDF agendas, and JSON. Use to read primary-source documents directly: Council agendas, PSC filings, county board notices, legislative bill text. Find the URL via web_search first, then fetch_url it.",
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
      "Get recent docket entries from the federal criminal case against Jody Owens, Chokwe Antar Lumumba, and Aaron Banks. Returns the most recent entries (motions, orders, filings). Call this FIRST. Returns 'unavailable' if CourtListener can't be reached.",
    input_schema: {
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
  {
    name: "read_court_filing",
    description:
      "Read the full plain text of a specific court filing by its recap_document_id. Use sparingly in the brief — only when the filing is genuinely the lead.",
    input_schema: {
      type: "object",
      properties: {
        recap_document_id: { type: "integer" },
      },
      required: ["recap_document_id"],
    },
  },
  {
    name: "publish_brief",
    description:
      "Submit the final Morning Brief for immediate publication. Call this exactly once after research is complete.",
    input_schema: {
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
            "Headline. Format: 'Morning Brief: Jun 16 — [punchy summary]'.",
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
];

// --- CourtListener helpers (copy of autopilot.mjs's) ------------------------

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
    const res = await fetch(url, { headers: clHeaders() });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.results?.length) {
      cachedOwensDocketId = data.results[0].id;
      return cachedOwensDocketId;
    }
  }
  const url = `${CL_BASE}/dockets/?court=${OWENS_CASE.court}&case_name__icontains=Owens`;
  const res = await fetch(url, { headers: clHeaders() });
  if (res.ok) {
    const data = await res.json();
    if (data.results?.length) {
      cachedOwensDocketId = data.results[0].id;
      return cachedOwensDocketId;
    }
  }
  throw new Error("Owens case not found on CourtListener");
}

async function getOwensCaseDocket(daysBack = 3) {
  const docketId = await findOwensDocketId();
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const url = `${CL_BASE}/docket-entries/?docket=${docketId}&order_by=-date_filed&page_size=25`;
  const res = await fetch(url, { headers: clHeaders() });
  if (!res.ok) {
    throw new Error(`docket-entries HTTP ${res.status}`);
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
    `Recent docket entries (last ${daysBack} days):`,
    "",
  ];
  for (const e of entries) {
    const docIds = (e.recap_documents || []).map((d) => d.id).filter(Boolean);
    lines.push(`[Entry #${e.entry_number ?? "?"}, ${e.date_filed}]`);
    lines.push(`${(e.description || "(no description)").slice(0, 600)}`);
    if (docIds.length) lines.push(`recap_document_id: ${docIds.join(", ")}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function readCourtFiling(recapDocumentId) {
  const url = `${CL_BASE}/recap-documents/${recapDocumentId}/`;
  const res = await fetch(url, { headers: clHeaders() });
  if (!res.ok) throw new Error(`recap-document HTTP ${res.status}`);
  const data = await res.json();
  const text = data.plain_text || "";
  if (!text.trim()) {
    return `(no extracted text; description: ${
      data.description || data.short_description || "n/a"
    })`;
  }
  return text.length > 10000 ? text.slice(0, 10000) + "\n\n[truncated]" : text;
}

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
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const client = new Anthropic();

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
1. Call get_owens_case_docket FIRST. Include a corruption-case item ONLY if there's a substantive filing in the last 2-3 days.
2. Call web_search 3-6 times across the Wire's beats: politics, city hall, real estate, business, infrastructure, schools, courts.
3. Compose 5 items, mixed across beats, news-weight order.
4. Call publish_brief with slug "morning-brief-${today}", title format "Morning Brief: ${pretty} — [punchy summary]".`;

  console.log(`[brief] today=${today} (${pretty})`);

  const messages = [{ role: "user", content: userPrompt }];

  let brief = null;
  let iteration = 0;
  const MAX_ITERATIONS = 14;
  let container = null;

  while (iteration++ < MAX_ITERATIONS && !brief) {
    console.log(`[brief] iteration ${iteration}: calling Claude...`);

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
      `[brief] stop_reason=${response.stop_reason}, blocks=${response.content.length}`,
    );

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "publish_brief") {
        brief = block.input;
      }
    }
    if (brief) break;

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "pause_turn") continue;

    if (response.stop_reason === "end_turn") {
      console.error("[brief] Model ended turn without calling publish_brief.");
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      console.error("[brief] Final text:", text.slice(0, 1000));
      process.exit(1);
    }

    if (response.stop_reason !== "tool_use") {
      console.error(`[brief] Unexpected stop_reason: ${response.stop_reason}`);
      process.exit(1);
    }

    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const name = block.name;

      if (name === "get_owens_case_docket") {
        const daysBack = Math.min(Math.max(block.input?.days_back ?? 3, 1), 14);
        try {
          const content = await getOwensCaseDocket(daysBack);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content,
          });
        } catch (e) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `CourtListener unavailable (${e.message}). Skip corruption-case item.`,
            is_error: true,
          });
        }
      } else if (name === "read_court_filing") {
        try {
          const content = await readCourtFiling(block.input.recap_document_id);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content,
          });
        } catch (e) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Could not read filing: ${e.message}`,
            is_error: true,
          });
        }
      } else if (name === "fetch_url") {
        console.log(`[brief] fetch_url: ${block.input?.url}`);
        try {
          const { contentType, text } = await fetchUrl(block.input.url);
          const truncated =
            text.length > 12000 ? text.slice(0, 12000) + "\n\n[truncated]" : text;
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `[${contentType}]\n${truncated}`,
          });
        } catch (e) {
          console.error(`[brief] fetch_url failed:`, e.message);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Fetch failed: ${e.message}`,
            is_error: true,
          });
        }
      } else if (name === "publish_brief") {
        // captured above
      } else {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Unknown tool: ${name}`,
          is_error: true,
        });
      }
    }

    if (toolResults.length === 0) continue;
    messages.push({ role: "user", content: toolResults });
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

  console.log(`[brief] ✓ Published "${brief.title}".`);
}

main().catch((err) => {
  console.error("[brief] FAILED:", err?.message || err);
  process.exit(1);
});
