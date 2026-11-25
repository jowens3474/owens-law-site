// Dates and times as Jackson reads them (America/Chicago), in the Wire's
// style: "Monday, Nov. 23", "5:42 p.m.". Shared by the city guide pages.

const TZ = "America/Chicago";

// AP month abbreviations: March through July are spelled out.
const AP_MONTHS = [
  "Jan.",
  "Feb.",
  "March",
  "April",
  "May",
  "June",
  "July",
  "Aug.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec.",
];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Today's calendar date in Jackson, as yyyy-mm-dd.
export function centralToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

// "Monday, Nov. 23, 2026" for a yyyy-mm-dd calendar date. `year: false`
// drops the year.
export function formatDay(iso: string, { year = true, weekday = true } = {}): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const parts = [`${AP_MONTHS[m - 1]} ${d}`];
  if (year) parts.push(String(y));
  const text = parts.join(", ");
  return weekday ? `${WEEKDAYS[date.getUTCDay()]}, ${text}` : text;
}

// "5:42 p.m." (or "noon" / "midnight") in Jackson for an ISO instant.
export function formatClock(isoInstant: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(isoInstant));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour");
  const minute = get("minute");
  const pm = get("dayPeriod").toLowerCase().startsWith("p");
  if (minute === "00" && hour === "12") return pm ? "noon" : "midnight";
  return `${hour}${minute === "00" ? "" : `:${minute}`} ${pm ? "p.m." : "a.m."}`;
}

// "5:42 p.m. Monday, Nov. 23" in Jackson for an ISO instant.
export function formatInstant(isoInstant: string): string {
  return `${formatClock(isoInstant)} ${formatDay(centralToday(new Date(isoInstant)), { year: false })}`;
}

// Whole days from one yyyy-mm-dd date to another (negative if `to` is earlier).
export function daysBetween(from: string, to: string): number {
  const utc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86400000);
}
