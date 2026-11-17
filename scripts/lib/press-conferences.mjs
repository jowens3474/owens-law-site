// Official press conference videos and their transcripts, for the sports desk
// (scripts/sports-desk.mjs).
//
// Ole Miss and Mississippi State post every coach and player press conference
// to their athletics YouTube channels, usually the same day. The desk lists
// the recent ones in its prompt as story ideas, and its
// press_conference_transcript tool reads one. A transcript is YouTube's
// caption text (usually automatic captions), so it holds what was actually
// said: the desk can quote it, and the quote check matches against it.
//
// No key is needed. The channel list comes from YouTube's public RSS feed;
// the captions come from YouTube's player data as its Android and iOS apps
// request it (the web player's caption links now need a token this script
// cannot make). Channel ids were checked against the channels on Nov. 17,
// 2026.
//
// YouTube refuses the caption request from GitHub's runners (LOGIN_REQUIRED)
// but answers a home connection, so the owner's Mac saves each new
// transcript ahead of time (scripts/press-transcripts-sync.mjs) to the
// claude/press-transcripts branch, and the desk reads the saved copy first
// (readSavedTranscripts below).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const PRESS_CHANNELS = [
  { school: "Ole Miss", channelId: "UCp47rvbbB-HzCH96MU6yplQ", name: "Ole Miss Rebels (YouTube)" },
  { school: "Mississippi State", channelId: "UCeDDInREzm0nJNnCNFSmVwA", name: "Mississippi State Athletics (YouTube)" },
];

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TheJacksonWire/1.0";

// Ole Miss titles its press conferences "PRESSER | Name - Topic (date)";
// Mississippi State uses "FOOTBALL | Name Press Conference - date" for weekly
// sessions and "SPORT | Names vs Opponent - date" for postgame ones.
const PRESS_WORDS = /\b(presser|press conference|media session|media availability|media day|postgame|post-game|pregame|weekly)\b/i;
const NOT_PRESS = /\b(highlights?|hype|trailer|recap|preview show|mic'?d up|all-access|behind the scenes|feature|hype video|promo|selection show)\b/i;

/** True for a video title that reads like a press conference or interview session. */
export function isPressConferenceTitle(title) {
  const t = String(title ?? "");
  if (!t.trim() || NOT_PRESS.test(t)) return false;
  if (PRESS_WORDS.test(t)) return true;
  // Mississippi State's postgame sessions: "SPORT | Name, Name vs Opponent - 11/17/26".
  return /^[A-Z'’ ]{4,}\s\|\s.+\bvs\.?\s.+\s-\s\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/.test(t);
}

const decodeXml = (s) =>
  String(s ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** Videos in a YouTube channel RSS feed: { videoId, title, published } in feed order (newest first). */
export function parseChannelFeed(xml) {
  const out = [];
  for (const entry of String(xml ?? "").split(/<entry>/).slice(1)) {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1]?.trim();
    if (videoId && title && published) out.push({ videoId, title: decodeXml(title).trim(), published });
  }
  return out;
}

/**
 * Plain text from a YouTube "json3" caption file: the words in order, one space
 * apart. Segments within an event run together (automatic captions carry their
 * own spaces); events are separate lines, so they are joined with a space.
 */
export function captionText(json) {
  const events = Array.isArray(json?.events) ? json.events : [];
  const lines = [];
  for (const e of events) {
    const segs = Array.isArray(e?.segs) ? e.segs : [];
    const line = segs.map((x) => (typeof x?.utf8 === "string" ? x.utf8 : "")).join("");
    if (line.trim()) lines.push(line);
  }
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

/** The watch URL the desk cites for a video. */
export const videoUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;

async function fetchText(url, init = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init.headers || {}) }, signal: c.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Press conferences posted in the last `hours` on the schools' channels,
 * newest first. A channel that fails to load is skipped and reported.
 * `feeds` says, per school, whether its feed loaded and the date of the
 * oldest video in it (a feed holds only the channel's latest 15 videos).
 * @returns {Promise<{ items: { school: string, videoId: string, title: string, published: string, url: string }[], errors: string[], feeds: Record<string, { ok: boolean, oldest: string | null }> }>}
 */
export async function recentPressConferences({ hours = 96, now = new Date(), fetchFeed = fetchText } = {}) {
  const since = now.getTime() - hours * 3600_000;
  const items = [];
  const errors = [];
  const feeds = {};
  await Promise.all(
    PRESS_CHANNELS.map(async (ch) => {
      try {
        const xml = await fetchFeed(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`);
        const videos = parseChannelFeed(xml);
        const times = videos.map((v) => Date.parse(v.published)).filter(Number.isFinite);
        feeds[ch.school] = { ok: true, oldest: times.length ? new Date(Math.min(...times)).toISOString() : null };
        for (const v of videos) {
          if (Date.parse(v.published) < since || !isPressConferenceTitle(v.title)) continue;
          items.push({ school: ch.school, videoId: v.videoId, title: v.title, published: v.published, url: videoUrl(v.videoId) });
        }
      } catch (e) {
        feeds[ch.school] = { ok: false, oldest: null };
        errors.push(`${ch.name}: ${e.message}`);
      }
    }),
  );
  items.sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  return { items, errors, feeds };
}

// The player requests YouTube's own apps make. Each returns caption links
// that work without the web player's token.
const PLAYER_CLIENTS = [
  {
    name: "ANDROID",
    body: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30 },
    ua: "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
  },
  {
    name: "IOS",
    body: { clientName: "IOS", clientVersion: "20.10.4", deviceModel: "iPhone16,2", osName: "iPhone", osVersion: "18.3.2.22D82" },
    ua: "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
  },
];

/** The English caption track to read: a human-made one when there is one, else the automatic one. */
export function pickCaptionTrack(tracks) {
  const list = Array.isArray(tracks) ? tracks.filter((t) => t && typeof t.baseUrl === "string") : [];
  const english = list.filter((t) => /^en\b/i.test(String(t.languageCode ?? "")));
  return english.find((t) => t.kind !== "asr") || english[0] || null;
}

/**
 * The transcript of one video. Tries each app client in turn.
 * @returns {Promise<{ text: string, automatic: boolean }>}
 */
export async function pressConferenceTranscript(videoId, { fetchImpl = fetchText } = {}) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(String(videoId ?? ""))) throw new Error(`"${videoId}" is not a YouTube video id.`);
  const reasons = [];
  for (const client of PLAYER_CLIENTS) {
    try {
      const player = JSON.parse(
        await fetchImpl("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": client.ua },
          body: JSON.stringify({ context: { client: { ...client.body, hl: "en" } }, videoId }),
        }),
      );
      const status = player?.playabilityStatus?.status;
      const track = pickCaptionTrack(player?.captions?.playerCaptionsTracklistRenderer?.captionTracks);
      if (!track) {
        reasons.push(`${client.name}: no English captions (status ${status || "unknown"})`);
        continue;
      }
      const raw = await fetchImpl(`${track.baseUrl}&fmt=json3`, { headers: { "User-Agent": client.ua } });
      const text = raw.trim() ? captionText(JSON.parse(raw)) : "";
      if (text.length < 200) {
        reasons.push(`${client.name}: caption file empty`);
        continue;
      }
      return { text, automatic: track.kind === "asr" };
    } catch (e) {
      reasons.push(`${client.name}: ${e.message}`);
    }
  }
  throw new Error(`No transcript available (${reasons.join("; ")}).`);
}

// ---------------------------------------------------------------------------
// Saved transcripts: one <videoId>.json file per press conference, written by
// the Mac job and read by the desk.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const PRESS_SCHOOLS = new Set(PRESS_CHANNELS.map((c) => c.school));
const MIN_SAVED_CHARS = 200;

/** The record the Mac job saves for one press conference. */
export function transcriptRecord(video, { text, automatic }, now = new Date()) {
  return {
    videoId: video.videoId,
    school: video.school,
    title: video.title,
    published: video.published,
    url: videoUrl(video.videoId),
    automatic: Boolean(automatic),
    fetchedAt: now.toISOString(),
    text,
  };
}

/**
 * A saved record checked field by field, or null when it is not one the desk
 * can use. The video id must match the file it came from, and the school
 * must be one of PRESS_CHANNELS, and the posting time must be an ISO date
 * like the feed's. A record that does not say whether its
 * captions were automatic is treated as automatic, so the desk keeps the
 * misheard-words warning.
 */
export function validTranscriptRecord(rec, videoId) {
  if (!rec || typeof rec !== "object" || Array.isArray(rec)) return null;
  if (!VIDEO_ID.test(String(videoId ?? "")) || rec.videoId !== videoId) return null;
  if (!PRESS_SCHOOLS.has(rec.school)) return null;
  if (typeof rec.title !== "string" || !rec.title.trim()) return null;
  if (typeof rec.published !== "string" || !ISO_TIME.test(rec.published) || Number.isNaN(Date.parse(rec.published))) return null;
  if (typeof rec.text !== "string" || rec.text.trim().length < MIN_SAVED_CHARS) return null;
  return {
    videoId,
    school: rec.school,
    title: rec.title.trim(),
    published: rec.published,
    url: videoUrl(videoId),
    automatic: rec.automatic !== false,
    fetchedAt: typeof rec.fetchedAt === "string" ? rec.fetchedAt : "",
    text: rec.text,
  };
}

/**
 * Every usable saved transcript in a folder, in file name order. Files
 * not named <videoId>.json are ignored; unreadable or malformed ones are
 * reported in errors. A missing folder is not an error: there is nothing
 * saved yet.
 * @returns {{ items: ReturnType<typeof validTranscriptRecord>[], errors: string[] }}
 */
export function readSavedTranscripts(dir) {
  const items = [];
  const errors = [];
  let names;
  try {
    names = readdirSync(dir);
  } catch (e) {
    if (e?.code !== "ENOENT") errors.push(`${dir}: ${e.message}`);
    return { items, errors };
  }
  for (const name of names.sort()) {
    const id = name.match(/^([A-Za-z0-9_-]{11})\.json$/)?.[1];
    if (!id) continue;
    try {
      const rec = validTranscriptRecord(JSON.parse(readFileSync(join(dir, name), "utf8")), id);
      if (rec) items.push(rec);
      else errors.push(`${name}: not a usable transcript record`);
    } catch (e) {
      errors.push(`${name}: ${e.message}`);
    }
  }
  return { items, errors };
}

/**
 * The desk's press conference list, newest first: the feeds' sessions, each
 * with its saved transcript (or null) as `saved`, plus saved sessions a feed
 * no longer shows because they are older than its oldest video or because
 * that school's feed did not load. A saved session missing from a feed that
 * reaches back past its date was taken down or made private, so it is left
 * out. Only sessions posted in the last `hours` are kept.
 */
export function mergeSavedPressers(listed, saved, feeds = {}, { now = new Date(), hours = 96 } = {}) {
  const since = now.getTime() - hours * 3600_000;
  const savedById = new Map(saved.map((t) => [t.videoId, t]));
  const byId = new Map(listed.map((v) => [v.videoId, v]));
  for (const t of saved) {
    if (byId.has(t.videoId)) continue;
    const at = Date.parse(t.published);
    if (!(at >= since)) continue;
    const feed = feeds[t.school];
    const oldest = feed?.ok && feed.oldest ? Date.parse(feed.oldest) : NaN;
    if (Number.isFinite(oldest) && at >= oldest) continue; // the feed covers its date and lacks it
    byId.set(t.videoId, { school: t.school, videoId: t.videoId, title: t.title, published: t.published, url: t.url });
  }
  return [...byId.values()]
    .map((v) => ({ ...v, saved: savedById.get(v.videoId) ?? null }))
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
}
