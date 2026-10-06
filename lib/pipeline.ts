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
  | "undecided"
  | "approved"
  | "under-construction"
  | "opening"
  | "stalled";

export const STAGE_LABEL: Record<Stage, string> = {
  proposed: "Proposed",
  approved: "Approved",
  "under-construction": "Under construction",
  opening: "Opening soon",
  undecided: "Undecided",
  stalled: "Stalled",
};

export const STAGE_ORDER: Stage[] = [
  "under-construction",
  "opening",
  "approved",
  "proposed",
  "undecided",
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
  | "groundbreaking"
  | "demolition"
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
    name: "UMMC Cancer Center and Research Institute",
    developer: "University of Mississippi Medical Center",
    location: "State Street across from the UMMC campus, Jackson (per Mississippi Today; parcel not announced)",
    investment: "$250M: $100M state capital funds, $125M private campaign (80% raised), UMMC bonds for the balance",
    stage: "approved",
    status:
      "The Legislature appropriated $100 million in the FY2027 budget signed in April 2026; private gifts passed 80 percent of the $125 million goal with Regions Bank's $2.5 million this week. A five-story, 250,000-plus-square-foot building aimed at a National Cancer Institute designation, with clinics, infusion suites, clinical trial space, and research labs. No retail component in any plan the Wire found. WJTV reported construction starts in late October and the complex opens in about four years.",
    next: "Groundbreaking in late October, with the first public site plan.",
    slugs: ["ummc-cancer-center-state-street-site-retail-stadium", "dps-tower-implosion-woodrow-wilson-what-comes-next"],
  },
  {
    name: "Former Department of Public Safety headquarters site",
    developer: "State of Mississippi (Department of Finance and Administration)",
    location: "1900 East Woodrow Wilson Avenue at I-55, Jackson",
    stage: "undecided",
    status:
      "The 1976 tower was imploded Oct. 4, 2026 after DPS moved to a $70 million headquarters in Pearl. Commissioner Sean Tindell floated a hotel or mixed-use project serving the hospital district; the Department of Finance and Administration will decide, and no proposal has been announced.",
    next: "A Bureau of Buildings appraisal, notice, or legislative authorization for the land.",
    slugs: ["dps-tower-implosion-woodrow-wilson-what-comes-next"],
  },
  {
    name: "Vieux Carre expansion and medical office building",
    developer: "Vieux Carre Apartments South LLC, an affiliate of State Street Group",
    location: "I-55 North frontage road south of Meadowbrook Road, Jackson",
    investment: "$28M, with $1.3M in city TIF bonds",
    stage: "approved",
    status:
      "The council approved three actions on the project's tax-increment financing agreement on Aug. 25, 2026, clearing the way for construction to start. The plan renovates the 1968 complex, adds 84 units on the 4.8 acres rezoned R-4 in 2021, and builds a 10,000-square-foot medical office building.",
    next: "Visible site work on the south parcel and the first building permits, within the 18-month construction window.",
    slugs: ["vieux-carre-tif-north-jackson-28-million"],
  },
  {
    name: "Jackson Rubbish Landfill reopening and fee ordinance",
    developer: "City of Jackson Public Works",
    location: "6810 I-55 South Frontage Road, Byram",
    stage: "opening",
    status:
      "The Class I rubbish site closed in 2024 when its cell exceeded permitted capacity. MDEQ accepted the construction certification for the new cell in February 2026, and the city said in late September it could reopen any day. An ordinance introduced Sept. 22 replaces the $5-per-cubic-yard rate with $10 a ton for residents and $20 a ton for commercial and out-of-city users.",
    next: "Council adoption vote on the fee ordinance, and the publication of the tonnage and cost study behind the rates.",
    slugs: [
      "jackson-landfill-reopening-10-dollars-a-ton-too-cheap-economics",
      "jackson-solid-waste-disposal-fee-ordinance-september-22",
    ],
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
  {
    name: "Museum Trail: downtown connector, Lakeland Drive bridge, extension to Jackson State",
    developer: "Jackson Heart Foundation, Greater Belhaven Neighborhood Foundation, Great City Mississippi Foundation, City of Jackson, MDOT",
    location: "GM&O Depot on East Pearl Street north to LeFleur's Bluff; planned west to Jackson State",
    investment: "About $10M identified: $1.6M original trail, $213K Eastover leg, $588K federal planning grant, $8M bridge ($5M federal)",
    stage: "under-construction",
    status:
      "The Capitol Green Connector downtown is expected to finish construction in October 2026 after slipping from a spring target, and the $8 million pedestrian bridge over Lakeland Drive broke ground Aug. 19, 2026. The 2.5-mile western extension to Jackson State has a planning grant but no construction money.",
    next: "Opening of the downtown connector, then a construction funding source for the leg to Jackson State.",
    slugs: ["museum-trail-downtown-connector-lakeland-bridge-eastover-beltline"],
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
    date: "2026-08-25",
    kind: "vote",
    text: "Jackson City Council approves three actions on the Vieux Carre TIF agreement for the $28 million North Jackson expansion.",
    slug: "vieux-carre-tif-north-jackson-28-million",
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
    date: "2026-10-13",
    approx: true,
    kind: "vote",
    text: "Jackson City Council can take up the landfill fee ordinance ($10 a ton residents, $20 commercial) for adoption at a regular meeting in October.",
    slug: "jackson-landfill-reopening-10-dollars-a-ton-too-cheap-economics",
  },
  {
    date: "2026-10-04",
    kind: "demolition",
    text: "The former Department of Public Safety tower at I-55 and Woodrow Wilson Avenue is imploded; no plan for the land has been announced.",
    slug: "dps-tower-implosion-woodrow-wilson-what-comes-next",
  },
  {
    date: "2026-10-31",
    approx: true,
    kind: "groundbreaking",
    text: "UMMC expects to break ground on its $250 million Cancer Center and Research Institute; WJTV reported construction starts in late October.",
    slug: "ummc-cancer-center-state-street-site-retail-stadium",
  },
  {
    date: "2026-10-31",
    approx: true,
    kind: "opening",
    text: "Capitol Green Connector, the Museum Trail's downtown entrance between the GM&O Depot and Hal & Mal's, expected to finish construction in October per WLBT.",
    slug: "museum-trail-downtown-connector-lakeland-bridge-eastover-beltline",
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
    date: "2027-06-30",
    approx: true,
    kind: "opening",
    text: "Lakeland Drive pedestrian bridge linking the Museum Trail and LeFleur East Trail due 'sometime next year' per officials at the Aug. 19, 2026 groundbreaking.",
    slug: "museum-trail-downtown-connector-lakeland-bridge-eastover-beltline",
  },
  {
    date: "2027-10-01",
    approx: true,
    kind: "opening",
    text: "Flats at Fondren scheduled to deliver 234 units in fall 2027.",
    slug: "flats-at-fondren-rent-double-jackson-median",
  },
  {
    date: "2028-02-15",
    approx: true,
    kind: "opening",
    text: "Vieux Carre expansion (84 units plus medical office) due if the 18-month construction estimate from an August 2026 start holds.",
    slug: "vieux-carre-tif-north-jackson-28-million",
  },
  {
    date: "2030-10-31",
    approx: true,
    kind: "opening",
    text: "UMMC Cancer Center and Research Institute due to open if WJTV's reported four-year construction schedule from a late-October 2026 start holds.",
    slug: "ummc-cancer-center-state-street-site-retail-stadium",
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
