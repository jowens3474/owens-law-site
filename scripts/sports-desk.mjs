#!/usr/bin/env node
// Sports desk: researches the day's biggest Mississippi college sports story
// with DeepSeek, web search, the Sports tab's own headline feeds and ESPN's
// schedule data, writes one original article in the Wire's voice, appends it
// to lib/posts.ts as a sports story (category "General News", tag
// "sports-ms-college"), and pushes to main. Run by
// .github/workflows/sports-desk.yml.
//
// The beat is Ole Miss and Mississippi State (football, men's and women's
// basketball, baseball). Southern Miss, Jackson State and the other
// Mississippi schools get the story only when they have the day's biggest
// news.
//
// Every draft goes through scripts/lib/sports-desk-checks.mjs before it can
// publish: sources it actually opened, quotes found word for word in what it
// read, the next game matching ESPN's schedule, weekdays matching dates, no
// betting language, length and the What's next paragraph, and no repeat of a
// recent story. A draft with problems goes back to the model once or twice;
// one that still fails is not published.
//
// DRY_RUN=1 does everything except write, commit and push: the draft and its
// check results are printed (and added to the run summary on GitHub).
//
// The editor can steer it with data/sports-assignments.json, the same list
// format as the news desk's data/assignments.json (scripts/lib/assignments.mjs).

import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import OpenAI from "openai";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { webSearch } from "./lib/search.mjs";
import { runDataTool } from "./lib/data-tools.mjs";
import { pingIndexNow } from "./lib/indexnow.mjs";
import { checkSeoTitle, SEO_TITLE_MAX } from "./lib/seo-title.mjs";
import { wellFormedMessages } from "./lib/well-formed-messages.mjs";
import { readAssignments, writeAssignments, pickAssignment, applyOutcome } from "./lib/assignments.mjs";
import { buildSportsHeadlines } from "../lib/sports-feeds.mjs";
import { teamSchedule, SCHEDULE_SCHOOLS, SPORTS, weekdayOf } from "./lib/espn-schedule.mjs";
import { draftProblems, STORY_SCHOOLS, STORY_SPORTS } from "./lib/sports-desk-checks.mjs";

const DRY_RUN = process.env.DRY_RUN === "1";
const POSTS_FILE = "lib/posts.ts";
const SPORTS_ASSIGNMENTS_FILE = "data/sports-assignments.json";
const SPORTS_TAG = "sports-ms-college";
const MAX_ITERATIONS = 16;
const WRAP_UP_AT = 12;
const MAX_REVISIONS = 2;
const FETCH_CHARS = 18000;
const MIN_SOURCE_CHARS = 400;
const log = (...a) => console.log("[sports-desk]", ...a);

// Lead headlines that name a Mississippi school, for picking SEC items out of
// the SEC section. The Mississippi college section is taken whole.
const MS_NAMES =
  /\b(Ole Miss|Rebels|Mississippi State|Hail State|Starkville|Oxford|Southern Miss|Golden Eagles|Jackson State|JSU|Alcorn|Valley State|Delta State|Mississippi College|Millsaps|Belhaven|William Carey)\b/i;

const SYSTEM_PROMPT = `You are the sports desk writer for The Jackson Wire, an independent news site in Jackson, Mississippi. Each day you research and write one original article about Mississippi college sports and submit it with the publish_sports_article tool.

THE BEAT
- Core: Ole Miss and Mississippi State, the state's two power-conference (SEC) programs, in football, men's basketball, women's basketball and baseball. Another sport at those schools only when it is clearly the biggest story of the day (a national title run, a coaching scandal, a major NCAA ruling).
- Southern Miss, Jackson State, Alcorn State, Mississippi Valley State, Delta State and the state's other colleges get the story only when they have the day's biggest news: a coaching change, a championship, a historic result, a major NCAA or conference ruling, a stadium or arena decision. Otherwise stay with Ole Miss and State.
- Write about the single biggest story across those schools and sports.

WHAT TO PICK, in order
1. Breaking news from the last 24 to 36 hours: a game moved, postponed or canceled; injuries and suspensions; coaching hires, firings and contracts; transfers and commitments; SEC or NCAA rulings; NIL news tied to these schools.
2. A big result and what it means: rankings, standings, the bowl or NCAA tournament picture.
3. On a game day, the setup: what is at stake, the kickoff, tipoff or first-pitch time, and TV.
4. On a slow day, a deeper explainer: a coach under pressure, the transfer portal, a recruiting class, a schedule or conference change. Never a filler recap.
- Do not repeat a topic from the recent sports stories you are given unless there is genuinely new information; then lead with what is new.
- Tie-breakers: Ole Miss and Mississippi State news beats other schools; in the fall, football beats other sports unless another story is clearly bigger.
- When the user prompt includes TODAY'S ASSIGNMENT, that assignment is today's story and outranks everything above. Research it first and write it. Skip it only if, after opening its sources and searching, nothing new about it can be verified; bigger news elsewhere is not a reason to skip it.

RESEARCH ORDER
1. Start with the leads in the user prompt and with news_feed for "Ole Miss" and "Mississippi State" over the last 36 hours (and any other school with big news in the leads).
2. Pick the story, then open the best sources with fetch_url and read them: the school's or conference's own announcement and at least one news report. Search results and leads are pointers, not sources.
3. Call team_schedule for the school and sport of your story. Use it for every date, time, opponent, score and TV listing you state. If ESPN's data and a news report disagree on a date or time, go with the school's own announcement and say what changed.
4. Use web_search for anything else you need, then fetch_url what you will rely on.

FACT DISCIPLINE, non-negotiable
- Every concrete claim (names, dates, times, scores, statistics, records, rankings, injuries, quotes, contract terms) must come from a tool result you saw in this conversation. Never rely on memory for rosters, coaches, records or schedules: they change every season.
- Attribute in line: "the school announced," "ESPN's schedule lists," "the Clarion Ledger reported," "according to the SEC."
- Quote only word for word from a page you read, keep quotes short, and credit them. If you cannot find a real quote, paraphrase and attribute. Never invent or tidy up a quote. When you paraphrase, use clearly different words; never reuse a source's sentence without quotation marks.
- Every number (scores, records, statistics, rankings, attendance, dollar figures) must appear exactly as written in a source you read. Do not compute records, totals or percentages yourself.
- Injuries, transfers and coaching moves: report only what was announced or what a named outlet reported, and attribute it. Never present a rumor as fact.
- No betting lines, point spreads, odds, over/unders or sportsbook names.
- Be fair to every school and opponent. No cheerleading, no "we" or "our."
- Never preview a game that has already started. The user prompt gives the current Central time, and team_schedule marks games under way. If a game has begun or ended, report the result or pick another story.
- Wikipedia is not a source. Use the schools, the conferences, the NCAA, ESPN and news outlets.

STORY REQUIREMENTS
- Headline: clear and specific, under 100 characters. Numbers and proper nouns welcome.
- Dek: one or two sentences, under 40 words, not repeated as the first paragraph.
- Body: 5 to 8 paragraphs of 1 to 4 short sentences, about 450 to 650 words, never more than 750.
- Lead with the news, then what it means: for the season, the standings, the program.
- Include at least one fact or comparison a box score would not give readers (a record, a streak, a schedule consequence, a piece of program history), from your sources.
- AP style: "Sunday, Nov. 15"; times like "7:30 p.m." or "noon," Central time.
- End with the "What's next" section: exactly one paragraph begins with "What's next:". Name the next game with its date, Central time and TV when announced (from team_schedule), or the next decision and who makes it.
- When the What's next paragraph names a game, it must be the team's very next scheduled game, and nextGame must carry its school, sport, opponent, date and time exactly as team_schedule lists them. Give that date, time and opponent in the paragraph too.

VOICE AND PUNCTUATION
- Short, declarative sentences. Active voice. Direct and observant, never breathless.
- Do not use em dashes or en dashes anywhere. Use commas, periods, colons or parentheses.
- Do not end with a one-line kicker; end with the What's next section.

OUTPUT
- Call publish_sports_article once with the article, the school and sport it is about, nextGame when the What's next names a game, and sources: the URLs you opened and relied on. List at least two, including at least one official source (a school, conference, the NCAA or the team_schedule source) or established news outlet, and at least one page you read with fetch_url.
- If the tool answers with problems, fix every one and call publish_sports_article again with the full corrected article.
- If nothing new can be verified today, reply with the exact text NO_ARTICLE and nothing else.
- Do not narrate your process.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current news and information. Returns result snippets with titles, URLs and excerpts. Snippets are pointers; open what you rely on with fetch_url.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "A specific, news-style search query." } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Fetch and read a public page: a school or conference announcement, a news report, a PDF or JSON. Returns the visible text. Use it on every source you rely on.",
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
      name: "news_feed",
      description:
        "Recent headlines from Google News and GDELT for a query, newest first, with links. No key, no quota. Start with 'Ole Miss' and 'Mississippi State'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search phrase, e.g. 'Ole Miss football'." },
          hours: { type: "integer", description: "Lookback window in hours (default 24, max 168).", minimum: 1, maximum: 168 },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "team_schedule",
      description:
        "ESPN's schedule for one school in one sport: the last three results and the next four games, with dates in AP style, Central times, opponents, venues and TV. Use it for every date, time, score and TV listing in the story.",
      parameters: {
        type: "object",
        properties: {
          school: { type: "string", enum: SCHEDULE_SCHOOLS },
          sport: { type: "string", enum: SPORTS },
        },
        required: ["school", "sport"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_sports_article",
      description:
        "Submit the finished sports article. The desk checks it before publishing and answers with any problems to fix.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: { type: "string", description: "URL slug: lowercase words and hyphens only." },
          title: { type: "string", description: "Headline, under 100 characters." },
          seoTitle: {
            type: "string",
            description: `Search and browser-tab title, ${SEO_TITLE_MAX} characters or fewer, in the form "<School or team>: <what happened>". Only facts in the headline and body. No dashes. Do not add the site name.`,
          },
          dek: { type: "string", description: "One or two sentences, under 40 words." },
          school: { type: "string", enum: STORY_SCHOOLS, description: "The school the story is mainly about." },
          sport: { type: "string", enum: STORY_SPORTS, description: "The sport the story is mainly about." },
          body: {
            type: "array",
            items: { type: "string" },
            minItems: 5,
            description:
              "5 to 8 plain-text paragraphs, about 450 to 650 words, never more than 750. Exactly one paragraph, one of the last two, begins with \"What's next:\". No markdown.",
          },
          nextGame: {
            type: "object",
            additionalProperties: false,
            description: "The game the What's next paragraph names, exactly as team_schedule lists it. Omit when it names no game.",
            properties: {
              school: { type: "string", enum: SCHEDULE_SCHOOLS },
              sport: { type: "string", enum: SPORTS },
              opponent: { type: "string" },
              date: { type: "string", description: "YYYY-MM-DD, Central." },
              time: { type: "string", description: "As team_schedule lists it, e.g. \"7:30 p.m.\", \"noon\" or \"TBA\"." },
              tv: { type: "string" },
            },
          },
          sources: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            description: "URLs you opened and relied on: fetch_url pages and, if used, the team_schedule source URL.",
          },
          assignmentOutcome: {
            type: "string",
            description:
              "Only when the prompt gave you TODAY'S ASSIGNMENT: exactly \"done\" if this is that story, or \"skipped: <short reason>\".",
          },
        },
        required: ["slug", "title", "seoTitle", "dek", "school", "sport", "body", "sources"],
      },
    },
  },
];

function nowCentral() {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }).format(new Date());
}

function todayLocalIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}

/** The newest sports stories in lib/posts.ts (file order is newest first). */
function recentSportsTitles(postsContent, limit = 10) {
  const out = [];
  for (const block of postsContent.split(/\n  \{\n/).slice(1)) {
    const title = block.match(/\n    title:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
    const date = block.match(/\n    date:\s*"([^"]+)"/)?.[1] ?? "";
    const tags = block.match(/\n    tags:\s*\[([^\]]*)\]/)?.[1] ?? "";
    if (!title || !tags.includes('"sports-')) continue;
    out.push({ title: title.replace(/\\"/g, '"'), date });
    if (out.length >= limit) break;
  }
  return out;
}

async function gatherLeads() {
  try {
    const { sections, report } = await buildSportsHeadlines({ deadlineMs: 25000 });
    const pool = [...(sections["ms-college"] || []), ...(sections.sec || []).filter((h) => MS_NAMES.test(h.title))];
    const seen = new Set();
    const leads = [];
    for (const h of pool.sort((a, b) => b.date.localeCompare(a.date))) {
      if (seen.has(h.link)) continue;
      seen.add(h.link);
      leads.push(h);
    }
    return { leads: leads.slice(0, 40), ok: report.filter((r) => r.ok).length, total: report.length };
  } catch (e) {
    log(`leads unavailable: ${e.message}`);
    return { leads: [], ok: 0, total: 0 };
  }
}

function assignmentBlock(item) {
  const text = (v) => (typeof v === "string" ? v.trim() : "");
  const sources = (Array.isArray(item.sources) ? item.sources : []).map(text).filter((s) => /^https?:\/\//i.test(s));
  return [
    "TODAY'S ASSIGNMENT",
    "The editor assigned this story. It is today's story: research it first, call team_schedule for its school and sport, and write it.",
    `Topic: ${text(item.topic)}`,
    `Angle: ${text(item.angle) || "none given"}`,
    "Sources to open first (fetch_url):",
    ...(sources.length ? sources.map((s) => `- ${s}`) : ["- none listed"]),
    'Set assignmentOutcome to "done" when you write it. Only if, after opening its sources and searching, nothing new about it can be verified, write the day\'s best story instead and set assignmentOutcome to "skipped: <short reason>". Bigger news elsewhere is not a reason to skip it. Every fact rule applies unchanged.',
  ].join("\n");
}

function typeCheck() {
  execSync("npx next typegen", { stdio: "inherit" });
  execSync("npx tsc --noEmit -p .", { stdio: "inherit" });
}

function sanitizeSlug(raw) {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-$/, "");
}

function postObject(article, today, seoTitle) {
  const seoLine = seoTitle ? `\n    seoTitle: ${JSON.stringify(seoTitle)},` : "";
  return `  {
    slug: ${JSON.stringify(article.slug)},
    title: ${JSON.stringify(article.title.trim())},${seoLine}
    dek: ${JSON.stringify(article.dek.trim())},
    category: "General News",
    tags: ${JSON.stringify([SPORTS_TAG])},
    author: "Jackson Wire Staff",
    date: ${JSON.stringify(today)},
    views: 0,
    body: [
${article.body.map((p) => `      ${JSON.stringify(String(p).trim())},`).join("\n")}
    ],
  },
`;
}

function insertPost(postsContent, obj) {
  const updated = postsContent.replace(/const POSTS: Post\[\] = \[\n/, (m) => m + obj);
  if (updated === postsContent) throw new Error("Could not find the POSTS array marker in lib/posts.ts.");
  return updated;
}

function summarize(lines) {
  console.log(lines.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
    } catch {
      /* the summary is a convenience */
    }
  }
}

function draftSummary(article, problems, usage, heading) {
  const ng = article.nextGame && article.nextGame.opponent ? article.nextGame : null;
  return [
    `## ${heading}`,
    "",
    `**${article.title}**`,
    "",
    `_${article.dek}_`,
    "",
    [
      `School: ${article.school}`,
      `Sport: ${article.sport}`,
      ng ? `Next game: ${ng.school || article.school} ${ng.sport || article.sport} vs. ${ng.opponent}, ${ng.date}, ${ng.time || "time not given"}` : "",
      article.assignmentOutcome ? `Assignment: ${article.assignmentOutcome}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
    "",
    ...article.body.flatMap((p) => [p, ""]),
    "Sources:",
    ...(Array.isArray(article.sources) ? article.sources : []).map((s) => `- ${s}`),
    "",
    problems.length ? "Problems found by the checks:" : "Checks: all passed.",
    ...problems.map((p) => `- ${p}`),
    "",
    `DeepSeek usage: ${usage.calls} calls, ${usage.prompt} prompt tokens (${usage.hit} cached, ${usage.miss} not cached), ${usage.completion} completion tokens.`,
  ];
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");
  if (!process.env.TAVILY_API_KEY && !process.env.BRAVE_API_KEY) {
    log("No TAVILY_API_KEY or BRAVE_API_KEY; web_search will rely on DuckDuckGo.");
  }
  // A tree that already fails the type check would make this run's check fail
  // for reasons that are not the draft's. Find out before paying for a draft.
  if (!DRY_RUN) {
    log("Baseline type check before any model call: next typegen, then tsc.");
    typeCheck();
  }

  const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" });
  const postsContent = readFileSync(POSTS_FILE, "utf8");
  const today = todayLocalIso();
  const recent = recentSportsTitles(postsContent);
  const { leads, ok, total } = await gatherLeads();
  log(`today=${today}, recent sports stories=${recent.length}, leads=${leads.length} (feeds read ${ok} of ${total}), dry_run=${DRY_RUN}`);

  const { items: assignmentItems, problem: assignmentProblem } = readAssignments(SPORTS_ASSIGNMENTS_FILE);
  if (assignmentProblem) log(`Sports assignment list ignored: ${assignmentProblem}`);
  const assignment = pickAssignment(assignmentItems);
  log(`assignment=${assignment ? assignment.id : "none"}`);

  const userPrompt = [
    `Today is ${today} (${weekdayOf(today)}, America/Chicago); it is now ${nowCentral()} Central. Write today's Mississippi college sports article for The Jackson Wire.`,
    "",
    "Recent Wire sports stories (newest first). Do not repeat these topics unless there is genuinely new information:",
    ...(recent.length ? recent.map((r, i) => `${i + 1}. [${r.date}] ${r.title}`) : ["(none yet)"]),
    "",
    "Today's leads: headlines from the schools' athletics sites and Mississippi, SEC and national outlets, newest first. They are leads, not sources: open what you use with fetch_url.",
    ...(leads.length
      ? leads.map((h) => `- ${h.date.slice(0, 10)} | ${h.outlet}${h.sport ? ` | ${h.sport}` : ""} | ${h.title} | ${h.link}`)
      : ["(The leads feeds did not load today. Start with news_feed.)"]),
    "",
    'Steps: news_feed for "Ole Miss" and "Mississippi State" (36 hours), then pick the single biggest story by the rules, open the official announcement and at least one news report with fetch_url, call team_schedule for the story\'s school and sport, and publish with publish_sports_article.',
    ...(assignment ? ["", assignmentBlock(assignment), "", "With an assignment, do it first: open its sources, search for it, and write it unless it truly cannot be verified."] : []),
  ].join("\n");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  // What this run has read, for the checks: the text of every tool result,
  // the pages opened with fetch_url, and the schedules pulled.
  const sourceTexts = [];
  const readUrls = new Set();
  const schedules = [];
  const scheduleErrors = new Map(); // "school|sport" -> last error, told to the model with the check
  const usage = { calls: 0, prompt: 0, completion: 0, hit: 0, miss: 0 };
  const ctx = () => ({
    today,
    now: new Date().toISOString(),
    sourceTexts,
    readUrls: [...readUrls],
    schedules,
    scheduleUrls: schedules.map((s) => s.url),
    recentSportsTitles: recent.map((r) => r.title),
  });

  let article = null;
  let lastDraft = null;
  let lastProblems = [];
  let revisions = 0;
  let rejected = false; // a draft failed its checks after the last revision
  let iteration = 0;
  const maxIterations = MAX_ITERATIONS + MAX_REVISIONS;

  while (iteration++ < maxIterations && !article) {
    if (iteration === WRAP_UP_AT && !lastDraft) {
      log("research window closed; instructing the model to write.");
      messages.push({
        role: "user",
        content:
          "Research time is over. Using only what you have read, call publish_sports_article now with the strongest story you can support. If nothing can be verified, reply with the exact text NO_ARTICLE." +
          (assignment ? ' If TODAY\'S ASSIGNMENT is not supported, publish the strongest other story and set assignmentOutcome to "skipped: <short reason>".' : ""),
      });
    }
    const isFinal = iteration === maxIterations;
    log(`iteration ${iteration}: calling DeepSeek...`);
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: wellFormedMessages(messages),
      tools: TOOLS,
      tool_choice: isFinal ? { type: "function", function: { name: "publish_sports_article" } } : "auto",
      temperature: 0.3,
      max_tokens: 8000,
    });
    const u = response.usage || {};
    usage.calls++;
    usage.prompt += u.prompt_tokens || 0;
    usage.completion += u.completion_tokens || 0;
    usage.hit += u.prompt_cache_hit_tokens || 0;
    usage.miss += u.prompt_cache_miss_tokens || 0;

    const choice = response.choices[0];
    const msg = choice.message;
    log(`finish=${choice.finish_reason}, tool_calls=${msg.tool_calls?.length ?? 0}`);

    if (choice.finish_reason !== "tool_calls" || !msg.tool_calls?.length) {
      messages.push(msg);
      if ((msg.content || "").trim() === "NO_ARTICLE") {
        summarize([`## Sports desk: no story today`, "", "The model found nothing new it could verify.", "", `DeepSeek usage: ${usage.calls} calls, ${usage.prompt} prompt tokens, ${usage.completion} completion tokens.`]);
        return;
      }
      messages.push({ role: "user", content: "Call a research tool or publish_sports_article. Do not answer with text only." });
      continue;
    }

    messages.push(msg);
    for (const tc of msg.tool_calls) {
      const name = tc.function.name;
      let args;
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch (e) {
        messages.push({ role: "tool", tool_call_id: tc.id, content: `Arguments were not valid JSON (${e.message}). Retry with valid JSON.` });
        continue;
      }
      let content = "";
      if (name === "publish_sports_article") {
        lastDraft = args;
        const problems = draftProblems(args, ctx()).map((p) => {
          const m = p.match(/^Call team_schedule for (.+?) (football|men's basketball|women's basketball|baseball) /);
          const err = m && scheduleErrors.get(`${m[1]}|${m[2]}`);
          return err ? `${p} (Your last team_schedule call for it failed: ${err}. Call it once more.)` : p;
        });
        lastProblems = problems;
        if (problems.length === 0) {
          article = args;
          content = "Article accepted.";
        } else if (revisions < MAX_REVISIONS) {
          revisions++;
          log(`draft ${revisions} has ${problems.length} problem(s); asking for a revision.`);
          for (const p of problems) log(`  - ${p}`);
          content = `Not published yet. Fix every problem below, then call publish_sports_article again with the full corrected article:\n${problems.map((p) => `- ${p}`).join("\n")}`;
        } else {
          rejected = true;
          content = "Not published.";
        }
      } else if (name === "web_search") {
        log(`search: "${args.query}"`);
        try {
          content = await webSearch(String(args.query || ""), { prefix: "sports-desk" });
        } catch (e) {
          content = `Search error: ${e.message}`;
        }
        sourceTexts.push(content);
      } else if (name === "fetch_url") {
        log(`fetch_url: ${args.url}`);
        let host = "";
        try {
          host = new URL(String(args.url || "")).hostname;
        } catch {
          /* fetchUrl reports a bad URL below */
        }
        if (/(^|\.)wikipedia\.org$/i.test(host)) {
          messages.push({ role: "tool", tool_call_id: tc.id, content: "Wikipedia is not a source for Wire stories. Use the school, the conference, the NCAA, ESPN or a news outlet." });
          continue;
        }
        try {
          const { contentType, text, finalUrl } = await fetchUrl(String(args.url || ""));
          const seen = text.length > FETCH_CHARS ? `${text.slice(0, FETCH_CHARS)}\n\n[truncated]` : text;
          content = `[${contentType}]\n${seen}`;
          sourceTexts.push(seen);
          // A page that came back nearly empty (an error page, a paywall
          // stub) is not a source the story can rely on.
          if (text.trim().length >= MIN_SOURCE_CHARS) {
            readUrls.add(String(args.url));
            if (finalUrl) readUrls.add(String(finalUrl));
          } else {
            content += "\n\n[This page came back nearly empty, so it does not count as a source.]";
          }
        } catch (e) {
          content = `Fetch failed: ${e.message}`;
        }
      } else if (name === "news_feed") {
        log(`news_feed: "${args.query}"`);
        content = (await runDataTool("news_feed", args, { prefix: "sports-desk" })) ?? "news_feed unavailable.";
        sourceTexts.push(content);
      } else if (name === "team_schedule") {
        log(`team_schedule: ${args.school} ${args.sport}`);
        try {
          const sched = await teamSchedule(String(args.school), String(args.sport));
          const i = schedules.findIndex((s) => s.school === sched.school && s.sport === sched.sport);
          if (i >= 0) schedules[i] = sched;
          else schedules.push(sched);
          content = sched.text;
          sourceTexts.push(content);
          scheduleErrors.delete(`${args.school}|${args.sport}`);
        } catch (e) {
          log(`team_schedule failed: ${e.message}`);
          scheduleErrors.set(`${args.school}|${args.sport}`, e.message);
          content = `Schedule unavailable: ${e.message}`;
        }
      } else {
        content = `Unknown tool: ${name}`;
      }
      messages.push({ role: "tool", tool_call_id: tc.id, content });
    }
    if (rejected) break;
  }

  if (!article) {
    if (lastDraft) {
      summarize(draftSummary(lastDraft, lastProblems, usage, "Sports desk: draft failed its checks, not published"));
    } else {
      log("Ran out of iterations without a draft.");
    }
    if (DRY_RUN) return;
    process.exit(1);
  }

  article.slug = sanitizeSlug(article.slug);
  if (!article.slug) throw new Error("Empty slug after sanitizing.");
  if (postsContent.includes(`slug: "${article.slug}"`)) article.slug = `${article.slug}-${today}`;
  const seo = checkSeoTitle(article.seoTitle);
  log(seo.ok ? `seoTitle (${[...seo.value].length} characters): ${seo.value}` : `seoTitle dropped (${seo.reason}); the page will use the full title.`);
  log(`Drafted: "${article.title}" (${article.slug}), ${article.school} ${article.sport}, ${article.body.length} paragraphs.`);

  if (DRY_RUN) {
    summarize(draftSummary(article, [], usage, "Sports desk dry run: this draft would publish"));
    return;
  }

  const obj = postObject(article, today, seo.ok ? seo.value : "");
  execSync('git config user.name "Jackson Wire Autopilot"', { stdio: "inherit" });
  execSync('git config user.email "autopilot@thejacksonwire.com"', { stdio: "inherit" });

  // Another desk can push between this run's checkout and its push. Then the
  // push is rejected; start again from the new main and reapply the story.
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) {
      log(`push rejected; reapplying the story on top of the new main (attempt ${attempt}).`);
      execSync("git fetch origin main", { stdio: "inherit" });
      execSync("git reset --hard origin/main", { stdio: "inherit" });
    }
    const fresh = readFileSync(POSTS_FILE, "utf8");
    if (fresh.includes(`slug: "${article.slug}"`)) throw new Error(`Slug "${article.slug}" is already on main.`);
    const files = [POSTS_FILE];
    let commitMsg = `Sports desk: ${article.title.trim()}`;
    writeFileSync(POSTS_FILE, insertPost(fresh, obj));
    const listBefore = existsSync(SPORTS_ASSIGNMENTS_FILE) ? readFileSync(SPORTS_ASSIGNMENTS_FILE, "utf8") : null;
    if (assignment) {
      const { items } = readAssignments(SPORTS_ASSIGNMENTS_FILE);
      const result = applyOutcome(items, assignment.id, article.assignmentOutcome);
      writeAssignments(result.items, SPORTS_ASSIGNMENTS_FILE);
      files.push(SPORTS_ASSIGNMENTS_FILE);
      const note = `Sports assignment ${assignment.id}: ${result.status}${result.reason ? `. Reason: ${result.reason}` : ""}.`;
      commitMsg += `\n\n${note}`;
      log(note);
    }
    try {
      typeCheck();
    } catch (e) {
      writeFileSync(POSTS_FILE, fresh);
      if (listBefore !== null) writeFileSync(SPORTS_ASSIGNMENTS_FILE, listBefore);
      throw new Error(`Type check failed; ${POSTS_FILE} restored, nothing published. ${e.message}`);
    }
    execSync(`git add ${files.join(" ")}`, { stdio: "inherit" });
    // The message goes on stdin: headlines contain $ and quotes a shell would mangle.
    execSync("git commit -F -", { input: commitMsg, stdio: ["pipe", "inherit", "inherit"] });
    try {
      execSync("git push origin HEAD:main", { stdio: "inherit" });
      break;
    } catch (e) {
      if (attempt === 3) throw new Error(`Push failed three times: ${e.message}`);
    }
  }

  await pingIndexNow([
    `https://www.thejacksonwire.com/article/${article.slug}`,
    "https://www.thejacksonwire.com/sports/ms-college",
    "https://www.thejacksonwire.com/sitemap.xml",
  ]);
  summarize(draftSummary(article, [], usage, "Sports desk: published"));
  log(`Published "${article.title}".`);
}

main().catch((err) => {
  console.error("[sports-desk] FAILED:", err?.message || err);
  process.exit(1);
});
