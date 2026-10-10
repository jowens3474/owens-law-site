#!/usr/bin/env node
// Status report for the Jackson Wire's chief of staff. Read-only: it checks
// the live site, the deploys on main, the ten scheduled desks, what the desks
// published, what is scheduled to come up, and the staff backlog. It prints a
// Markdown report. It publishes nothing and commits nothing.
//
// Output: the report on stdout (appended to $GITHUB_STEP_SUMMARY when set),
// printed between ::stop-commands:: markers with a random token, so no text in
// it can act as a workflow command. Then ::warning:: annotations for a site
// that is not 200, a failed desk, or a missing desk run, then one last line,
// `STATUS_JSON <compact json>`, with the key facts. The exit code is 0 unless
// the script itself crashes: a check that cannot run prints "could not check:
// <reason>" and the report goes on.
// All times are America/Chicago, like "Sat Oct 10, 6:35 AM".
//
// Env:
//   GITHUB_TOKEN       read access to this repo's commits, statuses and Actions
//   GITHUB_REPOSITORY  owner/name (the workflow sets it)
//   SITE               default https://www.thejacksonwire.com
//   HOURS              length of the window in hours, default 26
//   GRACE_MINUTES      how long after a scheduled time a desk may still be
//                      starting before its missing run counts as MISSING.
//                      Default 720. GitHub starts this repo's scheduled runs
//                      1 to 9 hours late (about 4 hours at the median, over
//                      174 runs), so 20 minutes would call the Morning Brief
//                      MISSING every morning.
// Run daily by .github/workflows/status-report.yml. The token is sent only to
// the GitHub API and is never printed.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFileSync, readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TZ = "America/Chicago";
const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const DEFAULT_SITE = "https://www.thejacksonwire.com";
const DEFAULT_HOURS = 26;
const DEFAULT_GRACE_MINUTES = 720;
const HISTORY_DAYS = 14; // how far back to read each desk's runs, for "twice in a row"
const COMMITS_PER_PAGE = 50;
const RUNS_PER_PAGE = 30;
const STATUS_LOOKUPS_AT_ONCE = 8;
const LAWS_STREAK_COMMITS = 300; // how far back to read git for the laws desk's rejections in a row
const LATE_START_NOTE_MS = 30 * MINUTE; // a scheduled run that starts this much later than its time gets a note
const FETCH_TIMEOUT_MS = 20000;
const DEFAULT_JOB_TIMEOUT_MINUTES = 360; // GitHub's limit for a job that sets none
const TIMEOUT_SLACK_MS = 60000; // a run this close to its limit, or longer, was stopped by the limit
// A browser-like agent, so the site and its CDN treat the checks like a reader.
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 TheJacksonWire-StatusReport/1.0";

// The ten desks, by workflow file. The display name and the cron lines are
// read from each file at run time, so a schedule change shows up on its own.
export const DESK_FILES = [
  "meeting-archive.yml",
  "morning-brief.yml",
  "pro-briefing.yml",
  "pro-alerts.yml",
  "autopilot.yml",
  "laws-desk.yml",
  "sales-tax.yml",
  "instagram.yml",
  "social.yml",
  "newsletter.yml",
];

// Commit subjects the desks write (see each script's git commit), and what
// each one is: a story ("published") or a data update ("data"). The first
// match wins. The laws desk publishes as "What Passed: <bill>: <title>"
// (scripts/laws-desk.mjs); people also start site edits with "What Passed: ",
// so a bill number is required. The sales tax desk writes "Sales tax: update
// diversions dataset" when only the data changed. Social, Instagram and Pro
// alerts only record state, so they are not listed. The laws desk's queue
// commits ("Laws desk: ...") are handled in classifyCommit.
const DESK_SUBJECTS = [
  { desk: "Autopilot", re: /^Autopilot: /, kind: "published" },
  { desk: "Morning Brief", re: /^Morning Brief: /, kind: "published" },
  { desk: "Laws desk", re: /^What Passed: [A-Z]{1,5} ?\d+: /, kind: "published" },
  { desk: "Sales tax", re: /^Sales tax: update /, kind: "data" },
  { desk: "Sales tax", re: /^Sales tax: /, kind: "published" },
  { desk: "Meetings", re: /^Meetings: /, kind: "data" },
];
// A laws desk draft that failed validation is "moved to the back of the queue",
// or "dropped" after its last failed try. A bill dropped because it is already
// on the site or did not become law is queue housekeeping, not a rejected draft.
const QUEUE_REJECTION = /moved to the back of the queue|dropped/i;
const QUEUE_HOUSEKEEPING = /^Laws desk: dropped .* from the queue \((?:already on the site|did not become law)/i;

// Text from outside (a commit subject, a feed title or date, Vercel's
// description) goes into the report on one line: carriage returns and
// newlines become spaces. The report is also printed between stop-commands
// markers (see main), so no field can start a workflow command.
export const oneLine = (text) => String(text ?? "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// Times, in Central
// ---------------------------------------------------------------------------

const clockFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" });
const calendarFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
const isoDayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

function partsOf(format, date) {
  const out = {};
  for (const part of format.formatToParts(date)) if (part.type !== "literal") out[part.type] = part.value;
  return out;
}

function toDate(when) {
  return when instanceof Date ? when : new Date(when);
}

// "Sat Oct 10, 6:35 AM"
export function formatChicago(when) {
  const d = toDate(when);
  if (Number.isNaN(d.getTime())) return "unknown time";
  const p = partsOf(clockFormat, d);
  const period = String(p.dayPeriod).replace(/\./g, "").toUpperCase();
  return `${p.weekday} ${p.month} ${p.day}, ${p.hour}:${p.minute} ${period}`;
}

// "Sat Oct 10"
export function formatChicagoDay(when) {
  const d = toDate(when);
  if (Number.isNaN(d.getTime())) return "unknown date";
  const p = partsOf(dayFormat, d);
  return `${p.weekday} ${p.month} ${p.day}`;
}

// "2026-10-10": the calendar date in Chicago, the way lib/posts.ts compares dates.
export function chicagoDate(when) {
  return isoDayFormat.format(toDate(when));
}

// The site writes every story's date as midnight GMT, which is the evening
// before in Chicago. A midnight GMT value is a calendar date, not a time, so
// it prints as a date; anything else prints in Chicago time.
export function formatFeedDate(pubDate) {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return oneLine(pubDate) || "no date";
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    const p = partsOf(calendarFormat, d);
    return `${p.weekday} ${p.month} ${p.day} (date only)`;
  }
  return formatChicago(d);
}

// "35m", "5h 4m", "2d 3h", "3d"
export function formatDuration(ms) {
  const mins = Math.round(Math.abs(ms) / MINUTE);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rest = mins % 60;
  if (days) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours) return rest ? `${hours}h ${rest}m` : `${hours}h`;
  return `${rest}m`;
}

// ---------------------------------------------------------------------------
// Cron: when a workflow was scheduled to start
// ---------------------------------------------------------------------------

// One field of a 5-field cron line: "*", a number, a list (13,17,21), a range
// (2-6), or a step (*/15, 0-30/10). Returns null for a bare "*" (any value)
// and otherwise the set of values. Names like MON are not supported.
function parseCronField(field, min, max) {
  if (field === "*") return null;
  const values = new Set();
  for (const part of field.split(",")) {
    const m = part.match(/^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/);
    if (!m) throw new Error(`unsupported cron field "${field}"`);
    const step = m[3] === undefined ? 1 : Number(m[3]);
    if (step < 1) throw new Error(`unsupported cron field "${field}"`);
    let lo;
    let hi;
    if (m[1] === "*") {
      lo = min;
      hi = max;
    } else {
      lo = Number(m[1]);
      hi = m[2] === undefined ? (m[3] === undefined ? lo : max) : Number(m[2]);
    }
    if (lo < min || hi > max || lo > hi) throw new Error(`cron field "${field}" is out of range`);
    for (let v = lo; v <= hi; v += step) values.add(v);
  }
  return values;
}

// Parses "0 13,17,21 * * 1-5". Day of week 7 is Sunday, same as 0.
export function parseCron(expr) {
  const fields = String(expr).trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`unsupported cron "${expr}"`);
  const dow = parseCronField(fields[4], 0, 7);
  if (dow && dow.delete(7)) dow.add(0);
  return {
    minutes: parseCronField(fields[0], 0, 59),
    hours: parseCronField(fields[1], 0, 23),
    dom: parseCronField(fields[2], 1, 31),
    months: parseCronField(fields[3], 1, 12),
    dow,
  };
}

function dayMatches(cron, date) {
  if (cron.months && !cron.months.has(date.getUTCMonth() + 1)) return false;
  const domOk = !cron.dom || cron.dom.has(date.getUTCDate());
  const dowOk = !cron.dow || cron.dow.has(date.getUTCDay());
  // Cron rule: when both day fields are restricted, either one may match.
  return cron.dom && cron.dow ? domOk || dowOk : domOk && dowOk;
}

function range(lo, hi) {
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

// Every time (ms since the epoch, UTC, as GitHub runs cron) the given cron
// lines fire between fromMs and toMs, oldest first.
export function scheduledTimes(crons, fromMs, toMs) {
  const times = new Set();
  const firstDay = Math.floor(fromMs / DAY) * DAY;
  for (let day = firstDay; day <= toMs; day += DAY) {
    const date = new Date(day);
    for (const cron of crons) {
      if (!dayMatches(cron, date)) continue;
      for (const h of cron.hours ?? range(0, 23)) {
        for (const m of cron.minutes ?? range(0, 59)) {
          const t = day + h * HOUR + m * MINUTE;
          if (t >= fromMs && t <= toMs) times.add(t);
        }
      }
    }
  }
  return [...times].sort((a, b) => a - b);
}

// The cron expressions in a workflow file's `schedule:` block. Commented-out
// lines are skipped.
export function readCronLines(yaml) {
  const exprs = [];
  for (const line of String(yaml).split("\n")) {
    const m = line.match(/^\s*-\s*cron:\s*(?:"([^"]+)"|'([^']+)'|([^\s#]+(?:\s+[^\s#]+){4}))\s*(?:#.*)?$/);
    if (m) exprs.push((m[1] ?? m[2] ?? m[3]).trim());
  }
  return exprs;
}

// The workflow's display name: the top-level `name:` line.
export function workflowName(yaml) {
  const m = String(yaml).match(/^name:\s*["']?([^"'\n#]+?)["']?\s*(?:#.*)?$/m);
  return m ? m[1].trim() : "";
}

// The time limit, in minutes, of the workflow's jobs: the `timeout-minutes:`
// line under each job's id (the id sits 2 spaces in, the setting 4). A step's
// own limit sits deeper and is ignored. A job with no limit gets GitHub's
// default of 360. Returns the smallest limit, or null when the file has no jobs
// or a limit that is not a plain number, which means the limit is not known.
export function readTimeoutMinutes(yaml) {
  const lines = String(yaml).split("\n");
  const start = lines.findIndex((l) => /^jobs:\s*(?:#.*)?$/.test(l));
  if (start === -1) return null;
  const limits = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break; // the next top-level key ends the jobs block
    if (/^ {2}[\w-]+:\s*(?:#.*)?$/.test(line)) limits.push(DEFAULT_JOB_TIMEOUT_MINUTES); // a new job
    const m = line.match(/^ {4}timeout-minutes:\s*(\S.*?)\s*(?:#.*)?$/);
    if (m && limits.length) limits[limits.length - 1] = /^\d+(?:\.\d+)?$/.test(m[1]) ? Number(m[1]) : Number.NaN;
  }
  if (!limits.length || limits.some((n) => !(n > 0))) return null;
  return Math.min(...limits);
}

// ---------------------------------------------------------------------------
// Desks: did each scheduled run happen, and did it pass
// ---------------------------------------------------------------------------

const ACTIVE_STATUSES = new Set(["queued", "in_progress", "waiting", "pending", "requested"]);
// A run that failed. A run that was cancelled before its time limit is not a
// failure: someone or something stopped it, so it has its own verdict. A run
// that hit its time limit is a failure (see isTimeout).
const FAILURE_CONCLUSIONS = new Set(["failure", "timed_out", "startup_failure", "action_required"]);

const isFailure = (run) => run.status === "completed" && FAILURE_CONCLUSIONS.has(run.conclusion);
const isCancelled = (run) => run.status === "completed" && run.conclusion === "cancelled";

// GitHub records a job that runs into its `timeout-minutes` as "cancelled", the
// same as a person pressing Cancel. What tells them apart is how long the run
// lasted: one that went on for the whole limit (less a minute, for clocks) was
// stopped by the limit, which is a failure; a shorter one was stopped early.
// `timeoutMs` is the limit from the workflow file; without it nothing is a
// timeout. Real case: Autopilot run 34883748917 on Sep 14 lasted 15m20s against
// a 15 minute limit.
export function isTimeout(run, timeoutMs) {
  if (!isCancelled(run) || !(timeoutMs > 0)) return false;
  const lasted = Date.parse(run.updated_at) - Date.parse(run.run_started_at ?? run.created_at);
  return lasted >= timeoutMs - TIMEOUT_SLACK_MS;
}
const isActive = (run) => ACTIVE_STATUSES.has(run.status);
const createdMs = (run) => Date.parse(run.created_at);
const newestFirst = (a, b) => createdMs(b) - createdMs(a);

// Pairs each scheduled time with the run that answers it: the first run
// created at or after that time and before the next scheduled time (any event
// counts, so a manual dispatch or a push-triggered run covers it). A time with
// no run is "missing" once the grace has passed and "waiting" before that.
export function matchSlots(slots, runs, nowMs, graceMs) {
  const oldestFirst = [...runs].sort((a, b) => createdMs(a) - createdMs(b));
  return slots.map((time, i) => {
    const until = i + 1 < slots.length ? slots[i + 1] : Infinity;
    const run = oldestFirst.find((r) => createdMs(r) >= time && createdMs(r) < until);
    if (run) return { time, state: "ran", run };
    return { time, state: nowMs - time >= graceMs ? "missing" : "waiting" };
  });
}

// "Fri Oct 9, 2:07 PM, schedule, success". A run that hit its time limit reads
// "timed out after 15m" instead of the "cancelled" GitHub records for it.
function describeRun(run, timeoutMs) {
  const done = isTimeout(run, timeoutMs) ? `timed out after ${formatDuration(timeoutMs)}` : run.conclusion || "completed";
  const state = run.status === "completed" ? done : String(run.status).replace(/_/g, " ");
  return `${formatChicago(run.created_at)}, ${run.event}, ${state}`;
}

// "started 5h 4m after its Sat Oct 10, 6:00 AM slot" for a scheduled run that
// began 30 minutes or more after the time it was scheduled for.
function lagNote(run, crons) {
  if (run.event !== "schedule" || !crons.length) return "";
  const created = createdMs(run);
  // A weekly desk's slot can be a week back, so look back 8 days.
  const slot = scheduledTimes(crons, created - 8 * DAY, created).pop();
  if (slot === undefined || created - slot < LATE_START_NOTE_MS) return "";
  return ` (started ${formatDuration(created - slot)} after its ${formatChicago(slot)} slot)`;
}

// "the Fri Oct 9, 8:00 AM slot", or "3 slots: A; B; C; and 1 more"
function describeSlots(times) {
  if (times.length === 1) return `the ${formatChicago(times[0])} slot`;
  const shown = times.slice(0, 3).map(formatChicago).join("; ");
  return `${times.length} slots: ${shown}${times.length > 3 ? `; and ${times.length - 3} more` : ""}`;
}

// Where a desk's own window starts. A scheduled time is judged only once the
// grace has passed, so the window reaches back a day plus the grace (36 hours
// with the default grace). That way every daily desk always has one slot that
// is both old enough to judge and still in view, even when the report starts
// late or in standard time. The report's own window (HOURS, 26 by default)
// still sets Published and Deploys; a longer HOURS wins here too.
export function deskWindowStart(nowMs, windowStartMs, graceMs) {
  return Math.min(windowStartMs, nowMs - DAY - graceMs);
}

// One desk's verdict. `runs` are the workflow's recent runs (up to
// HISTORY_DAYS back, any event); the desk's window is
// [deskWindowStart, nowMs]. `timeoutMs` is the workflow's time limit, read from
// its file: a cancelled run that lasted that long is a timeout, which counts as
// a failure (and toward "twice in a row"). Verdicts: FAILED, MISSING, running,
// cancelled, waiting, ok, "not scheduled in window".
export function summarizeDesk({ label, cronExprs, timeoutMs = null, runs, nowMs, windowStartMs, graceMs }) {
  const crons = cronExprs.map(parseCron);
  const startMs = deskWindowStart(nowMs, windowStartMs, graceMs);
  const history = runs.filter((r) => createdMs(r) <= nowMs).sort(newestFirst);
  const inWindow = history.filter((r) => createdMs(r) >= startMs);
  const slots = scheduledTimes(crons, startMs, nowMs);
  const matched = matchSlots(slots, inWindow, nowMs, graceMs);
  const missing = matched.filter((s) => s.state === "missing").map((s) => s.time);
  const waiting = matched.filter((s) => s.state === "waiting").map((s) => s.time);

  const failedRun = (run) => isFailure(run) || isTimeout(run, timeoutMs);
  const doneInWindow = inWindow.find((r) => r.status === "completed");
  const done = history.filter((r) => r.status === "completed");
  const failed = Boolean(doneInWindow) && failedRun(doneInWindow);
  const timedOut = failed && isTimeout(doneInWindow, timeoutMs);
  const cancelled = Boolean(doneInWindow) && isCancelled(doneInWindow) && !failed;
  const twice = failed && done.length >= 2 && failedRun(done[0]) && failedRun(done[1]);
  const running = inWindow.some(isActive);
  const last = inWindow[0] ?? null;

  let verdict;
  if (failed) verdict = "FAILED";
  else if (missing.length) verdict = "MISSING";
  else if (running) verdict = "running";
  else if (cancelled) verdict = "cancelled";
  else if (!inWindow.length && !slots.length) verdict = "not scheduled in window";
  else if (!inWindow.length) verdict = "waiting";
  else verdict = "ok";

  const lastText = last ? ` Last run ${describeRun(last, timeoutMs)}${lagNote(last, crons)}.` : "";
  let line;
  if (verdict === "FAILED") {
    line = `${label}: FAILED${twice ? " twice in a row" : ""}. Last finished run ${describeRun(doneInWindow, timeoutMs)}. ${doneInWindow.html_url}`;
    if (twice) line += ` The run before: ${describeRun(done[1], timeoutMs)}. ${done[1].html_url}`;
    if (running) line += " A newer run is still going.";
    if (missing.length) line += ` Also no run for ${describeSlots(missing)}.`;
  } else if (verdict === "MISSING") {
    line = `${label}: MISSING. No run for ${describeSlots(missing)}.${lastText}`;
  } else if (verdict === "running") {
    line = `${label}: running.${lastText}`;
  } else if (verdict === "cancelled") {
    line = `${label}: cancelled. Someone or something stopped the last finished run before its time limit: ${describeRun(doneInWindow, timeoutMs)}. ${doneInWindow.html_url}`;
    if (!(timeoutMs > 0)) line += " The workflow's time limit could not be read, so this may have been a timeout.";
    if (waiting.length) line += ` Waiting on ${describeSlots(waiting)}.`;
  } else if (verdict === "waiting") {
    line = `${label}: waiting. No run yet for ${describeSlots(waiting)}.`;
  } else if (verdict === "ok") {
    line = `${label}: ok.${lastText}`;
    if (waiting.length) line += ` Waiting on ${describeSlots(waiting)}.`;
    if (!slots.length) line += " No scheduled time in the window.";
  } else {
    line = `${label}: not scheduled in window.`;
  }
  if (!inWindow.length) {
    line += history.length ? ` Last run before the window: ${describeRun(history[0], timeoutMs)}.` : ` No runs in the last ${HISTORY_DAYS} days.`;
  }

  return { label, verdict, twice, timedOut, line: `- ${line}`, failedUrl: failed ? doneInWindow.html_url : null, missingSlots: missing };
}

// ---------------------------------------------------------------------------
// Deploys: the Vercel commit status on each commit to main
// ---------------------------------------------------------------------------

const statusTime = (s) => Date.parse(s.updated_at || s.created_at || 0) || 0;
const DEPLOY_RANK = { error: 3, failure: 3, pending: 2, success: 1 };

// The Vercel state of a commit, from the combined status ({statuses: [...]})
// or the list of statuses. The newest status per Vercel context counts, and
// the worst state wins. Returns null when Vercel posted nothing.
export function vercelStatusOf(payload) {
  const list = Array.isArray(payload) ? payload : (payload?.statuses ?? []);
  const newest = new Map();
  for (const s of list) {
    if (!/vercel/i.test(s?.context ?? "")) continue;
    const prev = newest.get(s.context);
    if (!prev || statusTime(s) > statusTime(prev) || (statusTime(s) === statusTime(prev) && (s.id ?? 0) > (prev.id ?? 0))) {
      newest.set(s.context, s);
    }
  }
  if (!newest.size) return null;
  const [top] = [...newest.values()].sort((a, b) => (DEPLOY_RANK[b.state] ?? 0) - (DEPLOY_RANK[a.state] ?? 0) || statusTime(b) - statusTime(a));
  const bucket = top.state === "success" ? "deployed" : top.state === "failure" || top.state === "error" ? "failed" : "pending";
  return { bucket, state: top.state, description: top.description ?? "", context: top.context };
}

const firstLine = (text) => String(text ?? "").split("\n")[0];

// `commits` is the API's list of commits on main (possibly a little older than
// the window); `statusBySha` maps each sha to its combined status payload, or
// to an Error when that lookup failed. The counts cover commits made at or
// after `windowStartMs`. `last24h` covers every commit given, so it holds for
// any window length.
//
// `newest` is the newest commit that HAS a Vercel status, wherever it falls in
// the list: state-only commits marked [skip ci] get none, and they must not
// hide the real deploy. The search never looks past a commit whose status
// lookup failed. That commit becomes `newest` with `vercel` undefined, which
// means the state is unknown. `newest` is null when no commit in the list has
// a status. `listed` is how many commits were given.
export function summarizeDeploys(commits, statusBySha, nowMs, windowStartMs = -Infinity) {
  const counts = { deployed: 0, failed: 0, pending: 0, none: 0, unknown: 0 };
  let total = 0;
  let last24h = 0;
  let newest = null;
  const rows = commits
    .map((c) => ({ sha: c.sha, when: c.commit?.committer?.date ?? c.commit?.author?.date, subject: firstLine(c.commit?.message) }))
    .sort((a, b) => Date.parse(b.when) - Date.parse(a.when));
  for (const row of rows) {
    const when = Date.parse(row.when);
    const payload = statusBySha.get(row.sha);
    const lookupFailed = payload === undefined || payload instanceof Error;
    const vercel = lookupFailed ? undefined : vercelStatusOf(payload);
    if (vercel && nowMs - when <= DAY) last24h += 1;
    if (!newest && (lookupFailed || vercel)) newest = { ...row, vercel };
    if (when < windowStartMs) continue;
    total += 1;
    if (lookupFailed) counts.unknown += 1;
    else if (!vercel) counts.none += 1;
    else counts[vercel.bucket] += 1;
  }
  return { total, ...counts, last24h, newest, listed: commits.length, truncated: commits.length >= COMMITS_PER_PAGE };
}

// ---------------------------------------------------------------------------
// Published: what the desks committed
// ---------------------------------------------------------------------------

// Lines of `git log --format=%H%x1f%cI%x1f%s` (fields split by the 0x1f
// character), newest first.
export function parseGitLog(raw) {
  return String(raw)
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, when, ...subject] = line.split("\x1f");
      return { sha, when, subject: subject.join("\x1f") };
    });
}

// Which desk a commit subject belongs to and what it is: a story ("published"),
// a rejected laws draft ("rejected"), a data update ("data"), or laws queue
// housekeeping ("queue"). null for every other commit.
export function classifyCommit(subject) {
  if (/^Laws desk: /.test(subject)) {
    const rejected = QUEUE_REJECTION.test(subject) && !QUEUE_HOUSEKEEPING.test(subject);
    return { desk: "Laws desk", kind: rejected ? "rejected" : "queue" };
  }
  const hit = DESK_SUBJECTS.find((d) => d.re.test(subject));
  return hit ? { desk: hit.desk, kind: hit.kind } : null;
}

// Consecutive laws desk rejections at the front of `commits` (newest first):
// 0 when the newest draft was published, 2 when the last two were rejected.
// Queue housekeeping is not a draft, so it neither counts nor breaks a streak.
export function rejectionStreak(commits) {
  let streak = 0;
  for (const c of commits) {
    const hit = classifyCommit(c.subject);
    if (!hit || hit.desk !== "Laws desk" || hit.kind === "queue") continue;
    if (hit.kind !== "rejected") break;
    streak += 1;
  }
  return streak;
}

export function summarizePublished(commits, sinceMs, untilMs) {
  const items = [];
  for (const c of commits) {
    const when = Date.parse(c.when);
    if (when < sinceMs || when > untilMs) continue;
    const hit = classifyCommit(c.subject);
    if (hit) items.push({ ...c, ...hit });
  }
  const only = (kind) => items.filter((i) => i.kind === kind);
  return { published: only("published"), rejected: only("rejected"), data: only("data"), queue: only("queue"), items };
}

// ---------------------------------------------------------------------------
// Coming up: future-dated posts and laws, and the laws queue
// ---------------------------------------------------------------------------

// Reads { slug, date } pairs out of the TypeScript array `name` in lib/posts.ts
// or lib/laws.ts. Entries start with "  {" and end with "  }," at two spaces,
// and their slug and date sit at four. `entries` counts every line that opens
// an entry; `pairs` are the entries with a slug and a date. The two must
// match, or the parse missed something.
export function parseEntries(source, name) {
  const start = new RegExp(`^(?:export\\s+)?const\\s+${name}\\b[^\\n=]*=\\s*\\[\\s*$`, "m").exec(source);
  if (!start) throw new Error(`could not find the ${name} array`);
  const rest = source.slice(start.index + start[0].length);
  const end = rest.search(/^\];/m);
  const lines = (end === -1 ? rest : rest.slice(0, end)).split("\n");
  const entries = lines.filter((l) => /^ {2}\{/.test(l)).length;
  const pairs = [];
  let block = null;
  for (const line of lines) {
    if (block === null) {
      if (/^ {2}\{\s*$/.test(line)) block = [];
    } else if (/^ {2}\},?\s*$/.test(line)) {
      const slug = block.map((l) => l.match(/^ {4}slug:\s*"((?:[^"\\]|\\.)*)"/)).find(Boolean);
      const date = block.map((l) => l.match(/^ {4}date:\s*"(\d{4}-\d{2}-\d{2})"/)).find(Boolean);
      if (slug && date) pairs.push({ slug: slug[1], date: date[1] });
      block = null;
    } else {
      block.push(line);
    }
  }
  return { entries, pairs };
}

// Entries dated after `today` (YYYY-MM-DD, Chicago), soonest first.
export function scheduledEntries(pairs, today) {
  return pairs.filter((p) => p.date > today).sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));
}

// The laws queue the way scripts/laws-desk.mjs reads it: the next bill is the
// first item that is not already in lib/laws.ts.
export function summarizeQueue(queue, lawsSource) {
  const items = Array.isArray(queue) ? queue : [];
  const done = (bill) => lawsSource.includes(`bill: ${JSON.stringify(bill)}`);
  const next = items.find((q) => !q.bill || !done(q.bill));
  const name = (q) => oneLine(q.bill) || "an unnumbered item";
  return {
    count: items.length,
    next: next ? name(next) : null,
    retried: items.filter((q) => (q.attempts ?? 0) > 0).map((q) => ({ bill: name(q), attempts: q.attempts })),
  };
}

// ---------------------------------------------------------------------------
// Backlog: unchecked items in docs/staff/backlog.md, by "##" heading
// ---------------------------------------------------------------------------

export function parseBacklog(markdown) {
  const sections = [];
  let section = null;
  let item = null;
  const open = (heading) => {
    section = { heading, items: [] };
    sections.push(section);
  };
  for (const line of String(markdown).split("\n")) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      open(heading[1]);
      item = null;
      continue;
    }
    const entry = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*\S)\s*$/);
    if (entry) {
      item = null;
      if (entry[1] === " ") {
        if (!section) open("(no heading)");
        item = { text: entry[2] };
        section.items.push(item);
      }
      continue;
    }
    // A wrapped item: an indented line right under it.
    if (item && /^\s{2,}\S/.test(line) && !/^\s*[-*]\s/.test(line)) item.text += ` ${line.trim()}`;
    else item = null;
  }
  const kept = sections.filter((s) => s.items.length).map((s) => ({ heading: s.heading, items: s.items.map((i) => i.text) }));
  return { sections: kept, total: kept.reduce((n, s) => n + s.items.length, 0) };
}

// ---------------------------------------------------------------------------
// Site: the feed
// ---------------------------------------------------------------------------

function decodeXml(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// The items of an RSS feed: { title, link, pubDate }, in document order.
export function parseFeed(xml) {
  const items = [];
  for (const m of String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
    const field = (tag) => {
      const t = m[1].match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`));
      return t ? decodeXml(t[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1").trim()) : "";
    };
    items.push({ title: field("title"), link: field("link"), pubDate: field("pubDate") });
  }
  return items;
}

// The item with the latest pubDate; the first one listed wins a tie.
export function newestFeedItem(items) {
  let best = null;
  for (const item of items) {
    const t = Date.parse(item.pubDate);
    if (!best || (!Number.isNaN(t) && (Number.isNaN(best.t) || t > best.t))) best = { item, t };
  }
  return best ? best.item : null;
}

// ---------------------------------------------------------------------------
// Errors and annotations
// ---------------------------------------------------------------------------

function redact(text) {
  const token = process.env.GITHUB_TOKEN;
  return token ? String(text).split(token).join("[redacted]") : String(text);
}

// A short, safe reason for a failed request or check.
export function reasonOf(err) {
  if (err?.name === "TimeoutError" || err?.name === "AbortError") return `timed out after ${FETCH_TIMEOUT_MS / 1000}s`;
  const code = err?.cause?.code || err?.code;
  const message = String(err?.message || err || "unknown error");
  return oneLine(redact(code && !message.includes(code) ? `${message} (${code})` : message)).slice(0, 240);
}

const escapeData = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escapeProperty = (s) => escapeData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

// A GitHub Actions workflow command: ::warning title=...::message
export function warning(title, message) {
  return `::warning title=${escapeProperty(title)}::${escapeData(message)}`;
}

// ---------------------------------------------------------------------------
// Rendering: each section returns its Markdown lines
// ---------------------------------------------------------------------------

export function renderDeploys(summary) {
  const lines = [];
  lines.push(`- Commits on main in the window: ${summary.total}${summary.truncated ? ` (the list holds only the newest ${COMMITS_PER_PAGE})` : ""}.`);
  lines.push(
    `- Vercel: ${summary.deployed} deployed, ${summary.failed} failed or blocked, ${summary.pending} pending, ${summary.none} with no Vercel status` +
      `${summary.unknown ? `, ${summary.unknown} could not be checked` : ""}.`,
  );
  lines.push(`- Deploys in the last 24 hours (commits with a Vercel status): ${summary.last24h}.`);
  // The newest deploy is the newest commit that has a Vercel status; commits with none are skipped.
  const n = summary.newest;
  if (n) {
    const what = n.vercel === undefined ? "could not check: the status lookup failed" : `${n.vercel.state}, "${oneLine(n.vercel.description)}"`;
    lines.push(`- Newest deploy, commit ${n.sha.slice(0, 7)} (${formatChicago(n.when)}, "${oneLine(n.subject)}"): ${what}`);
  } else {
    lines.push(`- Newest deploy: could not check: ${summary.listed === 0 ? "no commits were listed" : "none of the commits listed has a Vercel status"}.`);
  }
  return lines;
}

// The desk names behind each verdict: { ok: ["Autopilot", ...], FAILED: [...], ... }.
export function desksByVerdict(results) {
  const out = {};
  for (const r of results) (out[r.verdict] ??= []).push(r.label);
  return out;
}

// `lookbackMs` is how far back the desks were read (default a day plus the grace).
export function renderDesks(results, graceMs, lookbackMs = DAY + graceMs) {
  const by = desksByVerdict(results);
  const count = (verdict) => (by[verdict] ?? []).length;
  const named = (verdict) => (count(verdict) ? ` (${by[verdict].join(", ")})` : "");
  const lines = [
    `A desk is MISSING when a scheduled time passed more than ${formatDuration(graceMs)} ago with no run after it. GitHub often starts scheduled runs hours late. Each desk is read over the last ${formatDuration(lookbackMs)}.`,
    `Summary: ${count("ok")} ok, ${count("running")} running, ${count("waiting")} waiting, ${count("not scheduled in window")} not scheduled in window, ` +
      `${count("FAILED")} FAILED${named("FAILED")}, ${count("MISSING")} MISSING${named("MISSING")}, ${count("cancelled")} cancelled${named("cancelled")}` +
      `${count("unknown") ? `, ${count("unknown")} could not be checked` : ""}.`,
  ];
  for (const r of results) lines.push(r.line);
  return lines;
}

// Stories are "published"; a rejected laws draft is REJECTED; data-only commits
// are DATA and laws queue housekeeping is QUEUE. Only stories count as published.
export function renderPublished(summary, streak, refName) {
  const lines = [`Commits on ${refName} in the window whose subject starts with a desk prefix.`];
  if (!summary.items.length) lines.push("- None.");
  const tags = { rejected: "REJECTED ", data: "DATA ", queue: "QUEUE " };
  for (const i of summary.items) {
    lines.push(`- ${tags[i.kind] ?? ""}${formatChicago(i.when)}: ${oneLine(i.subject)}`);
  }
  const extra = [(summary.data ?? []).length && ` Data updates ${summary.data.length}.`, (summary.queue ?? []).length && ` Queue changes ${summary.queue.length}.`];
  lines.push(`Published ${summary.published.length}, rejected ${summary.rejected.length}.${extra.filter(Boolean).join("")}`);
  if (streak >= 1) lines.push(`Laws desk: the last ${streak === 1 ? "draft was" : `${streak} drafts were`} rejected${streak >= 2 ? " in a row" : ""}.`);
  return lines;
}

export function renderBacklog(backlog) {
  const lines = [`${backlog.total} open item${backlog.total === 1 ? "" : "s"}. Items are listed oldest first.`];
  for (const s of backlog.sections) {
    lines.push(`### ${oneLine(s.heading)} (${s.items.length})`);
    for (const item of s.items) lines.push(`- [ ] ${oneLine(item)}`);
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Network layer
// ---------------------------------------------------------------------------

// "2026-10-10T11:35:00Z": the form the GitHub API and git both read.
const isoSeconds = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function githubGet(ctx, path) {
  const res = await fetch(`${ctx.apiBase}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "TheJacksonWire-StatusReport",
      Authorization: `Bearer ${ctx.token}`,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = String((await res.json()).message || "").slice(0, 120);
    } catch {
      // the error body was not JSON
    }
    throw new Error(`GitHub API ${res.status} for ${path.split("?")[0]}${detail ? ` (${detail})` : ""}`);
  }
  return res.json();
}

function requireGithub(ctx) {
  if (!ctx.token) throw new Error("GITHUB_TOKEN is not set");
  if (!ctx.repo) throw new Error("GITHUB_REPOSITORY is not set");
}

// One GET to the live site. Never throws: the result says what happened.
// scripts/site-watch.mjs reuses it.
export async function probe(url, { manual = false, readBody = false } = {}) {
  try {
    const res = await fetch(url, {
      redirect: manual ? "manual" : "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    let body = "";
    if (readBody) body = await res.text();
    else await res.body?.cancel();
    return {
      ok: true,
      status: res.status,
      cache: res.headers.get("x-vercel-cache"),
      age: res.headers.get("age"),
      location: res.headers.get("location"),
      body,
    };
  } catch (err) {
    return { ok: false, error: reasonOf(err), code: err?.cause?.code || err?.code || err?.name || "error" };
  }
}

const probeText = (r) => (r.ok ? String(r.status) : `could not check: ${r.error}`);

// What the error code of a failed bare-domain request means, in plain words.
const BARE_ERRORS = {
  ENOTFOUND: "the bare domain does not resolve",
  ECONNREFUSED: "the connection was refused",
  ETIMEDOUT: "the connection timed out",
  TimeoutError: "the request timed out",
};

async function checkSite(ctx) {
  const base = ctx.site.replace(/\/+$/, "");
  const siteUrl = new URL(base);
  // The bare domain is the same address without "www.".
  const bareHost = siteUrl.hostname.startsWith("www.") ? siteUrl.hostname.slice(4) : null;
  const bareUrl = bareHost ? `${siteUrl.protocol}//${bareHost}${siteUrl.port ? `:${siteUrl.port}` : ""}/` : null;
  const [home, robots, sitemap, feed, bare] = await Promise.all([
    probe(`${base}/`),
    probe(`${base}/robots.txt`),
    probe(`${base}/sitemap.xml`),
    probe(`${base}/feed.xml`, { readBody: true }),
    bareUrl ? probe(bareUrl, { manual: true }) : Promise.resolve(null),
  ]);

  const lines = [];
  const homeExtras = [home.cache ? `x-vercel-cache: ${home.cache}` : "", home.age ? `age: ${home.age}` : ""].filter(Boolean).join(", ");
  lines.push(`- Home page (${base}/): ${probeText(home)}${home.ok && home.status === 402 ? ". Vercel has paused the account (402)" : ""}${homeExtras ? ` (${homeExtras})` : ""}`);
  lines.push(`- /robots.txt: ${probeText(robots)}`);
  lines.push(`- /sitemap.xml: ${probeText(sitemap)}`);

  // The feed and its newest story.
  let newest = null;
  let article = null;
  if (!feed.ok || feed.status !== 200) {
    lines.push(`- /feed.xml: ${probeText(feed)}`);
    lines.push(`- Newest feed item: could not check: ${feed.ok ? `the feed returned ${feed.status}` : "the feed did not load"}`);
    lines.push("- Newest article: could not check: no article URL from the feed");
  } else {
    lines.push("- /feed.xml: 200");
    const item = newestFeedItem(parseFeed(feed.body));
    if (!item) {
      lines.push("- Newest feed item: could not check: the feed has no items");
      lines.push("- Newest article: could not check: no article URL from the feed");
    } else {
      newest = { title: oneLine(item.title), pubDate: formatFeedDate(item.pubDate) };
      lines.push(`- Newest feed item: "${newest.title}", ${newest.pubDate}`);
      let path = "";
      try {
        path = new URL(item.link, base).pathname;
      } catch {
        // no usable link
      }
      if (!path || path === "/") {
        lines.push("- Newest article: could not check: the item has no article link");
      } else {
        article = await probe(`${base}${path}`);
        lines.push(`- Newest article (${path}): ${probeText(article)}`);
      }
    }
  }

  // The bare domain. If the www site could not be reached at all, a DNS error
  // here proves nothing (the runner may be offline), so it is not reported as a finding.
  let bareText = null;
  if (bare) {
    if (!bare.ok && !home.ok) {
      bareText = `could not check: ${bare.error}`;
    } else if (!bare.ok) {
      bareText = BARE_ERRORS[bare.code] ? `${bare.code}, ${BARE_ERRORS[bare.code]}` : bare.code;
    } else {
      bareText = `${bare.status}${bare.location ? `, Location: ${bare.location}` : ""}`;
    }
    lines.push(`- Bare domain (${bareUrl}): ${bareText}`);
  }

  // Warnings: one per distinct problem, with the paths that share it.
  const checks = [
    ["/", home],
    ["/robots.txt", robots],
    ["/sitemap.xml", sitemap],
    ["/feed.xml", feed],
  ];
  if (article) checks.push(["the newest article", article]);
  const byProblem = new Map();
  for (const [path, r] of checks) {
    if (r.ok && r.status === 200) continue;
    const problem = r.ok ? `returned ${r.status}${r.status === 402 ? " (Vercel has paused the account)" : ""}` : `could not be reached: ${r.error}`;
    byProblem.set(problem, [...(byProblem.get(problem) ?? []), path]);
  }
  const warnings = [...byProblem].map(([problem, paths]) => warning("Site is not 200", `${paths.join(", ")} ${problem}`));

  const status = (r) => (r === null ? null : r.ok ? r.status : r.code);
  return {
    lines,
    warnings,
    json: {
      url: base,
      ok: byProblem.size === 0,
      home: status(home),
      robots: status(robots),
      sitemap: status(sitemap),
      feed: status(feed),
      article: status(article),
      bare: bareText,
      newest,
    },
  };
}

async function checkDeploys(ctx) {
  requireGithub(ctx);
  // Read back at least 24 hours so "deploys in the last 24 hours" holds for any window.
  const since = isoSeconds(Math.min(ctx.windowStart, ctx.now - DAY));
  const query = new URLSearchParams({ sha: "main", since, per_page: String(COMMITS_PER_PAGE) });
  const commits = await githubGet(ctx, `/repos/${ctx.repo}/commits?${query}`);
  const statusBySha = new Map();
  await mapLimit(commits, STATUS_LOOKUPS_AT_ONCE, async (c) => {
    try {
      statusBySha.set(c.sha, await githubGet(ctx, `/repos/${ctx.repo}/commits/${c.sha}/status`));
    } catch (err) {
      statusBySha.set(c.sha, err instanceof Error ? err : new Error(String(err)));
    }
  });
  const summary = summarizeDeploys(commits, statusBySha, ctx.now, ctx.windowStart);
  const n = summary.newest;
  return {
    lines: renderDeploys(summary),
    warnings: [],
    json: {
      commits: summary.total,
      deployed: summary.deployed,
      failed: summary.failed,
      pending: summary.pending,
      none: summary.none,
      unknown: summary.unknown,
      last24h: summary.last24h,
      // The newest commit that has a Vercel status (state "unknown" when its lookup failed), or null.
      newest: n ? { sha: n.sha.slice(0, 7), state: n.vercel ? n.vercel.state : "unknown", description: n.vercel?.description ?? "" } : null,
    },
  };
}

// The desk's recent runs come from the Actions API, from HISTORY_DAYS days back
// (or the start of the window if that is earlier), so "failed twice in a row"
// can see past the window. Only runs on main count: a test dispatch from a
// feature branch is not the desk doing its job.
async function checkDesk(ctx, file) {
  const fallback = file.replace(/\.ya?ml$/, "");
  let yaml;
  try {
    yaml = readFileSync(resolve(ROOT, ".github/workflows", file), "utf8");
  } catch (err) {
    return unchecked(fallback, `cannot read .github/workflows/${file} (${err.code || err.message})`);
  }
  const label = workflowName(yaml) || fallback;
  const cronExprs = readCronLines(yaml);
  try {
    cronExprs.forEach(parseCron);
    requireGithub(ctx);
    const since = isoSeconds(Math.min(ctx.windowStart, ctx.now - HISTORY_DAYS * DAY));
    const query = new URLSearchParams({ branch: "main", created: `>=${since}`, per_page: String(RUNS_PER_PAGE) });
    const data = await githubGet(ctx, `/repos/${ctx.repo}/actions/workflows/${file}/runs?${query}`);
    const timeoutMinutes = readTimeoutMinutes(yaml);
    return summarizeDesk({
      label,
      cronExprs,
      timeoutMs: timeoutMinutes === null ? null : timeoutMinutes * MINUTE,
      runs: data.workflow_runs ?? [],
      nowMs: ctx.now,
      windowStartMs: ctx.windowStart,
      graceMs: ctx.graceMs,
    });
  } catch (err) {
    return unchecked(label, reasonOf(err));
  }
}

function unchecked(label, reason) {
  return { label, verdict: "unknown", twice: false, timedOut: false, line: `- ${label}: could not check: ${reason}`, failedUrl: null, missingSlots: [] };
}

async function checkDesks(ctx) {
  const results = await Promise.all(DESK_FILES.map((file) => checkDesk(ctx, file)));
  const warnings = [];
  for (const r of results) {
    if (r.verdict === "FAILED") warnings.push(warning("Desk failed", `${r.label} failed${r.twice ? " twice in a row" : ""}: ${r.failedUrl}`));
    if (r.verdict === "MISSING" || (r.verdict === "FAILED" && r.missingSlots.length)) {
      warnings.push(warning("Desk missed its run", `${r.label} has no run for ${describeSlots(r.missingSlots)}`));
    }
  }
  const by = desksByVerdict(results);
  const count = (verdict) => (by[verdict] ?? []).length;
  return {
    lines: renderDesks(results, ctx.graceMs, ctx.now - deskWindowStart(ctx.now, ctx.windowStart, ctx.graceMs)),
    warnings,
    json: {
      ok: count("ok"),
      running: count("running"),
      waiting: count("waiting"),
      notScheduled: count("not scheduled in window"),
      unknown: count("unknown"),
      failed: by.FAILED ?? [],
      missing: by.MISSING ?? [],
      cancelled: by.cancelled ?? [],
      timedOut: results.filter((r) => r.timedOut).map((r) => r.label),
      twice: results.filter((r) => r.twice).map((r) => r.label),
      verdicts: Object.fromEntries(results.map((r) => [r.label, r.verdict])),
    },
  };
}

function checkPublished(ctx) {
  let ref = "HEAD";
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", "origin/main"], { cwd: ROOT, stdio: "ignore" });
    ref = "origin/main";
  } catch {
    // no origin/main in this checkout; read HEAD instead
  }
  const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const format = "--format=%H%x1f%cI%x1f%s";
  const inWindow = parseGitLog(git(["log", ref, `--since=${isoSeconds(ctx.windowStart)}`, format]));
  const summary = summarizePublished(inWindow, ctx.windowStart, ctx.now);
  // The streak can reach back past the window: the last few laws desk commits,
  // up to the moment of the report.
  const recent = parseGitLog(git(["log", ref, "-n", String(LAWS_STREAK_COMMITS), format])).filter((c) => Date.parse(c.when) <= ctx.now);
  const streak = rejectionStreak(recent);
  return {
    lines: renderPublished(summary, streak, ref),
    warnings: [],
    json: {
      count: summary.published.length,
      rejected: summary.rejected.length,
      dataUpdates: summary.data.length,
      queueChanges: summary.queue.length,
      lawsRejectedInARow: streak,
    },
  };
}

function checkComingUp(ctx) {
  const today = chicagoDate(ctx.now);
  const lines = [`Today is ${formatChicagoDay(ctx.now)} (${today}) in Chicago. Entries dated after today stay hidden until their day.`];
  const json = {};
  let lawsSource = "";
  for (const [file, name, key] of [
    ["lib/posts.ts", "POSTS", "posts"],
    ["lib/laws.ts", "LAWS", "laws"],
  ]) {
    try {
      const source = readFileSync(resolve(ROOT, file), "utf8");
      if (key === "laws") lawsSource = source;
      const { entries, pairs } = parseEntries(source, name);
      if (entries !== pairs.length) {
        lines.push(`- ${file}: could not check: found ${entries} entries but ${pairs.length} slug and date pairs`);
        json[key] = { error: "pair count mismatch" };
        continue;
      }
      const scheduled = scheduledEntries(pairs, today);
      lines.push(`- ${file}: ${entries} entries, ${scheduled.length} scheduled.`);
      for (const s of scheduled) lines.push(`  - ${s.date} ${s.slug}`);
      json[key] = { entries, scheduled };
    } catch (err) {
      lines.push(`- ${file}: could not check: ${reasonOf(err)}`);
      json[key] = { error: reasonOf(err) };
    }
  }
  try {
    const queue = summarizeQueue(JSON.parse(readFileSync(resolve(ROOT, "data/laws-queue.json"), "utf8")), lawsSource);
    const retried = queue.retried.length ? ` Retried: ${queue.retried.map((r) => `${r.bill} (${r.attempts} failed ${r.attempts === 1 ? "try" : "tries"})`).join(", ")}.` : "";
    lines.push(`- Laws queue (data/laws-queue.json): ${queue.count} item${queue.count === 1 ? "" : "s"}. ${queue.next ? `Next bill: ${queue.next}.` : "The queue is empty."}${retried}`);
    json.queue = { count: queue.count, next: queue.next };
  } catch (err) {
    lines.push(`- Laws queue (data/laws-queue.json): could not check: ${reasonOf(err)}`);
    json.queue = { error: reasonOf(err) };
  }
  return { lines, warnings: [], json };
}

function checkBacklog() {
  const backlog = parseBacklog(readFileSync(resolve(ROOT, "docs/staff/backlog.md"), "utf8"));
  return {
    lines: renderBacklog(backlog),
    warnings: [],
    json: { open: backlog.total, sections: Object.fromEntries(backlog.sections.map((s) => [s.heading, s.items.length])) },
  };
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

// A check that throws still leaves a line in the report.
async function section(key, title, run) {
  try {
    return { key, title, ...(await run()) };
  } catch (err) {
    const reason = reasonOf(err);
    return { key, title, lines: [`- could not check: ${reason}`], warnings: [], json: { error: reason } };
  }
}

// `sections` are { key, title, lines, warnings, json }. Every "could not check"
// line in the report is repeated in the JSON's `errors`, so one place lists
// everything the report could not verify.
export function buildReport({ sections, now, hours, windowStart }) {
  const md = [
    "# Jackson Wire status report",
    "",
    `Generated ${formatChicago(now)} Central. Window: the last ${hours} hours, since ${formatChicago(windowStart)}. All times are Central (America/Chicago).`,
  ];
  for (const s of sections) {
    md.push("", `## ${s.title}`, ...s.lines);
  }
  const json = {
    v: 1,
    at: new Date(now).toISOString(),
    windowHours: hours,
    ...Object.fromEntries(sections.map((s) => [s.key, s.json])),
    errors: sections.flatMap((s) => s.lines.filter((l) => /^\s*- .*could not check:/.test(l)).map((l) => `${s.title}: ${l.replace(/^\s*- /, "")}`)),
  };
  return {
    markdown: md.join("\n"),
    annotations: sections.flatMap((s) => s.warnings),
    json,
  };
}

// The report between GitHub Actions' stop-commands markers. While they are in
// force the runner ignores workflow commands, so no field in the report (a
// commit subject, a feed title, a log line) can start one. The token must be
// unguessable and new on every run; main passes a random UUID.
export function stopCommandsFence(markdown, token) {
  return `::stop-commands::${token}\n${markdown}\n::${token}::`;
}

async function main() {
  const now = Date.now();
  const hoursEnv = Number(process.env.HOURS);
  const hours = Number.isFinite(hoursEnv) && hoursEnv > 0 ? hoursEnv : DEFAULT_HOURS;
  const graceEnv = process.env.GRACE_MINUTES === undefined || process.env.GRACE_MINUTES === "" ? NaN : Number(process.env.GRACE_MINUTES);
  const graceMinutes = Number.isFinite(graceEnv) && graceEnv >= 0 ? graceEnv : DEFAULT_GRACE_MINUTES;
  const repoEnv = process.env.GITHUB_REPOSITORY || "";
  const ctx = {
    now,
    windowStart: now - hours * HOUR,
    graceMs: graceMinutes * MINUTE,
    site: process.env.SITE || DEFAULT_SITE,
    repo: /^[\w.-]+\/[\w.-]+$/.test(repoEnv) ? repoEnv : "",
    token: process.env.GITHUB_TOKEN || "",
    apiBase: (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, ""),
  };

  // The three network sections run together; the rest read local files and git.
  const [site, deploys, desks] = await Promise.all([
    section("site", "Site", () => checkSite(ctx)),
    section("deploys", "Deploys", () => checkDeploys(ctx)),
    section("desks", "Desks", () => checkDesks(ctx)),
  ]);
  const published = await section("published", "Published", async () => checkPublished(ctx));
  const comingUp = await section("comingUp", "Coming up", async () => checkComingUp(ctx));
  const backlog = await section("backlog", "Backlog", async () => checkBacklog());

  const report = buildReport({ sections: [site, deploys, desks, published, comingUp, backlog], now, hours, windowStart: ctx.windowStart });
  console.log(stopCommandsFence(report.markdown, randomUUID()));
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report.markdown}\n`);
    } catch (err) {
      console.log(`could not write the step summary: ${reasonOf(err)}`);
    }
  }
  console.log("");
  for (const a of report.annotations) console.log(a);
  console.log(`STATUS_JSON ${JSON.stringify(report.json)}`);
}

// Run only when started from the command line, so tests can import the functions.
const entry = process.argv[1] ? realpathSync(process.argv[1]) : "";
if (entry === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    console.error(`[status-report] FAILED: ${reasonOf(err)}`);
    process.exit(1);
  });
}
