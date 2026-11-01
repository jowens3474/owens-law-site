// What the Courts Decided: Mississippi Supreme Court and Court of Appeals
// decisions, explained in plain words. It is the court-ruling counterpart of
// What Passed (lib/laws.ts), and each entry follows the same shape so a reader
// who has read one knows where to look in the next: what happened, what the
// court decided, why it matters, what changes for you, and what to watch for.
//
// Writing rules:
// - Plain words, for a bright 12-year-old: short sentences, and a one-line
//   definition of any legal term the first time it appears. Whenever one of
//   these comes up, say what it means: affirmed (the higher court agreed, so
//   the lower court's ruling stands), reversed (it disagreed, so the lower
//   court's ruling is thrown out), rendered (the higher court made the final
//   ruling itself, with nothing left for the lower court to do), remanded
//   (sent back to the lower court or an agency for more work), vacated (set
//   aside, as if never made), dismissed (ended without the court ruling on
//   the questions raised), dissent (a judge's written disagreement with the
//   majority), en banc (decided by all of the court's judges instead of a
//   smaller panel) and per curiam (an opinion issued in the court's name,
//   with no single author).
// - Say what the court decided, never whether a person did something. A court
//   upholding a conviction is not the Wire saying the person did it.
//   Attribute everything: "the court wrote," "according to the opinion."
// - Quotes must be verbatim from the opinion. Analysis goes only in sentences
//   that begin "The Wire's read:".
// - Never legal advice. The opinion is the official record, so `opinionUrl`
//   links to it and the page says so.
// - Use names as the opinion prints them, and initials for minors.
// - No em or en dashes. Write ranges as "5 to 15".
//
// Every number, name, date and quote should trace to the opinion or to a
// source listed in `sources`; where it cannot, the entry says so. New entries
// go at the top of RULINGS.
import { cache } from "react";
import { absoluteUrl } from "./markdown";
import { todayLocalIso } from "./posts";
import { site } from "./site";
import { smarten } from "./typography";
import { LAW_TOPICS, relatedByTopic, type LawSource, type LawTopic } from "./laws";

// Rulings are filed under the same topics as laws, so a topic chip means the
// same thing in both sections. Re-exported so the rulings pages import
// everything from here.
export { LAW_TOPICS };

export const RULING_COURTS = [
  "Mississippi Supreme Court",
  "Mississippi Court of Appeals",
] as const;

export type RulingCourt = (typeof RULING_COURTS)[number];

export type RulingOutcome =
  | "affirmed"
  | "reversed"
  | "reversed and remanded"
  | "reversed and rendered"
  | "affirmed in part and reversed in part"
  | "vacated and remanded"
  | "dismissed"
  | "other";

export interface Ruling {
  slug: string; // becomes /rulings/<slug>
  title: string; // plain headline, under 90 characters
  caseName: string; // as the opinion prints it, e.g. "Smith v. State"
  court: RulingCourt;
  docket: string; // "2024-KA-01234-SCT"
  appealedFrom?: string; // the court the case came up from, e.g. "Panola County Circuit Court"
  decided: string; // ISO yyyy-mm-dd; the day the court handed down the opinion
  citation?: string; // e.g. "412 So. 3d 100", once the court has assigned one
  writtenBy: string; // "Justice Branning", or "Per curiam" when no one judge signed it
  vote: string; // "5 to 4"
  outcome: RulingOutcome;
  topics: LawTopic[];
  oneSentence: string; // the whole ruling in one plain sentence
  whatHappened: string[]; // paragraphs: the facts, and how the case reached this court
  whatTheCourtDecided: string[];
  whyItMatters: string[];
  whatChangesForYou: string[];
  jackson?: string[]; // what it means for Jackson specifically, when there is something to say
  watchFor: string[]; // rehearing requests, remands, next steps
  opinionUrl: string; // the court's opinion itself
  sources: LawSource[]; // every other page used
  author: string;
  // An entry opened before its date has its not-found page cached for at most
  // an hour; the first visit after that still gets it while the page refreshes
  // (lib/not-found-cap.ts).
  date: string; // ISO yyyy-mm-dd; publication date (future dates stay hidden)
  updated?: string;
  note?: string; // reporting note shown at the end
}

// The site's share image (app/opengraph-image.png) for the rulings pages to
// name outright. A page that sets its own openGraph or twitter replaces the
// root layout's, and with it the file-based image, so without this a page
// shared on social media would carry no picture.
export const RULING_SHARE_IMAGE = {
  url: absoluteUrl("/opengraph-image.png"),
  width: 1200,
  height: 630,
  alt: `${site.name}, with the tagline: ${site.tagline}`,
};

// The line every ruling page carries, on the hub and under each entry, so a
// reader knows a summary is not the opinion and not legal advice.
export const RULING_DISCLAIMER =
  "A plain-language summary of a court opinion, not legal advice. The opinion is the official record.";

export const RULINGS: Ruling[] = [
  {
    slug: "medical-cannabis-application-fee-no-refund",
    title: "Cannabis applicant denied over a nearby church gets no fee refund, Supreme Court rules",
    caseName: "Mississippi Alcoholic Beverage Control and Mississippi Department of Revenue v. Green Cross of MS, LLC and Karen Crumpler",
    court: "Mississippi Supreme Court",
    docket: "2024-SA-01021-SCT",
    appealedFrom: "Panola County Circuit Court",
    decided: "2026-10-29",
    writtenBy: "Justice Branning",
    vote: "5 to 4",
    outcome: "affirmed in part and reversed in part",
    topics: ["Business and jobs", "Health care"],
    oneSentence: "The state could not refund a $15,000 fee to a cannabis applicant denied over a church 99 feet away, the court ruled.",
    whatHappened: [
      "Mississippi's 2022 medical cannabis law bars a dispensary within 1,000 feet of a school, church or child care center, the opinion explains. A waiver is possible only beyond 500 feet. On July 30, 2022, Green Cross of MS LLC applied to open one at 311 Heritage Drive in Oxford.",
      "A survey found a child care center within 1,000 feet but not within 500. So Green Cross got the waiver, or permission, the law allows. The surveyor also certified that no church-owned property was in the zone, the court wrote.",
      "But the state's Alcoholic Beverage Control division, part of the Department of Revenue, found a church nearby. Wellspring Church had begun holding services on July 15, 2022, in a strip mall 99 feet from the proposed dispensary. It did not own the property, the court noted.",
      "On Aug. 5, 2022, the division denied the license. It refunded the $25,000 yearly license fee but kept the $15,000 application fee, the opinion says.",
      "Green Cross appealed to Panola County Circuit Court. The judge upheld the denial but ordered the $15,000 returned, the opinion says.",
      "Keeping the fee 'in this unique set of facts' was 'arbitrary,' or without good reason, the judge found. Both sides then appealed to the Supreme Court.",
    ],
    whatTheCourtDecided: [
      "On the fee, the court reversed, meaning it threw out the order to return the $15,000. On the license, it affirmed, meaning it upheld the denial. Justice Branning wrote for five justices.",
      "The law calls the application fee nonrefundable, the court wrote. Its only exception lets the state refund the fee when the sole reason for denial is another dispensary within 1,500 feet. No exception covers a church, and it is 'certainly not within the constitutional powers of this Court to create one,' Branning wrote.",
      "The majority also said a church does not have to own its building to count. It is enough that the church existed there before the application, and no one disputed that Wellspring did, the court wrote.",
      "Four justices dissented, meaning they disagreed with the result. Chief Justice Randolph wrote that Green Cross 'was never offered constitutional due process,' which Randolph described as notice and a chance to be heard. Randolph would have sent the case back for a full appeal before the agency.",
      "Justice Sullivan, joined by Presiding Justice King and Justice Ishee, said the denial rested on 'uncorroborated hearsay within hearsay,' meaning secondhand reports. The agency's record was three emails from an agent and an affidavit, a sworn statement, Sullivan wrote. Sullivan would have overturned the denial and kept the refund.",
    ],
    whyItMatters: [
      "The court called this 'a case of first impression,' meaning it had never ruled on these questions before. Its answer is that the $15,000 application fee stays with the state when a license is denied over a nearby church.",
      "Under the ruling, a church does not need to own its space to block a dispensary. Wellspring had paid a fee to use its space, the trial judge found. The majority quoted that finding and agreed.",
    ],
    whatChangesForYou: [
      "The ruling deals with fees paid by people and companies applying for dispensary licenses. On the court's reading, an applicant denied for any reason other than a nearby dispensary cannot get the $15,000 application fee back.",
      "A 2023 law, House Bill 1158, created an appeal inside the agency for denied applicants, the majority wrote. Green Cross applied and went to court before that law took effect.",
      "The Wire's read: applicants carry the risk that a church opens nearby shortly before they apply, even if a careful survey finds nothing.",
    ],
    watchFor: [
      "The ruling does not send the case back to a lower court. Either side may ask the court to reconsider, a step called a motion for rehearing. None had been filed when the opinion was released, its cover page shows.",
    ],
    opinionUrl: "https://courts.ms.gov/Images/Opinions/CO193120.pdf",
    sources: [
      { name: "CourtListener: case record and opinion", url: "https://www.courtlistener.com/opinion/11049610/mississippi-alcoholic-beverage-control-and-mississippi-department-of/" },
      { name: "Opinion, CourtListener copy of the court's PDF", url: "https://storage.courtlistener.com/pdf/2026/10/29/mississippi_alcoholic_beverage_control_and_mississippi_department_of.pdf" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-11-01",
    note: "The Wire read the majority opinion and both dissents in full in CourtListener's copy of the court's PDF. It compared that copy with the court's own PDF.",
  },
  {
    slug: "tenant-injury-verdict-tossed-unqualified-expert",
    title: "Supreme Court tosses Hinds County jury's verdict for a tenant over unqualified expert",
    caseName: "Park Wind Apartments, LLC v. Glenda Mayze",
    court: "Mississippi Supreme Court",
    docket: "2025-CA-00269-SCT",
    appealedFrom: "Hinds County Circuit Court",
    decided: "2026-10-15",
    writtenBy: "Chief Justice Randolph",
    vote: "unanimous, 9 to 0",
    outcome: "reversed and remanded",
    topics: ["Housing and property"],
    oneSentence: "A tenant's jury win over a knee injury at her apartment complex was thrown out because her safety expert was unqualified, the court ruled.",
    whatHappened: [
      "Glenda Mayze rented an apartment at Park Wind Apartments, where her only path to the parking lot was a sidewalk between two buildings. A disconnected downspout sent rainwater onto a sunken stretch of it. Despite complaints, the complex fixed neither before she was hurt, according to the opinion.",
      "On a dark, stormy night in July 2022, Mayze stepped around a puddle there. She testified that she slipped on a hidden 'jagged edge' in the mud and twisted her right knee. She later had surgery for a torn meniscus, a knee cartilage injury.",
      "The opinion notes she had knee trouble before, including a possible tear diagnosed that April. She sued the complex, and a Hinds County jury ruled for her.",
      "One of her witnesses was Kenneth Goodrum, offered as an expert in 'premises safety,' meaning how owners keep property safe. The complex objected, but the trial judge let him testify. He testified that the complex was 'on notice of the dangerous condition,' the opinion says.",
    ],
    whatTheCourtDecided: [
      "The court reversed and remanded, meaning it threw out the jury's verdict and sent the case back for a new trial. All nine justices joined Chief Justice Randolph's opinion. The court addressed only the expert question, which it said decided the appeal.",
      "The court found Goodrum unqualified. He had no trade school, college or on-the-job training after high school, the opinion says, and 'watched an eight-hour webinar and obtained three certificates.' His knowledge of lighting and premises safety was 'nonexistent,' the court wrote.",
      "His methods also failed the rules of evidence, the court held. He measured with 'a level and measuring tape, items in many households,' and any ordinary person could repeat his work, it wrote.",
      "Juries 'are often in awe of expert witnesses,' the court wrote, quoting an earlier case. So letting an unqualified expert testify on the central question 'can never be harmless,' it said.",
    ],
    whyItMatters: [
      "Before letting an expert testify, a judge must be able to answer yes to two questions, the court explained. Is the witness qualified, and is the testimony based on reliable methods?",
      "It is not the first time the court has turned Goodrum away. In a 2025 case involving Pilot Travel Centers, it held he was unqualified and ordered a new trial, the opinion says.",
      "The ruling does not decide whether the complex was careless. Park Wind raised other issues on appeal, but the court did not reach them.",
    ],
    whatChangesForYou: [
      "The court threw out the verdict Mayze won. It sent her claim back to Hinds County Circuit Court for a new trial.",
      "The Wire's read: for tenants and landlords alike, the ruling shows that an expert's credentials can undo a jury's decision on appeal.",
    ],
    jackson: [
      "The case came from Hinds County Circuit Court, where Judge Eleanor Johnson Peterson presided. Goodrum learned building code enforcement as a Jackson police officer, the opinion says. He testified that 'Jackson incorporated the International Building Code in 2012.'",
    ],
    watchFor: [
      "The case returns to Hinds County Circuit Court for a new trial, the opinion says. It sets no date.",
      "Either side may ask the court to reconsider, a step called a motion for rehearing. None had been filed when the opinion was released, its cover page shows.",
    ],
    opinionUrl: "https://courts.ms.gov/Images/Opinions/CO196092.pdf",
    sources: [
      { name: "CourtListener: case record and opinion", url: "https://www.courtlistener.com/opinion/11035284/park-wind-apartments-llc-v-glenda-mayze/" },
      { name: "Opinion, CourtListener copy of the court's PDF", url: "https://storage.courtlistener.com/pdf/2026/10/15/park_wind_apartments_llc_v._glenda_mayze.pdf" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-11-01",
    note: "The Wire read the unanimous opinion in full in CourtListener's copy of the court's PDF. It compared that copy with the court's own PDF.",
  },
  {
    slug: "jackson-home-loan-challenge-filed-too-late",
    title: "Daughter sued too late over loan on parents' Jackson home, appeals court rules",
    caseName: "ReJohnna Brown Mitchell v. Wells Fargo Bank, N.A., a/k/a Wells Fargo Home Mortgage, Rushmore Loan Management Services, U.S. Bank Trust National Association as Trustee of the LB-Cabana Service IV Trust",
    court: "Mississippi Court of Appeals",
    docket: "2025-CP-01155-COA",
    appealedFrom: "Hinds County Chancery Court",
    decided: "2026-10-06",
    writtenBy: "Judge McCarty",
    vote: "unanimous, 9 to 0",
    outcome: "affirmed",
    topics: ["Housing and property", "Courts and families"],
    oneSentence: "A daughter waited too long to challenge the 2008 loan papers on her late parents' Jackson home, the Court of Appeals ruled.",
    whatHappened: [
      "William Brown and his wife owned a home on Laura Avenue in Jackson, according to the opinion. They signed a note to borrow $119,356.26 from Wells Fargo, backed by a deed of trust. That is a paper that lets a lender take the home if the loan goes unpaid.",
      "The deed of trust was recorded, meaning filed in the public land records, in Hinds County on Oct. 16, 2008. Mrs. Brown died in 2009 and Mr. Brown in 2017, and neither challenged the loan, the court wrote.",
      "In 2019, Mr. Brown's estate, meaning the property he left, won an order halting the bank's foreclosure, its move to take the house. That order was later lifted, the opinion says.",
      "In 2022, their daughter, ReJohnna Mitchell, sued as the person in charge of her father's estate. She claimed her mother lacked the mental capacity to sign and had been under a conservatorship, meaning someone else managed her affairs.",
      "The court noted that Mrs. Brown's signature on the deed of trust is 'merely an odd scribble.' The trial court dismissed the suit as filed too late, and Mitchell, representing herself, appealed.",
    ],
    whatTheCourtDecided: [
      "The Court of Appeals affirmed, meaning it let the dismissal stand. Judge McCarty wrote the opinion, and all nine judges who took part agreed. Judge Westbrooks did not participate.",
      "The deadline to sue, called the statute of limitations, started when the deed of trust was recorded in 2008, the court held. It relied on a 2021 Supreme Court ruling about deeds.",
      "The trial court had used a three-year deadline for fraud claims. The appeals court said the right one was 10 years, the deadline for suits to recover land. But Mitchell had agreed to the three-year rule in the trial court, so she could not switch now, the court wrote.",
      "Either way, she lost. Ten years from 2008 ran out by 2018, and she sued in 2022, so 'the statute of limitations had long run,' the court wrote.",
      "The court wrote that Mrs. Brown's shaky signature 'is visible and concerning.' Still, under an earlier Supreme Court ruling that lower courts follow, the clock started in 2008. The court upheld the dismissal 'with prejudice,' meaning the claim cannot be filed again.",
    ],
    whyItMatters: [
      "Mitchell argued she did not learn of her mother's signature until 2019. The trial court found the deed was public record, so no one hid it, and the appeals court agreed the clock started at recording.",
      "The court also applied what it called an 'ancient rule.' A party that relies on the wrong deadline in the trial court is stuck with the result.",
    ],
    whatChangesForYou: [
      "The Wire's read: for heirs who doubt a parent's loan papers, the deadline may have started years ago, when the papers were recorded.",
      "The opinion does not say what happens to the house now. It says the order halting foreclosure was lifted, but not whether the bank has foreclosed.",
    ],
    jackson: [
      "The home is on Laura Avenue in Jackson, and the deed of trust was recorded in Hinds County. The case came from Hinds County Chancery Court, where Judge J. Dewayne Thomas dismissed it in September 2025.",
    ],
    watchFor: [
      "The ruling does not send the case back to the trial court. Either side may ask the court to reconsider, a step called a motion for rehearing. None had been filed when the opinion was released, its cover page shows.",
    ],
    opinionUrl: "https://courts.ms.gov/Images/Opinions/CO195394.pdf",
    sources: [
      { name: "CourtListener: case record and opinion", url: "https://www.courtlistener.com/opinion/11012973/rejohnna-brown-mitchell-v-wells-fargo-bank-na-aka-wells-fargo-home/" },
      { name: "Opinion, CourtListener copy of the court's PDF", url: "https://storage.courtlistener.com/pdf/2026/10/06/rejohnna_brown_mitchell_v._wells_fargo_bank_n.a._aka_wells_fargo_home.pdf" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-11-01",
    note: "The Wire read the opinion in full in CourtListener's copy of the court's PDF. It compared that copy with the court's own PDF.",
  },
];

function isPublished(r: Ruling): boolean {
  return r.date <= todayLocalIso();
}

// True when the slug belongs to a ruling entry that exists but is future-dated.
// The ruling page uses it to cap how long its not-found render is cached (see
// lib/not-found-cap.ts); an unknown slug returns false.
export function isScheduledRulingSlug(slug: string): boolean {
  const ruling = RULINGS.find((r) => r.slug === slug);
  return ruling !== undefined && !isPublished(ruling);
}

const memo = new WeakMap<Ruling, Ruling>();
function smartenRuling(ruling: Ruling): Ruling {
  const hit = memo.get(ruling);
  if (hit) return hit;
  const out: Ruling = {
    ...ruling,
    title: smarten(ruling.title),
    caseName: smarten(ruling.caseName),
    writtenBy: smarten(ruling.writtenBy),
    oneSentence: smarten(ruling.oneSentence),
    whatHappened: ruling.whatHappened.map(smarten),
    whatTheCourtDecided: ruling.whatTheCourtDecided.map(smarten),
    whyItMatters: ruling.whyItMatters.map(smarten),
    whatChangesForYou: ruling.whatChangesForYou.map(smarten),
    watchFor: ruling.watchFor.map(smarten),
    // Source names are display text, so they curl like the rest; URLs stay as is.
    sources: ruling.sources.map((s) => ({ ...s, name: smarten(s.name) })),
  };
  if (ruling.appealedFrom) out.appealedFrom = smarten(ruling.appealedFrom);
  if (ruling.jackson) out.jackson = ruling.jackson.map(smarten);
  if (ruling.note) out.note = smarten(ruling.note);
  memo.set(ruling, out);
  return out;
}

// Published rulings, the most recently decided first; ties go to the most
// recently published entry.
export const getAllRulings = cache((): Ruling[] =>
  RULINGS.filter(isPublished)
    .sort((a, b) => b.decided.localeCompare(a.decided) || b.date.localeCompare(a.date))
    .map(smartenRuling),
);

export const getRulingBySlug = cache((slug: string): Ruling | undefined => {
  const ruling = RULINGS.find((r) => r.slug === slug);
  return ruling && isPublished(ruling) ? smartenRuling(ruling) : undefined;
});

export function getRelatedRulings(ruling: Ruling, limit = 3): Ruling[] {
  return relatedByTopic(ruling, getAllRulings(), limit);
}

// Newest entries by publication date, for the front-page rail.
export function getLatestRulings(limit = 3): Ruling[] {
  return [...getAllRulings()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

// The result in plain words, each saying what the header's definitions say. A
// remand names no court, because it can go to an agency as well as a trial
// court. None of these carry an apostrophe, because the pages show this text
// as written and the entries' own text is curled by smarten().
export function outcomeLabel(outcome: RulingOutcome): string {
  switch (outcome) {
    case "affirmed":
      return "Affirmed, so the lower court decision stands";
    case "reversed":
      return "Reversed, so the lower court decision is thrown out";
    case "reversed and remanded":
      return "Reversed and sent back for more work";
    case "reversed and rendered":
      return "Reversed, and the court made the final ruling itself";
    case "affirmed in part and reversed in part":
      return "Part of the lower court decision stands and part is reversed";
    case "vacated and remanded":
      return "Set aside and sent back for more work";
    case "dismissed":
      return "Dismissed, so the court did not rule on the questions raised";
    default:
      return "Read the entry for the result";
  }
}

// "Mississippi Supreme Court" becomes "Supreme Court", for cards and chips.
export function courtShort(court: RulingCourt): string {
  return court.replace(/^Mississippi /, "");
}
