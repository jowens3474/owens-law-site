#!/usr/bin/env node
// Meeting Archive ingest. Finds new meeting videos in the city's own Swagit
// archive (jacksonms.swagit.com: council, committees, budget hearings, with
// agendas), transcribes the audio, has DeepSeek index each meeting (summary,
// topics with timestamps, people, money, votes), and writes data/meetings/.
// The workflow commits the result; /meetings and the desk's
// meeting_transcripts tool read it. Publishes no articles.
//
// YouTube channels are a second source, used only when YouTube can be
// reached (it blocks GitHub's addresses unless YOUTUBE_COOKIES is set).
//
// Env:
//   DEEPSEEK_API_KEY  optional; without it transcripts are stored unindexed
//                     and indexed on a later run
//   GROQ_API_KEY      optional; Whisper via Groq instead of the runner's CPU
//   MODE              "list" prints candidate videos and exits;
//                     "ytprobe" tests which yt-dlp client can read VIDEO
//   VIDEO             comma-separated ids to ingest directly: Swagit numeric
//                     ids or URLs (…/videos/400748), YouTube ids or URLs
//   LIMIT             new videos to ingest per run (default 2; transcription
//                     is the slow part)
//   MAX_HOURS         skip videos longer than this (default 4)
//   BACKFILL          list this many older YouTube uploads per channel via
//                     yt-dlp instead of the 15-item RSS feed (default 0)
//   YOUTUBE=1         also check the YouTube channels (default only when
//                     YTDLP_COOKIES is set)
//   FORCE=1           re-ingest VIDEO ids already archived
//   DRY_RUN=1         do the work, print, write nothing
//   YTDLP_ARGS        extra yt-dlp flags if YouTube starts blocking the runner
// Requires ffmpeg on PATH; yt-dlp for YouTube; faster-whisper (python) when
// GROQ_API_KEY is not set.

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
  listSwagitVideos,
  swagitVideoInfo,
  classifySwagitBody,
  extractAudio,
  transcribe,
  DATA_DIR,
} from "./lib/meetings.mjs";
import { fetchUrl } from "./lib/fetch-url.mjs";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const log = (m) => console.log(`[meetings] ${m}`);
const dryRun = process.env.DRY_RUN === "1";
const force = process.env.FORCE === "1";
const mode = (process.env.MODE || "").trim();
const LIMIT = Math.max(1, Number(process.env.LIMIT) || 2);
const BACKFILL = Math.max(0, Number(process.env.BACKFILL) || 0);
const MAX_SECONDS = Math.max(1, Number(process.env.MAX_HOURS) || 4) * 3600;
const USE_YOUTUBE = process.env.YOUTUBE === "1" || !!process.env.YTDLP_COOKIES;
const TMP = join(DATA_DIR, ".tmp");
const MAX_CAPTION_TRIES = 6; // auto captions can lag an upload by hours

/** "400748", "sw400748", a Swagit URL, a YouTube id or URL → {kind, id}. */
function parseVideoIds(spec) {
  return (spec || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const sw = s.match(/swagit\.com\/videos\/(\d+)/) || s.match(/^(?:sw)?(\d{4,9})$/);
      if (sw) return { kind: "swagit", id: `sw${sw[1]}` };
      const yt = s.match(/(?:v=|youtu\.be\/|\/live\/|\/shorts\/)([\w-]{11})/)?.[1] || (/^[\w-]{11}$/.test(s) ? s : null);
      return yt ? { kind: "youtube", id: yt } : null;
    })
    .filter(Boolean);
}

/** Candidate videos across all sources: [{id, kind, title, source, body}]. */
async function discover() {
  const out = [];
  try {
    const videos = await listSwagitVideos();
    log(`swagit: ${videos.length} videos in the city archive`);
    for (const v of videos) {
      out.push({ id: `sw${v.id}`, kind: "swagit", title: v.title, published: v.date, duration: v.duration, source: "swagit", body: classifySwagitBody(v.title) });
    }
  } catch (e) {
    log(`swagit listing failed: ${e.message}`);
  }
  if (!USE_YOUTUBE) {
    log("YouTube channels skipped (set YOUTUBE=1 or YOUTUBE_COOKIES to include them)");
    return out;
  }
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
      out.push({ ...v, kind: "youtube", source: src.key, body });
    }
  }
  return out;
}

async function ingestSwagit(id, { body, index, client }) {
  const existing = index.meetings.find((m) => m.id === id);
  const num = id.replace(/^sw/, "");
  log(`ingest swagit ${num}${existing ? " (retry)" : ""}`);
  const info = await swagitVideoInfo(num);
  if (!info.media) throw new Error("no media or download link on the video page");
  const meeting = {
    id,
    source: "swagit",
    body: body || existing?.body || classifySwagitBody(info.title) || "City of Jackson public meeting",
    title: info.title,
    date: info.date || existing?.date || "",
    duration: null,
    channel: "City of Jackson video archive",
    url: `https://jacksonms.new.swagit.com/videos/${num}`,
    agenda: info.agenda,
    captions: "transcribed",
    fetched: new Date().toISOString(),
  };
  log(`  ${meeting.date} | ${meeting.body} | ${meeting.title}`);

  mkdirSync(TMP, { recursive: true });
  const audio = join(TMP, `${id}.mp3`);
  const t0 = Date.now();
  extractAudio(info.media, audio);
  log(`  audio extracted in ${Math.round((Date.now() - t0) / 1000)}s`);
  const { cues, engine } = await transcribe(audio, { log: (m) => log(`  ${m}`) });
  rmSync(audio, { force: true });
  meeting.duration = cues.length ? cues[cues.length - 1].t : null;
  meeting.engine = engine;
  const blocks = cuesToBlocks(cues);
  log(`  ${cues.length} segments → ${blocks.length} blocks via ${engine} in ${Math.round((Date.now() - t0) / 60000)} min`);
  if (!blocks.length) throw new Error("transcription produced no text");

  let agenda = "";
  if (info.agenda) {
    try {
      agenda = (await fetchUrl(info.agenda)).text || "";
      log(`  agenda: ${agenda.length} chars`);
    } catch (e) {
      log(`  agenda unreadable: ${e.message}`);
    }
  }
  const words = blocks.reduce((n, b) => n + b.text.split(/\s+/).length, 0);
  const full = { ...meeting, words, blocks };
  let indexed = null;
  if (client) {
    try {
      indexed = await indexWithModel(client, full, { log: (m) => log(`  ${m}`), agenda });
      log(`  indexed: ${indexed.topics.length} topics, ${indexed.votes.length} votes`);
    } catch (e) {
      log(`  indexing failed: ${e.message}`);
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
    log("yt-dlp not installed; YouTube sources unavailable");
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
    const id = direct.find((d) => d.kind === "youtube")?.id || "bfwlmLU0BAc"; // Regular City Council Meeting Sep 8, 2026
    log(`probing YouTube access with ${id}${process.env.YTDLP_COOKIES ? " (cookies set)" : ""}${process.env.BGUTIL_SCRIPT ? " (PO token provider set)" : ""}`);
    probeYouTubeAccess(id, log);
    return;
  }
  if (direct.length) {
    for (const { kind, id } of direct) {
      const k = known.get(id);
      if (k && k.words > 0 && !force) {
        log(`${id} already archived (${k.date} ${k.body}); use FORCE=1 to redo`);
        continue;
      }
      jobs.push({ id, kind, source: k?.source, body: k?.body });
    }
  } else {
    const found = await discover();
    if (mode === "list") {
      for (const v of found) console.log(`${v.id} | ${v.published || "?"} | ${v.duration ? fmtTime(v.duration) : "?"} | ${v.body || "(skip: no body match)"} | ${v.title}`);
      return;
    }
    // Newest first so a fresh meeting is archived before older backlog.
    found.sort((a, b) => (b.published || "").localeCompare(a.published || ""));
    for (const v of found) {
      if (!v.body) continue;
      if (v.duration && v.duration > MAX_SECONDS) continue;
      if (v.duration && v.duration < 120) continue; // test clips
      const k = known.get(v.id);
      if (k && (k.words > 0 || (k.tries || 0) >= MAX_CAPTION_TRIES)) continue;
      jobs.push({ id: v.id, kind: v.kind, source: v.source, body: v.body });
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
      } else if (job.kind === "swagit" || /^sw\d+$/.test(job.id)) {
        result = await ingestSwagit(job.id, { ...job, index, client });
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
