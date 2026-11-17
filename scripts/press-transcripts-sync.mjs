// Saves the schools' press conference transcripts for the sports desk.
//
// YouTube hands caption files to a home connection but refuses GitHub's
// runners (LOGIN_REQUIRED), so in production the desk cannot read a
// transcript itself. This script runs on the owner's Mac instead, every two
// hours (scripts/press-transcripts-mac.sh, which launchd starts). It lists the
// press conferences Ole Miss and Mississippi State posted in the last week,
// saves each one's transcript it does not have yet as <videoId>.json in the
// output folder, and deletes saved ones older than two weeks. The Mac job
// commits that folder to the claude/press-transcripts branch, and the sports
// desk workflow reads the branch before each run
// (readSavedTranscripts in scripts/lib/press-conferences.mjs).
//
// A video whose captions are not ready yet is skipped and tried again on the
// next run. Automatic captions saved within six hours of posting can be
// partial (a livestream still processing), so those are fetched once more
// after the six hours. Nothing here needs a key or npm packages.
//
// Usage: node scripts/press-transcripts-sync.mjs --out <folder> [--hours 168] [--keep-days 14]
// Exits 1 only when neither school's video list loaded.

import { mkdirSync, writeFileSync, renameSync, unlinkSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  PRESS_CHANNELS,
  recentPressConferences,
  pressConferenceTranscript,
  readSavedTranscripts,
  transcriptRecord,
} from "./lib/press-conferences.mjs";

const MAX_FETCHES = 20; // per run, so a first run or a long-off Mac backfills gently
const REFRESH_HOURS = 6;
const SAVED_NAME = /^([A-Za-z0-9_-]{11})\.json$/;

/** True for an automatic transcript saved within REFRESH_HOURS of posting, once REFRESH_HOURS have passed. */
export function needsRefresh(rec, now = new Date()) {
  const posted = Date.parse(rec.published);
  const fetched = Date.parse(rec.fetchedAt);
  const window = REFRESH_HOURS * 3600_000;
  return Boolean(rec.automatic) && Number.isFinite(fetched) && fetched - posted < window && now.getTime() - posted >= window;
}

/**
 * One pass: save new transcripts, refresh early automatic ones, and prune
 * old ones (and malformed files not touched in keepDays).
 * @returns {Promise<{ listed: number, added: object[], refreshed: object[], failed: string[], pruned: object[], prunedBad: string[], listErrors: string[], badFiles: string[] }>}
 */
export async function syncTranscripts({
  out,
  hours = 168,
  keepDays = 14,
  now = new Date(),
  list = recentPressConferences,
  transcript = pressConferenceTranscript,
  maxFetches = MAX_FETCHES,
} = {}) {
  mkdirSync(out, { recursive: true });
  const { items: saved, errors: badFiles } = readSavedTranscripts(out);
  const savedById = new Map(saved.map((s) => [s.videoId, s]));
  const { items: videos, errors: listErrors } = await list({ hours, now });

  const added = [];
  const refreshed = [];
  const failed = [];
  const written = new Set();
  let fetches = 0;
  for (const v of videos) {
    const old = savedById.get(v.videoId);
    if (old && !needsRefresh(old, now)) continue;
    if (fetches >= maxFetches) break;
    fetches++;
    try {
      const rec = transcriptRecord(v, await transcript(v.videoId), now);
      const file = join(out, `${v.videoId}.json`);
      writeFileSync(`${file}.tmp`, `${JSON.stringify(rec, null, 2)}\n`);
      renameSync(`${file}.tmp`, file);
      written.add(v.videoId);
      (old ? refreshed : added).push(rec);
    } catch (e) {
      failed.push(`${v.videoId} (${v.title})${old ? " refresh" : ""}: ${e.message}`);
    }
  }

  const cutoff = now.getTime() - keepDays * 86400_000;
  const pruned = [];
  for (const s of saved) {
    if (Date.parse(s.published) >= cutoff) continue;
    unlinkSync(join(out, `${s.videoId}.json`));
    pruned.push(s);
  }
  // A malformed <id>.json is re-saved if its video is still listed; one that
  // is not, and has sat untouched for keepDays, is removed.
  const prunedBad = [];
  for (const name of readdirSync(out)) {
    const id = name.match(SAVED_NAME)?.[1];
    if (!id || savedById.has(id) || written.has(id)) continue;
    const file = join(out, name);
    if (statSync(file).mtimeMs < cutoff) {
      unlinkSync(file);
      prunedBad.push(name);
    }
  }
  return { listed: videos.length, added, refreshed, failed, pruned, prunedBad, listErrors, badFiles };
}

function argValue(args, name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const out = argValue(args, "--out", "");
  const hours = Number(argValue(args, "--hours", "168"));
  const keepDays = Number(argValue(args, "--keep-days", "14"));
  if (!out || !(hours > 0) || !(keepDays > 0)) {
    console.error("Usage: node scripts/press-transcripts-sync.mjs --out <folder> [--hours 168] [--keep-days 14]");
    process.exit(2);
  }
  const r = await syncTranscripts({ out: resolve(out), hours, keepDays });
  for (const e of r.listErrors) console.log(`list failed: ${e}`);
  for (const e of r.badFiles) console.log(`bad saved file: ${e}`);
  for (const a of r.added) console.log(`saved ${a.videoId} | ${a.school} | ${a.title} | ${a.text.length} chars${a.automatic ? " (automatic captions)" : ""}`);
  for (const a of r.refreshed) console.log(`refreshed ${a.videoId} | ${a.school} | ${a.title} | ${a.text.length} chars${a.automatic ? " (automatic captions)" : ""}`);
  for (const f of r.failed) console.log(`not yet: ${f}`);
  for (const p of r.pruned) console.log(`pruned ${p.videoId} | ${p.published.slice(0, 10)} | ${p.title}`);
  for (const n of r.prunedBad) console.log(`pruned bad file ${n}`);
  console.log(`press conferences listed: ${r.listed}, saved: ${r.added.length}, refreshed: ${r.refreshed.length}, not ready: ${r.failed.length}, pruned: ${r.pruned.length + r.prunedBad.length}`);
  if (r.listErrors.length >= PRESS_CHANNELS.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
