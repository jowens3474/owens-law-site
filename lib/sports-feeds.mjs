// Sports headline feeds: the registry of outside outlets the Sports tab links
// to, the routing of their items to sections, and the builder behind
// /api/sports/headlines.
//
// Plain ESM with JSDoc types so the Next app (allowJs) and node scripts
// (scripts/data-check.mjs, TOOL=sports) share one code path.
//
// Cost: feed requests use node:https, never fetch. Next patches global fetch
// and caches fetches in static/ISR routes, and a feed body can be 100-500 KB;
// every cached entry is a billed write on Vercel Hobby. node:https keeps raw
// bodies out of the Data Cache, so only the small processed JSON is cached.
import https from "node:https";
import { parseFeed, isoDate } from "../scripts/lib/local-feeds.mjs";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TheJacksonWire/1.0 (+https://www.thejacksonwire.com)";
const ACCEPT = "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5";

/**
 * GET a URL over https only. Follows up to maxRedirects redirects (https only),
 * enforces an overall timeout and a body size limit.
 * @param {string} url
 * @param {{ timeoutMs?: number, maxBytes?: number, maxRedirects?: number }} [opts]
 * @returns {Promise<{ status: number, body: string }>}
 */
export function httpsGetText(url, { timeoutMs = 8000, maxBytes = 3_000_000, maxRedirects = 3 } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    /** @type {import("node:http").ClientRequest | null} */
    let current = null;
    const finish = (fn, v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(v);
    };
    const timer = setTimeout(() => {
      if (current) current.destroy();
      finish(reject, new Error(`timeout after ${timeoutMs} ms`));
    }, timeoutMs);

    const go = (target, redirectsLeft) => {
      let u;
      try {
        u = new URL(target);
      } catch {
        return finish(reject, new Error("invalid URL"));
      }
      if (u.protocol !== "https:") return finish(reject, new Error(`only https URLs are allowed (${u.protocol})`));
      const req = https.get(
        u,
        { headers: { "User-Agent": UA, Accept: ACCEPT } },
        (res) => {
          const status = res.statusCode || 0;
          if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
            res.resume();
            if (redirectsLeft <= 0) return finish(reject, new Error("too many redirects"));
            let next;
            try {
              next = new URL(res.headers.location, u).href;
            } catch {
              return finish(reject, new Error("bad redirect location"));
            }
            return go(next, redirectsLeft - 1);
          }
          const chunks = [];
          let size = 0;
          res.on("data", (c) => {
            size += c.length;
            if (size > maxBytes) {
              req.destroy();
              finish(reject, new Error(`body exceeds ${maxBytes} bytes`));
              return;
            }
            chunks.push(c);
          });
          res.on("end", () => finish(resolve, { status, body: Buffer.concat(chunks).toString("utf8") }));
          res.on("error", (e) => finish(reject, e));
        },
      );
      current = req;
      req.on("error", (e) => finish(reject, e));
    };
    go(url, maxRedirects);
  });
}

/**
 * route.fixed: sections every item goes to.
 * route.hs: also apply Mississippi high school / recruiting keywords.
 * route.national: "college" = national if the title looks like college sports;
 *                 "unlessNil" = national unless the item went to nil.
 * Keyword routing for ms-college, nil and sec applies to every feed.
 * @typedef {{ fixed?: string[], hs?: boolean, national?: "college" | "unlessNil" }} FeedRoute
 * @typedef {{ outlet: string, url: string, sport?: string, route: FeedRoute }} SportsFeed
 * @typedef {{ title: string, link: string, outlet: string, sport?: string, date: string }} Headline
 * @typedef {{ outlet: string, url: string, ok: boolean, items: number, error?: string, newest?: string, dropped?: string[] }} FeedResult
 */

const SPORT_PATHS = [
  ["football", "Football"],
  ["mbball", "Men's basketball"],
  ["wbball", "Women's basketball"],
  ["baseball", "Baseball"],
];

/** @type {SportsFeed[]} */
const schoolFeeds = [];
function school(outlet, make, extra = []) {
  for (const [p, label] of SPORT_PATHS) {
    schoolFeeds.push({
      outlet,
      url: make(p),
      sport: label,
      route: { fixed: ["ms-college", ...extra], hs: true },
    });
  }
}
school("Ole Miss Athletics", (p) => `https://olemisssports.com/rss?path=${p}`, ["sec"]);
school("Mississippi State Athletics", (p) => `https://hailstate.com/rss?path=${p}`, ["sec"]);
school("Southern Miss Athletics", (p) => `https://southernmiss.com/rss?path=${p}`);
school("Jackson State Athletics", (p) => `https://gojsutigers.com/rss.aspx?path=${p}`);
school("Alcorn State Athletics", (p) => `https://alcornsports.com/rss.aspx?path=${p}`);
school("Mississippi Valley State Athletics", (p) => `https://mvsusports.com/rss.aspx?path=${p}`);
school("Delta State Athletics", (p) => `https://gostatesmen.com/rss.aspx?path=${p}`);
school("Millsaps Athletics", (p) => `https://gomajors.com/rss.aspx?path=${p}`);
school("Mississippi College Athletics", (p) => `https://gochoctaws.com/rss.aspx?path=${p}`);

/** @type {SportsFeed[]} */
export const SPORTS_FEEDS = [
  ...schoolFeeds,
  { outlet: "SuperTalk Mississippi", url: "https://www.supertalk.fm/category/sports/feed/", route: { hs: true } },
  { outlet: "Magnolia Tribune", url: "https://magnoliatribune.com/category/sports/feed/", route: { hs: true } },
  { outlet: "Mississippi Today", url: "https://mississippitoday.org/category/sports/feed/", route: { hs: true } },
  {
    outlet: "WLBT",
    url: "https://www.wlbt.com/arc/outboundfeeds/rss/category/sports/?outputType=xml",
    route: { hs: true },
  },
  { outlet: "MHSAA", url: "https://www.misshsaa.com/feed/", route: { fixed: ["ms-high-school"], hs: true } },
  {
    outlet: "WLBT",
    url: "https://www.wlbt.com/arc/outboundfeeds/rss/category/sports/high-school/?outputType=xml",
    route: { fixed: ["ms-high-school"], hs: true },
  },
  ...[
    ["football/fbs", "Football"],
    ["basketball-men/d1", "Men's basketball"],
    ["basketball-women/d1", "Women's basketball"],
    ["baseball/d1", "Baseball"],
  ].map(([path, sport]) => ({
    outlet: "NCAA.com",
    url: `https://www.ncaa.com/news/${path}/rss.xml`,
    sport,
    route: { fixed: ["national"] },
  })),
  { outlet: "WJTV", url: "https://www.wjtv.com/sports/feed/", route: { hs: true, national: "college" } },
  { outlet: "Saturday Down South", url: "https://www.saturdaydownsouth.com/feed/", route: { fixed: ["sec"] } },
  {
    outlet: "Business of College Sports",
    url: "https://businessofcollegesports.com/category/name-image-likeness/feed/",
    route: { fixed: ["nil"] },
  },
  {
    outlet: "Business of College Sports",
    url: "https://www.businessofcollegesports.com/feed/",
    route: { national: "unlessNil" },
  },
  // Sportico's college sports section only; its main feed is mostly pro.
  {
    outlet: "Sportico",
    url: "https://www.sportico.com/leagues/college-sports/feed/",
    route: { national: "unlessNil" },
  },
  { outlet: "Front Office Sports", url: "https://frontofficesports.com/feed/", route: { national: "college" } },
  { outlet: "Front Office Sports", url: "https://frontofficesports.com/tag/nil/feed/", route: { fixed: ["nil"] } },
  // The NCAA's own news: rules, governance and championships.
  { outlet: "NCAA.org", url: "https://www.ncaa.org/feed/", route: { national: "unlessNil" } },
];

/**
 * True when any pattern matches. Each keyword set pairs a case-insensitive
 * pattern for words with a case-sensitive one for acronyms, so "30 sec" is
 * not the SEC and "2-nil" is not NIL.
 * @param {...RegExp} patterns
 */
function anyOf(...patterns) {
  return { test: (/** @type {string} */ s) => patterns.some((p) => p.test(s)) };
}

const MS_COLLEGE = anyOf(
  /Ole Miss|Mississippi State|Miss\. State|Hail State|Southern Miss|Jackson State|Alcorn|Mississippi Valley|Delta State|Millsaps|Mississippi College|Belhaven|William Carey|Egg Bowl/i,
  /\b(JSU|MVSU)\b/,
);
// High school and recruiting. Kept narrow because school athletics feeds use
// it too: "preps for Georgia", "Bulldogs commit three turnovers", "Rebels
// commit costly turnovers", "NFL Draft prospect" and "Jackson State
// championship hopes" must not count, while "commits to Ole Miss",
// "four-star", "prep football", "signing day" and "prospect camp" do.
// "Commit" alone is left out on purpose: as a verb it shows up in game
// recaps, and recruiting headlines nearly always carry one of the other
// words. High school titles are caught by MHSAA, "Class 5A" and "5A state",
// not by a bare "state championship".
const MS_HS = anyOf(
  /high school|\bClass [1-7]A\b|\b[1-7]A (state|title|championship|playoffs?|region)\b|\bprep (football|basketball|baseball|softball|soccer|sports|athletes?|stars?|players?|teams?)\b|\brecruit(s|ed|ing)?\b|\bcommits (to|from)\b|\bcommitted to\b|\bcommitment from\b|\b(lands?|earns?|gets?|secures?|flips?) (a )?commitment\b|\bsignees?\b|signing (day|class)|class of 20\d\d|(three|four|five)-star|All-State|Mr\. Football|Miss Basketball|Mr\. Basketball|Gatorade Player|(?<!(NFL|MLB|NBA|WNBA|draft) )\bprospects?\b/i,
  /\b(MHSAA|MAIS)\b/,
);
// Not bare "collective": an AP rankings story drew "a collective 'Huh?'".
const NIL = anyOf(
  /\bNIL\b/,
  /name, image,? and likeness|College Sports Commission|revenue[- ]shar|House settlement|House v\. NCAA|booster collectives?|SCORE Act|athlete employ|employee status|pay[- ]for[- ]play/i,
);
// "Class of 2027" in a hall of fame story is not a recruiting class.
const HALL_OF_FAME = /Hall of Fame/i;
const SEC = anyOf(/\bSEC\b/, /Southeastern Conference/i);
const COLLEGE = anyOf(
  /\bcollege\b|NCAA|College Football Playoff|Heisman|March Madness|Final Four|transfer portal|Big Ten|Big 12|Sun Belt|Conference USA|Mountain West|American Athletic/i,
  /\b(CFP|ACC|SEC|SWAC)\b/,
);

// Gambling promotion, not news about the gambling business: promo and bonus
// offers, picks, and odds or betting-line pieces. "Beats the odds" and a
// story such as "The NCAA's New Rev-Share Model's Impact on Sports Betting"
// stay.
const GAMBLING_TITLE =
  /promo code|bonus (bets?|code)|deposit match|odds boost|\bbet \$|best bets?|\bparlays?\b|player props?|against the spread|picks? and predictions?|predictions? and picks?|\b(odds|spread|line|picks?|predictions?)(,| and| &) (odds|spread|lines?|picks?|predictions?)\b|betting (odds|lines?|picks|preview|tips|trends|guide)|\b(expert|staff|weekly|week \d+|football|basketball|game) picks\b|\bpicks (for|against)\b/i;
const GAMBLING_PATH = /\/(betting|odds|picks|sportsbook|promo)(?=\/|$)/i;

// Not headlines: video and photo posts ("WATCH: Coach Jans Postgame
// Presser") and MHSAA's school profile pages ("St. Martin High School –
// Football").
const NOT_A_HEADLINE = /^(WATCH|LISTEN|PHOTOS?|GALLERY)\s*:|\bSchool\s+[–—-]\s+[A-Za-z' &]+$/i;

export const SECTION_SLUGS = ["ms-college", "ms-high-school", "national", "sec", "nil"];
const PER_SECTION = 15;
// At most this many items from one outlet before others get a turn, so one
// school's run of postgame posts cannot fill the list.
const PER_OUTLET = 3;
const DAY = 86_400_000;

/** @returns {string[]} sections an item goes to */
function routeItem(feed, title) {
  const r = feed.route || {};
  const out = new Set(r.fixed || []);
  if (MS_COLLEGE.test(title)) out.add("ms-college");
  if (r.hs && MS_HS.test(title) && !HALL_OF_FAME.test(title)) out.add("ms-high-school");
  if (NIL.test(title)) out.add("nil");
  if (SEC.test(title)) out.add("sec");
  if (r.national === "college" && COLLEGE.test(title)) out.add("national");
  if (r.national === "unlessNil" && !out.has("nil")) out.add("national");
  return [...out];
}

// The same story can arrive from two feeds with tracking tags, a trailing
// slash, or http instead of https. Other query parameters stay: some sites
// identify the story there (article.aspx?id=123).
function normLink(href) {
  try {
    const u = new URL(href);
    for (const k of [...u.searchParams.keys()]) if (/^utm_/i.test(k)) u.searchParams.delete(k);
    const q = u.searchParams.toString();
    return `${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, "")}${q ? `?${q}` : ""}`;
  } catch {
    return href;
  }
}

// Stations run the same wire headline on their own sites, so a specific
// headline counts once across outlets. A short generic one ("Postgame
// Notes") counts once only within its outlet: two schools can both post it.
const SPECIFIC_TITLE_WORDS = 6;
/** @param {Headline} it */
function titleKey(it) {
  const t = it.title.toLowerCase();
  return t.split(/\s+/).length >= SPECIFIC_TITLE_WORDS ? t : `${it.outlet}|${t}`;
}

/**
 * Select up to PER_SECTION. The first pass honors the per-outlet cap; the
 * second fills any remaining slots with the newest skipped items and appends
 * them after the first pass, so the top of the list (the hub shows the first
 * five) stays varied.
 */
function select(items) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  /** @type {Map<string, Headline>} */
  const byLink = new Map();
  const seenTitle = new Set();
  const unique = [];
  for (const it of sorted) {
    const l = normLink(it.link);
    const t = titleKey(it);
    const kept = byLink.get(l);
    if (kept) {
      // A school posts a department-wide story in several sport feeds; then
      // no single sport label is right. Each section holds its own copies
      // (see buildSportsHeadlines), so this changes only this section.
      if (kept.sport !== it.sport) delete kept.sport;
      continue;
    }
    if (seenTitle.has(t)) continue;
    byLink.set(l, it);
    seenTitle.add(t);
    unique.push(it);
  }
  const picked = [];
  const skipped = [];
  const perOutlet = new Map();
  for (const it of unique) {
    if (picked.length >= PER_SECTION) break;
    const n = perOutlet.get(it.outlet) || 0;
    if (n >= PER_OUTLET) skipped.push(it);
    else {
      perOutlet.set(it.outlet, n + 1);
      picked.push(it);
    }
  }
  const fill = skipped.slice(0, Math.max(0, PER_SECTION - picked.length));
  return [...picked, ...fill];
}

/**
 * Fetch every feed, route items to sections, and return the headlines.
 * Never throws.
 * @param {{ fetchText?: (url: string) => Promise<{status:number, body:string}>, now?: Date, concurrency?: number, deadlineMs?: number, feeds?: SportsFeed[] }} [opts]
 * @returns {Promise<{ updated: string, sections: Record<string, Headline[]>, report: FeedResult[] }>}
 */
export async function buildSportsHeadlines({
  fetchText = httpsGetText,
  now = new Date(),
  concurrency = 10,
  deadlineMs = 20000,
  feeds = SPORTS_FEEDS,
} = {}) {
  /** @type {Record<string, Headline[]>} */
  const pool = Object.fromEntries(SECTION_SLUGS.map((s) => [s, []]));
  /** @type {FeedResult[]} */
  const report = feeds.map((f) => ({ outlet: f.outlet, url: f.url, ok: false, items: 0, error: "not finished by deadline" }));
  const nowMs = now.getTime();
  let expired = false;

  const processFeed = async (i) => {
    const feed = feeds[i];
    const res = report[i];
    try {
      const { status, body } = await fetchText(feed.url);
      if (expired) return;
      if (status < 200 || status >= 300) throw new Error(`HTTP ${status}`);
      const parsed = parseFeed(body);
      if (parsed.length === 0) throw new Error("no items parsed");
      const dropped = [];
      let kept = 0;
      let newest = "";
      for (const it of parsed) {
        const title = String(it.title || "").trim();
        if (!title) continue;
        let u;
        try {
          u = new URL(it.link);
        } catch {
          continue;
        }
        if (u.protocol !== "http:" && u.protocol !== "https:") continue;
        const t = new Date(it.date).getTime();
        if (!it.date || Number.isNaN(t)) continue;
        if (t < nowMs - 30 * DAY || t > nowMs + DAY) continue;
        if (GAMBLING_PATH.test(u.pathname) || GAMBLING_TITLE.test(title)) {
          dropped.push(title);
          continue;
        }
        if (NOT_A_HEADLINE.test(title)) continue;
        const iso = new Date(t).toISOString();
        if (!newest || iso > newest) newest = iso;
        const slugs = routeItem(feed, title);
        if (slugs.length === 0) continue;
        kept++;
        /** @type {Headline} */
        const h = { title, link: u.href, outlet: feed.outlet, date: iso };
        if (feed.sport) h.sport = feed.sport;
        // A copy per section, so select() can edit one section's entry
        // without changing the others.
        for (const s of slugs) pool[s].push({ ...h });
      }
      res.ok = true;
      res.items = kept;
      res.newest = newest ? isoDate(newest) : "-";
      res.dropped = dropped;
      delete res.error;
    } catch (e) {
      res.ok = false;
      res.error = e instanceof Error ? e.message : String(e);
    }
  };

  let next = 0;
  const worker = async () => {
    while (!expired && next < feeds.length) {
      const i = next++;
      try {
        await processFeed(i);
      } catch {
        /* processFeed handles its own errors */
      }
    }
  };
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, feeds.length)) }, worker);
  let timer;
  await Promise.race([
    Promise.all(workers),
    new Promise((resolve) => {
      timer = setTimeout(resolve, deadlineMs);
    }),
  ]);
  clearTimeout(timer);
  expired = true;

  /** @type {Record<string, Headline[]>} */
  const sections = {};
  for (const s of SECTION_SLUGS) sections[s] = select(pool[s]);
  return { updated: now.toISOString(), sections, report };
}
