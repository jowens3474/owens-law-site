// The Pipeline: every development project and money decision the Wire is
// tracking, plus the dated milestones that will decide them. Rendered by
// /pipeline and the homepage "Coming up" rail. Every entry traces to a
// published Wire article (see `slugs`) so readers can check the sourcing.
//
// To add a project or a date, append to PROJECTS or MILESTONES below. Keep
// `date` as ISO yyyy-mm-dd; set `approx: true` when only a month or season is
// known and the day is a placeholder.

import { todayLocalIso } from "./posts";

export type Stage =
  | "proposed"
  | "approved"
  | "under-construction"
  | "opening"
  | "stalled";

export const STAGE_LABEL: Record<Stage, string> = {
  proposed: "Proposed",
  approved: "Approved",
  "under-construction": "Under construction",
  opening: "Opening soon",
  stalled: "Stalled",
};

export const STAGE_ORDER: Stage[] = [
  "under-construction",
  "opening",
  "approved",
  "proposed",
  "stalled",
];

export interface Project {
  name: string;
  developer: string;
  location: string;
  investment?: string;
  stage: Stage;
  status: string; // one sentence: where it stands today
  next?: string; // one sentence: the next thing that has to happen
  slugs: string[]; // Wire articles that source this entry (newest first)
}

export type MilestoneKind =
  | "vote"
  | "deadline"
  | "election"
  | "opening"
  | "rate"
  | "fiscal";

export interface Milestone {
  date: string; // ISO yyyy-mm-dd
  approx?: boolean; // day is a placeholder; only the month or season is known
  kind: MilestoneKind;
  text: string;
  slug?: string; // Wire article that sources this date
}

export const PROJECTS: Project[] = [
  {
    name: "Prado Vista and the Madison County Conference Center",
    developer: "Gabriel Prado (private); Madison County (venue)",
    location: "77 acres off I-55 near Sunnybrook Road, Ridgeland",
    investment: "$100M private, plus $48M county urban renewal bonds",
    stage: "approved",
    status:
      "Supervisors authorized the $48 million bond issue for an 1,800-person conference center on a 3-2 vote on Sept. 8, 2026, over objections about the land appraisal and a $10 conveyance clause. The private side adds a 250-room hotel and four restaurants.",
    next: "Bond sale and a public construction schedule.",
    slugs: [
      "madison-county-conference-center-48m-bond-prado",
      "prado-vista-ridgeland-100-million-development",
      "madison-county-approves-48-million-conference-center-ridgeland",
    ],
  },
  {
    name: "Amazon Web Services data center campuses",
    developer: "Amazon Web Services",
    location: "Madison County, with related sites in Ridgeland, Clinton, and Warren County",
    investment: "About $25B disclosed",
    stage: "under-construction",
    status:
      "Construction is under way. A 25-year water and wastewater agreement with Ridgeland, effective March 18, 2025, sets Amazon's peak-day draw at 82 percent of the city's total use and routes 1.8 million gallons a day of cooling wastewater into Jackson's West Bank interceptor.",
    next: "Whether JXN Water and Ridgeland put a shortage-priority clause in writing.",
    slugs: ["amazon-ridgeland-water-deal-wastewater-jackson"],
  },
  {
    name: "Flats at Fondren",
    developer: "Arlington Properties",
    location: "Mitchell Avenue, west Fondren, Jackson",
    investment: "$59M, 234 units",
    stage: "under-construction",
    status:
      "Ground broke in April 2026. Average rents are planned near $2,100 a month, about twice the city's median.",
    next: "Delivery in fall 2027.",
    slugs: ["flats-at-fondren-rent-double-jackson-median"],
  },
  {
    name: "McNair Davis Planetarium reopening",
    developer: "City of Jackson; operated by the Mississippi Museum of Art",
    location: "Downtown Jackson",
    investment: "$23M renovation",
    stage: "opening",
    status:
      "The city transferred operations to the Mississippi Museum of Art in July 2026. Reopening was expected about six months later, once digital screens go in.",
    next: "Reopening in early 2027.",
    slugs: ["planetarium-reopening-mma-transfer-six-months"],
  },
  {
    name: "Hinds County criminal justice facility",
    developer: "Hinds County Board of Supervisors",
    location: "Hinds County",
    investment: "Funded in part by a 1.5-mill tax increase (about $2.3M a year)",
    stage: "approved",
    status:
      "Supervisors adopted the FY2027 budget on Sept. 10, 2026 with a 1.5-mill increase, and the new jail is the single largest reason the county gave for needing the money.",
    next: "Design, site, and total cost have not been made public.",
    slugs: ["hinds-county-adopts-budget-1-5-mill-increase-jail"],
  },
  {
    name: "Saxum data center rezoning",
    developer: "Saxum Investment Group (New Jersey)",
    location: "About 230 acres along Forest Avenue Extension, northwest Jackson",
    stage: "stalled",
    status:
      "The city's planning director said rezoning hearings will keep being postponed until Jackson adopts data center regulations. The 183-day moratorium passed July 14, 2026 took effect a month later, and the replacement ordinance was still undrafted in mid-September.",
    next: "An ordinance, or the moratorium's expiration in February 2027 with nothing to replace it.",
    slugs: [
      "jackson-data-center-moratorium-clock-runs-as-ordinance-stalls",
      "jackson-data-center-moratorium-clock-ordinance",
      "jackson-data-center-moratorium-takes-effect-as-council-asks-where-to-put-them",
    ],
  },
  {
    name: "Prado AI off-grid campus",
    developer: "Prado AI / Gabriel Prado",
    location: "Undisclosed Jackson-metro site",
    stage: "proposed",
    status:
      "The Public Service Commission declined to issue the declaratory ruling Prado sought in Docket 2026-AD-10, calling the request premature. Mississippi Power and Entergy Mississippi intervened.",
    next: "An off-grid generation permit application, which both utilities oppose.",
    slugs: [
      "jackson-data-center-power-plant-prado-psc",
      "prado-vista-ridgeland-100-million-development",
    ],
  },
  {
    name: "Eudora Welty Library replacement",
    developer: "City of Jackson",
    location: "Site not chosen",
    investment: "About $4M in HUD funds",
    stage: "stalled",
    status:
      "The city received the grant three years ago to replace the flagship branch that closed in 2023. No location has been selected and the federal drawdown clock is running.",
    next: "A site decision by the council.",
    slugs: ["jacksons-4-million-library-grant-clock-ticking"],
  },
];

export const MILESTONES: Milestone[] = [
  {
    date: "2026-07-20",
    kind: "vote",
    text: "Madison County supervisors vote 3-1 to pursue urban renewal bonds for the Ridgeland conference center.",
    slug: "madison-county-approves-48-million-conference-center-ridgeland",
  },
  {
    date: "2026-08-13",
    kind: "deadline",
    text: "Jackson's 183-day data center moratorium takes effect, 30 days after the July 14 vote.",
    slug: "jackson-data-center-moratorium-takes-effect-as-council-asks-where-to-put-them",
  },
  {
    date: "2026-09-03",
    kind: "vote",
    text: "Jackson City Council sets the millage at 63.03 mills, locking in no property tax increase.",
    slug: "flat-millage-locks-in-no-tax-increase-as-public-works-cut-looms",
  },
  {
    date: "2026-09-08",
    kind: "vote",
    text: "Madison County authorizes $48 million in bonds for the conference center, 3-2.",
    slug: "madison-county-conference-center-48m-bond-prado",
  },
  {
    date: "2026-09-10",
    kind: "vote",
    text: "Hinds County adopts its budget with a 1.5-mill increase to fund a new jail.",
    slug: "hinds-county-adopts-budget-1-5-mill-increase-jail",
  },
  {
    date: "2026-10-01",
    kind: "fiscal",
    text: "New fiscal year begins for Jackson and Hinds County. The city's flat budget and the county's 1.5-mill increase take effect.",
    slug: "hinds-county-adopts-budget-1-5-mill-increase-jail",
  },
  {
    date: "2026-11-03",
    kind: "election",
    text: "Jackson voters decide a 0.5% prepared-food tax increase and a 1% lodging tax increase for Visit Jackson, the first change since 1983.",
    slug: "jackson-tourism-tax-referendum-november",
  },
  {
    date: "2027-01-15",
    approx: true,
    kind: "opening",
    text: "McNair Davis Planetarium expected to reopen under Mississippi Museum of Art management.",
    slug: "planetarium-reopening-mma-transfer-six-months",
  },
  {
    date: "2027-02-12",
    approx: true,
    kind: "deadline",
    text: "Jackson's data center moratorium expires. Without an ordinance, the Saxum rezoning returns under the old rules.",
    slug: "jackson-data-center-moratorium-clock-runs-as-ordinance-stalls",
  },
  {
    date: "2027-04-01",
    approx: true,
    kind: "rate",
    text: "JXN Water's financial plan projects a 10% rate increase in spring 2027, with further hikes in 2028 and 2029.",
    slug: "jxn-water-files-plan-another-10-percent-rate-hike-spring-2027",
  },
  {
    date: "2027-10-01",
    approx: true,
    kind: "opening",
    text: "Flats at Fondren scheduled to deliver 234 units in fall 2027.",
    slug: "flats-at-fondren-rent-double-jackson-median",
  },
];

const byDate = (a: Milestone, b: Milestone) => a.date.localeCompare(b.date);

/** Milestones dated today or later, soonest first. */
export function getUpcomingMilestones(limit?: number): Milestone[] {
  const today = todayLocalIso();
  const upcoming = MILESTONES.filter((m) => m.date >= today).sort(byDate);
  return limit ? upcoming.slice(0, limit) : upcoming;
}

/** Milestones already past, most recent first. */
export function getRecentMilestones(limit?: number): Milestone[] {
  const today = todayLocalIso();
  const past = MILESTONES.filter((m) => m.date < today).sort(byDate).reverse();
  return limit ? past.slice(0, limit) : past;
}

/** Projects grouped by stage in STAGE_ORDER, omitting empty stages. */
export function getProjectsByStage(): { stage: Stage; projects: Project[] }[] {
  return STAGE_ORDER.map((stage) => ({
    stage,
    projects: PROJECTS.filter((p) => p.stage === stage),
  })).filter((g) => g.projects.length > 0);
}

/** "Sept. 9" for exact dates, "Early 2027" style when approximate. */
export function formatMilestoneDate(m: Milestone): string {
  const [y, mo, d] = m.date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (m.approx) {
    const month = dt.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
    return `${month} ${y} (approx.)`;
  }
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
