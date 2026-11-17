// Tips for the sports desk's idea scout (scripts/sports-desk.mjs): what fans,
// beat writers and the schools' insider podcasts are talking about, and what
// Mississippians are searching for. The news feeds tell the desk what other
// outlets already wrote; tips point at stories nobody has written yet.
//
// A tip is a lead, never a source. The desk does not open social posts or
// podcasts with fetch_url (isTipOnlyUrl), does not cite them, and never
// takes a fact, number, name or quote from one: every idea is verified from
// the schools, the conferences, ESPN data, public records or news reports.
//
// Sources, all public and keyless, checked from GitHub's runners on Nov. 17,
// 2026:
// - Bluesky post search (api.bsky.app; public.api.bsky.app refuses runners).
// - Podcast RSS: the daily Ole Miss and Mississippi State shows, SuperTalk's
//   statewide shows and Southern Miss's own.
// - Google Trends' daily trending searches for Mississippi.
// Reddit, X, 247Sports and On3 boards refuse automated readers, and
// TigerDroppings opens only its LSU boards, so they are not used.

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TheJacksonWire/1.0 (+https://www.thejacksonwire.com)";

export const BLUESKY_QUERIES = ["Ole Miss", "Mississippi State", "Southern Miss", "Jackson State", "Egg Bowl", "Alcorn State"];

export const PODCAST_FEEDS = [
  { name: "Locked On Ole Miss", school: "Ole Miss", url: "https://feeds.simplecast.com/e_k5LEa3" },
  { name: "Talk of Champions (Ole Miss)", school: "Ole Miss", url: "https://feeds.redcircle.com/a915b990-157d-4d0c-8024-10e60770a4b8" },
  { name: "Bleav in Ole Miss", school: "Ole Miss", url: "https://feeds.simplecast.com/z6OkYruj" },
  { name: "Locked On Mississippi State", school: "Mississippi State", url: "https://feeds.simplecast.com/J_I_PQjC" },
  { name: "Thunder & Lightning (Mississippi State)", school: "Mississippi State", url: "https://rss.amperwave.net/v2/feed/telesouth/telesouth-thunder__lightning" },
  { name: "SportsTalk Mississippi", school: "", url: "https://rss.amperwave.net/v2/feed/telesouth/telesouth-sportstalk_mississippi" },
  { name: "Inside Southern Miss Athletics", school: "Southern Miss", url: "https://rss.art19.com/inside-southern-miss-athletics" },
];

export const TRENDS_URL = "https://trends.google.com/trending/rss?geo=US-MS";

// Hosts whose pages are tips at most: social networks, forums, podcast hosts
// and search trends. 247Sports and On3 are newsrooms, but their message
// boards are not.
const TIP_HOSTS = [
  "bsky.app", "bsky.social", "reddit.com", "redd.it", "x.com", "twitter.com", "t.co", "facebook.com", "fb.com",
  "instagram.com", "threads.net", "threads.com", "tiktok.com", "tigerdroppings.com", "simplecast.com", "pdrl.fm",
  "amperwave.net", "art19.com", "redcircle.com", "megaphone.fm", "omnycontent.com", "libsyn.com", "podbean.com",
  "anchor.fm", "spotify.com", "podcasts.apple.com", "trends.google.com",
];

/** True for a URL that can only ever be a tip: a social post, forum, podcast or search trend. */
export function isTipOnlyUrl(raw) {
  let u;
  try {
    u = new URL(String(raw ?? "").trim());
  } catch {
    return false;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (TIP_HOSTS.some((d) => host === d || host.endsWith(`.${d}`))) return true;
  return /(^|\.)(247sports\.com|on3\.com)$/.test(host) && /\/boards?\//i.test(u.pathname);
}

const decode = (s) =>
  String(s ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
const plain = (s) => decode(decode(s)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

// Podcast notes end in sponsor reads and ad disclosures; cut them off.
const SPONSOR_CUT = /\s*(Our Sponsors:|Support (?:the|this) show|Learn more about your ad choices|Advertising Inquiries|Privacy & Opt-Out|See omnystudio\.com|Become a member|Sponsored by|Presented by|This episode is (?:presented|brought to you)|Use (?:my )?code\b)/i;

/** Bluesky search results as tips: { kind, author, text, likes, reposts, replies, date, url }. */
export function parseBlueskyPosts(json, query = "") {
  const posts = Array.isArray(json?.posts) ? json.posts : [];
  const out = [];
  for (const p of posts) {
    const handle = String(p?.author?.handle ?? "");
    const rkey = String(p?.uri ?? "").split("/").pop();
    const text = typeof p?.record?.text === "string" ? p.record.text.replace(/\s+/g, " ").trim() : "";
    const date = String(p?.record?.createdAt ?? p?.indexedAt ?? "");
    if (!handle || !rkey || !text || Number.isNaN(Date.parse(date))) continue;
    // Search matches loosely ("Mississippi State" finds "state auditor"), so
    // keep a post only when its text or a link in it names the search.
    const links = [
      p?.record?.embed?.external?.uri,
      ...(Array.isArray(p?.record?.facets) ? p.record.facets.flatMap((f) => (Array.isArray(f?.features) ? f.features.map((x) => x?.uri) : [])) : []),
    ].filter((x) => typeof x === "string");
    const haystack = `${text} ${links.join(" ")}`.toLowerCase().replace(/[-_+]/g, " ");
    if (query && !haystack.includes(query.toLowerCase())) continue;
    out.push({
      kind: "Bluesky",
      query,
      author: handle,
      text: clip(text, 300),
      likes: Number(p.likeCount) || 0,
      reposts: Number(p.repostCount) || 0,
      replies: Number(p.replyCount) || 0,
      date: new Date(Date.parse(date)).toISOString(),
      url: `https://bsky.app/profile/${handle}/post/${rkey}`,
    });
  }
  return out;
}

/** Podcast episodes posted since `since` (ms): { kind, show, school, title, summary, date, url }. Complete <item>s only. */
export function parsePodcastFeed(xml, feed, since = 0) {
  const out = [];
  for (const m of String(xml ?? "").matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const title = plain(it.match(/<title\b[^>]*>([\s\S]*?)<\/title>/)?.[1]);
    const when = Date.parse(decode(it.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "").trim());
    if (!title || !Number.isFinite(when) || when < since) continue;
    const raw = it.match(/<description\b[^>]*>([\s\S]*?)<\/description>/)?.[1] ?? it.match(/<itunes:summary>([\s\S]*?)<\/itunes:summary>/)?.[1] ?? "";
    const summary = clip(plain(raw).split(SPONSOR_CUT)[0].trim(), 500);
    const link = plain(it.match(/<link>([\s\S]*?)<\/link>/)?.[1]) || feed.url;
    out.push({ kind: "Podcast", show: feed.name, school: feed.school, title, summary, date: new Date(when).toISOString(), url: link });
  }
  return out;
}

/** Google Trends daily searches: { kind, title, traffic, news: [headline] }. */
export function parseTrends(xml) {
  const out = [];
  for (const m of String(xml ?? "").matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const title = plain(it.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    if (!title) continue;
    const traffic = plain(it.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1]);
    const news = [...it.matchAll(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/g)].map((n) => plain(n[1])).filter(Boolean).slice(0, 3);
    out.push({ kind: "Search trend", title, traffic, news });
  }
  return out;
}

const SPORTS_WORDS =
  /\b(football|basketball|baseball|softball|soccer|volleyball|coach|coaches|quarterback|qb|game|games|score|vs\.?|bowl|playoffs?|sec|swac|ncaa|nfl|nba|mlb|recruit\w*|commit\w*|transfer portal|draft|rebels|bulldogs|golden eagles|tigers|braves|delta devils|statesmen|egg bowl|ole miss|mississippi state|southern miss|jackson state|alcorn|valley state|delta state|hail state|starkville|oxford)\b/i;

/** Trends that look like sports: the search itself or one of its headlines. */
export const sportsTrends = (trends) => trends.filter((t) => SPORTS_WORDS.test(t.title) || t.news.some((n) => SPORTS_WORDS.test(n)));

/** GET a URL, keeping at most maxBytes of the body (podcast feeds run to several megabytes; the newest episodes come first). */
export async function fetchHead(url, { maxBytes = 600_000, timeoutMs = 20000, headers = {} } = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: c.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    while (size < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    await reader.cancel().catch(() => {});
    return new TextDecoder("utf-8").decode(Buffer.concat(chunks.map((ch) => Buffer.from(ch))).subarray(0, maxBytes));
  } finally {
    clearTimeout(t);
  }
}

/**
 * Every tip from the last `hours`. A source that fails is skipped and named
 * in errors. Bluesky posts come back most-engaged first, at most `perQuery`
 * per search.
 * @returns {Promise<{ bluesky: object[], podcasts: object[], trends: object[], errors: string[] }>}
 */
export async function gatherTips({ hours = 48, now = new Date(), fetchText = fetchHead, perQuery = 6 } = {}) {
  const since = now.getTime() - hours * 3600_000;
  const errors = [];
  const sinceIso = new Date(since).toISOString();

  const blueskyLists = await Promise.all(
    BLUESKY_QUERIES.map(async (q) => {
      const url = `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(`"${q}"`)}&sort=top&limit=25&since=${encodeURIComponent(sinceIso)}`;
      try {
        const posts = parseBlueskyPosts(JSON.parse(await fetchText(url, { maxBytes: 2_000_000, headers: { Accept: "application/json" } })), q);
        return posts
          .filter((p) => Date.parse(p.date) >= since)
          .sort((a, b) => b.likes + 2 * b.reposts + b.replies - (a.likes + 2 * a.reposts + a.replies))
          .slice(0, perQuery);
      } catch (e) {
        errors.push(`Bluesky "${q}": ${e.message}`);
        return [];
      }
    }),
  );
  const seen = new Set();
  const bluesky = blueskyLists.flat().filter((p) => (seen.has(p.url) ? false : (seen.add(p.url), true)));

  const podcastLists = await Promise.all(
    PODCAST_FEEDS.map(async (f) => {
      try {
        return parsePodcastFeed(await fetchText(f.url), f, since).slice(0, 4);
      } catch (e) {
        errors.push(`${f.name}: ${e.message}`);
        return [];
      }
    }),
  );
  const podcasts = podcastLists.flat().sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  let trends = [];
  try {
    trends = sportsTrends(parseTrends(await fetchText(TRENDS_URL)));
  } catch (e) {
    errors.push(`Google Trends: ${e.message}`);
  }
  return { bluesky, podcasts, trends, errors };
}

/** The tips as numbered lines for the scout's prompt. Ids (B1, P1, T1) let an idea name the tips behind it. */
export function formatTips({ bluesky = [], podcasts = [], trends = [] }) {
  const lines = [];
  lines.push("BLUESKY POSTS (author | likes/reposts/replies | posted | text):");
  if (bluesky.length) bluesky.forEach((p, i) => lines.push(`B${i + 1}. @${p.author} | ${p.likes}/${p.reposts}/${p.replies} | ${p.date.slice(0, 16)}Z | ${p.text}`));
  else lines.push("(none today)");
  lines.push("", "PODCAST EPISODES (show | posted | title: summary):");
  if (podcasts.length) podcasts.forEach((p, i) => lines.push(`P${i + 1}. ${p.show} | ${p.date.slice(0, 10)} | ${p.title}: ${p.summary}`));
  else lines.push("(none today)");
  lines.push("", "MISSISSIPPI SEARCH TRENDS, sports-related (search | approx. searches | headlines Google pairs with it):");
  if (trends.length) trends.forEach((t, i) => lines.push(`T${i + 1}. ${t.title} | ${t.traffic || "?"} | ${t.news.join(" / ") || "no headlines"}`));
  else lines.push("(none today)");
  return lines.join("\n");
}
