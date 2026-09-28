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

/**
 * Link to a moment in the video. YouTube takes &t=<s>s; the city's Swagit
 * player takes ?ts=<seconds> (the format its own "Start video at" share
 * box generates). `entry` is an index entry or {id, url}.
 */
export function watchUrl(entry, t) {
  const url = entry.url || `https://www.youtube.com/watch?v=${entry.id}`;
  if (!t) return url;
  const sep = url.includes("?") ? "&" : "?";
  if (/youtube\.com|youtu\.be/.test(url)) return `${url}${sep}t=${Math.floor(t)}s`;
  return `${url}${sep}ts=${Math.floor(t)}`;
}

export function videoUrl(id, t) {
  return watchUrl({ id }, t);
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

export async function indexWithModel(client, meeting, { log = () => {}, agenda = "" } = {}) {
  const lines = meeting.blocks.map((b) => `[${fmtTime(b.t)}] ${b.text}`);
  let text = lines.join("\n");
  const CAP = 420_000; // ~100k tokens; keeps a 4-hour meeting inside the context
  if (text.length > CAP) {
    log(`transcript ${text.length} chars, truncating to ${CAP}`);
    text = text.slice(0, CAP) + "\n[transcript truncated]";
  }
  const agendaPart = agenda ? `\n\nPublished agenda (use its item names and spellings where the transcript matches):\n${agenda.slice(0, 16_000)}` : "";
  const res = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: INDEX_PROMPT },
      { role: "user", content: `Meeting: ${meeting.body}\nVideo title: ${meeting.title}\nDate: ${meeting.date}${agendaPart}\n\nTranscript:\n${text}` },
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
        hits.push({ id: m.id, url: m.url, body: m.body, date: m.date, title: m.title, t: b.t, text: b.text });
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
    out.push(`- ${h.date} | ${h.body} | ${fmtTime(h.t)} | ${watchUrl(h, h.t)} | https://www.thejacksonwire.com/meetings/${h.id}`);
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

// --- Swagit (the city's own video archive) ---------------------------------------
//
// jacksonms.swagit.com holds every council, committee, and hearing video
// with its agenda, and unlike YouTube it does not block GitHub's network.
// It has no captions, so audio is transcribed here (see transcribe()).

export const SWAGIT_BASE = "https://jacksonms.new.swagit.com";
export const SWAGIT_VIEW = `${SWAGIT_BASE}/views/160`;

// Titles as the archive uses them: "City Council", "Special City Council",
// "Zoning Meeting" (the council's monthly zoning session), "Budget",
// "Finance", "Planning", "Legislative", "Rules", "Public Hearing",
// "Confirmation Hearing", "Water/Sewer Ad-Hoc", and so on.
const SWAGIT_BODIES = [
  [/budget/i, "Jackson City Council budget hearing"],
  [/zoning/i, "Jackson City Council zoning meeting"],
  [/confirmation\s*hearing/i, "Jackson City Council confirmation hearing"],
  [/public\s*hearing/i, "Jackson City Council public hearing"],
  [/press\s*conference/i, "City of Jackson press conference"],
  [/finance/i, "Jackson City Council Finance Committee"],
  [/planning\s*(&|and)\s*economic/i, "Jackson City Council Planning & Economic Development Committee"],
  [/^planning$/i, "Jackson City Council Planning Committee"],
  [/economic\s*development/i, "Jackson City Council Economic Development Committee"],
  [/legislative/i, "Jackson City Council Legislative Committee"],
  [/public\s*safety/i, "Jackson City Council Public Safety & Parks Committee"],
  [/public\s*works/i, "Jackson City Council Public Works Committee"],
  [/^rules$/i, "Jackson City Council Rules Committee"],
  [/ad[\s-]*hoc|committee|internal\s*audit|government\s*operations|disaster/i, "Jackson City Council committee"],
  [/planning\s*board/i, "Jackson Planning Board"],
  [/1\s*%\s*sales\s*tax|sales\s*tax/i, "Jackson 1% Sales Tax Commission"],
  [/emergency|special/i, "Jackson City Council special meeting"],
  [/council|regular/i, "Jackson City Council"],
  [/hearing|meeting/i, "City of Jackson public meeting"],
];

export function classifySwagitBody(title) {
  for (const [re, body] of SWAGIT_BODIES) if (re.test(title)) return body;
  return null;
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function parseSwagitDate(s) {
  const m = s.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return "";
  const mo = MONTHS[m[1].toLowerCase()];
  return mo ? `${m[3]}-${String(mo).padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
}

function parseSwagitDuration(s) {
  const h = Number(s.match(/(\d+)\s*h/)?.[1] || 0);
  const m = Number(s.match(/(\d+)\s*m/)?.[1] || 0);
  const sec = Number(s.match(/(\d+)\s*s/)?.[1] || 0);
  const total = h * 3600 + m * 60 + sec;
  return total || null;
}

/**
 * Parse the archive listing into [{id, title, date, duration, url, agenda}].
 * Each row on the page is a title link, a date, a duration, and the
 * "Video"/"Agenda" links, all pointing at /videos/<n>.
 */
export function parseSwagitListing(html) {
  const out = [];
  const seen = new Set();
  const re = /<a[^>]+href="\/videos\/(\d+)"[^>]*>([^<]+)<\/a>([\s\S]{0,1500}?)(?=<a[^>]+href="\/videos\/\d+"[^>]*>(?!Video|Agenda)|$)/g;
  for (const m of html.matchAll(re)) {
    const id = m[1];
    const title = strip(m[2]);
    if (!title || /^(video|agenda)$/i.test(title) || seen.has(id)) continue;
    seen.add(id);
    const tail = strip(m[3]);
    out.push({
      id,
      title,
      date: parseSwagitDate(tail),
      duration: parseSwagitDuration(tail),
      url: `${SWAGIT_BASE}/videos/${id}`,
      agenda: new RegExp(`/videos/${id}/agenda`).test(m[3]) ? `${SWAGIT_BASE}/videos/${id}/agenda` : null,
    });
  }
  return out;
}

function strip(s) {
  return String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

export async function listSwagitVideos() {
  const res = await fetch(SWAGIT_VIEW, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`swagit listing HTTP ${res.status}`);
  return parseSwagitListing(await res.text());
}

/** The media URL (mp4 or HLS playlist) on a Swagit video page. */
export function findSwagitMedia(html) {
  const cands = [];
  for (const m of html.matchAll(/https?:\/\/[^"'\s<>]+\.(?:mp4|m3u8)(?:\?[^"'\s<>]*)?/gi)) cands.push(m[0]);
  for (const m of html.matchAll(/["'](\/\/[^"'\s<>]+\.(?:mp4|m3u8)(?:\?[^"'\s<>]*)?)["']/gi)) cands.push("https:" + m[1]);
  // Prefer a plain mp4 file, then the HLS playlist; ffmpeg reads either.
  // (The rtmp:// variant is excluded by the https requirement.)
  return cands.find((u) => /\.mp4$/i.test(u)) || cands.find((u) => /\.m3u8/i.test(u)) || cands[0] || null;
}

export async function swagitVideoInfo(id) {
  const res = await fetch(`${SWAGIT_BASE}/videos/${id}`, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`swagit video HTTP ${res.status}`);
  const html = await res.text();
  // The stream URL (an HLS playlist on archive-stream.granicus.com) is only
  // in the embed page's player setup; the main page has the title, agenda,
  // and a /download link that serves as the fallback.
  let media = findSwagitMedia(html);
  if (!media) {
    try {
      const emb = await fetch(`${SWAGIT_BASE}/videos/${id}/embed`, { headers: { "User-Agent": UA, Accept: "text/html" } });
      if (emb.ok) media = findSwagitMedia(await emb.text());
    } catch {
      /* fall through to the download link */
    }
  }
  // <title>Sep 10, 2026 Public Safety &amp; Parks Committee Meeting - Jackson, MS</title>
  const rawTitle = strip(html.match(/<title>([^<]*)<\/title>/)?.[1] || "").replace(/\s*-\s*Jackson, MS\s*$/i, "");
  const date = parseSwagitDate(rawTitle);
  const title = rawTitle.replace(/^[A-Za-z]{3}\.?\s+\d{1,2},\s*\d{4}\s*/, "").trim() || rawTitle;
  const download = html.match(/href="([^"]*\/videos\/\d+\/download)"/i)?.[1] || null;
  const agenda = /\/videos\/\d+\/agenda|agenda_file/i.test(html) ? `${SWAGIT_BASE}/videos/${id}/agenda` : null;
  // /videos/<id>/download serves the MP4 itself and is open to any client;
  // the HLS stream behind it sits on CloudFront and refuses the runner.
  const downloadUrl = download ? new URL(download, SWAGIT_BASE).href : `${SWAGIT_BASE}/videos/${id}/download`;
  return { id, title, date, media, download: downloadUrl, sources: [downloadUrl, media].filter(Boolean), agenda };
}

// --- transcription ------------------------------------------------------------------
//
// Groq's Whisper endpoint when GROQ_API_KEY is set (fast, large-v3-turbo,
// free tier covers hours a day); otherwise faster-whisper on the runner's
// CPU via scripts/lib/transcribe.py (slower, no key). Both return cues.

/**
 * Pull mono 16 kHz MP3 audio (what Whisper wants; a 3-hour meeting is
 * about 80 MB) from the first source ffmpeg can open. The archive's stream
 * host checks the Referer, so requests carry the archive page as referer
 * and a browser user agent.
 */
export function extractAudio(sources, outPath, { log = () => {} } = {}) {
  const list = (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
  const headers = `Referer: ${SWAGIT_BASE}/\r\nOrigin: ${SWAGIT_BASE}\r\n`;
  let lastErr = null;
  for (const src of list) {
    try {
      execFileSync(
        "ffmpeg",
        ["-y", "-loglevel", "error", "-user_agent", UA, "-headers", headers, "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", outPath],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      return src;
    } catch (e) {
      lastErr = e;
      log(`ffmpeg could not open ${src.slice(0, 90)}…: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
    }
  }
  throw new Error(`no readable media source (${list.length} tried): ${String(lastErr?.stderr || lastErr?.message || "").trim().split("\n").pop()}`);
}

function audioDuration(path) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], { encoding: "utf8" });
  return Math.round(Number(out.trim()) || 0);
}

export async function transcribeWithGroq(audioPath, { log = () => {} } = {}) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");
  const total = audioDuration(audioPath);
  const CHUNK = 20 * 60; // seconds; keeps each upload well under the 25 MB cap
  const cues = [];
  for (let start = 0; start < total; start += CHUNK) {
    const part = `${audioPath}.${start}.mp3`;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(start), "-t", String(CHUNK), "-i", audioPath, "-c", "copy", part], { stdio: ["ignore", "ignore", "pipe"] });
    const form = new FormData();
    form.append("file", new Blob([readFileSync(part)], { type: "audio/mpeg" }), "chunk.mp3");
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "verbose_json");
    form.append("language", "en");
    let res;
    for (let attempt = 1; attempt <= 4; attempt++) {
      res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
      if (res.status !== 429 && res.status < 500) break;
      const wait = Number(res.headers.get("retry-after")) || attempt * 20;
      log(`groq ${res.status}; retrying in ${wait}s`);
      await new Promise((r) => setTimeout(r, wait * 1000));
    }
    if (!res.ok) throw new Error(`groq HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    for (const s of data.segments || []) {
      const text = String(s.text || "").trim();
      if (text) cues.push({ t: Math.round(start + (s.start || 0)), text });
    }
    rmSync(part, { force: true });
    log(`groq: ${fmtTime(Math.min(start + CHUNK, total))} of ${fmtTime(total)}`);
  }
  return cues;
}

export function transcribeLocally(audioPath, { log = () => {} } = {}) {
  const model = process.env.WHISPER_MODEL || "small.en";
  log(`faster-whisper ${model} (CPU)`);
  const out = execFileSync("python3", ["scripts/lib/transcribe.py", audioPath, model], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "inherit"] });
  return JSON.parse(out);
}

export async function transcribe(audioPath, opts = {}) {
  if (process.env.GROQ_API_KEY) {
    try {
      return { cues: await transcribeWithGroq(audioPath, opts), engine: "groq-whisper-large-v3-turbo" };
    } catch (e) {
      opts.log?.(`groq failed (${e.message}); falling back to local whisper`);
    }
  }
  return { cues: transcribeLocally(audioPath, opts), engine: `faster-whisper-${process.env.WHISPER_MODEL || "small.en"}` };
}
