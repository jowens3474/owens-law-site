// Tests for the sports desk's tips (Bluesky, podcasts, search trends).
// Run: node --test scripts/lib/sports-tips.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isTipOnlyUrl,
  parseBlueskyPosts,
  parsePodcastFeed,
  parseTrends,
  sportsTrends,
  gatherTips,
  formatTips,
  BLUESKY_QUERIES,
  PODCAST_FEEDS,
  TRENDS_URL,
} from "./sports-tips.mjs";

test("social, forum, podcast and trends URLs are tip-only; newsrooms, schools and YouTube are not", () => {
  for (const u of [
    "https://bsky.app/profile/someone.bsky.social/post/3abc",
    "https://www.reddit.com/r/CFB/comments/x",
    "https://old.reddit.com/r/olemiss",
    "https://x.com/someone/status/1",
    "https://twitter.com/someone",
    "https://www.facebook.com/page",
    "https://www.tigerdroppings.com/rant/lsu-sports/x/1/",
    "https://feeds.simplecast.com/e_k5LEa3",
    "https://open.spotify.com/episode/1",
    "https://podcasts.apple.com/us/podcast/x",
    "https://trends.google.com/trending/rss?geo=US-MS",
    "https://247sports.com/college/ole-miss/board/103/contents/x",
    "https://www.on3.com/boards/threads/x.1/",
  ]) {
    assert.ok(isTipOnlyUrl(u), u);
  }
  for (const u of [
    "https://olemisssports.com/news/2026/11/17/x",
    "https://247sports.com/college/ole-miss/article/x",
    "https://www.on3.com/teams/ole-miss-rebels/news/x/",
    "https://www.youtube.com/watch?v=e5IkVddyqac",
    "https://www.clarionledger.com/story/sports/x",
    "not a url",
    "",
  ]) {
    assert.ok(!isTipOnlyUrl(u), u);
  }
});

const post = (over = {}) => ({
  uri: "at://did:plc:abc/app.bsky.feed.post/3n2esk45s7cxq",
  author: { handle: "beatwriter.bsky.social" },
  record: { text: "Ole Miss  will\\nannounce a new DC soon, per sources", createdAt: "2026-11-17T15:00:00.000Z" },
  likeCount: 40,
  repostCount: 10,
  replyCount: 5,
  ...over,
});

test("Bluesky posts become tips with a post URL, and only posts that name the search are kept", () => {
  const tips = parseBlueskyPosts(
    {
      posts: [
        post(),
        post({ uri: "at://did:plc:abc/app.bsky.feed.post/linkonly", record: { text: "Read this", createdAt: "2026-11-17T14:00:00Z", embed: { external: { uri: "https://www.ebony.com/ole-miss-incident/" } } } }),
        post({ uri: "at://did:plc:abc/app.bsky.feed.post/offtopic", record: { text: "The state auditor spoke", createdAt: "2026-11-17T14:00:00Z" } }),
        post({ uri: "", record: { text: "Ole Miss", createdAt: "2026-11-17T14:00:00Z" } }),
        post({ record: { text: "Ole Miss", createdAt: "not a date" } }),
      ],
    },
    "Ole Miss",
  );
  assert.deepEqual(tips.map((t) => t.url), [
    "https://bsky.app/profile/beatwriter.bsky.social/post/3n2esk45s7cxq",
    "https://bsky.app/profile/beatwriter.bsky.social/post/linkonly",
  ]);
  assert.equal(tips[0].text, "Ole Miss will\\nannounce a new DC soon, per sources".replace(/\s+/g, " "));
  assert.equal(tips[0].likes, 40);
  assert.equal(tips[0].date, "2026-11-17T15:00:00.000Z");
  assert.deepEqual(parseBlueskyPosts(null), []);
});

const feedXml = `<?xml version="1.0"?><rss><channel><title>Show</title>
<item><title><![CDATA[Lebby&#8217;s Future &amp; the Staff Firings]]></title><pubDate>Tue, 17 Nov 2026 01:42:37 +0000</pubDate><link>https://show.example/ep2</link><description><![CDATA[<p>State fired its offensive line coach.</p> Our Sponsors: * Check out MyBookie and use my code X]]></description></item>
<item><title>Old episode</title><pubDate>Mon, 02 Nov 2026 01:00:00 +0000</pubDate><description>old</description></item>
<item><title>Cut off mid-way</title><pubDate>Tue, 17 Nov 2026 02:00:00 +0000</pubDate><descr`;

test("podcast episodes: recent complete items only, entities decoded, sponsor reads cut", () => {
  const feed = { name: "Thunder & Lightning (Mississippi State)", school: "Mississippi State", url: "https://feed.example/rss" };
  const eps = parsePodcastFeed(feedXml, feed, Date.parse("2026-11-15T00:00:00Z"));
  assert.equal(eps.length, 1);
  assert.equal(eps[0].title, "Lebby’s Future & the Staff Firings");
  assert.equal(eps[0].summary, "State fired its offensive line coach.");
  assert.equal(eps[0].url, "https://show.example/ep2");
  assert.equal(eps[0].show, feed.name);
  assert.equal(eps[0].date, "2026-11-17T01:42:37.000Z");
  const presented = parsePodcastFeed(
    `<item><title>Ep</title><pubDate>Tue, 17 Nov 2026 01:00:00 +0000</pubDate><description>Ole Miss lost. Presented by Kalshi, the prediction market</description></item>`,
    feed,
  );
  assert.equal(presented[0].summary, "Ole Miss lost.");
});

const trendsXml = `<rss><channel><title>Daily Search Trends</title>
<item><title>egg bowl tickets</title><ht:approx_traffic>2000+</ht:approx_traffic><ht:news_item_title>Egg Bowl moves to Friday</ht:news_item_title></item>
<item><title>gta 6 release date</title><ht:approx_traffic>5000+</ht:approx_traffic><ht:news_item_title>Rockstar sets a date</ht:news_item_title></item>
<item><title>pete golding</title><ht:approx_traffic>500+</ht:approx_traffic><ht:news_item_title>Golding says the fourth loss seals the fate</ht:news_item_title></item>
</channel></rss>`;

test("search trends: parsed with traffic and headlines, and only sports-looking ones kept", () => {
  const all = parseTrends(trendsXml);
  assert.equal(all.length, 3);
  assert.deepEqual(all[0], { kind: "Search trend", title: "egg bowl tickets", traffic: "2000+", news: ["Egg Bowl moves to Friday"] });
  assert.deepEqual(sportsTrends(all).map((t) => t.title), ["egg bowl tickets"]);
  // A trend with a sports headline counts even when the search itself is just a name.
  assert.deepEqual(
    sportsTrends([{ kind: "Search trend", title: "pete golding", traffic: "", news: ["Ole Miss coach Pete Golding"] }]).map((t) => t.title),
    ["pete golding"],
  );
});

test("gatherTips: each source fetched, failures reported, posts ranked by engagement and deduped", async () => {
  const now = new Date("2026-11-17T20:00:00Z");
  const fetched = [];
  const fetchText = async (url) => {
    fetched.push(url);
    if (url.startsWith("https://api.bsky.app/")) {
      const q = decodeURIComponent(new URL(url).searchParams.get("q")).replace(/"/g, "");
      if (q === "Alcorn State") throw new Error("HTTP 429");
      return JSON.stringify({
        posts: [
          post({ uri: `at://x/app.bsky.feed.post/low${q.length}`, record: { text: `${q} quiet post`, createdAt: "2026-11-17T10:00:00Z" }, likeCount: 1, repostCount: 0, replyCount: 0 }),
          post({ uri: "at://x/app.bsky.feed.post/shared", record: { text: `${q} and Ole Miss and Mississippi State and Southern Miss and Jackson State and Egg Bowl`, createdAt: "2026-11-17T11:00:00Z" } }),
          post({ uri: `at://x/app.bsky.feed.post/old${q.length}`, record: { text: `${q} old`, createdAt: "2026-11-10T11:00:00Z" } }),
        ],
      });
    }
    if (url === TRENDS_URL) return trendsXml;
    if (url === PODCAST_FEEDS[0].url) throw new Error("HTTP 500");
    return feedXml;
  };
  const tips = await gatherTips({ now, fetchText, hours: 48 });
  assert.equal(fetched.filter((u) => u.startsWith("https://api.bsky.app/")).length, BLUESKY_QUERIES.length);
  assert.ok(fetched.every((u) => !u.startsWith("https://api.bsky.app/") || new URL(u).searchParams.get("since") === "2026-11-15T20:00:00.000Z"));
  assert.equal(tips.bluesky[0].url, "https://bsky.app/profile/beatwriter.bsky.social/post/shared");
  assert.equal(tips.bluesky.filter((p) => p.url.endsWith("/shared")).length, 1, "the same post from two searches is one tip");
  assert.ok(tips.bluesky.every((p) => !p.url.includes("/old")), "posts older than the window are dropped");
  assert.equal(tips.podcasts.length, PODCAST_FEEDS.length - 1);
  assert.deepEqual(tips.trends.map((t) => t.title), ["egg bowl tickets"]);
  assert.deepEqual(tips.errors.sort(), ['Bluesky "Alcorn State": HTTP 429', `${PODCAST_FEEDS[0].name}: HTTP 500`].sort());

  const text = formatTips(tips);
  assert.match(text, /^BLUESKY POSTS/);
  assert.match(text, /\nB1\. @beatwriter\.bsky\.social \| 40\/10\/5 \| /);
  assert.match(text, /\nP1\. .+ \| 2026-11-17 \| Lebby’s Future & the Staff Firings: State fired its offensive line coach\./);
  assert.match(text, /\nT1\. egg bowl tickets \| 2000\+ \| Egg Bowl moves to Friday/);
  assert.match(formatTips({}), /\(none today\)/);
});
