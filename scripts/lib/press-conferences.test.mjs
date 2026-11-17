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
  transcriptRecord,
  validTranscriptRecord,
  readSavedTranscripts,
  mergeSavedPressers,
} from "./press-conferences.mjs";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  const { items, errors, feeds } = await recentPressConferences({ hours: 96, now, fetchFeed });
  assert.deepEqual(
    items.map((i) => i.videoId),
    ["e5IkVddyqac", "Rq4XwdopV68"],
  );
  assert.equal(items[0].school, "Ole Miss");
  assert.equal(items[0].url, videoUrl("e5IkVddyqac"));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Mississippi State.*HTTP 500/);
  // The feed's reach counts every video in it, not just press conferences.
  assert.deepEqual(feeds, {
    "Ole Miss": { ok: true, oldest: "2026-11-01T22:00:00.000Z" },
    "Mississippi State": { ok: false, oldest: null },
  });
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

const SAVED_TEXT = "Golding said the senior class has a chance to become the winningest in program history. ".repeat(4);
const savedVideo = { school: "Ole Miss", videoId: "e5IkVddyqac", title: "PRESSER | Pete Golding - Wofford Preview (11-17-26)", published: "2026-11-17T19:00:00+00:00", url: videoUrl("e5IkVddyqac") };

test("a saved transcript record round-trips, and a bad one is refused field by field", () => {
  const rec = transcriptRecord(savedVideo, { text: SAVED_TEXT, automatic: true }, new Date("2026-11-17T20:00:00Z"));
  assert.equal(rec.fetchedAt, "2026-11-17T20:00:00.000Z");
  const ok = validTranscriptRecord(JSON.parse(JSON.stringify(rec)), "e5IkVddyqac");
  assert.equal(ok.text, SAVED_TEXT);
  assert.equal(ok.automatic, true);
  assert.equal(ok.url, "https://www.youtube.com/watch?v=e5IkVddyqac");

  assert.equal(validTranscriptRecord(rec, "AAAAAAAAAAA"), null, "id must match the file");
  assert.equal(validTranscriptRecord({ ...rec, school: "Alabama" }, rec.videoId), null);
  assert.equal(validTranscriptRecord({ ...rec, title: " " }, rec.videoId), null);
  assert.equal(validTranscriptRecord({ ...rec, published: "soon" }, rec.videoId), null);
  assert.equal(validTranscriptRecord({ ...rec, published: "Nov 17, 2026" }, rec.videoId), null, "ISO dates only");
  assert.equal(validTranscriptRecord({ ...rec, text: "too short" }, rec.videoId), null);
  assert.equal(validTranscriptRecord([rec], rec.videoId), null);
  assert.equal(validTranscriptRecord(null, rec.videoId), null);
  // A stored url is ignored: the desk cites the watch URL built from the id.
  assert.equal(validTranscriptRecord({ ...rec, url: "https://evil.example/" }, rec.videoId).url, rec.url);
  // Missing "automatic" keeps the misheard-words warning.
  const noFlag = { ...rec };
  delete noFlag.automatic;
  assert.equal(validTranscriptRecord(noFlag, rec.videoId).automatic, true);
  assert.equal(validTranscriptRecord({ ...rec, automatic: false }, rec.videoId).automatic, false);
});

test("readSavedTranscripts reads <id>.json files, reports bad ones, and treats a missing folder as empty", () => {
  const dir = mkdtempSync(join(tmpdir(), "saved-transcripts-"));
  try {
    const rec = transcriptRecord(savedVideo, { text: SAVED_TEXT, automatic: false });
    writeFileSync(join(dir, "e5IkVddyqac.json"), JSON.stringify(rec));
    writeFileSync(join(dir, "BBBBBBBBBBB.json"), "{not json");
    writeFileSync(join(dir, "CCCCCCCCCCC.json"), JSON.stringify({ ...rec, videoId: "e5IkVddyqac" }));
    writeFileSync(join(dir, "README.md"), "notes");
    writeFileSync(join(dir, "e5IkVddyqac.json.tmp"), "partial");
    const { items, errors } = readSavedTranscripts(dir);
    assert.deepEqual(items.map((i) => i.videoId), ["e5IkVddyqac"]);
    assert.equal(items[0].automatic, false);
    assert.equal(errors.length, 2);
    assert.match(errors.join("\n"), /BBBBBBBBBBB\.json/);
    assert.match(errors.join("\n"), /CCCCCCCCCCC\.json: not a usable transcript record/);
    assert.deepEqual(readSavedTranscripts(join(dir, "missing")), { items: [], errors: [] });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("mergeSavedPressers: feed sessions get their saved copy; saved sessions return only when a feed cannot show them", () => {
  const now = new Date("2026-11-17T22:00:00Z");
  const session = (videoId, school, published) => ({ school, videoId, title: `PRESSER | ${videoId}`, published, url: videoUrl(videoId) });
  const savedOf = (v) => validTranscriptRecord(transcriptRecord(v, { text: SAVED_TEXT, automatic: true }), v.videoId);

  const listedA = session("AAAAAAAAAAA", "Ole Miss", "2026-11-17T19:02:11+00:00");
  const offFeed = session("OFFFEED0000", "Ole Miss", "2026-11-15T12:00:00+00:00"); // older than the Ole Miss feed reaches
  const takenDown = session("GONE0000000", "Ole Miss", "2026-11-16T12:00:00+00:00"); // the feed reaches this date but lacks it
  const feedDown = session("MSUFEED0000", "Mississippi State", "2026-11-16T20:00:00Z"); // MSU's feed failed
  const tooOld = session("TOOOLD00000", "Mississippi State", "2026-11-12T12:00:00Z"); // outside 96 hours
  const listedB = session("BBBBBBBBBBB", "Ole Miss", "2026-11-17T08:00:00-06:00"); // 14:00Z, other offset style

  const saved = [listedA, offFeed, takenDown, feedDown, tooOld].map(savedOf);
  const feeds = { "Ole Miss": { ok: true, oldest: "2026-11-16T00:00:00.000Z" }, "Mississippi State": { ok: false, oldest: null } };
  const out = mergeSavedPressers([listedB, listedA], saved, feeds, { now, hours: 96 });

  assert.deepEqual(out.map((v) => v.videoId), ["AAAAAAAAAAA", "BBBBBBBBBBB", "MSUFEED0000", "OFFFEED0000"]);
  assert.equal(out[0].saved.text, SAVED_TEXT);
  assert.equal(out[1].saved, null);
  assert.equal(out[2].saved.videoId, "MSUFEED0000");
  assert.equal(out[3].url, videoUrl("OFFFEED0000"));

  // With no feed information at all (the list failed outright), every saved session in the window returns.
  const noFeeds = mergeSavedPressers([], saved, {}, { now, hours: 96 });
  assert.deepEqual(noFeeds.map((v) => v.videoId), ["AAAAAAAAAAA", "MSUFEED0000", "GONE0000000", "OFFFEED0000"]);
  assert.ok(noFeeds.every((v) => v.saved));
});
