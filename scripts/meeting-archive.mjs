#!/usr/bin/env node
// Meeting Archive ingest. Finds new meeting videos on the governments' own
// YouTube channels, pulls the captions, has DeepSeek index each meeting
// (summary, topics with timestamps, people, money, votes), and writes
// data/meetings/. The workflow commits the result; /meetings and the desk's
// meeting_transcripts tool read it. Publishes no articles.
//
// Env:
//   DEEPSEEK_API_KEY  optional; without it transcripts are stored unindexed
//                     and indexed on a later run
//   MODE              "list" prints candidate videos and exits;
//                     "ytprobe" tests which yt-dlp client can read VIDEO
//   VIDEO             comma-separated YouTube ids or URLs to ingest directly
//   LIMIT             new videos to ingest per run (default 6)
//   BACKFILL          list this many older uploads per channel via yt-dlp
//                     instead of the 15-item RSS feed (default 0)
//   FORCE=1           re-ingest VIDEO ids already archived
//   DRY_RUN=1         do the work, print, write nothing
//   YTDLP_ARGS        extra yt-dlp flags (e.g. extractor args) if YouTube
//                     starts blocking the runner
// Requires yt-dlp on PATH.

import OpenAI from "openai";
import {
  SOURCES,
  classifyBody,
  loadIndex,
  saveIndex,
  loadMeeting,
  saveMeeting,
  resolveChannelId,
  listRecentVideos,
  listChannelVideos,
  videoInfo,
  fetchCaptions,
  cuesToBlocks,
  indexWithModel,
  ytdlp,
  fmtTime,
  probeYouTubeAccess,
} from "./lib/meetings.mjs";

const log = (m) => console.log(`[meetings] ${m}`);
const dryRun = process.env.DRY_RUN === "1";
const force = process.env.FORCE === "1";
const mode = (process.env.MODE || "").trim();
const LIMIT = Math.max(1, Number(process.env.LIMIT) || 6);
const BACKFILL = Math.max(0, Number(process.env.BACKFILL) || 0);
const MAX_CAPTION_TRIES = 6; // auto captions can lag an upload by hours

function parseVideoIds(spec) {
  return (spec || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.match(/(?:v=|youtu\.be\/|\/live\/|\/shorts\/)([\w-]{11})/)?.[1] || (/^[\w-]{11}$/.test(s) ? s : null))
    .filter(Boolean);
}

/** Candidate videos across all sources: [{id, title, source, body}]. */
async function discover() {
  const out = [];
  for (const src of SOURCES) {
    let videos = [];
    try {
      if (BACKFILL > 0) {
        videos = listChannelVideos(src.handle, BACKFILL);
        log(`${src.key}: ${videos.length} uploads via yt-dlp (backfill ${BACKFILL})`);
      } else {
        const channelId = src.channelId || (await resolveChannelId(src.handle));
        videos = await listRecentVideos(channelId);
        log(`${src.key}: ${videos.length} recent uploads via feed ${channelId}`);
      }
    } catch (e) {
      log(`${src.key}: feed failed (${e.message}); trying yt-dlp listing`);
      try {
        videos = listChannelVideos(src.handle, 20);
      } catch (e2) {
        log(`${src.key}: listing failed: ${e2.message}`);
        continue;
      }
    }
    for (const v of videos) {
      const body = classifyBody(src, v.title);
      out.push({ ...v, source: src.key, body });
    }
  }
  return out;
}

async function ingest(id, { source, body, index, client }) {
  const existing = index.meetings.find((m) => m.id === id);
  log(`ingest ${id}${existing ? " (retry)" : ""}`);
  const info = videoInfo(id);
  if (info.live) {
    log(`  ${id}: still live or upcoming, skip`);
    return null;
  }
  const meeting = {
    id,
    source: source || existing?.source || "manual",
    body: body || existing?.body || classifyBodyAny(info.title) || "Public meeting",
    title: info.title,
    date: info.date || existing?.date || "",
    duration: info.duration,
    channel: info.channel,
    url: `https://www.youtube.com/watch?v=${id}`,
    captions: info.captions,
    fetched: new Date().toISOString(),
  };
  log(`  ${meeting.date} | ${meeting.body} | ${meeting.title} | ${fmtTime(meeting.duration || 0)} | captions=${info.captions}`);

  let blocks = [];
  if (info.captions !== "none") {
    const cues = fetchCaptions(id);
    blocks = cuesToBlocks(cues);
    log(`  ${cues.length} cues → ${blocks.length} blocks`);
  }
  if (!blocks.length) {
    const tries = (existing?.tries || 0) + 1;
    log(`  no captions yet (try ${tries}/${MAX_CAPTION_TRIES})`);
    return { entry: { ...meeting, captions: "none", tries, words: 0, indexed: false }, full: null };
  }
  const words = blocks.reduce((n, b) => n + b.text.split(/\s+/).length, 0);
  const full = { ...meeting, words, blocks };
  let indexed = existing?.indexed && !force ? loadMeeting(id)?.index : null;
  if (client && !indexed) {
    try {
      indexed = await indexWithModel(client, full, { log: (m) => log(`  ${m}`) });
      log(`  indexed: ${indexed.topics.length} topics, ${indexed.votes.length} votes`);
    } catch (e) {
      log(`  indexing failed: ${e.message}`);
      indexed = null;
    }
  }
  full.index = indexed;
  const entry = {
    ...meeting,
    words,
    indexed: !!indexed,
    summary: indexed?.summary || "",
    topics: indexed?.topics || [],
    people: indexed?.people || [],
    money: indexed?.money || [],
    votes: indexed?.votes || [],
  };
  return { entry, full };
}

function classifyBodyAny(title) {
  for (const src of SOURCES) {
    const b = classifyBody(src, title);
    if (b) return b;
  }
  return null;
}

async function main() {
  try {
    log(`yt-dlp ${ytdlp(["--version"]).trim()}`);
  } catch {
    throw new Error("yt-dlp is not installed (pip install -U yt-dlp)");
  }
  const client = process.env.DEEPSEEK_API_KEY
    ? new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" })
    : null;
  if (!client) log("No DEEPSEEK_API_KEY: transcripts will be stored unindexed.");

  const index = loadIndex();
  const known = new Map(index.meetings.map((m) => [m.id, m]));
  const jobs = [];

  const direct = parseVideoIds(process.env.VIDEO);
  if (mode === "ytprobe") {
    const id = direct[0] || "bfwlmLU0BAc"; // Regular City Council Meeting Sep 8, 2026
    log(`probing YouTube access with ${id}${process.env.YTDLP_COOKIES ? " (cookies set)" : ""}`);
    probeYouTubeAccess(id, log);
    return;
  }
  if (direct.length) {
    for (const id of direct) {
      const k = known.get(id);
      if (k && k.words > 0 && !force) {
        log(`${id} already archived (${k.date} ${k.body}); use FORCE=1 to redo`);
        continue;
      }
      jobs.push({ id, source: k?.source, body: k?.body });
    }
  } else {
    const found = await discover();
    if (mode === "list") {
      for (const v of found) console.log(`${v.id} | ${v.published || "?"} | ${v.body || "(skip: no body match)"} | ${v.title}`);
      return;
    }
    for (const v of found) {
      if (!v.body) continue;
      const k = known.get(v.id);
      if (k && (k.words > 0 || (k.tries || 0) >= MAX_CAPTION_TRIES)) continue;
      jobs.push({ id: v.id, source: v.source, body: v.body });
    }
    // Retry archived-but-unindexed meetings when a key is available.
    if (client) {
      for (const m of index.meetings) {
        if (m.words > 0 && !m.indexed && !jobs.some((j) => j.id === m.id)) jobs.push({ id: m.id, source: m.source, body: m.body, reindex: true });
      }
    }
  }
  log(`${jobs.length} video(s) to process; limit ${LIMIT}`);

  let changed = 0;
  for (const job of jobs.slice(0, LIMIT)) {
    try {
      let result;
      if (job.reindex) {
        const full = loadMeeting(job.id);
        if (!full) continue;
        const indexed = await indexWithModel(client, full, { log: (m) => log(`  ${m}`) });
        full.index = indexed;
        const entry = { ...known.get(job.id), indexed: true, summary: indexed.summary, topics: indexed.topics, people: indexed.people, money: indexed.money, votes: indexed.votes };
        result = { entry, full };
        log(`reindexed ${job.id}: ${indexed.topics.length} topics`);
      } else {
        result = await ingest(job.id, { ...job, index, client });
      }
      if (!result) continue;
      const { entry, full } = result;
      if (dryRun) {
        log(`DRY RUN: would write ${entry.id} (${entry.words} words, indexed=${entry.indexed})`);
        if (entry.summary) console.log(`  summary: ${entry.summary}`);
        for (const t of (entry.topics || []).slice(0, 8)) console.log(`  [${fmtTime(t.start)}] ${t.title}: ${t.note}`);
        continue;
      }
      if (full) saveMeeting(full);
      const i = index.meetings.findIndex((m) => m.id === entry.id);
      if (i >= 0) index.meetings[i] = entry;
      else index.meetings.push(entry);
      changed++;
    } catch (e) {
      log(`${job.id} failed: ${e.message}`);
    }
  }
  if (changed && !dryRun) {
    saveIndex(index);
    log(`wrote ${changed} meeting(s); archive now holds ${index.meetings.filter((m) => m.words > 0).length} transcripts`);
  } else {
    log("nothing written");
  }
}

main().catch((e) => {
  console.error(`[meetings] ${e.message}`);
  process.exit(1);
});
