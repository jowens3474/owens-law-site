// Tests for the Mac job that saves press conference transcripts.
// Run: node --test scripts/press-transcripts-sync.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readdirSync, rmSync, existsSync, utimesSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncTranscripts, needsRefresh } from "./press-transcripts-sync.mjs";
import { readSavedTranscripts, transcriptRecord, videoUrl } from "./lib/press-conferences.mjs";

const NOW = new Date("2026-11-17T22:00:00Z");
const TEXT = "Lebby said the quarterback will start Saturday if he practices all week. ".repeat(4);
const video = (videoId, published, school = "Mississippi State") => ({
  school,
  videoId,
  title: `FOOTBALL | Jeff Lebby Press Conference - ${published.slice(5, 10)}`,
  published,
  url: videoUrl(videoId),
});

function withDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "press-sync-"));
  return Promise.resolve(fn(dir)).finally(() => rmSync(dir, { recursive: true, force: true }));
}

test("new transcripts are saved, saved ones are not fetched again, and unready ones are retried later", () =>
  withDir(async (dir) => {
    const listed = [video("AAAAAAAAAAA", "2026-11-17T18:00:00Z"), video("BBBBBBBBBBB", "2026-11-17T17:00:00Z"), video("CCCCCCCCCCC", "2026-11-16T17:00:00Z")];
    writeFileSync(join(dir, "CCCCCCCCCCC.json"), JSON.stringify(transcriptRecord(listed[2], { text: TEXT, automatic: true })));
    const fetched = [];
    const transcript = async (id) => {
      fetched.push(id);
      if (id === "BBBBBBBBBBB") throw new Error("No transcript available (ANDROID: no English captions).");
      return { text: TEXT, automatic: true };
    };
    const list = async () => ({ items: listed, errors: [] });
    const r = await syncTranscripts({ out: dir, now: NOW, list, transcript });
    assert.deepEqual(fetched, ["AAAAAAAAAAA", "BBBBBBBBBBB"]);
    assert.deepEqual(r.added.map((a) => a.videoId), ["AAAAAAAAAAA"]);
    assert.equal(r.failed.length, 1);
    assert.match(r.failed[0], /^BBBBBBBBBBB .*no English captions/);
    assert.deepEqual(readdirSync(dir).sort(), ["AAAAAAAAAAA.json", "CCCCCCCCCCC.json"]);
    const saved = readSavedTranscripts(dir);
    assert.equal(saved.errors.length, 0);
    assert.equal(saved.items.find((i) => i.videoId === "AAAAAAAAAAA").fetchedAt, NOW.toISOString());

    // Next run: B's captions are ready now; A and C are not fetched again.
    fetched.length = 0;
    const again = await syncTranscripts({ out: dir, now: NOW, list, transcript: async (id) => (fetched.push(id), { text: TEXT, automatic: false }) });
    assert.deepEqual(fetched, ["BBBBBBBBBBB"]);
    assert.deepEqual(again.added.map((a) => a.videoId), ["BBBBBBBBBBB"]);
  }));

test("saved transcripts older than keepDays are pruned, newer ones and other files are kept", () =>
  withDir(async (dir) => {
    const old = video("OOOOOOOOOOO", "2026-11-01T12:00:00Z");
    const fresh = video("FFFFFFFFFFF", "2026-11-10T12:00:00Z");
    for (const v of [old, fresh]) writeFileSync(join(dir, `${v.videoId}.json`), JSON.stringify(transcriptRecord(v, { text: TEXT, automatic: true })));
    writeFileSync(join(dir, "README.md"), "keep me");
    const r = await syncTranscripts({ out: dir, now: NOW, keepDays: 14, list: async () => ({ items: [], errors: [] }), transcript: async () => assert.fail("nothing to fetch") });
    assert.deepEqual(r.pruned.map((p) => p.videoId), ["OOOOOOOOOOO"]);
    assert.ok(!existsSync(join(dir, "OOOOOOOOOOO.json")));
    assert.ok(existsSync(join(dir, "FFFFFFFFFFF.json")));
    assert.ok(existsSync(join(dir, "README.md")));
  }));

test("a run fetches at most maxFetches transcripts, makes the folder, and passes list errors through", () =>
  withDir(async (base) => {
    const dir = join(base, "transcripts");
    const listed = ["AAAAAAAAAAA", "BBBBBBBBBBB", "CCCCCCCCCCC"].map((id) => video(id, "2026-11-17T12:00:00Z"));
    let calls = 0;
    const r = await syncTranscripts({
      out: dir,
      now: NOW,
      maxFetches: 2,
      list: async ({ hours }) => {
        assert.equal(hours, 168);
        return { items: listed, errors: ["Ole Miss Rebels (YouTube): HTTP 500"] };
      },
      transcript: async () => (calls++, { text: TEXT, automatic: true }),
    });
    assert.equal(calls, 2);
    assert.equal(r.added.length, 2);
    assert.deepEqual(r.listErrors, ["Ole Miss Rebels (YouTube): HTTP 500"]);
    assert.equal(readdirSync(dir).length, 2);
  }));

test("an automatic transcript saved soon after posting is fetched once more after six hours", () =>
  withDir(async (dir) => {
    const v = video("RRRRRRRRRRR", "2026-11-17T12:00:00Z");
    const early = transcriptRecord(v, { text: TEXT, automatic: true }, new Date("2026-11-17T13:00:00Z"));
    writeFileSync(join(dir, "RRRRRRRRRRR.json"), JSON.stringify(early));
    assert.equal(needsRefresh(early, new Date("2026-11-17T17:00:00Z")), false, "not before six hours");
    assert.equal(needsRefresh(early, NOW), true);
    assert.equal(needsRefresh({ ...early, automatic: false }, NOW), false, "human captions are final");
    assert.equal(needsRefresh({ ...early, fetchedAt: "2026-11-17T19:00:00Z" }, NOW), false, "fetched late enough already");

    const longer = `${TEXT}He added that the kicker is healthy. `;
    const list = async () => ({ items: [v], errors: [] });
    const r = await syncTranscripts({ out: dir, now: NOW, list, transcript: async () => ({ text: longer, automatic: true }) });
    assert.deepEqual(r.refreshed.map((x) => x.videoId), ["RRRRRRRRRRR"]);
    assert.equal(r.added.length, 0);
    const after = JSON.parse(readFileSync(join(dir, "RRRRRRRRRRR.json"), "utf8"));
    assert.equal(after.text, longer);
    assert.equal(after.fetchedAt, NOW.toISOString());

    // Refreshed once: the next run leaves it alone.
    const again = await syncTranscripts({ out: dir, now: NOW, list, transcript: async () => assert.fail("no second refresh") });
    assert.equal(again.refreshed.length + again.added.length + again.failed.length, 0);

    // A failed refresh keeps the saved copy.
    writeFileSync(join(dir, "RRRRRRRRRRR.json"), JSON.stringify(early));
    const failedRefresh = await syncTranscripts({ out: dir, now: NOW, list, transcript: async () => { throw new Error("HTTP 429"); } });
    assert.match(failedRefresh.failed[0], /RRRRRRRRRRR .* refresh: HTTP 429/);
    assert.equal(JSON.parse(readFileSync(join(dir, "RRRRRRRRRRR.json"), "utf8")).text, TEXT);
  }));

test("a malformed saved file is re-saved while listed, and removed once untouched for keepDays", () =>
  withDir(async (dir) => {
    const listed = video("LLLLLLLLLLL", "2026-11-17T12:00:00Z");
    writeFileSync(join(dir, "LLLLLLLLLLL.json"), "{broken");
    writeFileSync(join(dir, "SSSSSSSSSSS.json"), "{broken, recent");
    writeFileSync(join(dir, "XXXXXXXXXXX.json"), "{broken, stale");
    const stale = new Date("2026-10-01T00:00:00Z");
    utimesSync(join(dir, "XXXXXXXXXXX.json"), stale, stale);
    utimesSync(join(dir, "LLLLLLLLLLL.json"), stale, stale);
    const r = await syncTranscripts({ out: dir, now: NOW, list: async () => ({ items: [listed], errors: [] }), transcript: async () => ({ text: TEXT, automatic: true }) });
    assert.deepEqual(r.added.map((a) => a.videoId), ["LLLLLLLLLLL"]);
    assert.deepEqual(r.prunedBad, ["XXXXXXXXXXX.json"]);
    assert.equal(r.badFiles.length, 3);
    assert.deepEqual(readdirSync(dir).sort(), ["LLLLLLLLLLL.json", "SSSSSSSSSSS.json"]);
  }));
