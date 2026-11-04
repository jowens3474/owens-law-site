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
  { outlet: "Sportico", url: "https://www.sportico.com/feed/", route: { national: "college" } },
  { outlet: "Front Office Sports", url: "https://frontofficesports.com/feed/", route: { national: "college" } },
];

const MS_COLLEGE =
  /Ole Miss|Mississippi State|Miss\. State|Hail State|Southern Miss|Jackson State|\bJSU\b|Alcorn|Mississippi Valley|\bMVSU\b|Delta State|Millsaps|Mississippi College|Belhaven|William Carey|Egg Bowl/i;
const MS_HS =
  /high school|MHSAA|\bMAIS\b|\bpreps?\b|state championship|state title|Class [1-7]A|\b[1-7]A (state|title|championship|playoffs?)|\brecruit(s|ed|ing)?\b|\bcommit(s|ted|ment)?\b|\bsignee\b|signing day|\bprospect|class of 20\d\d|(three|four|five)-star|All-State|Mr\. Football|Miss Basketball|Mr\. Basketball|Gatorade Player/i;
const NIL =
  /\bNIL\b|name, image,? and likeness|College Sports Commission|NIL Go|revenue[- ]shar|House settlement|House v\. NCAA|\bcollective\b|SCORE Act|athlete employ|employee status|pay[- ]for[- ]play/i;
const SEC = /\bSEC\b|Southeastern Conference/i;
const COLLEGE =
  /\bcollege\b|NCAA|\bCFP\b|College Football Playoff|Heisman|March Madness|Final Four|transfer portal|Big Ten|Big 12|\bACC\b|\bSEC\b|\bSWAC\b|Sun Belt|Conference USA|Mountain West|American Athletic/i;

const GAMBLING_TITLE =
  /promo code|bonus bets?|sportsbook|odds boost|\bbetting\b|\bbet\s*\$|DraftKings|FanDuel|BetMGM|Caesars Sportsbook|bet365|Novig|Kalshi|Polymarket|PrizePicks|best bets|against the spread|picks? and predictions?|predictions? and picks?|\bodds\b/i;
const GAMBLING_PATH = /\/(betting|odds|picks|sportsbook|promo)(?=\/|$)/i;

export const SECTION_SLUGS = ["ms-college", "ms-high-school", "national", "sec", "nil"];
const PER_SECTION = 15;
const PER_OUTLET = 5;
const DAY = 86_400_000;

/** @returns {string[]} sections an item goes to */
function routeItem(feed, title) {
  const r = feed.route || {};
  const out = new Set(r.fixed || []);
  if (MS_COLLEGE.test(title)) out.add("ms-college");
  if (r.hs && MS_HS.test(title)) out.add("ms-high-school");
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

/** Select up to PER_SECTION: first pass honors the per-outlet cap, second fills. */
function select(items) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  const seenLink = new Set();
  const seenTitle = new Set();
  const unique = [];
  for (const it of sorted) {
    const l = normLink(it.link);
    const t = it.title.toLowerCase();
    if (seenLink.has(l) || seenTitle.has(t)) continue;
    seenLink.add(l);
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
  for (const it of skipped) {
    if (picked.length >= PER_SECTION) break;
    picked.push(it);
  }
  return picked.sort((a, b) => b.date.localeCompare(a.date));
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
        const iso = new Date(t).toISOString();
        if (!newest || iso > newest) newest = iso;
        const slugs = routeItem(feed, title);
        if (slugs.length === 0) continue;
        kept++;
        /** @type {Headline} */
        const h = { title, link: u.href, outlet: feed.outlet, date: iso };
        if (feed.sport) h.sport = feed.sport;
        for (const s of slugs) pool[s].push(h);
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
