#!/usr/bin/env node
// Autopilot — researches a fresh topic via Claude + web search, writes a full
// article in the Wire's voice, appends it to lib/posts.ts, and pushes to main.
// Triggered by .github/workflows/autopilot.yml on a cron schedule.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";

const POSTS_FILE = "lib/posts.ts";
const CATEGORIES = [
  "General News",
  "Commercial Real Estate",
  "Residential Real Estate",
  "Politics",
];

const SYSTEM_PROMPT = `You are an autopilot writer for The Jackson Wire — an independent news site covering Jackson, Mississippi: city and county politics, real estate, and the federal corruption case against DA Jody Owens, former Mayor Chokwe Antar Lumumba, and former Councilman Aaron Banks.

Your job: research a fresh, current topic on the Wire's beat using web search, then draft a complete publishable article in the Wire's voice and submit it via the publish_article tool.

VOICE
- Direct, observant, slightly literary. Short, declarative sentences. Active voice.
- No hype, no editorial flourishes beyond what the facts support.
- Analysis pieces: lead with a thesis, back it with specifics.
- Open with a strong lede that earns the reader's attention. Close with a forward-looking line or a sharp observation.

STRUCTURE
- Headline: clear, specific, not clickbait. Under ~100 characters.
- Dek: one or two sentences summarizing the article's thesis. Do NOT repeat it as the first body paragraph.
- Body: 6–12 paragraphs, each 1–4 sentences. Self-contained and quotable.

FACT DISCIPLINE — non-negotiable
- Use web_search aggressively before drafting. Search for current news on the topic.
- Every concrete claim — names, dates, dollar figures, court rulings, quotes, events — MUST trace to a web_search result you actually saw in this conversation.
- If you cannot verify a fact, leave it out. Do not paraphrase from memory.
- Attribute claims in-line by source ("according to WLBT", "Mississippi Today reported", "court filings show").
- Do not fabricate quotes. If you can't find a real quote, paraphrase and attribute.

TOPIC SELECTION
- Pick something timely — search for news from the last 7 days first.
- Avoid duplicating topics already covered (you'll be given recent titles).
- Mix categories across runs — don't write Politics back-to-back if the last article was Politics.
- Real estate, city hall, county courts, and the federal corruption case are all in scope.

OUTPUT
- After research, call publish_article exactly ONCE with the final article.
- Do not narrate your process to the user — go straight from research to publishing.`;

function todayLocalIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

async function main() {
  const client = new Anthropic();

  const postsContent = readFileSync(POSTS_FILE, "utf8");
  const recentTitles = [...postsContent.matchAll(/title:\s*"([^"]+)"/g)]
    .slice(0, 12)
    .map((m) => m[1])
    .filter((t) => t !== "Headline As It Appears");

  const today = todayLocalIso();

  const userPrompt = `Today is ${today} (America/Chicago). Research and draft a new article for The Jackson Wire.

Recent articles already published — do not duplicate these topics:
${recentTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Search the web for current Jackson MS news, then write the article and call publish_article.
Use date "${today}". Pick a category from: ${CATEGORIES.join(", ")}.`;

  const publishTool = {
    name: "publish_article",
    description:
      "Submit the final, fully-researched and written article for immediate publication on The Jackson Wire. Call this exactly once, after web research is complete.",
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
  };

  console.log(
    `[autopilot] today=${today}, recent_titles=${recentTitles.length}`,
  );

  let messages = [{ role: "user", content: userPrompt }];
  let article = null;
  let iteration = 0;

  while (iteration++ < 6) {
    console.log(`[autopilot] iteration ${iteration}: calling Claude...`);

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: SYSTEM_PROMPT,
      tools: [
        { type: "web_search_20260209", name: "web_search" },
        publishTool,
      ],
      messages,
    });

    console.log(
      `[autopilot] stop_reason=${response.stop_reason}, blocks=${response.content.length}`,
    );

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "publish_article") {
        article = block.input;
      }
    }

    if (article) break;

    if (response.stop_reason === "pause_turn") {
      messages = [
        ...messages,
        { role: "assistant", content: response.content },
      ];
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

    console.error(
      `[autopilot] Unexpected stop_reason: ${response.stop_reason}.`,
    );
    process.exit(1);
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

  // Build the TS object string
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
  if (err?.response) console.error("[autopilot] Response:", err.response);
  process.exit(1);
});
