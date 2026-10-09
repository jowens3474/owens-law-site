// Local feeds: RSS and Atom feeds from Jackson-area newsrooms, governments,
// universities, and civic groups, read directly so the desk gets dated
// headlines with real links instead of Google News redirects.
//
// Two parts. `parseFeed` and `probeFeed` are used by the Data Check
// workflow (`TOOL=feeds`) to test candidate feeds from a runner, since the
// editor's sandbox cannot reach most local sites. `FEEDS` is the registry of
// feeds that probe proved readable; `localFeeds` is the desk tool that reads
// them in parallel and returns the newest items.

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TheJacksonWire/1.0 (+https://www.thejacksonwire.com)";
const TIMEOUT_MS = 15000;

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decode(m[1]) : "";
}

/** Parse RSS 2.0, RSS 1.0 (RDF), or Atom into [{title, link, date, summary}]. */
export function parseFeed(xml) {
  const text = String(xml || "");
  const items = [];
  const isAtom = /<feed[\s>]/i.test(text) && !/<rss[\s>]/i.test(text);
  const re = isAtom ? /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi : /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(text))) {
    const b = m[1];
    let link = "";
    if (isAtom) {
      const alt = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = alt ? decode(alt[1]) : "";
    } else {
      link = pick(b, "link") || (b.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] || "";
      if (!link) {
        const g = pick(b, "guid");
        if (/^https?:/.test(g)) link = g;
      }
    }
    const date = pick(b, "pubDate") || pick(b, "published") || pick(b, "updated") || pick(b, "dc:date") || pick(b, "lastBuildDate");
    const summary = pick(b, "description") || pick(b, "summary") || pick(b, "content");
    items.push({ title: pick(b, "title"), link: link.trim(), date, summary: summary.slice(0, 300) });
  }
  return items;
}

async function get(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: c.signal,
    });
    const body = await res.text();
    return { status: res.status, ct: res.headers.get("content-type") || "", body, final: res.url };
  } finally {
    clearTimeout(t);
  }
}

function looksLikeFeed(body) {
  const head = body.slice(0, 4000);
  return /<rss[\s>]|<feed[\s>]|<rdf:RDF[\s>]/i.test(head);
}

/** Feed URLs advertised by an HTML page, plus the usual WordPress guess. */
export function discoverFeeds(html, baseUrl) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel=["'][^"']*alternate[^"']*["']/i.test(tag)) continue;
    if (!/type=["']application\/(rss|atom)\+xml["']/i.test(tag)) continue;
    const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    try {
      const abs = new URL(decode(href), baseUrl).toString();
      if (!/comments|\/feed\/?\?p=|wp-json/i.test(abs) && !out.includes(abs)) out.push(abs);
    } catch {
      /* skip bad href */
    }
  }
  return out;
}

const pad = (n) => String(n).padStart(2, "0");
export function isoDate(s) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s ? String(s).slice(0, 16) : "";
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Probe one URL from a runner. Returns {url, status, ct, kind, items, newest, discovered, error}.
 * If the URL is an HTML page, tries up to three feeds it advertises.
 */
export async function probeFeed(url, { follow = true } = {}) {
  const r = { url };
  try {
    const res = await get(url);
    r.status = res.status;
    r.ct = res.ct.split(";")[0];
    r.final = res.final !== url ? res.final : undefined;
    if (res.status >= 400) {
      r.error = `HTTP ${res.status}`;
      return r;
    }
    if (looksLikeFeed(res.body)) {
      const items = parseFeed(res.body);
      r.kind = /<feed[\s>]/i.test(res.body.slice(0, 4000)) && !/<rss[\s>]/i.test(res.body.slice(0, 4000)) ? "atom" : "rss";
      r.items = items.length;
      r.newest = items.slice(0, 2).map((it) => `${isoDate(it.date) || "?"} | ${it.title.slice(0, 90)} | ${it.link}`);
      return r;
    }
    r.kind = "html";
    const found = discoverFeeds(res.body, res.final || url);
    r.discovered = found.slice(0, 6);
    if (follow) {
      r.tried = [];
      for (const f of found.slice(0, 3)) {
        const sub = await probeFeed(f, { follow: false });
        r.tried.push(sub);
        if (sub.items) break;
      }
    }
    return r;
  } catch (e) {
    r.error = e.name === "AbortError" ? "timeout" : e.message.slice(0, 120);
    return r;
  }
}

/** Run probes with limited concurrency. */
export async function probeAll(specs, concurrency = 8) {
  const results = new Array(specs.length);
  let i = 0;
  async function worker() {
    while (i < specs.length) {
      const idx = i++;
      results[idx] = await probeFeed(specs[idx].url);
      results[idx].name = specs[idx].name;
      results[idx].group = specs[idx].group;
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, specs.length) }, worker));
  return results;
}

export function formatProbe(r) {
  const head = `${r.group ? `[${r.group}] ` : ""}${r.name || ""} ${r.url}`;
  if (r.error) return `FAIL ${head}\n     ${r.error}${r.final ? ` (final ${r.final})` : ""}`;
  if (r.items !== undefined) {
    return `${r.items ? "OK  " : "EMPTY"} ${head}\n     ${r.kind} items=${r.items} ct=${r.ct}${r.final ? ` final=${r.final}` : ""}\n     ${(r.newest || []).join("\n     ")}`;
  }
  const lines = [`HTML ${head}\n     ct=${r.ct} discovered=${(r.discovered || []).length ? r.discovered.join(" ; ") : "none"}`];
  for (const t of r.tried || []) lines.push("   -> " + formatProbe(t).replace(/\n/g, "\n      "));
  return lines.join("\n");
}

// Candidate feeds to probe. Names are the outlet or body; groups drive the
// registry that the local_feeds tool will read once a feed proves readable.
export const CANDIDATE_FEEDS = [
  // Local newsrooms
  { group: "news", name: "WLBT", url: "https://www.wlbt.com/arc/outboundfeeds/rss/?outputType=xml" },
  { group: "news", name: "WLBT home", url: "https://www.wlbt.com/" },
  { group: "news", name: "WJTV", url: "https://www.wjtv.com/feed/" },
  { group: "news", name: "WJTV local", url: "https://www.wjtv.com/news/local-news/feed/" },
  { group: "news", name: "WAPT home", url: "https://www.wapt.com/" },
  { group: "news", name: "WAPT topstories", url: "https://www.wapt.com/topstories-rss" },
  { group: "news", name: "Mississippi Today", url: "https://mississippitoday.org/feed/" },
  { group: "news", name: "Mississippi Free Press", url: "https://www.mississippifreepress.org/feed/" },
  { group: "news", name: "Clarion Ledger rss index", url: "https://www.clarionledger.com/rss/" },
  { group: "news", name: "Clarion Ledger news", url: "https://rssfeeds.clarionledger.com/jackson/news" },
  { group: "news", name: "Jackson Advocate", url: "https://jacksonadvocateonline.com/feed/" },
  { group: "news", name: "Mississippi Link", url: "https://themississippilink.com/feed/" },
  { group: "news", name: "Northside Sun", url: "https://www.northsidesun.com/search/?f=rss&t=article&l=25&s=start_time&sd=desc" },
  { group: "news", name: "Northside Sun home", url: "https://www.northsidesun.com/" },
  { group: "news", name: "SuperTalk", url: "https://www.supertalk.fm/feed/" },
  { group: "news", name: "Magnolia Tribune", url: "https://magnoliatribune.com/feed/" },
  { group: "news", name: "Jackson Jambalaya", url: "https://kingfish1935.blogspot.com/feeds/posts/default?alt=rss" },
  { group: "news", name: "MPB news", url: "https://www.mpbonline.org/blogs/news/feed/" },
  { group: "news", name: "MPB home", url: "https://www.mpbonline.org/" },
  { group: "news", name: "Mississippi Business Journal", url: "https://msbusiness.com/feed/" },
  { group: "news", name: "Jackson Free Press", url: "https://www.jacksonfreepress.com/" },
  { group: "news", name: "Darkhorse Press", url: "https://darkhorsepressnow.com/feed/" },
  { group: "news", name: "Clinton Courier", url: "https://theclintoncourier.net/feed/" },
  { group: "news", name: "Madison County Journal", url: "https://madisoncountyjournal.com/" },
  { group: "news", name: "Rankin County News", url: "https://www.rankinnews.com/" },
  { group: "news", name: "Vicksburg Daily News", url: "https://www.vicksburgnews.com/feed/" },
  // Outlets that reprint Mississippi Today in full (a way around its bot wall)
  { group: "syndication", name: "DeSoto County News MS", url: "https://desotocountynews.com/category/mississippi-news/feed/" },
  { group: "syndication", name: "DeSoto County News", url: "https://desotocountynews.com/feed/" },
  { group: "syndication", name: "Tippah News MS", url: "https://tippahnews.com/category/mississippi-news/feed/" },
  { group: "syndication", name: "Our Tupelo", url: "https://ourtupelo.com/feed/" },
  { group: "syndication", name: "Scott County Times", url: "https://www.sctonline.net/search/?f=rss&t=article&l=25&s=start_time&sd=desc" },
  { group: "syndication", name: "Beat of the Capital", url: "https://thebeatofthecapital.com/feed/" },
  { group: "syndication", name: "News From The States", url: "https://www.newsfromthestates.com/rss.xml" },
  // City, county, utilities, authorities
  { group: "government", name: "City of Jackson", url: "https://www.jacksonms.gov/feed/" },
  { group: "government", name: "Hinds County", url: "https://www.hindscountyms.com/" },
  { group: "government", name: "JXN Water", url: "https://jxnwater.com/feed/" },
  { group: "government", name: "JXN Water home", url: "https://jxnwater.com/" },
  { group: "government", name: "Jackson Public Schools", url: "https://www.jackson.k12.ms.us/" },
  { group: "government", name: "JMAA airport", url: "https://jmaa.com/feed/" },
  { group: "government", name: "JMAA home", url: "https://jmaa.com/" },
  { group: "government", name: "JRA", url: "https://jrams.org/feed/" },
  { group: "government", name: "Hinds County Sheriff", url: "https://www.hindscountysheriff.com/" },
  { group: "government", name: "Jackson Housing Authority", url: "https://www.jacksonhousing.org/" },
  { group: "government", name: "CCID / DFA", url: "https://www.dfa.ms.gov/capitol-complex-improvement-district" },
  // Suburbs and neighboring counties
  { group: "metro", name: "Ridgeland", url: "https://www.ridgelandms.org/feed/" },
  { group: "metro", name: "Madison city", url: "https://www.cityofmadisonms.com/" },
  { group: "metro", name: "Flowood", url: "https://www.cityofflowood.com/" },
  { group: "metro", name: "Pearl", url: "https://www.cityofpearl.com/" },
  { group: "metro", name: "Brandon", url: "https://www.brandonms.org/" },
  { group: "metro", name: "Clinton", url: "https://www.clintonms.org/" },
  { group: "metro", name: "Byram", url: "https://www.byramms.us/" },
  { group: "metro", name: "Canton", url: "https://www.cityofcanton.net/" },
  { group: "metro", name: "Madison County", url: "https://www.madison-co.com/" },
  { group: "metro", name: "Rankin County", url: "https://www.rankincounty.org/" },
  // State agencies and officials
  { group: "state", name: "Governor", url: "https://governorreeves.ms.gov/feed/" },
  { group: "state", name: "Attorney General", url: "https://attorneygeneralfitch.com/feed/" },
  { group: "state", name: "State Auditor", url: "https://www.osa.ms.gov/rss.xml" },
  { group: "state", name: "State Auditor news", url: "https://www.osa.ms.gov/news" },
  { group: "state", name: "MDA", url: "https://mississippi.org/feed/" },
  { group: "state", name: "MDA press", url: "https://mississippi.org/press-releases/" },
  { group: "state", name: "MDOT", url: "https://mdot.ms.gov/portal/news" },
  { group: "state", name: "MDEQ", url: "https://www.mdeq.ms.gov/feed/" },
  { group: "state", name: "PSC", url: "https://www.psc.ms.gov/" },
  { group: "state", name: "PEER", url: "https://www.peer.ms.gov/" },
  { group: "state", name: "Dept of Revenue", url: "https://www.dor.ms.gov/" },
  { group: "state", name: "MDES", url: "https://mdes.ms.gov/" },
  { group: "state", name: "Legislature bill status", url: "https://billstatus.ls.state.ms.us/" },
  { group: "state", name: "Supreme Court decisions", url: "https://courts.ms.gov/appellatecourts/sc/scdecisions.php" },
  { group: "state", name: "Secretary of State", url: "https://www.sos.ms.gov/" },
  { group: "state", name: "Ethics Commission", url: "https://www.ethics.ms.gov/" },
  { group: "state", name: "Treasurer", url: "https://treasury.ms.gov/feed/" },
  { group: "state", name: "MS Dept of Health", url: "https://msdh.ms.gov/" },
  // Federal, local offices
  { group: "federal", name: "US Attorney SDMS", url: "https://www.justice.gov/usao-sdms/pr" },
  { group: "federal", name: "US Attorney SDMS rss", url: "https://www.justice.gov/usao-sdms/rss" },
  { group: "federal", name: "FBI Jackson", url: "https://www.fbi.gov/contact-us/field-offices/jackson/news" },
  // Universities and colleges
  { group: "campus", name: "Jackson State", url: "https://www.jsums.edu/news/feed/" },
  { group: "campus", name: "UMMC news", url: "https://www.umc.edu/news/" },
  { group: "campus", name: "Millsaps", url: "https://www.millsaps.edu/news/" },
  { group: "campus", name: "Belhaven", url: "https://blogs.belhaven.edu/news/feed/" },
  { group: "campus", name: "Mississippi College", url: "https://www.mc.edu/news" },
  { group: "campus", name: "Hinds CC", url: "https://www.hindscc.edu/news" },
  { group: "campus", name: "Tougaloo", url: "https://www.tougaloo.edu/" },
  { group: "campus", name: "Mississippi State newsroom", url: "https://www.msstate.edu/newsroom/rss" },
  { group: "campus", name: "Ole Miss news", url: "https://news.olemiss.edu/feed/" },
  // Business and civic groups, utilities
  { group: "civic", name: "Downtown Jackson Partners", url: "https://downtownjackson.com/feed/" },
  { group: "civic", name: "Greater Jackson Partnership", url: "https://greaterjacksonpartnership.com/feed/" },
  { group: "civic", name: "Visit Jackson", url: "https://visitjackson.com/feed/" },
  { group: "civic", name: "Fondren Renaissance", url: "https://fondren.org/feed/" },
  { group: "civic", name: "Jackson Assoc. of Neighborhoods", url: "https://www.jxnneighborhoods.com/news?format=rss" },
  { group: "civic", name: "Mississippi Economic Council", url: "https://msmec.com/feed/" },
  { group: "civic", name: "Innovate Mississippi", url: "https://innovate.ms/feed/" },
  { group: "civic", name: "Entergy newsroom", url: "https://www.entergynewsroom.com/rss/?company=entergy-mississippi" },
  { group: "civic", name: "Entergy newsroom home", url: "https://www.entergynewsroom.com/" },
  { group: "civic", name: "Great City Mississippi", url: "https://greatcityms.org/feed/" },
  { group: "civic", name: "Community Foundation for MS", url: "https://formississippi.org/feed/" },
  { group: "civic", name: "Jackson Chamber", url: "https://www.jacksonchamber.com/" },
];

// ---------------------------------------------------------------------------
// The registry and the desk tool.
//
// FEEDS lists feeds that the Data Check `feeds` probe read successfully from
// a GitHub runner. Keep the probe date in the editorial guide's local source
// map; re-probe before adding anything here.
//
// Groups: news (local newsrooms), syndication (outlets that reprint
// Mississippi Today in full), government (city, county, authorities),
// metro (suburbs), state (agencies and officials), campus, civic.

export const FEEDS = [
  // Local newsrooms (probed Oct. 9, 2026)
  { group: "news", name: "WLBT", url: "https://www.wlbt.com/arc/outboundfeeds/rss/category/news/?outputType=xml" },
  { group: "news", name: "WLBT Hinds County", url: "https://www.wlbt.com/arc/outboundfeeds/rss/category/news/hinds-county/?outputType=xml" },
  { group: "news", name: "WJTV", url: "https://www.wjtv.com/news/local-news/feed/" },
  { group: "news", name: "WJTV politics", url: "https://www.wjtv.com/news/politics/feed/" },
  { group: "news", name: "WJTV bribery case", url: "https://www.wjtv.com/news/jackson-bribery-scandal/feed/" },
  { group: "news", name: "WAPT", url: "https://www.wapt.com/topstories-rss" },
  { group: "news", name: "Mississippi Today", url: "https://mississippitoday.org/feed/", note: "feed reads from a runner; article pages do not" },
  { group: "news", name: "Mississippi Free Press", url: "https://www.mississippifreepress.org/feed/" },
  { group: "news", name: "Jackson Advocate", url: "https://jacksonadvocateonline.com/feed/" },
  { group: "news", name: "Mississippi Link", url: "https://themississippilink.com/feed/" },
  { group: "news", name: "SuperTalk", url: "https://www.supertalk.fm/feed/" },
  { group: "news", name: "Magnolia Tribune", url: "https://magnoliatribune.com/feed/" },
  { group: "news", name: "Magnolia Tribune business", url: "https://magnoliatribune.com/category/business/feed/" },
  { group: "news", name: "Jackson Jambalaya", url: "https://kingfish1935.blogspot.com/feeds/posts/default?alt=rss" },
  { group: "news", name: "Mississippi Business Journal", url: "https://msbusiness.com/feed/" },
  { group: "news", name: "Clinton Courier", url: "https://www.theclintoncourier.net/feed/" },
  // Outlets that reprint Mississippi Today or WJTV in full
  { group: "syndication", name: "Mississippi Today via DeSoto County News", url: "https://desotocountynews.com/category/mississippi-news/feed/" },
  { group: "syndication", name: "Mississippi Today via Tippah News", url: "https://tippahnews.com/category/mississippi-news/feed/" },
  { group: "syndication", name: "Mississippi Today via Our Tupelo", url: "https://ourtupelo.com/feed/" },
  { group: "syndication", name: "WJTV via Beat of the Capital", url: "https://thebeatofthecapital.com/feed/" },
  { group: "syndication", name: "States Newsroom", url: "https://www.newsfromthestates.com/rss.xml" },
  // City, authorities, utilities
  { group: "government", name: "JXN Water", url: "https://jxnwater.com/feed/" },
  { group: "government", name: "Jackson Municipal Airport Authority", url: "https://jmaa.com/feed/" },
  { group: "government", name: "Jackson Redevelopment Authority", url: "https://jrams.org/feed/", note: "rarely updated; newest post 2021" },
  // Suburbs
  { group: "metro", name: "City of Ridgeland", url: "https://www.ridgelandms.org/feed/" },
  { group: "metro", name: "City of Pearl", url: "https://www.cityofpearl.com/feed/" },
  { group: "metro", name: "City of Brandon", url: "https://brandonms.org/feed/" },
  { group: "metro", name: "City of Clinton", url: "https://clintonms.org/feed/" },
  // State officials and agencies
  { group: "state", name: "Governor", url: "https://governorreeves.ms.gov/feed/" },
  { group: "state", name: "Attorney General", url: "https://attorneygenerallynnfitch.com/feed/" },
  { group: "state", name: "Treasurer", url: "https://treasury.ms.gov/feed/" },
  { group: "state", name: "MDEQ", url: "https://www.mdeq.ms.gov/feed/" },
  { group: "state", name: "State Department of Health", url: "https://msdh.ms.gov/msdhsite/rssFeed.xml", note: "carries the weekly certificate-of-need report" },
  // Universities and colleges
  { group: "campus", name: "Millsaps College", url: "https://millsaps.edu/feed/" },
  { group: "campus", name: "Mississippi College", url: "https://www.mc.edu/rss/news" },
  { group: "campus", name: "Hinds Community College", url: "https://www.hindscc.edu/feed" },
  { group: "campus", name: "Jackson State University", url: "https://www.jsums.edu/news/feed/", note: "new site; one placeholder post as of Oct. 2026" },
  // Civic and business groups
  { group: "civic", name: "Jackson Association of Neighborhoods", url: "https://www.jxnneighborhoods.com/news?format=rss" },
  { group: "civic", name: "Innovate Mississippi", url: "https://www.innovate.ms/feed/" },
  { group: "civic", name: "Community Foundation for Mississippi", url: "https://formississippi.org/feed/" },
];

export const FEED_GROUPS = ["news", "syndication", "government", "metro", "state", "campus", "civic"];

async function readFeed(feed) {
  const res = await get(feed.url);
  if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
  if (!looksLikeFeed(res.body)) throw new Error("not a feed");
  return parseFeed(res.body).map((it) => ({ ...it, outlet: feed.name, group: feed.group }));
}

/**
 * Newest items across the local feed registry.
 * @param {object} args
 * @param {string} [args.group]  one of FEED_GROUPS, or "all" (default "news")
 * @param {string} [args.query]  keep only items whose title or summary mentions this (case-insensitive)
 * @param {number} [args.hours]  look back this many hours (default 48; undated items are kept and marked)
 * @param {number} [args.limit]  max items (default 40)
 */
export async function localFeeds({ group = "news", query = "", hours = 48, limit = 40 } = {}) {
  const g = String(group || "news").toLowerCase();
  const chosen = FEEDS.filter((f) => g === "all" || f.group === g);
  if (!chosen.length) {
    return `local_feeds unavailable: no feeds registered for group "${g}" (groups: ${FEED_GROUPS.join(", ")}, all)`;
  }
  const since = Date.now() - Math.max(1, Number(hours) || 48) * 3600 * 1000;
  const q = String(query || "").trim().toLowerCase();
  const items = [];
  const errors = [];
  let i = 0;
  async function worker() {
    while (i < chosen.length) {
      const f = chosen[i++];
      try {
        for (const it of await readFeed(f)) items.push(it);
      } catch (e) {
        errors.push(`${f.name}: ${e.name === "AbortError" ? "timeout" : e.message.slice(0, 80)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, chosen.length) }, worker));

  const seen = new Set();
  const kept = [];
  for (const it of items) {
    const t = Date.parse(it.date);
    const dated = !Number.isNaN(t);
    if (dated && t < since) continue;
    if (q && !`${it.title} ${it.summary}`.toLowerCase().includes(q)) continue;
    const key = (it.link || it.title).replace(/[?#].*$/, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push({ ...it, t: dated ? t : 0 });
  }
  kept.sort((a, b) => b.t - a.t);
  const rows = kept.slice(0, Math.min(Math.max(Number(limit) || 40, 5), 100));

  const out = [];
  out.push(
    `Local feeds, group "${g}"${q ? `, mentioning "${query}"` : ""}, last ${hours}h, newest first (${rows.length} of ${kept.length} items from ${chosen.length - errors.length} of ${chosen.length} feeds; direct links):`,
  );
  if (!rows.length) out.push("- (nothing in the window)");
  for (const it of rows) {
    out.push(`- ${it.t ? isoDate(it.date) : "undated"} | ${it.outlet} | ${it.title.slice(0, 140)}\n  ${it.link}`);
  }
  if (errors.length) out.push("", `(unreachable: ${errors.join(" | ")})`);
  out.push("", "Each line is a primary link; use fetch_url to read the story, then cite the outlet by name.");
  return out.join("\n");
}

export const LOCAL_FEEDS_SPEC = {
  type: "function",
  function: {
    name: "local_feeds",
    description:
      "Newest items from local RSS feeds the Wire reads directly: Jackson-area newsrooms (group \"news\"), outlets that reprint Mississippi Today in full (\"syndication\"), the city's authorities and utility (\"government\"), suburbs (\"metro\"), state agencies and officials (\"state\"), universities (\"campus\"), and civic and business groups (\"civic\"). Dated, deduplicated, newest first, with direct links. Call with group \"news\" at the start of every run alongside news_feed, then other groups by beat. Use query to keep only items mentioning a term.",
    parameters: {
      type: "object",
      properties: {
        group: { type: "string", enum: [...FEED_GROUPS, "all"], description: "Which feeds to read. Default \"news\"." },
        query: { type: "string", description: "Optional keyword filter on title and summary, e.g. \"JXN Water\" or \"Farish\"." },
        hours: { type: "integer", minimum: 1, maximum: 720, description: "Lookback window in hours. Default 48." },
        limit: { type: "integer", minimum: 5, maximum: 100, description: "Max items. Default 40." },
      },
    },
  },
};
