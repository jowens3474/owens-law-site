#!/usr/bin/env node
// Autopilot — researches a fresh topic via DeepSeek + Tavily web search, writes
// a full article in the Wire's voice, appends it to lib/posts.ts, and pushes to
// main. Triggered by .github/workflows/autopilot.yml on a cron schedule.

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

const SYSTEM_PROMPT = `You are an autopilot writer for The Jackson Wire — an independent news site covering Jackson, Mississippi: city and county politics, real estate, and the federal corruption case against DA Jody Owens, former Mayor Chokwe Antar Lumumba, and former Councilman Aaron Banks.

Your job: research a fresh, current topic on the Wire's beat using the web_search tool, then draft a complete publishable article in the Wire's voice and submit it via the publish_article tool. Call publish_article exactly once, after research is complete.

VOICE
- Direct, observant, slightly literary. Short, declarative sentences. Active voice.
- No hype, no editorial flourishes beyond what the facts support.
- Analysis pieces: lead with a thesis, back it with specifics.
- Open with a strong lede that earns the reader's attention. Close with a forward-looking line or a sharp observation.

STRUCTURE
- Headline: clear, specific, not clickbait. Under ~100 characters.
- Dek: one or two sentences summarizing the thesis. Do NOT repeat it as the first body paragraph.
- Body: 6–12 paragraphs, each 1–4 sentences.

FACT DISCIPLINE — non-negotiable
- Call web_search 3–6 times before drafting. Search current news in the last 7 days first.
- Every concrete claim — names, dates, dollar figures, court rulings, quotes, events — MUST trace to a web_search result you actually saw in this conversation.
- If you cannot verify a fact from search results, leave it out. Do not paraphrase from training data.
- Attribute claims in-line by source ("according to WLBT", "Mississippi Today reported", "court filings show").
- Do not fabricate quotes. If you can't find a real quote in search results, paraphrase and attribute.
- For stories naming Jody Owens, Chokwe Antar Lumumba, Aaron Banks, Kenny Stokes, John Horhn, or any other living public figure, every claim about them must trace to a web_search result.

TOPIC SELECTION
- Pick something timely. Search for news from the last 7 days first.
- Avoid duplicating topics already covered (you'll be given recent titles).
- Mix categories across runs — don't write Politics back-to-back if the last article was Politics.
- Real estate, city hall, county courts, and the federal corruption case are all in scope.

OUTPUT
- After research, call publish_article exactly ONCE with the final article.
- Do not narrate your process — go straight from research to publishing.`;

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
      name: "publish_article",
      description:
        "Submit the final, fully-researched and written article for immediate publication on The Jackson Wire. Call this exactly once, after web research is complete.",
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
              "One or two sentences summarizing the article. Shown italicized under the headline; do not also start the body with this same sentence.",
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
  if (results.length === 0) {
    return "(no results)";
  }
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\n${(r.content || "").slice(0, 1000)}`,
    )
    .join("\n\n");
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("Missing TAVILY_API_KEY");
  }

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

Use the web_search tool 3–6 times to find current Jackson MS news, then call publish_article with the full article.
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
  const MAX_ITERATIONS = 14;

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
      console.error(
        "[autopilot] Model returned no tool calls. Nudging it to call publish_article.",
      );
      messages.push({
        role: "user",
        content:
          "You must call either the web_search tool or the publish_article tool. Do not respond with text only.",
      });
      continue;
    }

    for (const tc of msg.tool_calls) {
      const name = tc.function.name;
      let args;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch (e) {
        console.error(
          `[autopilot] Failed to parse arguments for ${name}:`,
          e.message,
        );
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

  // Sanitize slug
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
