// Checks the sports desk (scripts/sports-desk.mjs) runs on every draft before
// it publishes. Each returns plain-English problems the desk sends back to the
// model for a revision; a draft that still has problems is not published.
//
// They live apart from the desk script because that file runs its main() the
// moment it is imported, which would make these impossible to test alone
// (see sports-desk-checks.test.mjs). Nothing here touches the network or disk.
import { apDate, weekdayOf, SPORTS, SCHEDULE_SCHOOLS } from "./espn-schedule.mjs";

// En dash and em dash, written as escapes so this file contains neither.
const DASHES = /[–—]/;

export const STORY_SCHOOLS = [
  ...SCHEDULE_SCHOOLS,
  "Delta State",
  "Mississippi College",
  "Millsaps",
  "Belhaven",
  "William Carey",
  "Other Mississippi school",
];
export const STORY_SPORTS = [...SPORTS, "other"];

// Betting lines and sportsbook promotion stay out of Wire stories. The plain
// word "sportsbook" is allowed, so an NCAA or school gambling investigation
// can be reported; lines, odds, parlays and sportsbook brands cannot.
export const BETTING =
  /\b(point spread|against the spread|money ?line|over\/under|betting (?:line|odds|favorite)|odds to win|parlays?|prop bets?|DraftKings|FanDuel|BetMGM|Caesars Sportsbook|bet365|ESPN BET|BetRivers|Hard Rock Bet|Fanatics Sportsbook|\d+(?:\.\d)?-point (?:favorite|underdog)|favored by (?:\d|an? ))/i;

// Official sources (schools, conferences, the NCAA, ESPN's schedule data) and
// established newsrooms. A draft must rely on at least one of these.
// Recruiting-insider and aggregator sites can be read but do not count.
export const TRUSTED_DOMAINS = [
  "olemisssports.com",
  "hailstate.com",
  "southernmiss.com",
  "gojsutigers.com",
  "alcornsports.com",
  "mvsusports.com",
  "gostatesmen.com",
  "gomajors.com",
  "gochoctaws.com",
  "olemiss.edu",
  "msstate.edu",
  "usm.edu",
  "jsums.edu",
  "secsports.com",
  "swac.org",
  "sunbeltsports.org",
  "ncaa.com",
  "ncaa.org",
  "espn.com",
  "apnews.com",
  "clarionledger.com",
  "mississippitoday.org",
  "mississippifreepress.org",
  "magnoliatribune.com",
  "supertalk.fm",
  "hottytoddy.com",
  "wlbt.com",
  "msnewsnow.com",
  "wjtv.com",
  "wapt.com",
  "wtva.com",
  "wcbi.com",
  "wtok.com",
  "wdam.com",
  "wlox.com",
  "wxxv25.com",
  "hattiesburgamerican.com",
  "sunherald.com",
  "djournal.com",
  "si.com",
  "cbssports.com",
  "foxsports.com",
  "nytimes.com",
  "usatoday.com",
  "al.com",
  "nola.com",
];

const AP_MONTHS = { "Jan.": 1, "Feb.": 2, March: 3, April: 4, May: 5, June: 6, July: 7, "Aug.": 8, "Sept.": 9, "Oct.": 10, "Nov.": 11, "Dec.": 12 };

/** Lowercase, straight quotes, one space: for matching text against sources. */
export function normalizeText(s) {
  return String(s ?? "")
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/…/g, "...")
    .replace(/[ \s]+/g, " ")
    .trim()
    .toLowerCase();
}

// Dashes between digits become hyphens with no spaces, so an en-dashed or
// spaced score reads the same as "42-7".
const normalizeNumbers = (s) => s.replace(/[–—]/g, "-").replace(/(\d)\s*-\s*(\d)/g, "$1-$2");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function wordCount(paragraphs) {
  return (Array.isArray(paragraphs) ? paragraphs : [])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Host and path of a URL without "www.", the fragment, utm_ tags or a trailing slash. */
export function normalizeUrl(raw) {
  let u;
  try {
    u = new URL(String(raw).trim());
  } catch {
    return "";
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return "";
  u.hash = "";
  for (const key of [...u.searchParams.keys()]) if (/^utm_/i.test(key)) u.searchParams.delete(key);
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : "";
  const search = u.searchParams.toString();
  return `${host}${path}${search ? `?${search}` : ""}`;
}

export function isTrusted(raw) {
  const n = normalizeUrl(raw);
  if (!n) return false;
  const host = n.split(/[/?]/)[0];
  return TRUSTED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Text names a date in AP style ("Nov. 1"), not as the start of another ("Nov. 15"). */
export function mentionsDate(text, isoDate) {
  const d = apDate(isoDate);
  return !!d && new RegExp(`${escapeRe(d)}(?!\\d)`).test(String(text ?? ""));
}

/** Text gives a clock time ("noon", "7:30 p.m.", "11 a.m."), allowing "7:30 pm" style. */
export function mentionsTime(text, time) {
  const compact = (s) => normalizeText(s).replace(/[\s.]/g, "");
  const t = compact(time);
  if (!t) return false;
  return new RegExp(`(?<!\\d)${escapeRe(t)}`).test(compact(text));
}

/** Text names a team or school as whole words ("Oklahoma", "Alabama State"). */
export function mentionsName(text, name) {
  const clean = (s) =>
    normalizeText(s)
      .replace(/[^a-z0-9' ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const n = clean(name);
  if (!n) return false;
  return new RegExp(`(^| )${escapeRe(n)}( |$)`).test(clean(text));
}

/** Direct quotes of two or more words, without the punctuation inside the closing mark. */
export function extractQuotes(text) {
  const out = [];
  const re = /["“]([^"“”]+)["”]/g;
  let m;
  while ((m = re.exec(String(text ?? ""))) !== null) {
    const q = m[1].trim().replace(/[,.;:!?]+$/, "").trim();
    if (q.split(/\s+/).length >= 2) out.push(q);
  }
  return out;
}

/** Quotes (two words or more) that appear in no source text the desk read. */
export function unmatchedQuotes(paragraphs, sourceTexts) {
  const corpus = normalizeText((Array.isArray(sourceTexts) ? sourceTexts : []).join("\n"));
  const missing = [];
  for (const q of extractQuotes((Array.isArray(paragraphs) ? paragraphs : []).join("\n"))) {
    // A quote trimmed with an ellipsis must match piece by piece.
    const pieces = normalizeText(q)
      .split(/\.\.\./)
      .map((p) => p.trim().replace(/[,.;:!?]+$/, "").trim())
      .filter((p) => p.split(/\s+/).length >= 2);
    if (pieces.length && pieces.some((p) => !corpus.includes(p))) missing.push(q);
  }
  return missing;
}

const MONTH_BEFORE = /(jan\.|feb\.|march|april|may|june|july|aug\.|sept\.|oct\.|nov\.|dec\.)\s*$/;

/**
 * Numbers in the text that appear in nothing the desk read: scores and
 * records ("42-7", "6-3"), decimals ("71.4") and whole numbers of 10 or more.
 * Dates, clock times and years are left alone. A number the model computed
 * itself has no source, so it comes back as a problem too.
 */
export function unsourcedNumbers(paragraphs, sourceTexts) {
  const corpus = normalizeNumbers(normalizeText((Array.isArray(sourceTexts) ? sourceTexts : []).join("\n")));
  const text = normalizeNumbers(normalizeText((Array.isArray(paragraphs) ? paragraphs : []).join("\n")));
  const has = (n) => new RegExp(`(?<![\\d.])${escapeRe(n)}(?!\\d)`).test(corpus);
  const missing = new Set();
  for (const m of text.matchAll(/(?<![\d.,:-])(\d{1,3})-(\d{1,3})(?![\d.,:-])/g)) {
    const pair = `${m[1]}-${m[2]}`;
    if (!has(pair) && !has(`${m[2]}-${m[1]}`)) missing.add(pair);
  }
  for (const m of text.matchAll(/(?<![\d.,:-])(\d+\.\d+)(?!\d)/g)) {
    if (!has(m[1])) missing.add(m[1]);
  }
  for (const m of text.matchAll(/(?<![\d.,:-])(\d{1,3}(?:,\d{3})+|\d{2,})(?![\d.,:-])(?!\s*(?:a\.m\.|p\.m\.))/g)) {
    const n = m[1];
    const v = Number(n.replace(/,/g, ""));
    if (v < 10) continue;
    if (!n.includes(",") && v >= 1900 && v <= 2099) continue;
    if (MONTH_BEFORE.test(text.slice(Math.max(0, m.index - 8), m.index))) continue;
    if (!has(n) && !has(n.replace(/,/g, ""))) missing.add(n);
  }
  return [...missing];
}

/**
 * "Saturday, Nov. 15" style phrases whose weekday is wrong for the date.
 * The year is the one that puts the date closest to today.
 */
export function weekdayMismatches(text, todayIso) {
  const out = [];
  const [ty, tm, td] = String(todayIso).split("-").map(Number);
  const today = Date.UTC(ty, tm - 1, td);
  const re = /\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),?\s+(Jan\.|Feb\.|March|April|May|June|July|Aug\.|Sept\.|Oct\.|Nov\.|Dec\.)\s+(\d{1,2})\b/g;
  let m;
  while ((m = re.exec(String(text ?? ""))) !== null) {
    const month = AP_MONTHS[m[2]];
    const day = Number(m[3]);
    let best = null;
    for (const y of [ty - 1, ty, ty + 1]) {
      const t = Date.UTC(y, month - 1, day);
      if (new Date(t).getUTCDate() !== day) continue;
      if (!best || Math.abs(t - today) < Math.abs(best.t - today)) best = { t, y };
    }
    if (!best) {
      out.push(`"${m[0]}" is not a real date.`);
      continue;
    }
    const iso = `${best.y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const actual = weekdayOf(iso);
    if (actual !== m[1]) out.push(`"${m[0]}" is wrong: ${m[2]} ${day}, ${best.y} is a ${actual}.`);
  }
  return out;
}

const STOP = new Set(
  "the a an and or of to in on for at by with from as is are was were be its it this that after before into over under vs ole miss mississippi state rebels bulldogs football basketball baseball women's men's women men game games season".split(
    " ",
  ),
);
const titleWords = (t) =>
  new Set(
    normalizeText(t)
      .replace(/[^a-z0-9' ]/g, " ")
      .split(" ")
      .filter((w) => w.length >= 3 && !STOP.has(w)),
  );

/** A recent sports title that shares most of its distinctive words with this one, or "". */
export function similarRecentTitle(title, recentTitles) {
  const a = titleWords(title);
  for (const r of Array.isArray(recentTitles) ? recentTitles : []) {
    const b = titleWords(r);
    const shared = [...a].filter((w) => b.has(w)).length;
    const union = new Set([...a, ...b]).size;
    if (shared >= 3 && union > 0 && shared / union >= 0.5) return r;
  }
  return "";
}

const canonTime = (t) =>
  normalizeText(t)
    .replace(/\s+/g, "")
    .replace(/^12(?::00)?p\.?m\.?$/, "noon")
    .replace(/^12(?::00)?a\.?m\.?$/, "midnight")
    .replace(/\./g, "")
    .replace(/:00/, "");

const nameTokens = (s) =>
  normalizeText(s)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter((w) => w.length >= 2);

export function opponentMatches(scheduleName, given) {
  const a = nameTokens(scheduleName);
  const b = nameTokens(given);
  if (!a.length || !b.length) return false;
  const sa = a.join(" ");
  const sb = b.join(" ");
  return sa.includes(sb) || sb.includes(sa) || a[0] === b[0];
}

const startMs = (g) => Date.parse(g.startIso);
const playable = (g) => g.status !== "canceled" && g.status !== "postponed";

/**
 * The next game a draft names must be the team's next playable game on a
 * schedule the desk read, not started, with the same date and time, and the
 * What's next paragraph must give that date, time (unless TBA) and opponent.
 */
export function nextGameProblems(article, schedules, todayIso, nowIso = "") {
  const problems = [];
  const nowMs = nowIso ? Date.parse(nowIso) : Date.parse(`${todayIso}T00:00:00Z`);
  const find = (school, sport) => (schedules || []).find((s) => s.school === school && s.sport === sport);
  const upcomingOf = (sched) => sched.games.filter((g) => startMs(g) > nowMs && playable(g));
  const storySched = SCHEDULE_SCHOOLS.includes(article.school) && SPORTS.includes(article.sport);
  if (storySched && !find(article.school, article.sport)) {
    problems.push(`Call team_schedule for ${article.school} ${article.sport} and use it for every date, time and opponent you state.`);
    return problems;
  }
  const ng = article.nextGame && typeof article.nextGame === "object" ? article.nextGame : null;
  const hasGame = ng && String(ng.opponent ?? "").trim() && String(ng.date ?? "").trim();
  if (storySched && !hasGame) {
    const soon = upcomingOf(find(article.school, article.sport)).find((g) => (startMs(g) - nowMs) / 86400000 <= 21);
    if (soon) {
      problems.push(
        `${article.school} ${article.sport} plays ${soon.opponentShort || soon.opponent} on ${soon.weekday}, ${apDate(soon.date)} (ESPN). Name the next game in the What's next paragraph and fill nextGame from team_schedule.`,
      );
    }
    return problems;
  }
  if (!hasGame) return problems;
  const school = String(ng.school || article.school);
  const sport = String(ng.sport || article.sport);
  const sched = find(school, sport);
  if (!sched) {
    problems.push(`nextGame is a ${school} ${sport} game, but the desk has not read that schedule. Call team_schedule for it.`);
    return problems;
  }
  const game = sched.games.find((g) => g.date === String(ng.date) && opponentMatches(g.opponent, ng.opponent));
  if (!game) {
    const upcoming = upcomingOf(sched)
      .slice(0, 4)
      .map((g) => `${g.opponentShort || g.opponent} on ${g.date}`)
      .join("; ");
    problems.push(
      `nextGame (${ng.opponent} on ${ng.date}) is not on ESPN's ${school} ${sport} schedule. Upcoming there: ${upcoming || "none listed"}.`,
    );
    return problems;
  }
  const name = game.opponentShort || game.opponent;
  if (game.status === "canceled") {
    problems.push(`ESPN lists ${name} on ${apDate(game.date)} as canceled. Say so if it matters, and name the next scheduled game instead.`);
  } else if (game.status === "postponed") {
    problems.push(`ESPN lists ${name} on ${apDate(game.date)} as postponed. Say it was postponed, and name the next scheduled game with its date from team_schedule.`);
  } else if (startMs(game) <= nowMs) {
    problems.push(
      `${name} on ${apDate(game.date)} has already started or finished (ESPN lists it at ${game.time} Central). Do not present it as the next game; name the game after it, or report the result.`,
    );
  } else {
    const first = upcomingOf(sched)[0];
    if (first && first !== game) {
      problems.push(
        `The next ${school} ${sport} game is ${first.opponentShort || first.opponent} on ${first.weekday}, ${apDate(first.date)}, not ${name}. Use it for nextGame and name it first in the What's next paragraph.`,
      );
    }
  }
  if (game.time !== "TBA" && ng.time && !/^tba$/i.test(String(ng.time).trim()) && canonTime(ng.time) !== canonTime(game.time)) {
    problems.push(`nextGame time "${ng.time}" does not match ESPN's ${game.time} Central for ${name} on ${apDate(game.date)}.`);
  }
  const body = Array.isArray(article.body) ? article.body : [];
  const whatsNext = body.find((p) => /^What['’]s next:/.test(String(p))) || "";
  if (!mentionsDate(whatsNext, game.date)) {
    problems.push(`The What's next paragraph must give the next game's date as "${game.weekday}, ${apDate(game.date)}".`);
  }
  if (game.time !== "TBA" && !mentionsTime(whatsNext, game.time)) {
    problems.push(`The What's next paragraph must give the game time as ESPN lists it: ${game.time} Central.`);
  }
  if (!mentionsName(whatsNext, name)) {
    problems.push(`The What's next paragraph must name the opponent, ${name}.`);
  }
  return problems;
}

/**
 * A game that started in the last 18 hours and is named in the draft must be
 * reported as a result (with ESPN's final score) or left out: never previewed.
 */
export function staleGameProblems(article, schedules, nowIso) {
  if (!nowIso) return [];
  const nowMs = Date.parse(nowIso);
  const text = [article.title, article.dek, ...(Array.isArray(article.body) ? article.body : [])].join("\n");
  const scores = normalizeNumbers(normalizeText(text));
  const problems = [];
  for (const s of schedules || []) {
    for (const g of s.games) {
      if (!playable(g) || startMs(g) > nowMs || startMs(g) <= nowMs - 18 * 3600_000) continue;
      const name = g.opponentShort || g.opponent;
      if (!mentionsName(text, name)) continue;
      if (g.status === "final") {
        if (g.us && g.them && !scores.includes(`${g.us}-${g.them}`) && !scores.includes(`${g.them}-${g.us}`)) {
          problems.push(
            `${s.school} ${s.sport} vs. ${name} (${g.weekday}, ${apDate(g.date)}) is over: ESPN has it final, ${g.us}-${g.them}. Report the result with the score, or leave that game out; do not preview it.`,
          );
        }
      } else {
        problems.push(
          `${s.school} ${s.sport} vs. ${name} started at ${g.time} on ${apDate(g.date)} and is under way or just ended. Do not preview it; leave it out until ESPN has a final score.`,
        );
      }
    }
  }
  return problems;
}

/** Sources the draft relied on: at least two the desk read, one trusted, one a page (not only ESPN's data). */
export function sourceProblems(sources, readUrls, scheduleUrls = []) {
  const read = new Set([...(readUrls || [])].map(normalizeUrl).filter(Boolean));
  const sched = new Set([...(scheduleUrls || [])].map(normalizeUrl).filter(Boolean));
  const given = [...new Set((Array.isArray(sources) ? sources : []).map(normalizeUrl).filter(Boolean))];
  const usable = given.filter((u) => read.has(u) || sched.has(u));
  const unread = (Array.isArray(sources) ? sources : []).filter((s) => {
    const n = normalizeUrl(s);
    return n && !read.has(n) && !sched.has(n);
  });
  const problems = [];
  if (unread.length) {
    problems.push(
      `These sources were not read with fetch_url in this run (or came back nearly empty), so they cannot be relied on: ${unread.join(", ")}.`,
    );
  }
  if (usable.length < 2) {
    problems.push("List at least two sources you opened and relied on (fetch_url pages or the team_schedule source).");
  }
  if (!usable.some((u) => read.has(u))) {
    problems.push("At least one source must be a page you read with fetch_url (an announcement or news report), not only ESPN's schedule data.");
  }
  if (usable.length && !usable.some((u) => isTrusted(`https://${u}`))) {
    problems.push("At least one source must be official (a school, conference, the NCAA or ESPN) or an established newsroom.");
  }
  return problems;
}

/** Shape and house-style problems: lengths, the What's next paragraph, dashes, betting, school and sport. */
export function structureProblems(article) {
  const problems = [];
  const title = String(article.title ?? "").trim();
  const dek = String(article.dek ?? "").trim();
  const body = Array.isArray(article.body) ? article.body.map((p) => String(p ?? "").trim()) : [];
  if (!title) problems.push("The headline is empty.");
  if (title.length >= 100) problems.push(`The headline is ${title.length} characters; keep it under 100.`);
  if (!dek) problems.push("The dek is empty.");
  if (dek.split(/\s+/).filter(Boolean).length > 40) problems.push("The dek is over 40 words.");
  if (body.length < 5 || body.length > 8) problems.push(`The body has ${body.length} paragraphs; use 5 to 8.`);
  if (body.some((p) => !p)) problems.push("A body paragraph is empty.");
  const words = wordCount(body);
  if (words < 400 || words > 750) problems.push(`The body is ${words} words; aim for 450 to 650 and stay between 400 and 750.`);
  const wn = body.map((p, i) => (/^What['’]s next:/.test(p) ? i : -1)).filter((i) => i >= 0);
  if (wn.length !== 1) problems.push(`Exactly one paragraph must begin with "What's next:" (found ${wn.length}).`);
  else if (wn[0] < body.length - 2) problems.push("The What's next paragraph must be one of the last two paragraphs.");
  const all = [title, dek, String(article.seoTitle ?? ""), ...body].join("\n");
  if (DASHES.test(all)) problems.push("Remove every em dash and en dash; use commas, periods, colons or parentheses.");
  const bet = all.match(BETTING);
  if (bet) {
    problems.push(
      `Remove betting language ("${bet[0]}"): no lines, spreads, odds, parlays or sportsbook promotion. A gambling investigation can be reported without them.`,
    );
  }
  if (!STORY_SCHOOLS.includes(article.school)) problems.push(`school must be one of: ${STORY_SCHOOLS.join(", ")}.`);
  if (!STORY_SPORTS.includes(article.sport)) problems.push(`sport must be one of: ${STORY_SPORTS.join(", ")}.`);
  return problems;
}

/** Every problem with a draft, given what the desk read this run. */
export function draftProblems(article, ctx) {
  const body = Array.isArray(article.body) ? article.body : [];
  const problems = [...structureProblems(article)];
  for (const q of unmatchedQuotes(body, ctx.sourceTexts)) {
    problems.push(
      `This quote does not appear word for word in anything you read: "${q}". Quote exactly from a source you opened, or paraphrase in clearly different words and attribute.`,
    );
  }
  const numbers = unsourcedNumbers([article.dek, ...body], ctx.sourceTexts);
  if (numbers.length) {
    problems.push(
      `These numbers do not appear in anything you read: ${numbers.join(", ")}. Use each number exactly as a source gives it, or remove it. Do not compute records, totals or percentages yourself.`,
    );
  }
  problems.push(...weekdayMismatches([article.title, article.dek, ...body].join("\n"), ctx.today));
  problems.push(...sourceProblems(article.sources, ctx.readUrls, ctx.scheduleUrls));
  problems.push(...nextGameProblems(article, ctx.schedules, ctx.today, ctx.now));
  problems.push(...staleGameProblems(article, ctx.schedules, ctx.now));
  const twin = similarRecentTitle(article.title, ctx.recentSportsTitles);
  if (twin) {
    problems.push(`This looks like a repeat of a recent Wire story ("${twin}"). Pick a different story, or lead with what is genuinely new and make the headline say so.`);
  }
  return problems;
}
