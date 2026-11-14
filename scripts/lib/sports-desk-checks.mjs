// Checks the sports desk (scripts/sports-desk.mjs) runs on every draft before
// it publishes. Each returns plain-English problems the desk sends back to the
// model for one revision; a draft that still has problems is not published.
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

// Betting lines and sportsbook promotion stay out of Wire stories.
export const BETTING =
  /\b(point spread|against the spread|money ?line|over\/under|betting (?:line|odds|favorite)|sportsbooks?|odds to win|DraftKings|FanDuel|BetMGM|Caesars Sportsbook|bet365|ESPN BET|\d+(?:\.\d)?-point (?:favorite|underdog)|favored by \d)/i;

// Official sources (schools, conferences, the NCAA, ESPN's schedule data) and
// established outlets. A draft must rely on at least one of these.
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
  "wlbt.com",
  "wjtv.com",
  "wapt.com",
  "wtva.com",
  "wcbi.com",
  "wtok.com",
  "wdam.com",
  "wlox.com",
  "hattiesburgamerican.com",
  "sunherald.com",
  "djournal.com",
  "on3.com",
  "247sports.com",
  "si.com",
  "cbssports.com",
  "foxsports.com",
  "nytimes.com",
  "usatoday.com",
  "yahoo.com",
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

/** Direct quotes of three or more words, without the punctuation inside the closing mark. */
export function extractQuotes(text) {
  const out = [];
  const re = /["“]([^"“”]+)["”]/g;
  let m;
  while ((m = re.exec(String(text ?? ""))) !== null) {
    const q = m[1].trim().replace(/[,.;:!?]+$/, "").trim();
    if (q.split(/\s+/).length >= 3) out.push(q);
  }
  return out;
}

/** Quotes (three words or more) that appear in no source text the desk read. */
export function unmatchedQuotes(paragraphs, sourceTexts) {
  const corpus = normalizeText((Array.isArray(sourceTexts) ? sourceTexts : []).join("\n"));
  const missing = [];
  for (const q of extractQuotes((Array.isArray(paragraphs) ? paragraphs : []).join("\n"))) {
    // A quote trimmed with an ellipsis must match piece by piece.
    const pieces = normalizeText(q)
      .split(/\.\.\./)
      .map((p) => p.trim().replace(/[,.;:!?]+$/, "").trim())
      .filter((p) => p.split(/\s+/).length >= 3);
    if (pieces.length && pieces.some((p) => !corpus.includes(p))) missing.push(q);
  }
  return missing;
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

/**
 * The next game a draft names must be on a schedule the desk read, with the
 * same date (and time, when ESPN lists one), and the What's next paragraph
 * must state that date.
 */
export function nextGameProblems(article, schedules, todayIso, nowIso = "") {
  const problems = [];
  const find = (school, sport) => (schedules || []).find((s) => s.school === school && s.sport === sport);
  const storySched = SCHEDULE_SCHOOLS.includes(article.school) && SPORTS.includes(article.sport);
  if (storySched && !find(article.school, article.sport)) {
    problems.push(`Call team_schedule for ${article.school} ${article.sport} and use it for every date, time and opponent you state.`);
    return problems;
  }
  const ng = article.nextGame && typeof article.nextGame === "object" ? article.nextGame : null;
  const hasGame = ng && String(ng.opponent ?? "").trim() && String(ng.date ?? "").trim();
  if (storySched && !hasGame) {
    const soon = find(article.school, article.sport).games.find(
      (g) => g.date >= todayIso && g.status !== "canceled" && (Date.parse(g.date) - Date.parse(todayIso)) / 86400000 <= 21,
    );
    if (soon) {
      problems.push(
        `${article.school} ${article.sport} plays ${soon.opponent} on ${soon.weekday}, ${apDate(soon.date)} (ESPN). Name the next game in the What's next paragraph and fill nextGame from team_schedule.`,
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
    const upcoming = sched.games
      .filter((g) => g.date >= todayIso)
      .slice(0, 4)
      .map((g) => `${g.opponent} on ${g.date}`)
      .join("; ");
    problems.push(
      `nextGame (${ng.opponent} on ${ng.date}) is not on ESPN's ${school} ${sport} schedule. Upcoming there: ${upcoming || "none listed"}.`,
    );
    return problems;
  }
  if (nowIso && game.status !== "postponed" && Date.parse(game.startIso) <= Date.parse(nowIso)) {
    problems.push(`${game.opponent} on ${apDate(game.date)} has already started or finished (ESPN lists it at ${game.time} Central). Do not present it as the next game; name the game after it, or report the result.`);
  }
  if (game.time !== "TBA" && ng.time && !/^tba$/i.test(String(ng.time).trim()) && canonTime(ng.time) !== canonTime(game.time)) {
    problems.push(`nextGame time "${ng.time}" does not match ESPN's ${game.time} Central for ${game.opponent} on ${apDate(game.date)}.`);
  }
  const body = Array.isArray(article.body) ? article.body : [];
  const whatsNext = body.find((p) => /^What['’]s next:/.test(String(p))) || "";
  if (!whatsNext.includes(apDate(game.date))) {
    problems.push(`The What's next paragraph must give the next game's date as "${game.weekday}, ${apDate(game.date)}".`);
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
    problems.push(`These sources were not opened with fetch_url in this run, so they cannot be relied on: ${unread.join(", ")}.`);
  }
  if (usable.length < 2) {
    problems.push("List at least two sources you opened and relied on (fetch_url pages or the team_schedule source).");
  }
  if (!usable.some((u) => read.has(u))) {
    problems.push("At least one source must be a page you read with fetch_url (an announcement or news report), not only ESPN's schedule data.");
  }
  if (usable.length && !usable.some((u) => isTrusted(`https://${u}`))) {
    problems.push("At least one source must be official (a school, conference, the NCAA or ESPN) or an established news outlet.");
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
  if (bet) problems.push(`Remove betting language ("${bet[0]}"): no lines, spreads, odds or sportsbooks.`);
  if (!STORY_SCHOOLS.includes(article.school)) problems.push(`school must be one of: ${STORY_SCHOOLS.join(", ")}.`);
  if (!STORY_SPORTS.includes(article.sport)) problems.push(`sport must be one of: ${STORY_SPORTS.join(", ")}.`);
  return problems;
}

/** Every problem with a draft, given what the desk read this run. */
export function draftProblems(article, ctx) {
  const body = Array.isArray(article.body) ? article.body : [];
  const problems = [...structureProblems(article)];
  const missing = unmatchedQuotes(body, ctx.sourceTexts);
  for (const q of missing) {
    problems.push(`This quote does not appear word for word in anything you read: "${q}". Quote exactly from a source you opened, or paraphrase and attribute.`);
  }
  problems.push(...weekdayMismatches([article.title, article.dek, ...body].join("\n"), ctx.today));
  problems.push(...sourceProblems(article.sources, ctx.readUrls, ctx.scheduleUrls));
  problems.push(...nextGameProblems(article, ctx.schedules, ctx.today, ctx.now));
  const twin = similarRecentTitle(article.title, ctx.recentSportsTitles);
  if (twin) {
    problems.push(`This looks like a repeat of a recent Wire story ("${twin}"). Pick a different story, or lead with what is genuinely new and make the headline say so.`);
  }
  return problems;
}
