#!/usr/bin/env node
// Autopilot — researches a fresh topic via DeepSeek + (CourtListener docket if
// available) + Tavily web search, writes a full article in the Wire's voice,
// appends it to lib/posts.ts, and pushes to main. Triggered by
// .github/workflows/autopilot.yml on a cron schedule.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import OpenAI from "openai";

const POSTS_FILE = "lib/posts.ts";
const CATEGORIES = [
  "General News",
  "Commercial Real Estate",
  "Residential Real Estate",
  "Politics",
];

// Federal criminal case the Wire is tracking. Adjust docket-number variants if
// CourtListener doesn't recognize the first one — the search tries each in turn.
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

VOICE
- Direct, observant, slightly literary. Short, declarative sentences. Active voice.
- No hype, no editorial flourishes beyond what the facts support.
- Analysis pieces: lead with a thesis, back it with specifics.
- Open with a strong lede. Close with a forward-looking line or a sharp observation.

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

TOPIC SELECTION (when falling back to news search)
- Pick something timely. Search for news from the last 7 days first.
- Avoid duplicating topics already covered (you'll be given recent titles).
- Mix categories across runs.

OUTPUT
- After research, call publish_article exactly ONCE with the final article.
- Do not narrate your process — go straight from research to publishing.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_owens_case_docket",
      description:
        "Get recent docket entries from the federal criminal case against Jody Owens, Chokwe Antar Lumumba, and Aaron Banks in the Southern District of Mississippi. Returns the most recent entries (motions, orders, filings). Call this FIRST every run, before web_search. Returns 'unavailable' if CourtListener can't be reached.",
      parameters: {
        type: "object",
        properties: {
          days_back: {
            type: "integer",
            description:
              "How many days back to look. Default 7. Maximum 30.",
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
      name: "web_search",
      description:
        "Search the web for current news and information. Returns 5 result snippets with titles, URLs, and content excerpts. Use this AFTER checking the docket, for context or fallback topic selection.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Specific search query.",
          },
        },
        required: ["query"],
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
          body: {
            type: "array",
            items: { type: "string" },
            minItems: 6,
            description:
              "Article paragraphs as plain strings. 6–12 paragraphs. Curly quotes ('' \"\") where appropriate. No markdown.",
          },
        },
        required: ["slug", "title", "dek", "category", "categories", "body"],
      },
    },
  },
];

function todayLocalIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

// --- CourtListener helpers ---------------------------------------------------

const CL_BASE = "https://www.courtlistener.com/api/rest/v3";

function clHeaders() {
  const h = { Accept: "application/json" };
  if (process.env.COURTLISTENER_API_TOKEN) {
    h.Authorization = `Token ${process.env.COURTLISTENER_API_TOKEN}`;
  }
  return h;
}

// Cached after first lookup so we don't re-search every iteration.
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
  // Last-ditch attempt: search by case name
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
    const docIds = (e.recap_documents || [])
      .map((d) => d.id)
      .filter(Boolean);
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
  // Cap at ~15k chars to keep token cost sane
  return text.length > 15000 ? text.slice(0, 15000) + "\n\n[truncated]" : text;
}

// --- Tavily search ----------------------------------------------------------

async function tavilySearch(query) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: 5,
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const results = data.results || [];
  if (results.length === 0) return "(no results)";
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\n${(r.content || "").slice(0, 1000)}`,
    )
    .join("\n\n");
}

// --- main loop --------------------------------------------------------------

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");
  if (!process.env.TAVILY_API_KEY) throw new Error("Missing TAVILY_API_KEY");

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const postsContent = readFileSync(POSTS_FILE, "utf8");
  const recentTitles = [...postsContent.matchAll(/title:\s*"([^"]+)"/g)]
    .slice(0, 12)
    .map((m) => m[1])
    .filter((t) => t !== "Headline As It Appears");

  const today = todayLocalIso();

  const userPrompt = `Today is ${today} (America/Chicago). Research and draft a new article for The Jackson Wire.

Recent articles already published — do not duplicate these topics:
${recentTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

REMINDER: call get_owens_case_docket FIRST. Only fall back to web_search if the docket has nothing of substance.
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

  while (iteration++ < MAX_ITERATIONS && !article) {
    console.log(`[autopilot] iteration ${iteration}: calling DeepSeek...`);

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
      `[autopilot] finish=${response.choices[0].finish_reason}, tool_calls=${msg.tool_calls?.length ?? 0}`,
    );

    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.error("[autopilot] Model returned no tool calls. Nudging.");
      messages.push({
        role: "user",
        content:
          "You must call get_owens_case_docket, web_search, read_court_filing, or publish_article. Do not respond with text only.",
      });
      continue;
    }

    for (const tc of msg.tool_calls) {
      const name = tc.function.name;
      let args;
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch (e) {
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: `Error parsing arguments: ${e.message}. Retry with valid JSON.`,
        });
        continue;
      }

      if (name === "get_owens_case_docket") {
        const daysBack = Math.min(Math.max(args.days_back ?? 7, 1), 30);
        console.log(`[autopilot] docket: last ${daysBack} days`);
        try {
          const out = await getOwensCaseDocket(daysBack);
          messages.push({ role: "tool", tool_call_id: tc.id, content: out });
        } catch (e) {
          console.error(`[autopilot] docket failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `CourtListener unavailable (${e.message}). Fall back to web_search for topic selection.`,
          });
        }
      } else if (name === "read_court_filing") {
        console.log(`[autopilot] read filing: ${args.recap_document_id}`);
        try {
          const out = await readCourtFiling(args.recap_document_id);
          messages.push({ role: "tool", tool_call_id: tc.id, content: out });
        } catch (e) {
          console.error(`[autopilot] read filing failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `Could not read filing: ${e.message}`,
          });
        }
      } else if (name === "web_search") {
        console.log(`[autopilot] search: "${args.query}"`);
        try {
          const results = await tavilySearch(args.query);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: results,
          });
        } catch (e) {
          console.error(`[autopilot] Search failed:`, e.message);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `Search error: ${e.message}`,
          });
        }
      } else if (name === "publish_article") {
        article = args;
        console.log(`[autopilot] publish_article called.`);
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

  const articleObj = `  {
    slug: ${JSON.stringify(article.slug)},
    title: ${JSON.stringify(article.title)},
    dek: ${JSON.stringify(article.dek)},
    category: ${JSON.stringify(article.category)},${categoriesLine}
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

  console.log(`[autopilot] ✓ Published "${article.title}".`);
}

main().catch((err) => {
  console.error("[autopilot] FAILED:", err?.message || err);
  if (err?.response?.data) {
    console.error("[autopilot] Response:", JSON.stringify(err.response.data));
  }
  process.exit(1);
});
