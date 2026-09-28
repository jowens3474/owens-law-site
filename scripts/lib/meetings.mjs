// The Meeting Archive: transcripts of public meetings in metro Jackson,
// pulled from the governments' own YouTube channels, indexed by DeepSeek,
// and stored in data/meetings/ so the site (/meetings) and the research desk
// (meeting_transcripts tool) can search what was actually said.
//
// Layout:
//   data/meetings/index.json   every archived meeting: metadata, summary,
//                              topics with timestamps (small; imported by pages)
//   data/meetings/<id>.json    one meeting's full transcript in timed blocks
//
// Captions come from YouTube (auto-generated unless the channel uploaded its
// own) via yt-dlp, which must be on PATH. Nothing here publishes an article.

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

export const DATA_DIR = "data/meetings";
export const INDEX_FILE = join(DATA_DIR, "index.json");
const TMP_DIR = join(DATA_DIR, ".tmp");

// YouTube channels that carry meeting video. `bodies` maps a title pattern
// to the public body, first match wins; videos matching none are skipped
// (the city's channel also carries PSAs and press conferences).
export const SOURCES = [
  {
    key: "jackson-peg",
    label: "City of Jackson PEG Network",
    handle: "@JacksonPEGNetwork",
    channelId: process.env.MEETINGS_JACKSON_PEG_CHANNEL || "",
    // Titles seen on the channel: "Regular City Council Meeting Sep 8, 2026",
    // "Special City Council Meeting Sep 3, 2026", "Budget Meeting Aug 25,
    // 2026 Pt1", "1% Sales Tax Meeting Sep 9, 2026", "Press Conference
    // July 7, 2026". Ribbon cuttings, PSAs, and films are skipped.
    bodies: [
      [/budget\s*(hearing|meeting)|finance\s*committee/i, "Jackson City Council budget hearing"],
      [/1\s*%\s*sales\s*tax|sales\s*tax\s*(commission|meeting)/i, "Jackson 1% Sales Tax Commission"],
      [/special\s*(called\s*)?(city\s*)?council/i, "Jackson City Council special meeting"],
      [/work\s*session|planning\s*session/i, "Jackson City Council work session"],
      [/committee/i, "Jackson City Council committee"],
      [/city\s*council|council\s*meeting/i, "Jackson City Council"],
      [/zoning|planning\s*board/i, "Jackson Planning Board"],
      [/jxn\s*water/i, "JXN Water"],
      [/press\s*conference/i, "City of Jackson press conference"],
    ],
  },
  {
    key: "jackson-planning",
    label: "City of Jackson Planning & Development",
    handle: "@JacksonPlanningandDevelopment",
    channelId: process.env.MEETINGS_JACKSON_PLANNING_CHANNEL || "",
    bodies: [
      [/zoning|planning\s*board/i, "Jackson Planning Board"],
      [/historic|preservation/i, "Jackson Historic Preservation Commission"],
      [/site\s*plan|board\s*of\s*adjustment|hearing|meeting/i, "Jackson Planning & Development"],
    ],
  },
];

export function classifyBody(source, title) {
  for (const [re, body] of source.bodies) if (re.test(title)) return body;
  return null;
}

// --- storage ----------------------------------------------------------------

export function loadIndex() {
  if (!existsSync(INDEX_FILE)) return { updated: null, meetings: [] };
  return JSON.parse(readFileSync(INDEX_FILE, "utf8"));
}

export function saveIndex(index) {
  mkdirSync(DATA_DIR, { recursive: true });
  index.meetings.sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  index.updated = new Date().toISOString();
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 1) + "\n");
}

export function meetingPath(id) {
  if (!/^[\w-]{6,20}$/.test(id)) throw new Error(`bad meeting id ${id}`);
  return join(DATA_DIR, `${id}.json`);
}

export function loadMeeting(id) {
  const p = meetingPath(id);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

export function saveMeeting(meeting) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(meetingPath(meeting.id), JSON.stringify(meeting) + "\n");
}

// --- YouTube listing ----------------------------------------------------------

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TheJacksonWire/1.0";

/** Resolve a channel handle to its UC... id by reading the channel page once. */
export async function resolveChannelId(handle) {
  const res = await fetch(`https://www.youtube.com/${handle}`, { headers: { "User-Agent": UA, "Accept-Language": "en-US" } });
  if (!res.ok) throw new Error(`channel page HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/"(?:channelId|externalId)":"(UC[\w-]{20,})"/) || html.match(/channel_id=(UC[\w-]{20,})/);
  if (!m) throw new Error("channel id not found in page");
  return m[1];
}

/** The channel's newest 15 videos from its public RSS feed (no key needed). */
export async function listRecentVideos(channelId) {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
  const xml = await res.text();
  const out = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = decodeXml(e.match(/<title>([^<]*)<\/title>/)?.[1] || "");
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1] || "";
    if (id) out.push({ id, title, published: published.slice(0, 10) });
  }
  return out;
}

/** Older uploads via yt-dlp's flat playlist listing (newest first). */
export function listChannelVideos(handle, limit = 50) {
  const raw = ytdlp(["--flat-playlist", "--playlist-end", String(limit), "-J", `https://www.youtube.com/${handle}/videos`]);
  const data = JSON.parse(raw);
  return (data.entries || [])
    .filter((e) => e && e.id)
    .map((e) => ({ id: e.id, title: e.title || "", published: "", duration: e.duration || null }));
}

function decodeXml(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// --- yt-dlp ------------------------------------------------------------------

export function ytdlp(args, opts = {}) {
  // YTDLP_ARGS: extra flags such as --extractor-args youtube:player_client=tv
  // when YouTube's bot check blocks the runner's default client.
  // YTDLP_COOKIES: path to a Netscape cookie file exported from a signed-in
  // browser; the last resort for the "confirm you're not a bot" wall.
  // BGUTIL_SCRIPT: path to bgutil-ytdlp-pot-provider's generate_once.js.
  // YouTube demands a proof-of-origin token from datacenter addresses such
  // as GitHub runners; the provider plugin mints one on demand.
  const extra = (process.env.YTDLP_ARGS || "").split(" ").filter(Boolean);
  if (process.env.BGUTIL_SCRIPT) extra.push("--extractor-args", `youtubepot-bgutilscript:script_path=${process.env.BGUTIL_SCRIPT}`);
  if (process.env.YTDLP_COOKIES) extra.push("--cookies", process.env.YTDLP_COOKIES);
  return execFileSync("yt-dlp", [...extra, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

/** Title, date, duration, and which caption tracks exist. */
export function videoInfo(id) {
  const raw = ytdlp(["-J", "--skip-download", "--no-playlist", `https://www.youtube.com/watch?v=${id}`]);
  const d = JSON.parse(raw);
  const up = d.upload_date || "";
  const date = up ? `${up.slice(0, 4)}-${up.slice(4, 6)}-${up.slice(6, 8)}` : "";
  const manual = Object.keys(d.subtitles || {}).filter((k) => /^en/.test(k));
  const auto = Object.keys(d.automatic_captions || {}).filter((k) => /^en/.test(k));
  return {
    id,
    title: d.title || "",
    date,
    duration: d.duration || null,
    description: (d.description || "").slice(0, 2000),
    channel: d.channel || d.uploader || "",
    captions: manual.length ? "manual" : auto.length ? "auto" : "none",
    live: d.is_live || d.live_status === "is_live" || d.live_status === "is_upcoming",
  };
}

/**
 * Fetch English captions (uploaded track first, else auto-generated) as
 * timed cues [{t: seconds, text}]. Returns [] when the video has none.
 */
export function fetchCaptions(id) {
  mkdirSync(TMP_DIR, { recursive: true });
  const base = join(TMP_DIR, id);
  try {
    ytdlp([
      "--skip-download", "--no-playlist",
      "--write-subs", "--write-auto-subs",
      "--sub-langs", "en.*,en,en-orig",
      "--sub-format", "json3",
      "-o", `${base}.%(ext)s`,
      `https://www.youtube.com/watch?v=${id}`,
    ]);
  } catch (e) {
    throw new Error(`yt-dlp captions: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
  }
  const files = readdirSync(TMP_DIR).filter((f) => f.startsWith(id + ".") && f.endsWith(".json3"));
  if (!files.length) return [];
  // Prefer a plain "en" track (uploaded) over "en-orig"/auto variants.
  files.sort((a, b) => (a === `${id}.en.json3` ? -1 : b === `${id}.en.json3` ? 1 : a.localeCompare(b)));
  const cues = parseJson3(readFileSync(join(TMP_DIR, files[0]), "utf8"));
  for (const f of files) rmSync(join(TMP_DIR, f), { force: true });
  return cues;
}

/** YouTube's json3 caption format → cues, dropping the rolling duplicates. */
export function parseJson3(raw) {
  const data = JSON.parse(raw);
  const cues = [];
  for (const ev of data.events || []) {
    if (!ev.segs) continue;
    const text = ev.segs.map((s) => s.utf8 || "").join("").replace(/\s+/g, " ").trim();
    if (!text) continue;
    cues.push({ t: Math.round((ev.tStartMs || 0) / 1000), text });
  }
  return cues;
}

/**
 * Merge cues into readable blocks of roughly `words` words, each stamped
 * with the time its first word was spoken.
 */
export function cuesToBlocks(cues, words = 90) {
  const blocks = [];
  let cur = null;
  for (const c of cues) {
    if (!cur) cur = { t: c.t, text: c.text };
    else cur.text += " " + c.text;
    const n = cur.text.split(/\s+/).length;
    // Break at a sentence end once the block is long enough, or hard-break
    // at double length so unpunctuated auto captions still split.
    if ((n >= words && /[.?!]$/.test(cur.text)) || n >= words * 2) {
      blocks.push(cur);
      cur = null;
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

export function fmtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (h ? `${h}:` : "") + `${h ? String(m).padStart(2, "0") : m}:${String(s).padStart(2, "0")}`;
}

export function videoUrl(id, t) {
  return `https://www.youtube.com/watch?v=${id}${t ? `&t=${t}s` : ""}`;
}

// --- DeepSeek index ------------------------------------------------------------

const INDEX_PROMPT = `You index transcripts of public government meetings in Jackson, Mississippi for a newsroom's searchable archive. The transcript is auto-generated captions: names and numbers may be misheard, and there is no punctuation or speaker labels. Return JSON only, with this shape:
{
 "summary": "3 to 5 plain sentences on what the meeting decided or discussed, most consequential first. No praise, no filler.",
 "topics": [{"title": "short label of one agenda item or discussion", "start": <seconds from the timestamp where it begins>, "note": "one sentence on what happened, including any vote outcome or dollar figure stated"}],
 "people": ["names as spoken that appear to be officials, staff, applicants, or speakers, best spelling"],
 "money": ["each specific dollar figure with what it was for, e.g. '$1.3 million TIF bonds for Vieux Carre'"],
 "votes": [{"item": "what was voted on", "outcome": "passed/failed/tabled/unclear", "start": <seconds>}]
}
Cover the whole meeting in 6 to 25 topics. Use the [h:mm:ss] stamps for start values (convert to seconds). Do not invent items that are not in the transcript. Keep every string under 300 characters.`;

export async function indexWithModel(client, meeting, { log = () => {} } = {}) {
  const lines = meeting.blocks.map((b) => `[${fmtTime(b.t)}] ${b.text}`);
  let text = lines.join("\n");
  const CAP = 420_000; // ~100k tokens; keeps a 4-hour meeting inside the context
  if (text.length > CAP) {
    log(`transcript ${text.length} chars, truncating to ${CAP}`);
    text = text.slice(0, CAP) + "\n[transcript truncated]";
  }
  const res = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: INDEX_PROMPT },
      { role: "user", content: `Meeting: ${meeting.body}\nVideo title: ${meeting.title}\nDate: ${meeting.date}\n\nTranscript:\n${text}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 6000,
  });
  const out = JSON.parse(res.choices[0].message.content || "{}");
  const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
  const str = (v, n = 300) => String(v ?? "").trim().slice(0, n);
  return {
    summary: str(out.summary, 1200),
    topics: (Array.isArray(out.topics) ? out.topics : []).slice(0, 40).map((t) => ({ title: str(t.title, 120), start: num(t.start), note: str(t.note) })).filter((t) => t.title),
    people: (Array.isArray(out.people) ? out.people : []).slice(0, 60).map((p) => str(p, 80)).filter(Boolean),
    money: (Array.isArray(out.money) ? out.money : []).slice(0, 40).map((p) => str(p)).filter(Boolean),
    votes: (Array.isArray(out.votes) ? out.votes : []).slice(0, 40).map((v) => ({ item: str(v.item), outcome: str(v.outcome, 40), start: num(v.start) })).filter((v) => v.item),
  };
}

// --- search (used by the desk tool and the site) -------------------------------

const STOP = new Set(["the", "and", "for", "that", "with", "this", "from", "have", "will", "are", "was", "were", "been", "they", "their", "what", "about", "into", "than", "then", "there", "which", "would", "could", "should", "city", "council", "meeting"]);

export function queryTerms(q) {
  return (q || "")
    .toLowerCase()
    .split(/[^a-z0-9$.']+/)
    .map((w) => w.replace(/^['.]+|['.]+$/g, ""))
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * Passages whose text contains every query term, newest meeting first.
 * Reads transcripts from disk; `meetings` defaults to the whole index.
 */
export function searchTranscripts(q, { days = 365, limit = 12, meetings } = {}) {
  const terms = queryTerms(q);
  if (!terms.length) return [];
  const since = new Date(Date.now() - days * 86400e3).toISOString().slice(0, 10);
  const list = (meetings || loadIndex().meetings).filter((m) => m.date >= since);
  const hits = [];
  for (const m of list) {
    const full = loadMeeting(m.id);
    if (!full) continue;
    for (const b of full.blocks) {
      const lc = b.text.toLowerCase();
      if (terms.every((t) => lc.includes(t))) {
        hits.push({ id: m.id, body: m.body, date: m.date, title: m.title, t: b.t, text: b.text });
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

export function renderHits(hits, q) {
  if (!hits.length) return `No archived meeting passages match "${q}".`;
  const out = [`Meeting archive passages matching "${q}" (newest first; each link opens the video at that moment):`];
  for (const h of hits) {
    out.push(`- ${h.date} | ${h.body} | ${fmtTime(h.t)} | ${videoUrl(h.id, h.t)} | https://www.thejacksonwire.com/meetings/${h.id}`);
    out.push(`  "${h.text.length > 600 ? h.text.slice(0, 600) + "…" : h.text}"`);
  }
  return out.join("\n");
}

// --- runner diagnostics ---------------------------------------------------------

/**
 * Try several yt-dlp client configurations against one video and report
 * which can read metadata and captions. Used when YouTube blocks a runner
 * with its "confirm you're not a bot" check; the winning flags go into
 * the YTDLP_ARGS repository variable.
 */
export function probeYouTubeAccess(id, log = console.log) {
  const configs = [
    "",
    "--extractor-args youtube:player_client=tv",
    "--extractor-args youtube:player_client=tv_embedded",
    "--extractor-args youtube:player_client=web_embedded",
    "--extractor-args youtube:player_client=mweb",
    "--extractor-args youtube:player_client=android",
    "--extractor-args youtube:player_client=ios",
    "--extractor-args youtube:player_client=android_vr",
    "--extractor-args youtube:player_client=web_safari",
    "--extractor-args youtube:player_client=tv,mweb",
  ];
  const results = [];
  for (const cfg of configs) {
    const saved = process.env.YTDLP_ARGS;
    process.env.YTDLP_ARGS = cfg;
    let line;
    try {
      const d = JSON.parse(ytdlp(["-J", "--skip-download", "--no-playlist", `https://www.youtube.com/watch?v=${id}`]));
      const auto = Object.keys(d.automatic_captions || {}).filter((k) => /^en/.test(k)).length;
      const manual = Object.keys(d.subtitles || {}).filter((k) => /^en/.test(k)).length;
      line = `OK   title="${(d.title || "").slice(0, 40)}" duration=${d.duration} manual_en=${manual} auto_en=${auto}`;
    } catch (e) {
      const err = String(e.stderr || "").trim().split("\n").filter((l) => /ERROR|WARNING/.test(l));
      line = `FAIL ${(err.slice(-2).join(" | ") || e.message).slice(0, 300)}`;
    } finally {
      if (saved === undefined) delete process.env.YTDLP_ARGS;
      else process.env.YTDLP_ARGS = saved;
    }
    log(`${(cfg || "(default)").padEnd(58)} ${line}`);
    results.push({ cfg, line });
  }
  return results;
}
