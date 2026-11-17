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
 * @returns {Promise<{ items: { school: string, videoId: string, title: string, published: string, url: string }[], errors: string[] }>}
 */
export async function recentPressConferences({ hours = 96, now = new Date(), fetchFeed = fetchText } = {}) {
  const since = now.getTime() - hours * 3600_000;
  const items = [];
  const errors = [];
  await Promise.all(
    PRESS_CHANNELS.map(async (ch) => {
      try {
        const xml = await fetchFeed(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`);
        for (const v of parseChannelFeed(xml)) {
          if (Date.parse(v.published) < since || !isPressConferenceTitle(v.title)) continue;
          items.push({ school: ch.school, videoId: v.videoId, title: v.title, published: v.published, url: videoUrl(v.videoId) });
        }
      } catch (e) {
        errors.push(`${ch.name}: ${e.message}`);
      }
    }),
  );
  items.sort((a, b) => b.published.localeCompare(a.published));
  return { items, errors };
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
