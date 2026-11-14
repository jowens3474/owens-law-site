// ESPN's public team schedule data, for the sports desk (scripts/sports-desk.mjs).
//
// The desk's team_schedule tool reads one school's schedule in one sport and
// hands the model the recent results and the next games in AP style, Central
// time. The same parsed games back the desk's checks: the next game a story
// names must match a game on the schedule the desk actually read.
//
// The endpoint needs no key: site.api.espn.com/apis/site/v2/sports/<sport>/
// teams/<id>/schedule. ESPN numbers teams per sport family, and college
// baseball uses its own ids (145 there is Lafayette, not Ole Miss), so each
// school carries a default id and a baseball id. All ids were checked
// against ESPN's team pages on Nov. 14, 2026.

const TZ = "America/Chicago";

export const SPORT_PATHS = {
  football: "football/college-football",
  "men's basketball": "basketball/mens-college-basketball",
  "women's basketball": "basketball/womens-college-basketball",
  baseball: "baseball/college-baseball",
};
export const SPORTS = Object.keys(SPORT_PATHS);

export const TEAM_IDS = {
  "Ole Miss": { default: 145, baseball: 92 },
  "Mississippi State": { default: 344, baseball: 150 },
  "Southern Miss": { default: 2572, baseball: 192 },
  "Jackson State": { default: 2296, baseball: 285 },
  "Alcorn State": { default: 2016, baseball: 260 },
  "Mississippi Valley State": { default: 2400, baseball: 388 },
};
export const SCHEDULE_SCHOOLS = Object.keys(TEAM_IDS);

const AP_MONTHS = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Calendar date and clock time of an instant in Central time. */
export function centralParts(date) {
  const p = Object.fromEntries(partsFmt.formatToParts(date).map((x) => [x.type, x.value]));
  const y = Number(p.year);
  const m = Number(p.month);
  const d = Number(p.day);
  return {
    iso: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    year: y,
    month: m,
    day: d,
    hour: Number(p.hour),
    minute: Number(p.minute),
  };
}

/** "2026-11-15" -> "Nov. 15" (AP style, no year). */
export function apDate(isoDate) {
  const [, m, d] = String(isoDate).split("-").map(Number);
  if (!m || !d) return "";
  return `${AP_MONTHS[m - 1]} ${d}`;
}

/** "2026-11-15" -> "Sunday" (the calendar weekday of that date). */
export function weekdayOf(isoDate) {
  const [y, m, d] = String(isoDate).split("-").map(Number);
  if (!y || !m || !d) return "";
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** Clock time in AP style: "noon", "midnight", "11 a.m.", "7:30 p.m." */
export function apTime(hour, minute) {
  if (hour === 12 && minute === 0) return "noon";
  if (hour === 0 && minute === 0) return "midnight";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "a.m." : "p.m.";
  return minute === 0 ? `${h12} ${suffix}` : `${h12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function scheduleUrl(school, sport) {
  const ids = TEAM_IDS[school];
  const path = SPORT_PATHS[sport];
  if (!ids || !path) return "";
  const id = sport === "baseball" ? ids.baseball : ids.default;
  return `https://site.api.espn.com/apis/site/v2/sports/${path}/teams/${id}/schedule`;
}

const textOf = (v) => (typeof v === "string" ? v : "");

function scoreOf(c) {
  const s = c?.score;
  if (s && typeof s === "object") return textOf(s.displayValue) || (s.value != null ? String(s.value) : "");
  return s != null ? String(s) : "";
}

function statusOf(type) {
  const name = textOf(type?.name).toUpperCase();
  if (type?.completed || name === "STATUS_FINAL") return "final";
  if (name.includes("POSTPONED")) return "postponed";
  if (name.includes("CANCELED") || name.includes("CANCELLED")) return "canceled";
  if (name.includes("DELAYED")) return "delayed";
  if (name.includes("IN_PROGRESS") || name.includes("HALFTIME") || name.includes("END_PERIOD")) return "in progress";
  return "scheduled";
}

/**
 * Games from an ESPN team schedule response, oldest first.
 * @returns {{ id: string, startIso: string, date: string, weekday: string, time: string, opponent: string,
 *   homeAway: string, neutral: boolean, venue: string, tv: string[], status: string, detail: string,
 *   us: string, them: string, result: string }[]}
 */
export function parseSchedule(json) {
  const teamId = String(json?.team?.id ?? "");
  const games = [];
  for (const e of Array.isArray(json?.events) ? json.events : []) {
    const comp = Array.isArray(e?.competitions) ? e.competitions[0] : null;
    if (!comp) continue;
    const start = new Date(e.date || comp.date);
    if (Number.isNaN(start.getTime())) continue;
    const comps = Array.isArray(comp.competitors) ? comp.competitors : [];
    const us = comps.find((c) => String(c?.team?.id ?? c?.id ?? "") === teamId) ?? comps[0];
    const them = comps.find((c) => c !== us);
    if (!us || !them) continue;
    const when = centralParts(start);
    const timeValid = e.timeValid !== false && comp.timeValid !== false;
    const status = statusOf(comp.status?.type);
    const tv = [];
    for (const b of Array.isArray(comp.broadcasts) ? comp.broadcasts : []) {
      const name = textOf(b?.media?.shortName) || (Array.isArray(b?.names) ? b.names.join(", ") : "");
      if (name && !tv.includes(name)) tv.push(name);
    }
    const ourScore = scoreOf(us);
    const theirScore = scoreOf(them);
    let result = "";
    if (status === "final" && ourScore !== "" && theirScore !== "") {
      if (us.winner === true) result = "W";
      else if (them.winner === true) result = "L";
      else {
        const a = Number(ourScore);
        const b = Number(theirScore);
        result = a > b ? "W" : a < b ? "L" : "T";
      }
    }
    games.push({
      id: String(e.id ?? ""),
      startIso: start.toISOString(),
      date: when.iso,
      weekday: weekdayOf(when.iso),
      time: timeValid ? apTime(when.hour, when.minute) : "TBA",
      opponent: textOf(them.team?.displayName) || textOf(them.team?.location) || "TBA",
      homeAway: textOf(us.homeAway),
      neutral: comp.neutralSite === true,
      venue: textOf(comp.venue?.fullName),
      tv,
      status,
      detail: textOf(comp.status?.type?.detail),
      us: ourScore,
      them: theirScore,
      result,
    });
  }
  games.sort((a, b) => a.startIso.localeCompare(b.startIso));
  return games;
}

function sideWord(g) {
  if (g.neutral) return "vs.";
  return g.homeAway === "away" ? "at" : "vs.";
}

/** The text the model reads: recent results and the next games, Central time. */
export function formatSchedule(school, sport, games, url, now = new Date()) {
  const nowMs = now.getTime();
  const past = games.filter((g) => g.status === "final" || Date.parse(g.startIso) < nowMs - 4 * 3600_000);
  const upcoming = games.filter((g) => !past.includes(g));
  const lines = [
    `ESPN schedule for ${school} ${sport}, times Central. Source: ${url}`,
    "Recent results:",
  ];
  const recent = past.slice(-3);
  if (recent.length === 0) lines.push("- none in ESPN's data");
  for (const g of recent) {
    const score = g.result ? `${g.result} ${g.us}-${g.them}` : g.status;
    lines.push(`- ${g.weekday}, ${apDate(g.date)}: ${score} ${sideWord(g)} ${g.opponent}${g.venue ? ` (${g.venue})` : ""}`);
  }
  lines.push("Next games:");
  const next = upcoming.slice(0, 4);
  if (next.length === 0) lines.push("- none scheduled in ESPN's data");
  for (const g of next) {
    const when = g.time === "TBA" ? "time TBA" : g.time;
    const note = g.status !== "scheduled" ? ` [${g.status}${g.detail ? `: ${g.detail}` : ""}]` : "";
    lines.push(
      `- ${g.weekday}, ${apDate(g.date)}, ${when}: ${sideWord(g)} ${g.opponent}${g.venue ? ` (${g.venue})` : ""}, TV: ${g.tv.length ? g.tv.join(", ") : "not listed"}${note}`,
    );
  }
  return lines.join("\n");
}

async function defaultFetchJson(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TheJacksonWire/1.0 (+https://www.thejacksonwire.com)", Accept: "application/json" },
      signal: c.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/** Fetch and parse one schedule. Throws on an unknown school or sport, or a failed fetch. */
export async function teamSchedule(school, sport, { fetchJson = defaultFetchJson, now = new Date() } = {}) {
  const url = scheduleUrl(school, sport);
  if (!url) {
    throw new Error(
      `No ESPN schedule for "${school}" ${sport}. Schools: ${SCHEDULE_SCHOOLS.join(", ")}. Sports: ${SPORTS.join(", ")}.`,
    );
  }
  const games = parseSchedule(await fetchJson(url));
  return { school, sport, url, games, text: formatSchedule(school, sport, games, url, now) };
}
