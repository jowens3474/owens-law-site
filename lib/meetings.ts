// The Record: archived public-meeting transcripts. The index (metadata,
// summaries, topics) is bundled at build time; full transcripts are read
// from data/meetings/<id>.json on the server. Written by
// scripts/meeting-archive.mjs; see scripts/lib/meetings.mjs for the format.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import index from "@/data/meetings/index.json";

export interface Topic {
  title: string;
  start: number; // seconds into the video
  note: string;
}
export interface Vote {
  item: string;
  outcome: string;
  start: number;
}
export interface MeetingEntry {
  id: string; // YouTube video id
  source: string;
  body: string; // e.g. "Jackson City Council"
  title: string; // video title as uploaded
  date: string; // ISO yyyy-mm-dd (upload date)
  duration: number | null; // seconds
  channel: string;
  url: string;
  captions: "manual" | "auto" | "none" | "transcribed";
  agenda?: string | null; // agenda PDF, when the archive has one
  engine?: string; // transcription engine, for transcribed meetings
  fetched: string;
  words: number;
  indexed: boolean;
  summary: string;
  topics: Topic[];
  people: string[];
  money: string[];
  votes: Vote[];
}
export interface Block {
  t: number; // seconds
  text: string;
}
export interface MeetingFull extends MeetingEntry {
  blocks: Block[];
}
interface Index {
  updated: string | null;
  meetings: MeetingEntry[];
}

const DATA_DIR = join(process.cwd(), "data", "meetings");
const data = index as unknown as Index;

/** Every meeting with a transcript, newest first. */
export const MEETINGS: MeetingEntry[] = data.meetings
  .filter((m) => m.words > 0)
  .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));

export const ARCHIVE_UPDATED = data.updated;

export function getMeetingEntry(id: string): MeetingEntry | undefined {
  return MEETINGS.find((m) => m.id === id);
}

export function getMeeting(id: string): MeetingFull | null {
  if (!/^[\w-]{6,20}$/.test(id)) return null;
  const p = join(DATA_DIR, `${id}.json`);
  if (!existsSync(p)) return null;
  const full = JSON.parse(readFileSync(p, "utf8")) as { blocks: Block[] };
  const entry = getMeetingEntry(id);
  if (!entry) return null;
  return { ...entry, blocks: full.blocks };
}

/** Bodies represented in the archive with their meeting counts, most first. */
export function getBodies(): { body: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of MEETINGS) counts.set(m.body, (counts.get(m.body) ?? 0) + 1);
  return [...counts].map(([body, count]) => ({ body, count })).sort((a, b) => b.count - a.count);
}

export function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return (h ? `${h}:` : "") + `${h ? String(m).padStart(2, "0") : m}:${String(s).padStart(2, "0")}`;
}

export function fmtDuration(sec: number | null): string {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} hr ${m} min` : `${m} min`;
}

/** Link to a moment in the video: YouTube takes &t=, Swagit start_at=hh:mm:ss. */
export function videoAt(m: { id: string; url?: string }, t?: number): string {
  const url = m.url || `https://www.youtube.com/watch?v=${m.id}`;
  if (!t) return url;
  const s = Math.floor(t);
  const sep = url.includes("?") ? "&" : "?";
  if (/youtube\.com|youtu\.be/.test(url)) return `${url}${sep}t=${s}s`;
  const hms = `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `${url}${sep}start_at=${hms}`;
}

export function isYouTube(m: { url?: string }): boolean {
  return /youtube\.com|youtu\.be/.test(m.url || "");
}

export function formatMeetingDate(iso: string): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// --- search -------------------------------------------------------------------

const STOP = new Set(["the", "and", "for", "that", "with", "this", "from", "have", "will", "are", "was", "were", "been", "they", "their", "what", "about", "into", "than", "then", "there", "which", "would", "could", "should", "city", "council", "meeting"]);

export function queryTerms(q: string): string[] {
  return (q || "")
    .toLowerCase()
    .split(/[^a-z0-9$.']+/)
    .map((w) => w.replace(/^['.]+|['.]+$/g, ""))
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export interface Hit {
  id: string;
  url: string;
  body: string;
  date: string;
  title: string;
  t: number;
  text: string;
}

/** Transcript passages containing every query term, newest meeting first. */
export function searchTranscripts(q: string, { limit = 40, body = "" } = {}): { terms: string[]; hits: Hit[] } {
  const terms = queryTerms(q);
  const hits: Hit[] = [];
  if (!terms.length) return { terms, hits };
  for (const m of MEETINGS) {
    if (body && m.body !== body) continue;
    const full = getMeeting(m.id);
    if (!full) continue;
    for (const b of full.blocks) {
      const lc = b.text.toLowerCase();
      if (terms.every((t) => lc.includes(t))) {
        hits.push({ id: m.id, url: m.url, body: m.body, date: m.date, title: m.title, t: b.t, text: b.text });
        if (hits.length >= limit) return { terms, hits };
      }
    }
  }
  return { terms, hits };
}
