// The Mississippi U.S. Senate count tracker (Nov. 3, 2026): Scott Colom (D),
// Sen. Cindy Hyde-Smith (R) and independent Ty Pinkins.
//
// This file is the single place editors update. The /mississippi-senate-race
// hub, the homepage banner, the sitemap, llms.txt and the article "From this
// beat" link all read it. Content changes by deploy, so no page here fetches
// anything or goes dynamic (every cache write is billed on Vercel Hobby).
//
// Rules for every entry:
// - Every number needs a source and a time. Vote totals carry `countAsOf` and
//   `countSource`; outstanding items, deadlines, FAQ answers and updates carry
//   their own sources.
// - The Wire never calls a race. It reports the Associated Press and the
//   Mississippi Secretary of State. Set `status` to "called" only after AP
//   calls it, and "certified" only after the state certifies the result.
// - Set `lastUpdated` (ISO with time and offset) every time you edit the data.
//   It drives the "Updated" line, the banner, the sitemap and the JSON-LD.
// - Set `showBanner` to false to take the homepage banner down.
import { absoluteUrl } from "./markdown";
import { getPostsByTag, todayLocalIso, type Post } from "./posts";
import { site } from "./site";

export const SENATE_TAG = "senate-race-2026";

export type SenateStatus = "uncalled" | "called" | "certified";

export interface SenateSource {
  name: string;
  url: string;
}

export interface SenateCandidate {
  name: string;
  party: string;
  votes?: number;
  share?: number; // percent, e.g. 48.7
}

export interface SenateRace {
  slug: "mississippi-senate-race";
  status: SenateStatus;
  showBanner: boolean;
  lastUpdated: string; // ISO with time and offset
  candidates: SenateCandidate[];
  countAsOf: string; // ISO
  countSource: SenateSource;
  outstanding: { label: string; value: string; note?: string; source?: SenateSource }[];
  deadlines: { date: string; label: string; detail: string; source?: SenateSource }[]; // date: YYYY-MM-DD
  faq: { q: string; a: string[]; sources: SenateSource[] }[];
  updates: {
    at: string; // ISO
    headline: string;
    body: string[];
    sources: SenateSource[];
  }[]; // newest first
  circuitClerks: {
    county: string;
    clerk?: string;
    phone?: string;
    address?: string;
    city?: string;
    sourceUrl?: string;
  }[];
}

export const SENATE_RACE: SenateRace = {
  slug: "mississippi-senate-race",
  status: "uncalled",
  showBanner: true,
  // PLACEHOLDER: poll close on election night. The editor sets the real time.
  lastUpdated: "2026-11-03T19:00:00-06:00",
  candidates: [
    { name: "Scott Colom", party: "Democrat" },
    { name: "Cindy Hyde-Smith", party: "Republican" },
    { name: "Ty Pinkins", party: "Independent" },
  ],
  countAsOf: "2026-11-03T19:00:00-06:00",
  countSource: { name: "Associated Press", url: "https://apnews.com/" },
  outstanding: [],
  deadlines: [],
  faq: [
    {
      q: "Will there be a runoff?",
      a: [
        "No. The Secretary of State lists U.S. Senate as a plurality office: the candidate with the most votes wins, even without a majority. The 2020 amendment that created runoffs covers statewide state offices such as governor, not Congress.",
      ],
      sources: [
        {
          name: "Mississippi Secretary of State, vote requirements chart, via the Wire's Nov. 2 preview",
          url: "/article/scott-colom-cindy-hyde-smith-senate-race-money-polls-rules",
        },
      ],
    },
  ],
  updates: [],
  circuitClerks: [],
};

// Stories tagged for the tracker, newest first.
export function getSenatePosts(): Post[] {
  return getPostsByTag(SENATE_TAG);
}

export interface SenateMargin {
  leader: SenateCandidate;
  trailer: SenateCandidate; // the runner-up
  margin: number; // votes; 0 is a tie
}

// Null until at least two candidates have vote totals.
export function getSenateMargin(
  candidates: SenateCandidate[] = SENATE_RACE.candidates,
): SenateMargin | null {
  const counted = candidates.filter(
    (c): c is SenateCandidate & { votes: number } => typeof c.votes === "number",
  );
  if (counted.length < 2) return null;
  const sorted = [...counted].sort((a, b) => b.votes - a.votes);
  return {
    leader: sorted[0],
    trailer: sorted[1],
    margin: sorted[0].votes - sorted[1].votes,
  };
}

function surname(name: string): string {
  return name.trim().split(/\s+/).pop() ?? name;
}

function votesWord(n: number): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "vote" : "votes"}`;
}

// "Colom leads by 2,010 votes", "Colom and Hyde-Smith are tied", or null.
export function senateMarginLine(m: SenateMargin | null = getSenateMargin()): string | null {
  if (!m) return null;
  if (m.margin === 0) return `${surname(m.leader.name)} and ${surname(m.trailer.name)} are tied`;
  return `${surname(m.leader.name)} leads by ${votesWord(m.margin)}`;
}

// Homepage banner headline, built from the data.
export function senateBannerHeadline(m: SenateMargin | null = getSenateMargin()): string {
  if (!m) return "Colom and Hyde-Smith race is too close to call";
  if (m.margin === 0) {
    return `${surname(m.leader.name)} and ${surname(m.trailer.name)} are tied as ballots are counted`;
  }
  return `${surname(m.leader.name)} leads ${surname(m.trailer.name)} by ${votesWord(m.margin)} as ballots are counted`;
}

const AP_MONTHS = [
  "Jan.", "Feb.", "March", "April", "May", "June",
  "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.",
];

// "Nov. 6" from a YYYY-MM-DD date (no time zone math).
export function apDate(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${AP_MONTHS[m - 1]} ${d}`;
}

// "Nov. 6, 9:00 a.m. CT" for an ISO instant, shown in America/Chicago.
export function apDateTimeCT(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  const meridiem = parts.dayPeriod?.toLowerCase().startsWith("p") ? "p.m." : "a.m.";
  return `${AP_MONTHS[Number(parts.month) - 1]} ${parts.day}, ${parts.hour}:${parts.minute} ${meridiem} CT`;
}

export function senateStatusLabel(status: SenateStatus = SENATE_RACE.status): string {
  return status === "called" ? "Called by AP" : status === "certified" ? "Certified" : "Uncalled";
}

// Deadlines sorted by date, each marked passed, next (the first upcoming) or
// upcoming, judged by today's date in Chicago at build or revalidate time.
export function getSenateDeadlines(today: string = todayLocalIso()) {
  const sorted = [...SENATE_RACE.deadlines].sort((a, b) => a.date.localeCompare(b.date));
  const nextIdx = sorted.findIndex((d) => d.date >= today);
  return sorted.map((d, i) => ({
    ...d,
    state: d.date < today ? ("passed" as const) : i === nextIdx ? ("next" as const) : ("upcoming" as const),
  }));
}

// The site's share image for the tracker to name outright (see
// SPORTS_SHARE_IMAGE in lib/sports.ts for why).
export const SENATE_SHARE_IMAGE = {
  url: absoluteUrl("/opengraph-image.png"),
  width: 1200,
  height: 630,
  alt: `${site.name}, with the tagline: ${site.tagline}`,
};

export const SENATE_FIRST_PUBLISHED = "2026-11-03T19:00:00-06:00";
