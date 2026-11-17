// Tests for the sports desk's press conference list and transcripts.
// Run: node --test scripts/lib/press-conferences.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRESS_CHANNELS,
  isPressConferenceTitle,
  parseChannelFeed,
  captionText,
  pickCaptionTrack,
  recentPressConferences,
  pressConferenceTranscript,
  videoUrl,
} from "./press-conferences.mjs";

test("press conference titles from both schools are kept; highlights and features are not", () => {
  for (const t of [
    "PRESSER | Pete Golding - Wofford Preview (11-17-26)",
    "PRESSER | Desrae Kyles & Rachael Okokoh - LA Tech Postgame (11-15-26)",
    "FOOTBALL | Jeff Lebby Press Conference - 11/16/26",
    "WOMEN'S BASKETBALL | Sam Purcell Media Session - 11/16/26",
    "WOMEN'S BASKETBALL | Melissa Guillet, Tootie Lockett vs Alabama State - 11/17/26",
  ]) {
    assert.ok(isPressConferenceTitle(t), t);
  }
  for (const t of [
    "HIGHLIGHTS: Women's Basketball vs. LA Tech (11/15/26)",
    "WOMEN'S BASKETBALL | Highlights vs Buffalo - 11/14/26",
    "MISSISSIPPI STATE WOMEN'S BASKETBALL | MADISON FRANCIS, THE RETURN HOME",
    "SOCCER | NCAA Tournament Selection Show Press Conference",
    "Another Opportunity Awaits.",
    "",
  ]) {
    assert.ok(!isPressConferenceTitle(t), t);
  }
});

const feed = `<?xml version="1.0"?><feed>
<entry><yt:videoId>e5IkVddyqac</yt:videoId><title>PRESSER | Pete Golding - Wofford Preview (11-17-26)</title><published>2026-11-17T19:02:11+00:00</published></entry>
<entry><yt:videoId>o3SvMNbh0AE</yt:videoId><title>HIGHLIGHTS: Women&apos;s Basketball vs. LA Tech (11/15/26)</title><published>2026-11-15T23:00:00+00:00</published></entry>
<entry><yt:videoId>Rq4XwdopV68</yt:videoId><title>PRESSER | Desrae Kyles &amp; Rachael Okokoh - LA Tech Postgame (11-15-26)</title><published>2026-11-15T22:00:00+00:00</published></entry>
<entry><yt:videoId>OLD00000000</yt:videoId><title>PRESSER | Old Session (11-01-26)</title><published>2026-11-01T22:00:00+00:00</published></entry>
</feed>`;

test("channel feeds are parsed and entities decoded", () => {
  const v = parseChannelFeed(feed);
  assert.equal(v.length, 4);
  assert.deepEqual(v[0], { videoId: "e5IkVddyqac", title: "PRESSER | Pete Golding - Wofford Preview (11-17-26)", published: "2026-11-17T19:02:11+00:00" });
  assert.equal(v[2].title, "PRESSER | Desrae Kyles & Rachael Okokoh - LA Tech Postgame (11-15-26)");
  assert.equal(v[1].title, "HIGHLIGHTS: Women's Basketball vs. LA Tech (11/15/26)");
});

test("recent press conferences: recent sessions only, newest first, a failed channel reported", async () => {
  const now = new Date("2026-11-17T21:00:00Z");
  const fetchFeed = async (url) => {
    if (url.includes(PRESS_CHANNELS[1].channelId)) throw new Error("HTTP 500");
    return feed;
  };
  const { items, errors } = await recentPressConferences({ hours: 96, now, fetchFeed });
  assert.deepEqual(
    items.map((i) => i.videoId),
    ["e5IkVddyqac", "Rq4XwdopV68"],
  );
  assert.equal(items[0].school, "Ole Miss");
  assert.equal(items[0].url, videoUrl("e5IkVddyqac"));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Mississippi State.*HTTP 500/);
});

test("caption text joins the words in order", () => {
  const json = { events: [{ segs: [{ utf8: "All right." }, { utf8: " Who wants" }] }, { tStartMs: 5 }, { segs: [{ utf8: "\n" }, { utf8: "to start us off?" }] }] };
  assert.equal(captionText(json), "All right. Who wants to start us off?");
  assert.equal(captionText({}), "");
  // Human-made tracks put each line in its own event with no trailing space.
  const human = { events: [{ segs: [{ utf8: "We play Saturday." }] }, { segs: [{ utf8: "He is out for the year." }] }] };
  assert.equal(captionText(human), "We play Saturday. He is out for the year.");
});

test("a human-made English track is preferred over automatic captions", () => {
  const asr = { languageCode: "en", kind: "asr", baseUrl: "https://x/asr" };
  const human = { languageCode: "en-US", baseUrl: "https://x/human" };
  const spanish = { languageCode: "es", baseUrl: "https://x/es" };
  assert.equal(pickCaptionTrack([spanish, asr, human]), human);
  assert.equal(pickCaptionTrack([spanish, asr]), asr);
  assert.equal(pickCaptionTrack([spanish]), null);
  assert.equal(pickCaptionTrack(undefined), null);
});

test("a transcript falls back to the next app client, and a video with no captions is an error", async () => {
  const words = "Coach said the starter is out for the year after the injury on Saturday. ".repeat(5);
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push(url);
    if (url.includes("/player")) {
      const client = JSON.parse(init.body).context.client.clientName;
      if (client === "ANDROID") throw new Error("HTTP 403");
      return JSON.stringify({ playabilityStatus: { status: "OK" }, captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ languageCode: "en", kind: "asr", baseUrl: "https://captions/ios" }] } } });
    }
    return JSON.stringify({ events: [{ segs: [{ utf8: words }] }] });
  };
  const t = await pressConferenceTranscript("e5IkVddyqac", { fetchImpl });
  assert.equal(t.automatic, true);
  assert.match(t.text, /starter is out for the year/);
  assert.ok(calls.includes("https://captions/ios&fmt=json3"));

  const none = async (url) =>
    url.includes("/player") ? JSON.stringify({ playabilityStatus: { status: "OK" }, captions: {} }) : "";
  await assert.rejects(pressConferenceTranscript("e5IkVddyqac", { fetchImpl: none }), /No transcript available.*no English captions/);
  await assert.rejects(pressConferenceTranscript("not-an-id"), /not a YouTube video id/);
});
