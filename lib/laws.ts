// What Passed: every bill that became law, explained in plain words. Each
// entry follows the same shape so a reader who has read one knows where to
// look in the next: what it does, why it happened, what is behind it, what
// it costs and who pays, what changes for you, and what to watch for.
//
// Write for a bright 12-year-old: short sentences, no jargon without a
// one-line definition, and dollar figures a household can picture. Every
// number, name, date and quote should trace to a source listed in
// `sources`; where it cannot, the entry says so. The desk script
// (scripts/laws-desk.mjs) inserts new entries at the top of LAWS.
import { cache } from "react";
import { todayLocalIso } from "./posts";
import { smarten } from "./typography";

export const LAW_TOPICS = [
  "Taxes and budget",
  "Schools",
  "Health care",
  "Public safety",
  "Elections",
  "Business and jobs",
  "Housing and property",
  "Courts and families",
  "Local government",
  "Environment and outdoors",
  "Technology",
  "Transportation",
] as const;

export type LawTopic = (typeof LAW_TOPICS)[number];

export interface LawSource {
  name: string; // "Bill text (Mississippi Legislature)", "Mississippi Today"
  url: string;
}

export interface Law {
  slug: string; // becomes /laws/<slug>
  bill: string; // "SB 2588"
  title: string; // plain headline, under 90 characters
  officialTitle?: string; // short title as enacted, e.g. "SHIELD Act"
  session: string; // "2026 Regular Session"
  becameLaw: "signed" | "without signature" | "veto overridden";
  signedOn?: string; // ISO yyyy-mm-dd; the day the governor acted
  effective: string; // ISO yyyy-mm-dd; the day the law starts
  effectiveNote?: string; // "Parts of it start Jan. 1, 2027."
  topics: LawTopic[];
  oneSentence: string; // the whole law in one plain sentence
  whatItDoes: string[]; // paragraphs
  whyItHappened: string[];
  whatsBehindIt: string[]; // who pushed it, who fought it, the politics and money
  whatItCosts: string[]; // dollars, who pays, what the Legislature's own estimate said
  whatChangesForYou: string[];
  jackson?: string[]; // what it means for Jackson specifically, when there is something to say
  watchFor: string[]; // dates, lawsuits, next steps
  sources: LawSource[]; // the bill first, then everything else used
  author: string;
  // An entry opened before its date has its not-found page cached for at most
  // an hour; the first visit after that still gets it while the page refreshes
  // (lib/not-found-cap.ts).
  date: string; // ISO yyyy-mm-dd; publication date (future dates stay hidden)
  updated?: string;
  note?: string; // reporting note shown at the end
}

export const LAWS: Law[] = [
  {
    slug: "voter-citizenship-checks-shield-act",
    bill: "SB 2588",
    title: "New law requires citizenship checks of Mississippi voters against a federal database",
    officialTitle: "SHIELD Act",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-04-01",
    effective: "2026-07-01",
    effectiveNote: "A federal court order issued before the law took effect limits the federal database it relies on.",
    topics: ["Elections"],
    oneSentence: "When you register, and once a year after that, the state checks your name against a federal immigration database and can make you prove you are a citizen.",
    whatItDoes: [
      "When you apply to register, the registrar checks your information against driver's license records. If those records say you are not a citizen, or you gave no license number and the state cannot find one, you count as a possible noncitizen. The registrar must then run you through a federal immigration database, according to the bill summary the Wire read. That database is SAVE, kept by the Department of Homeland Security, according to Ballotpedia.",
      "If both checks say you are not a citizen, the registrar mails you a notice. You have 30 days to send proof: a birth certificate, a U.S. passport or naturalization papers, the documents an immigrant receives on becoming a citizen. If you do not, your registration sits in 'pending' status. You can still vote by affidavit ballot, a ballot set aside until your registration is sorted out, but it counts only if you bring proof within five days.",
      "The secretary of state must also run the whole voter roll through SAVE once a year, at least 180 days before a federal election. Local election commissioners send flagged voters the same notice. A SAVE match alone cannot remove anyone, and no one can be removed because of a SAVE match in the 90 days before a federal election.",
    ],
    whyItHappened: [
      "Supporters say the law helps ensure only eligible citizens register to vote, the Mississippi Independent reported. The sponsor, Sen. Jeremy England, a Republican, told MPB he does not believe noncitizen voting is widespread but argued the law is needed to bolster public confidence in election integrity. England told the Senate that purging a noncitizen from the rolls would give people 'more confidence in our elections, I believe,' Magnolia Tribune reported.",
      "The Wire's read: the numbers behind it are small. England told the Senate that about 1.7 million Mississippians were registered in the last election and about 15 noncitizens were found on the rolls, Magnolia Tribune reported. Sen. Johnny DuPree, a Democrat, asked why so much attention was going to 15 people, some of whom may have checked a box by mistake.",
    ],
    whatsBehindIt: [
      "The bill passed the House 80 to 41 on March 4, with 77 Republicans, two Democrats and one independent in favor, and the Senate 31 to 16 on party lines, according to Ballotpedia. Gov. Tate Reeves signed it April 1 and called it 'another win for election integrity.'",
      "Civil rights groups argued the checks could disenfranchise eligible voters, MPB reported: naturalized citizens, people who changed a name after marriage, and people with discrepancies in government records. The Mississippi Independent added students who register to vote while attending college in Mississippi. Lydia Grizzell of the ACLU of Mississippi urged Mississippians to keep their records current and watch the mail for notices, MPB reported.",
    ],
    whatItCosts: [
      "The Wire could not find a published cost estimate for the checks. The Wire's read: SAVE is a federal system, so the state's cost is staff time in county registrar offices and the secretary of state's office, plus the mailed notices.",
      "For a flagged voter, the cost is paperwork: finding a birth certificate, passport or naturalization papers and getting them to the registrar within 30 days.",
    ],
    whatChangesForYou: [
      "England told MPB that voters would only be affected if the state flags them as a potential noncitizen, which triggers the documentation process. If you get a letter, you have 30 days to send a birth certificate, a passport or naturalization papers.",
      "If you are a naturalized citizen or you changed your name, check your registration before the Nov. 3 election, the date SuperTalk gave for the midterms. Jade Craig, an assistant professor at the University of Mississippi School of Law, told MPB to confirm your status and mailing address with the county registrar well before Election Day.",
    ],
    jackson: [
      "In Hinds County, as everywhere else, the registrar sends the notice when you register, and local election commissioners send it after the yearly roll check, according to the bill summary. The Wire could not find how many Hinds County voters, if any, have been flagged.",
    ],
    watchFor: [
      "A federal judge, Sparkle L. Sooknanan, ruled before the law took effect that the expanded SAVE system is unlawful in its current form and cannot be used for voter checks while the case continues, the Associated Press reported. England told MPB the ruling does not necessarily stop the state, because the law refers to the existing SAVE database or any successor system. MPB reported an appeal was expected; the Wire found no later reporting.",
      "The yearly roll check must come at least 180 days before a federal general election. The Wire's read: for the Nov. 3 election, that date passed in May, before the law took effect, so the first required sweep may not come until 2028. The Wire could not find a statement from Secretary of State Michael Watson on when the first sweep will run.",
    ],
    sources: [
      { name: "SB 2588 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-SB2588-2026" },
      { name: "Ballotpedia: Mississippi legislators enact citizenship checks for voter list maintenance, seven other election-related bills (April 20, 2026)", url: "https://news.ballotpedia.org/2026/04/20/mississippi-legislators-enact-citizenship-checks-for-voter-list-maintenance-seven-other-election-related-bills/" },
      { name: "Magnolia Tribune: New Mississippi laws aimed at curbing illegal immigration could face challenges from ACLU (via the Star-Herald)", url: "https://www.starherald.net/new-mississippi-laws-aimed-curbing-illegal-immigration-could-face-challenges-aclu-69e03b22eb06b" },
      { name: "MPB: Federal judge blocks Mississippi plan to verify voter citizenship before 2026 elections", url: "https://www.mpbonline.org/blogs/news/federal-judge-blocks-mississippi-plan-to-verify-voter-citizenship-before-2026-elections/" },
      { name: "Mississippi Free Press (AP): States can't use SAVE to check voter citizenship, judge rules", url: "https://www.mississippifreepress.org/states-cant-use-save-to-check-voter-citizenship-judge-rules/" },
      { name: "The Mississippi Independent: These new state laws take effect on July 1", url: "https://msindy.org/p/new-state-laws-taking-effect" },
      { name: "SuperTalk: In-person absentee voting will look different in Mississippi ahead of midterms", url: "https://www.supertalk.fm/in-person-absentee-voting-will-look-different-in-mississippi-ahead-of-midterms/" },
      { name: "WLOX: July 1: New Mississippi laws take effect today", url: "https://www.wlox.com/2026/07/01/july-1-new-mississippi-laws-take-effect-today/" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The Wire read the bill's section-by-section summary and history on PolicyRisk, a commercial bill tracker, because the Legislature's own site and LegiScan refuse automated readers. Vote counts and the signing date are from Ballotpedia and the tracker. Quotes are from Magnolia Tribune's report as published by the Star-Herald. The court ruling is described from the Associated Press as published by the Mississippi Free Press and from MPB; neither copy the Wire read carries a date. MPB spells the ACLU's policy manager's name Grizell and the Tribune spells it Grizzell; the Wire used the Tribune's spelling. The Wire did not contact Sen. England, the secretary of state's office or the ACLU before publication.",
  },
  {
    slug: "teens-with-guns-tried-as-adults",
    bill: "SB 2710",
    title: "Teens who carry a gun during a violent crime now go straight to adult court",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-04-08",
    effective: "2026-07-01",
    topics: ["Public safety", "Courts and families"],
    oneSentence: "A teenager who has a gun during a violent crime is charged as an adult, and adults who put stolen guns in kids' hands face long prison terms.",
    whatItDoes: [
      "Before this law, a child's case went to circuit court, the adult court, automatically only under a narrower rule limited to crimes punishable by life or death, WLBT reported; otherwise a youth court judge had to transfer it, MPB reported. Now circuit court takes the case from the start in three situations, according to the bill summary the Wire read. They are an act punishable by life or death, an act involving a deadly weapon, and a crime of violence committed while the child has a firearm. The summary says children under 13 cannot be prosecuted, though their parents can be sued.",
      "It creates a new felony, a serious crime, for shooting into a group of two or more people. The base penalty is 5 to 15 years in prison. At a place of worship, courthouse, school, playground or park it is 5 to 20 years, and 5 to 30 if anyone in the group is under 18. For a gang member it is 10 to 30.",
      "Stolen guns get their own ladder. Knowingly keeping or selling one is 5 years for a first conviction, and a second conviction, or a case with two or more stolen guns, counts as trafficking at 15 years or more. Selling or giving one to a child is 10 to 20 years, rising to 10 to 30 if the gun is later used in a violent crime and 10 to 40 if it is used in a murder. Schools must also tell the youth court when they expel a student and why.",
    ],
    whyItHappened: [
      "Attorney General Lynn Fitch asked lawmakers for the bill and called it a way to help reduce the strain on the state's troubled youth court system, MPB reported. Supporters, including Fitch, said it answers rising youth gun violence and repeat gun offenses, the Mississippi Independent reported.",
      "Ken Winter, executive director of the Mississippi Association of Chiefs of Police, called it 'a good law,' MPB reported. 'It's only going to affect people who are involved in violent crimes, and it's going to affect people who are passing firearms down to juveniles,' he said.",
    ],
    whatsBehindIt: [
      "Sen. Joey Fillingane, a Republican, sponsored it. The House and Senate passed different versions. A conference committee, a small group from both chambers that works out one version, settled them March 31, and Gov. Tate Reeves signed the bill April 8, according to the bill history.",
      "The bill faced opposition from Democrats worried about minors' rights, MPB reported, and some pointed out that the gun only has to be present, not used. The chairman of the Legislative Black Caucus said adults have to be able to explain to kids that 'decisions have life-changing consequences.' Keisha Coleman of the Office of Neighborhood Safety and Engagement told MPB that prevention should be funded at the same level as enforcement.",
    ],
    whatItCosts: [
      "The Wire could not find a fiscal note, the Legislature's own estimate of what a bill will cost. The Wire's read: the costs fall on county jails and the Department of Corrections, which hold adults, and on circuit courts and district attorneys, which now take cases youth courts used to handle. Longer sentences for stolen-gun crimes mean more prison years to pay for. The Wire found no published estimate.",
      "The Wire's read: for a family, the cost is the difference between the two systems. Youth court is 'uniquely designed to address behavioral challenges and provide resources to that child and to that family,' Hinds County Youth Court Judge Carlyn Hicks told WLBT, and those resources are not available in the adult system, she said.",
    ],
    whatChangesForYou: [
      "If your teenager has a gun during a crime of violence, the case starts in adult court. Judge Hicks gave WLBT the example of a teen caught burglarizing a home who comes into possession of a firearm. 'But sometimes just being there is enough. And that's scary,' she said.",
      "If you sell or hand off a gun, make sure it is not stolen. Knowingly transferring a stolen gun to anyone is now a felony, and to a child it is 10 to 20 years.",
    ],
    jackson: [
      "Hinds County Youth Court will lose a slice of its cases to the circuit court. Judge Hicks urged parents to 'know where your children are' and who their friends are, telling WLBT that the resources youth court offers a family 'are no longer available... in the adult system.'",
    ],
    watchFor: [
      "How the Hinds County district attorney's office uses its new power to file directly in circuit court, and whether the strain on youth court eases, as the attorney general said it would.",
      "Whether the rule that a gun need only be present, not used, draws a court challenge. The Wire did not search court dockets for one.",
    ],
    sources: [
      { name: "SB 2710 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-SB2710-2026" },
      { name: "MPB: Mississippi to try armed minors in violent crimes as adults under new law", url: "https://www.mpbonline.org/blogs/news/mississippi-to-try-armed-minors-in-violent-crimes-as-adults-under-new-law/" },
      { name: "WLBT: Mississippi law expands when juveniles can be tried as adults (July 3, 2026)", url: "https://www.wlbt.com/2026/07/03/mississippi-law-expands-when-juveniles-can-be-tried-adults/" },
      { name: "The Mississippi Independent: These new state laws take effect on July 1", url: "https://msindy.org/p/new-state-laws-taking-effect" },
      { name: "WLOX: July 1: New Mississippi laws take effect today", url: "https://www.wlox.com/2026/07/01/july-1-new-mississippi-laws-take-effect-today/" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The penalty ranges and the under-13 rule are from the bill summary on PolicyRisk, a commercial bill tracker, which the Wire used because the Legislature's site and LegiScan refuse automated readers. Reports differ on the age floor: MPB says the law applies to minors 13 and older, WLOX wrote 18 and under, and the Mississippi Independent reported children as young as 10 could be transferred. The Wire followed the tracker, which matches MPB, and will correct this entry if the bill text shows otherwise. The Wire left the Legislative Black Caucus chairman unnamed because it could not check the spelling of his name in MPB's report against the Legislature's roster, which refuses automated readers. Quotes are from MPB and WLBT. The Wire did not contact the attorney general's office or Sen. Fillingane before publication.",
  },
  {
    slug: "joint-custody-is-now-the-starting-point-in-divorce",
    bill: "HB 1662",
    title: "Divorcing parents now start at a 50-50 custody split",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-04-08",
    effective: "2026-07-01",
    topics: ["Courts and families"],
    oneSentence: "In new custody cases, judges begin by presuming both parents get equal time and an equal say, and a parent who wants more must prove why.",
    whatItDoes: [
      "The law 'shifts the starting point for judges,' as the Mississippi Independent put it. In cases where the first temporary or first final custody order is entered after July 1, 2026, the court presumes that joint custody and equal parenting time are best for the child, according to the bill summary the Wire read.",
      "A parent can overcome that presumption with a preponderance of the evidence, meaning more likely than not. The law gives reasons such as a parent's absence, mental illness, substance abuse, sex offender status, prison or other serious facts. If the judge departs from 50-50, the order must explain why. If both parents agree on joint custody, the court presumes that is best.",
      "Where parents share time equally, child support is figured for each parent and the higher earner pays the difference. Courts presume it harms a child to give any custody to a parent with a history of family violence, and a parent who makes a completely unfounded violence claim pays the other side's court costs and lawyer fees.",
    ],
    whyItHappened: [
      "Supporters say the change encourages both parents to remain actively involved in their children's lives, the Mississippi Independent reported. The Independent called it one of the most significant changes to Mississippi custody law in decades.",
    ],
    whatsBehindIt: [
      "The House and Senate passed different versions. A conference committee, a small group from both chambers that works out one version, wrote a compromise that both chambers adopted on March 31 and April 1. Gov. Tate Reeves signed it April 8, according to the bill history. The Wire could not find the final vote counts in the reporting it reviewed.",
      "Critics question whether a default 50-50 framework adequately accounts for complicated family situations and whether it could create unintended consequences in difficult custody disputes, the Independent reported. The Wire's read: the family violence rules and the written-findings requirement answer part of that.",
    ],
    whatItCosts: [
      "The Wire's read: the state pays little, because the change is in what judges presume, not in any program. For parents, the money moves through child support. Under the equal-time formula the parent who earns more pays the difference between the two guideline amounts. So, by the Wire's read, a higher earner who used to pay full guideline support may pay less, and a lower earner may receive less than before, depending on each family's income.",
      "The Wire found no published estimate of the effect on lawyer fees.",
    ],
    whatChangesForYou: [
      "If your first custody order comes after July 1, 2026, expect the judge to start at equal time. If you want primary custody, gather evidence on grounds such as the ones the law names. If you already have a custody order, the equal-time presumption does not apply to later changes to that order, according to the summary.",
      "Schools and doctors must give both parents access to a child's records. A parent cannot be refused because they are not the 'custodial' parent.",
    ],
    watchFor: [
      "The Wire's read: the Mississippi Supreme Court and Court of Appeals will decide what counts as enough evidence to overcome the presumption, and the first appeals from orders entered after July 1 are the ones to watch.",
      "The Wire will update this entry when the enrolled bill text and the final vote counts can be read.",
    ],
    sources: [
      { name: "HB 1662 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB1662-2026" },
      { name: "The Mississippi Independent: These new state laws take effect on July 1", url: "https://msindy.org/p/new-state-laws-taking-effect" },
      { name: "Magnolia Tribune: From teacher pay to illegal immigration: New laws set to take effect in Mississippi", url: "https://magnoliatribune.com/2026/06/29/from-teacher-pay-to-illegal-immigration-new-laws-set-to-take-effect-in-mississippi/" },
      { name: "WLBT (via WTVA): New laws in Mississippi take effect on July 1", url: "https://www.wtva.com/2026/07/01/new-laws-mississippi-take-effect-july-1-heres-what-you-need-know/" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The section-by-section description comes from PolicyRisk, a commercial bill tracker, checked against the Mississippi Independent, Magnolia Tribune and WLBT; the Wire did not read the enrolled bill, because the Legislature's site and LegiScan refuse automated readers. The Wire did not contact any lawmaker, family lawyer or advocacy group before publication.",
  },
  {
    slug: "hospitals-can-spend-more-before-asking-the-state",
    bill: "HB 3",
    title: "Hospitals can now spend twice as much before asking the state's permission",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-02-04",
    effective: "2026-02-04",
    effectiveNote: "Took effect the day it was signed.",
    topics: ["Health care", "Business and jobs"],
    oneSentence: "Hospitals and other providers can spend twice as much on improvements before needing a state permit, and UMMC's own exemption is limited to the Jackson area.",
    whatItDoes: [
      "Mississippi makes hospitals, nursing homes and clinics get a certificate of need before building, adding services or buying big equipment. A certificate of need is a state permit that says the project is needed; the Department of Health grants or denies it, and competitors can object. The law doubles the spending thresholds that trigger the permit: for clinical improvements other than major medical equipment, from $5 million to $10 million, Mississippi Today reported. Major medical equipment now needs a permit above $3 million, according to the bill summary the Wire read.",
      "It narrows the University of Mississippi Medical Center's exemption. UMMC did not need a permit for facilities or equipment used for education; now that exemption is limited to the area around UMMC's main campus and the Jackson Medical Mall, Mississippi Today reported. If UMMC seeks to make a capital improvement or open a new facility outside the Jackson area, the Department of Health must determine that the expense fulfills a 'substantial and meaningful academic function,' SuperTalk reported from the bill text. The HB 1622 summary the Wire read puts that finding inside a defined area of Jackson instead, and lets existing facilities keep the exemption as long as they are not moved; the Wire could not settle the difference.",
      "The Department of Health must also study whether small hospitals should be exempt for dialysis units and geriatric psychiatric units.",
    ],
    whyItHappened: [
      "A similar bill reached Gov. Tate Reeves in 2025 and he vetoed it over a provision tied to a legal dispute between Texas-based Oceans Healthcare and St. Dominic Hospital, SuperTalk reported. This year's bill removed the provision that led to the veto, Mississippi Today reported.",
      "A federal court ruled in January 2026 that the state's decades-long moratorium was unconstitutional, the law firm Bradley wrote in its session recap; a moratorium is a freeze on permits for new health care facilities. The reforms came on the heels of that ruling, Bradley wrote.",
    ],
    whatsBehindIt: [
      "Rep. Sam Creekmore, the New Albany Republican who chairs the House Public Health and Human Services Committee, wrote the bill, and it passed both chambers unanimously, SuperTalk reported. State Health Officer Dr. Dan Edney told SuperTalk that having to get a permit to spend money over a threshold is, 'in my opinion, ridiculous.' The Board of Health and the health department had recommended eliminating the thresholds, he said, but 'they chose to double them, which is a good move.'",
      "The UMMC limit is about competition: the bill seeks to level the playing field between UMMC and other health care providers, Mississippi Today reported. Critics of certificate-of-need laws argue they stifle competition and fail to lower costs; advocates say they ensure communities have access to a range of services, not only the profitable ones, Mississippi Today reported. With more than half of Mississippi's rural hospitals at risk of closing, some argue the laws keep struggling hospitals from opening profitable services, the report said.",
    ],
    whatItCosts: [
      "The Wire could not find a state cost estimate, a fee schedule or an estimate of what hospitals will save. The Wire's read: a project that falls between the old threshold and the new one no longer goes through the state's review, and the time that saves is the point of the law.",
      "Whether patients pay less is the open question. Stakeholders are divided on whether the permit law lowers costs, Mississippi Today reported.",
    ],
    whatChangesForYou: [
      "The Wire's read: hospitals may renovate, add imaging and expand units faster, because fewer projects go through the permit process and the objections that come with it.",
      "If you use UMMC's clinics outside the Jackson area, a new one will need the Department of Health to find that it serves a meaningful academic function, SuperTalk reported.",
    ],
    jackson: [
      "The law draws a line around UMMC's home turf: the area around its main campus and the Jackson Medical Mall, Mississippi Today reported. The HB 1622 summary says UMMC can also plan and build clinical research units in Jackson without a permit.",
    ],
    watchFor: [
      "The Department of Health's feasibility study on exempting small hospitals' dialysis and geriatric psychiatric units. The Wire could not find a due date in its sources.",
      "HB 1622, signed March 23, 2026, goes further for rural hospitals: a Small Community Hospital Pilot that lets hospitals in counties with no town over 15,000 people add services without a permit, with an application deadline of June 30, 2027. The Wire will explain it separately.",
    ],
    sources: [
      { name: "HB 3 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB3-2026" },
      { name: "SuperTalk: Bill reforming Mississippi's CON laws heads to governor's desk with unanimous support", url: "https://www.supertalk.fm/bill-reforming-mississippis-con-laws-heads-to-governors-desk-with-unanimous-support/" },
      { name: "Mississippi Today: Governor signs bill for hospital improvements as lawmakers work to boost rural facilities (read via OurTupelo)", url: "https://ourtupelo.com/governor-signs-bill-for-hospital-improvements-as-lawmakers-work-to-boost-rural-facilities/" },
      { name: "Bradley: Mississippi 2026 Legislative Session Recap", url: "https://www.bradley.com/insights/publications/2026/05/mississippi-2026-legislative-session-recap" },
      { name: "HB 1622 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB1622-2026" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The Wire read SuperTalk's report, Bradley's recap and the bill summaries on PolicyRisk, a commercial bill tracker. Mississippi Today's report was read through its syndication copy on OurTupelo, which carries no byline or date in the copy the Wire read. The Legislature's site and LegiScan refuse automated readers, so the Wire did not read the enrolled bill. SuperTalk and the HB 1622 summary describe the UMMC academic-function finding differently, and the Wire could not settle which is right. The Wire did not contact UMMC, the Department of Health or Rep. Creekmore before publication.",
  },
  {
    slug: "casinos-take-child-support-out-of-big-wins",
    bill: "SB 2369",
    title: "Win $2,000 at a casino while owing child support, and the state takes what you owe",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-03-19",
    effective: "2026-07-01",
    effectiveNote: "The Gaming Commission and the Department of Human Services have until Jan. 1, 2027 to build the system.",
    topics: ["Courts and families", "Business and jobs"],
    oneSentence: "Casinos must check big winners against a state list of parents behind on child support and send the money they owe to the state before paying them.",
    whatItDoes: [
      "The Department of Human Services, or MDHS, will send casinos a daily list of parents who owe back child support. The check applies to a win of $2,000 or more at a slot machine or a sportsbook, Bradley and SuperTalk reported; WLOX put it at more than $2,000. The bill summary the Wire read says the rule covers winnings that require a federal tax form. If the winner is on the list, the casino withholds what is owed, sends it to MDHS within seven days and pays out whatever is left; card and table games such as poker and craps are exempt, SuperTalk reported.",
      "MDHS holds the money for 30 days. The parent can ask for a hearing in that window, but only about a mistaken identity or a wrong amount, not about the support order itself. Casinos may keep a fee of up to $35 per payment, starting with the second payment for annuities, slot jackpots paid in installments, and cannot be sued for following the list, according to the bill summary.",
    ],
    whyItHappened: [
      "About 170,000 of Mississippi's roughly 200,000 child support cases have an arrearage, meaning someone is behind, according to MDHS figures reported by WLOX. Federal data show Mississippi collected 53% of court-ordered child support in 2024, against a 65% national rate, DeSoto County News reported. Senate Gaming Chairman David Blount, a Jackson Democrat, cited state data showing 153,964 children are owed $1.7 billion in past-due support.",
      "MDHS had pushed for the policy for four years, spokesperson Mark Jones said, according to DeSoto County News. Louisiana's version intercepted an average of nearly $1 million a year in its first nine years, the National Child Support Engagement Association reported, according to the same story.",
    ],
    whatsBehindIt: [
      "Similar bills had failed in past sessions, SuperTalk reported. This time Sen. Walter Michel, a Ridgeland Republican, wrote the bill; the House passed it 92 to 22 in early March and Gov. Tate Reeves signed it March 19, according to DeSoto County News and the bill history. The Wire could not find who cast the 22 no votes or why.",
      "Michel said the bill aims mainly at slot payouts reported to the IRS, chiefly wins over $2,000, and explicitly covers slot annuities and sports bets, DeSoto County News reported. MDHS thanked the Gaming Commission, the attorney general and the gaming industry for collaborating on the bill, Jones said.",
    ],
    whatItCosts: [
      "The Wire could not find an official estimate of how much the state expects to collect; Louisiana's program averaged nearly $1 million a year, the National Child Support Engagement Association reported. The bill summary allows casinos a fee of up to $35 per payment, and the Wire could not tell from the summary whether the fee comes out of the winner's money or the state's. Someone who owes more than the jackpot gets nothing.",
      "The Wire's read: the state's cost is building the daily list and the hearing process at MDHS, both due by Jan. 1, 2027.",
    ],
    whatChangesForYou: [
      "If you owe back child support and hit a $2,000 jackpot, the casino must withhold what you owe and send it to the state. If you are owed support, the money arrives after a 30-day hold unless the other parent asks for a hearing.",
      "The Wire's read: everyday play is not affected, because the rules cover only wins large enough for a tax form, and casinos do not have to re-check the same person for 24 hours.",
    ],
    watchFor: [
      "Jan. 1, 2027: the deadline for the Gaming Commission and MDHS to have the list, the fees and the hearing process in place. The Wire's read: until then the law is on the books but the system to run it may not be fully running.",
      "The first annual numbers from MDHS on how much was intercepted.",
    ],
    sources: [
      { name: "SB 2369 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-SB2369-2026" },
      { name: "WLOX: July 1: New Mississippi laws take effect today", url: "https://www.wlox.com/2026/07/01/july-1-new-mississippi-laws-take-effect-today/" },
      { name: "DeSoto County News: Mississippi Legislature OKs law to seize gambling jackpots from parents behind on child support", url: "https://desotocountynews.com/mississippi-news/mississippi-legislature-oks-law-to-seize-gambling-jackpots-from-parents-behind-on-child-support/" },
      { name: "SuperTalk: Bill-by-bill recap of the 2026 Mississippi legislative session", url: "https://www.supertalk.fm/bill-by-bill-recap-of-the-2026-mississippi-legislative-session/" },
      { name: "Bradley: Mississippi 2026 Legislative Session Recap", url: "https://www.bradley.com/insights/publications/2026/05/mississippi-2026-legislative-session-recap" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The hold, hearing and fee details are from the bill summary on PolicyRisk, a commercial bill tracker, which the Wire used because the Legislature's site and LegiScan refuse automated readers. The caseload figure is from WLOX; the vote, the collection rates and the MDHS and Louisiana figures are from DeSoto County News, whose story carries no byline in the copy the Wire read. Sources differ on whether the threshold is $2,000 or more than $2,000. The Wire did not contact Sen. Michel, MDHS or the Gaming Commission before publication.",
  },
  {
    slug: "insurers-must-cover-cancer-biomarker-tests",
    bill: "HB 565",
    title: "Health plans must now pay for biomarker tests that guide cancer and Alzheimer's care",
    officialTitle: "Jill's Law",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-03-16",
    effective: "2026-07-01",
    effectiveNote: "Applies to each plan as it starts or renews on or after July 1, 2026.",
    topics: ["Health care"],
    oneSentence: "State-regulated health plans, Medicaid and the state employee plan must cover biomarker testing for cancer, Alzheimer's and other diseases when solid medical evidence supports it.",
    whatItDoes: [
      "A biomarker is a measurable sign in your blood, tissue or genes that shows a disease is there or which treatment is likely to work; biomarker testing matches a tumor to a drug before it is prescribed. The law requires health plans regulated by the Mississippi Insurance Department and Medicaid to cover the tests for diagnosis, treatment, management or monitoring, according to the bill summary the Wire read. The Mississippi Independent reported it also covers the State and School Employees' Health Insurance Plan. Coverage is required when the evidence supports the test, such as FDA labeling, Medicare coverage decisions or national clinical guidelines, according to the summary.",
      "Plans must post their biomarker policies online. If a plan denies a test that meets the law's evidence standards, it must give a detailed written reason, and plans must post an easy way to request exceptions or appeal. Prior authorization, a plan's advance approval of a test, must be decided within state time limits, and coverage has to be arranged to avoid repeat biopsies. Medicaid had 60 days from July 1 to add the billing codes.",
    ],
    whyItHappened: [
      "The bill is named for Jill Eure, who died at 48 in 2025 after a battle with multiple myeloma; her husband, Rep. Casey Eure, represents part of Harrison County, WLOX reported.",
      "Mississippi's cancer death rate is 23% higher than the national average, according to Centers for Disease Control and Prevention figures cited by the law firm Bradley. With this law Mississippi became the 23rd state to require the coverage, SuperTalk reported.",
    ],
    whatsBehindIt: [
      "The bill moved without a fight the Wire could find: it passed the House, passed the Senate unanimously on March 4, and Gov. Tate Reeves signed it March 16, according to WLOX and the bill history. Supporters said the change removes obstacles to an accurate diagnosis. 'Biomarker testing can help doctors detect Alzheimer's earlier and make a more accurate diagnosis,' Blair Ewing of the Alzheimer's Association Mississippi Chapter told WLOX.",
      "The Wire's read: the usual objection to coverage mandates is their cost to insurers and employers, and the Wire found no organized opposition in the reporting it reviewed. Self-insured plans, where a large employer pays claims itself instead of buying insurance, follow federal law rather than state mandates. Workers in those plans may not see the change; that is general insurance law, not something the Wire found in Mississippi reporting on this bill.",
    ],
    whatItCosts: [
      "The Wire could not find a fiscal note, the Legislature's own estimate of what a bill will cost. The Wire's read: for Medicaid and the state employee plan, the state pays for more tests, and for private plans the cost spreads across premiums. The Wire found no Mississippi estimate of the net cost either way.",
      "For a patient, the change is a covered claim instead of an out-of-pocket bill or a skipped test.",
    ],
    whatChangesForYou: [
      "If you or a family member is diagnosed with cancer after your plan renews on or after July 1, 2026, ask the oncologist about biomarker testing and expect the plan to cover it when guidelines support it. If a plan says no to a test that meets the evidence standard, it must tell you why in writing, and its appeal route must be posted.",
      "The Wire's read: a fully insured plan, one where an insurance company pays the claims, through a Mississippi employer, Medicaid or the state employee plan is covered, and a large employer's self-insured plan may not be.",
    ],
    watchFor: [
      "Plans had to post their policies within 60 days of enactment and must post changes 30 days ahead. The Insurance Department can audit compliance; watch for its first enforcement actions.",
      "The Wire's read: denials and appeals in the first renewal cycle will show whether the evidence standard is read broadly or narrowly.",
    ],
    sources: [
      { name: "HB 565 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB565-2026" },
      { name: "WLOX: July 1: New Mississippi laws take effect today", url: "https://www.wlox.com/2026/07/01/july-1-new-mississippi-laws-take-effect-today/" },
      { name: "WLOX: Mississippi Senate passes 'Jill's Law,' requiring insurance coverage for biomarker testing (March 5, 2026)", url: "https://www.wlox.com/2026/03/05/mississippi-senate-passes-jills-law-requiring-insurance-coverage-biomarker-testing/" },
      { name: "The Mississippi Independent: These new state laws take effect on July 1", url: "https://msindy.org/p/new-state-laws-taking-effect" },
      { name: "SuperTalk: Bill-by-bill recap of the 2026 Mississippi legislative session", url: "https://www.supertalk.fm/bill-by-bill-recap-of-the-2026-mississippi-legislative-session/" },
      { name: "Bradley: Mississippi 2026 Legislative Session Recap", url: "https://www.bradley.com/insights/publications/2026/05/mississippi-2026-legislative-session-recap" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "Coverage rules, deadlines and the signing date are from the bill summary and history on PolicyRisk, a commercial bill tracker, which the Wire used because the Legislature's site and LegiScan refuse automated readers. The tracker's page lists no sponsor, and the Wire could not confirm who sponsored the bill. Background on Jill Eure and the bill's purpose is from WLOX. The Wire did not contact Rep. Eure, the Insurance Department or any insurer before publication.",
  },
  {
    slug: "new-state-hires-can-retire-after-30-years-again",
    bill: "HB 4073",
    title: "New state workers can retire after 30 years again, and retirees can come back sooner",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-04-08",
    effective: "2026-07-01",
    topics: ["Business and jobs", "Taxes and budget"],
    oneSentence: "The law softens last year's pension cuts for new hires, lets retirees return to state jobs after 30 days at 80% pay, and creates a state-run retirement account.",
    whatItDoes: [
      "PERS, the Public Employees' Retirement System, is the pension plan for state employees such as teachers and first responders, WDAM reported. In 2025 the Legislature created Tier 5 for anyone hired after March 1, 2026, requiring 35 years of service for full benefits and making the plan a hybrid defined contribution plan instead of a defined benefit plan, Mississippi Today reported. A defined benefit plan promises a set monthly check; a defined contribution plan builds an account. This law cuts the service requirement back to 30 years and bases benefits on an employee's highest four years of pay instead of eight, Mississippi Today reported.",
      "Retirees can return to a state job after a 30-day break instead of 90, earning up to 80% of the job's salary with no new benefits and no annual raises, through July 1, 2036. Elected officials, school superintendents and college administrators are excluded, according to the bill summary the Wire read. Retired teachers get their own path: back after 30 days, for up to five years, paid at up to 125% of the state salary schedule, with no more than half going to the teacher and the rest to PERS.",
      "It also creates Mississippi Work and Save, a voluntary retirement account run by the state treasurer. Employers may offer it and enroll workers automatically, workers can opt out, and the self-employed can join; money comes out of paychecks into a Roth IRA, a retirement account funded with after-tax dollars. Contributions start by Aug. 1, 2028, and fees are capped at 0.75% a year after a three-year start-up period, according to the summary.",
    ],
    whyItHappened: [
      "PERS has about $26 billion in unfunded liabilities, the gap between what it has promised retirees and what it holds, Mississippi Today reported. Last year's cuts were meant to stop the gap from growing, but opponents said they would make hiring and keeping state employees such as teachers and first responders harder, Mississippi Today reported. First responders asked for 25 years and got 30, WDAM reported.",
      "Sen. Joey Fillingane, a Republican, pointed to the teacher shortage, WDAM reported. 'If they're still willing to sit out for 30 days and come back making 80% of what they were formerly making and still be of service in their field, then we think that's a huge win,' he said.",
    ],
    whatsBehindIt: [
      "Rep. Jody Steverson, a Republican, sponsored the bill. The House and Senate adopted a conference committee's compromise on March 29, nearly unanimously, Mississippi Today reported; a conference committee is a small group from both chambers that works out one version of a bill. Gov. Tate Reeves signed it April 8.",
      "The Wire's read: what did not pass matters as much. The Senate's plan to put $1 billion into PERS over a decade died, as did the House's idea to tie a $600 million transfer to legalizing mobile sports betting, Mississippi Today reported. The Wire's read: the $26 billion gap is unchanged, and the Wire found no new money toward it in this law.",
    ],
    whatItCosts: [
      "The Wire could not find the pension system's cost estimate for the Tier 5 changes, and found no new money toward the $26 billion gap in the reporting it read. The Wire's read: shorter careers and a four-year pay average mean higher benefits per retiree than last year's plan, which the system must fund.",
      "For a new teacher or officer hired after March 1, 2026, the change is worth five years of working life. For a retiree who comes back, 80% of a $50,000 job is $40,000 on top of a pension.",
    ],
    whatChangesForYou: [
      "Hired into a PERS job after March 1, 2026: you are in Tier 5, and you can now retire with full benefits after 30 years.",
      "Already retired: you can take a state job 30 days after you leave, at up to 80% of its pay, and keep your pension. If your employer offers Work and Save, or you are self-employed: watch for sign-ups by 2028.",
    ],
    watchFor: [
      "The PERS board can set a later date than 30 days for returns; watch its rules. Work and Save must be running by Aug. 1, 2028.",
      "Sen. Joey Fillingane said leaders are still discussing a plan moving forward, WDAM reported; the Wire found no date.",
    ],
    sources: [
      { name: "HB 4073 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB4073-2026" },
      { name: "Mississippi Today: What lived and died in the 2026 Mississippi legislative session (via DeSoto County News)", url: "https://desotocountynews.com/mississippi-news/what-lived-and-died-in-the-2026-mississippi-legislative-session/" },
      { name: "WDAM (via WLBT): Mississippi lawmakers reach compromise on changes to PERS Tier 5 plan", url: "https://www.wlbt.com/2026/03/31/mississippi-lawmakers-reach-compromise-changes-pers-tier-5-plan/" },
      { name: "Magnolia Tribune: From teacher pay to illegal immigration: New laws set to take effect in Mississippi", url: "https://magnoliatribune.com/2026/06/29/from-teacher-pay-to-illegal-immigration-new-laws-set-to-take-effect-in-mississippi/" },
      { name: "Bradley: Mississippi 2026 Legislative Session Recap", url: "https://www.bradley.com/insights/publications/2026/05/mississippi-2026-legislative-session-recap" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The return-to-work rules, the Work and Save program and the signing date are from the bill summary and history on PolicyRisk, a commercial bill tracker, which the Wire used because the Legislature's site and LegiScan refuse automated readers. That tracker's summary describes the Tier 5 pay average as the highest eight years; Mississippi Today, Bradley and Magnolia Tribune all report the law changed it to four, and the Wire went with the news reports. The Wire did not contact PERS, Rep. Steverson or Sen. Fillingane before publication.",
  },
  {
    slug: "teachers-get-a-2000-raise-and-a-new-attendance-law",
    bill: "SB 2103",
    title: "Teachers get a $2,000 raise, and schools get a new attendance law",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-04-08",
    effective: "2026-07-01",
    topics: ["Schools", "Taxes and budget"],
    oneSentence: "Every public school teacher's minimum salary rises by $2,000 this school year, special education teachers get $4,000, and the same law rewrites the rules on absences.",
    whatItDoes: [
      "The minimum salary schedule is the floor the state pays teachers by license and years of experience. It rises for the 2026-27 school year, and the raise is $2,000 for teachers and assistant teachers, Mississippi First reported. Special education teachers get an extra $2,000 supplement, for $4,000; school psychologists and occupational therapists get $2,000 and school resource officers $5,000, WLOX reported, and career-tech instructors get $2,000, Magnolia Tribune reported. The money is in a separate bill, HB 1935, the Department of Education's budget, which Gov. Tate Reeves also signed April 8.",
      "The law also raises the base amount the state sends districts per student to $7,201.77 from $6,845, Magnolia Tribune reported, and sets assistant teachers' minimum pay at $19,000.",
      "Attendance rules change too. A student counts as present for the day at 66% of the school day, according to the bill summary; Magnolia Tribune reported the figure as 60%. Missing 10% of school days makes a child chronically absent, schools must contact families after three absences, and eight unlawful absences build a legal case against the parent. Students at school-sanctioned activities are not counted absent.",
    ],
    whyItHappened: [
      "Mississippi's average teacher salary will be $55,704 after the raise, still last in the country, according to National Education Association figures reported by WLOX. The House wanted $5,000; the Senate offered $2,000, then $6,000 spread over three years; the chambers landed on $2,000, Mississippi Today reported.",
      "After the haggling over school choice subsided, lawmakers in both chambers shifted their focus to a teacher pay raise, Mississippi Today reported.",
    ],
    whatsBehindIt: [
      "Sen. Angela Burks Hill, a Republican, sponsored the policy bill, and Rep. Karl Oliver, a Republican, is listed as the sponsor of the budget bill. Both went to conference committees, small groups from both chambers that settle one version of a bill. HB 1935's compromise was adopted March 29 and 30, SB 2103's on April 1, and both bills were signed April 8, according to the bill histories.",
      "The Mississippi Association of Educators said the raise is appreciated and every bit helps, but is somewhat canceled out by rising insurance costs and the cost of living, WMC reported.",
    ],
    whatItCosts: [
      "The Wire could not find the Legislature's cost figure for the raise. The education budget bill sets $2.81 billion for the student funding formula for the year that began July 1, 2026, according to the bill summary the Wire read. The Wire could not tell from the summary how much of that is the raise. For a teacher, $2,000 a year is about $167 a month before taxes.",
    ],
    whatChangesForYou: [
      "Teachers and the listed staff see the raise in paychecks for the 2026-27 school year. Parents see new absence rules: after three absences the school must contact you, five excused absences per semester is the limit without the superintendent's approval, and after the third illness absence the school needs a doctor's note.",
      "Retired teachers who came back under the old return-to-work law lose that option after July 2, 2026; the new path runs through the PERS law, HB 4073. PERS is the state retirement system.",
    ],
    watchFor: [
      "Nov. 1, 2026: the deadline for districts' written policies on excuse documents and family outreach; the state's model policy was due Aug. 15. Districts must publish chronic absenteeism data every year; watch for the first reports.",
      "The 2027 session. The House's $5,000 bill, HB 1126, died this year, Mississippi First reported, and the Wire found no statement about next year's plans.",
    ],
    sources: [
      { name: "SB 2103 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-SB2103-2026" },
      { name: "HB 1935 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB1935-2026" },
      { name: "HB 4073 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB4073-2026" },
      { name: "Mississippi First: As New Education Laws Take Effect, A Look Back at the 2026 Legislative Session", url: "https://www.mississippifirst.org/2026-legislative-session-review/" },
      { name: "WLOX: July 1: New Mississippi laws take effect today", url: "https://www.wlox.com/2026/07/01/july-1-new-mississippi-laws-take-effect-today/" },
      { name: "WLBT (via WTVA): New laws in Mississippi take effect on July 1", url: "https://www.wtva.com/2026/07/01/new-laws-mississippi-take-effect-july-1-heres-what-you-need-know/" },
      { name: "Magnolia Tribune: From teacher pay to illegal immigration: New laws set to take effect in Mississippi", url: "https://magnoliatribune.com/2026/06/29/from-teacher-pay-to-illegal-immigration-new-laws-set-to-take-effect-in-mississippi/" },
      { name: "Mississippi Today: What lived and died in the 2026 Mississippi legislative session (via DeSoto County News)", url: "https://desotocountynews.com/mississippi-news/what-lived-and-died-in-the-2026-mississippi-legislative-session/" },
      { name: "WMC (via WLOX): New law gives Mississippi teachers a pay raise", url: "https://www.wlox.com/2026/07/02/new-law-gives-mississippi-teachers-pay-raise/" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The salary schedule, attendance rules and signing dates are from the bill summaries and histories on PolicyRisk, a commercial bill tracker, which the Wire used because the Legislature's site and LegiScan refuse automated readers. The tracker's HB 1935 page lists Karl Oliver in its header and William Tracy Arnold below it, and the Wire could not confirm which is the sponsor. The tracker says a student counts present at 66% of the day; Magnolia Tribune reported 60%. The Wire did not contact Sen. Hill, Rep. Oliver, the Department of Education or the Mississippi Association of Educators before publication.",
  },
  {
    slug: "absentee-ballots-go-straight-into-the-machine",
    bill: "HB 859",
    title: "Vote absentee in person, and your ballot now goes straight into the counting machine",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-03-19",
    effective: "2026-07-01",
    topics: ["Elections"],
    oneSentence: "In-person absentee voters now feed their ballot into a scanner instead of sealing it in an envelope, so it is counted at 7 p.m. on election night.",
    whatItDoes: [
      "Before this law, an in-person absentee voter filled out a ballot at the circuit clerk's office, sealed it in an envelope, and the envelope sat until after the polls closed on election night. Now the clerk prints your ballot, you mark it and you feed it into the same kind of scanner used at the polls, according to the bill summary the Wire read. You still show voter ID and sign the voter's certificate.",
      "In-person absentee voting starts up to 45 days before an election and ends at noon the Saturday before a Tuesday election. A signature mismatch is not a reason to reject an in-person absentee ballot. Clerks must seal the scanners every night, keep a seal log and print a daily count that anyone can request.",
      "Mailed absentee ballots still arrive in envelopes, stay locked at the registrar's office and are counted when the polls close. Ballots that scanners reject go to a trained resolution board of at least three people, which can make a duplicate the scanner will read. Every county must record each absentee application and ballot in the Statewide Election Management System.",
    ],
    whyItHappened: [
      "'We got rid of the envelope this year,' Sen. Jeremy England, a Vancleave Republican, told SuperTalk. 'At 7 p.m. on Election Day, those votes are going to be tallied just like everybody else's.' Under the old system, absentee ballots were not counted until after the polls closed, which often led to long waits for results, particularly in rural areas, SuperTalk reported.",
      "Supporters said feeding the ballot into a machine reduces the risk of a ballot being disqualified, WLOX reported. England told SuperTalk the bill stemmed from growing distrust of elections, and SuperTalk cited a University of California San Diego survey in which 40% of respondents nationwide doubted votes would be counted accurately in 2026.",
    ],
    whatsBehindIt: [
      "Rep. Noah Sanford, a Republican, sponsored the bill. It passed with a single dissenting vote, SuperTalk reported, and Gov. Tate Reeves signed it March 19, according to the bill history. It was one of eight election bills enacted in 2026, Ballotpedia reported.",
      "A companion law, HB 858, bars any ballot scanner that can make a wireless connection from being used in an election, Ballotpedia reported.",
    ],
    whatItCosts: [
      "Counties and cities may buy or rent scanners that meet state standards, and county supervisors pay for the seals, according to the bill summary. The Wire could not find a statewide cost estimate or a figure for Hinds County.",
    ],
    whatChangesForYou: [
      "If you vote absentee in person for the Nov. 3 election, the window runs Sept. 21 through noon on Saturday, Oct. 31, SuperTalk reported. Bring your ID, fill out the application, sign the certificate, mark the printed ballot and feed it into the scanner yourself.",
      "Once you cast an absentee ballot, by mail or in person, it is final; you cannot also vote at your precinct.",
    ],
    jackson: [
      "For most Jackson voters the change applies at the Hinds County circuit clerk's office. The Wire could not find how many in-person absentee ballots Hinds County expects.",
    ],
    watchFor: [
      "Election night, Nov. 3: whether Hinds County and the state report results faster than in past years.",
      "The daily in-person absentee counts that clerks must now print.",
    ],
    sources: [
      { name: "HB 859 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB859-2026" },
      { name: "SuperTalk: In-person absentee voting will look different in Mississippi ahead of midterms", url: "https://www.supertalk.fm/in-person-absentee-voting-will-look-different-in-mississippi-ahead-of-midterms/" },
      { name: "Ballotpedia: Mississippi legislators enact citizenship checks for voter list maintenance, seven other election-related bills (April 20, 2026)", url: "https://news.ballotpedia.org/2026/04/20/mississippi-legislators-enact-citizenship-checks-for-voter-list-maintenance-seven-other-election-related-bills/" },
      { name: "WLOX: July 1: New Mississippi laws take effect today", url: "https://www.wlox.com/2026/07/01/july-1-new-mississippi-laws-take-effect-today/" },
      { name: "Magnolia Tribune: From teacher pay to illegal immigration: New laws set to take effect in Mississippi", url: "https://magnoliatribune.com/2026/06/29/from-teacher-pay-to-illegal-immigration-new-laws-set-to-take-effect-in-mississippi/" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The procedures, deadlines and signing date are from the bill summary and history on PolicyRisk, a commercial bill tracker, which the Wire used because the Legislature's site and LegiScan refuse automated readers. Quotes, Sen. England's hometown and the voting window are from SuperTalk. The Wire did not contact the Hinds County circuit clerk, Rep. Sanford or the secretary of state's office before publication.",
  },
  {
    slug: "illegal-entry-state-crime-jails-ice",
    bill: "SB 2114",
    title: "Mississippi makes illegal entry a state crime and orders county jails to work with ICE",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-04-08",
    effective: "2026-07-01",
    effectiveNote: "The law repeals itself on July 1, 2028 unless lawmakers renew it.",
    topics: ["Public safety", "Local government"],
    oneSentence: "Entering Mississippi illegally is now a state crime with at least six months in prison, and county jails had to seek ICE agreements by Oct. 1.",
    whatItDoes: [
      "A person in the country illegally who is caught entering Mississippi from another country outside a lawful port of entry commits a misdemeanor, a lower-level crime. The minimum sentence is six months in prison, according to the bill summary the Wire read. The law also adds prison time for people in the country illegally who are convicted of other state crimes with a possible sentence of 12 months or more. The summary puts the add-on at two years or more for a nonviolent crime and three to five years for a violent or sex crime; Magnolia Tribune reported the violent-crime add-on as at least five years.",
      "Every county that runs a jail had to make a reasonable attempt to sign a 287(g) agreement with U.S. Immigration and Customs Enforcement, or ICE, by Oct. 1, 2026. A 287(g) agreement lets local officers perform some immigration enforcement under ICE supervision. Counties that have not signed must report to the Department of Public Safety every three months on why, and the attorney general can sue to force compliance.",
      "The Department of Public Safety must assign agents to immigration enforcement and seek its own 287(g) agreement within 120 days of July 1. Two companion laws passed the same day, according to the bill histories. HB 538 requires every state and local agency and public college to honor ICE detainers, requests to hold a person for immigration agents, and voids any sanctuary policy, a local rule that limits cooperation with immigration agents. SB 2322 makes out-of-state driver's licenses issued without proof of lawful presence invalid in Mississippi.",
    ],
    whyItHappened: [
      "Sen. Angela Burks Hill, a Republican who sponsored two of the three bills, said lawmakers were 'putting some teeth' in immigration laws, Magnolia Tribune reported. The Tribune wrote that when the ICE cooperation bill was introduced in mid-February, fewer than ten Mississippi localities had 287(g) agreements, and that by the time it wrote there were nearly 30.",
      "HB 538 extends Mississippi's existing ban on sanctuary policies to law enforcement agencies, the Tribune reported.",
    ],
    whatsBehindIt: [
      "Hill and Sen. Joseph Seymour sponsored SB 2114; Rep. Lee Yancey, a Republican, sponsored HB 538. All three bills went through conference committees, small groups from both chambers that settle one version, and Gov. Tate Reeves signed them April 8, according to the bill histories. Democrats, by and large, opposed each bill, and several Republicans questioned the reason and intent of some measures, the Tribune reported.",
      "Senate Minority Leader Derrick Simmons, a Democrat, said the state would do better to fund schools and health care. Sen. David Blount, a Democrat, called the license bill 'a bad bill on so many fronts.' The ACLU of Mississippi argued the original bill set no probable cause standard for an arrest and would lead to profiling of citizens. Its policy and advocacy manager, Lydia Grizzell, told the Tribune she could not confirm or deny whether the group would sue.",
    ],
    whatItCosts: [
      "The Wire could not find a fiscal note, the Legislature's own estimate of what a bill will cost, for any of the three bills. Democrats argued the plan leaves counties on the hook for jailing people held for immigration violations, Mississippi Today reported. The Wire could not find a published price for the DPS agents.",
      "The Wire's read: for an immigrant family, the cost is risk: a traffic stop that becomes an ICE referral, as the ACLU put it, and a license that may no longer be valid here.",
    ],
    whatChangesForYou: [
      "The Wire's read: if you are a citizen, little changes on the surface, though the ACLU argues profiling will reach citizens too. If you drive on an out-of-state license issued without proof of lawful presence, it is no longer valid here, and officers must cite you and refer you to ICE.",
      "If you work for a city, a county, a public college or the state, your agency must cooperate with ICE requests, and the attorney general can take it to court if it does not. Asylum, protection for people fleeing danger, and DACA approvals dated 2012 through 2021, a federal program for some people brought here as children, are defenses to the entry charge, according to the summary.",
    ],
    jackson: [
      "The law covers every county that runs a jail, so the Oct. 1 deadline applied in Hinds County; the Wire could not find whether the county sought an agreement or filed the required report. Jackson's police, Hinds County government and Jackson State University, a public university, all fall under HB 538's cooperation rules.",
    ],
    watchFor: [
      "The quarterly reports counties owe DPS, which will show who signed with ICE and who did not. DPS's own 287(g) agreement is due within 120 days of July 1, which falls at the end of October.",
      "A lawsuit: when the Tribune reported, the ACLU said it could not confirm or deny one, and the Wire did not search for later filings. And July 1, 2028, when SB 2114 repeals itself unless the Legislature renews it.",
    ],
    sources: [
      { name: "SB 2114 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-SB2114-2026" },
      { name: "HB 538 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-HB538-2026" },
      { name: "SB 2322 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-SB2322-2026" },
      { name: "Magnolia Tribune: New Mississippi laws aimed at curbing illegal immigration could face challenges from ACLU (via the Star-Herald)", url: "https://www.starherald.net/new-mississippi-laws-aimed-curbing-illegal-immigration-could-face-challenges-aclu-69e03b22eb06b" },
      { name: "Mississippi Today: What lived and died in the 2026 Mississippi legislative session (via DeSoto County News)", url: "https://desotocountynews.com/mississippi-news/what-lived-and-died-in-the-2026-mississippi-legislative-session/" },
      { name: "ACLU of Mississippi: SB 2114: Illegal immigration; criminalize under state law", url: "https://www.aclu-ms.org/?p=5684" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The penalties, deadlines and sunset date are from the bill summaries and histories on PolicyRisk, a commercial bill tracker, which the Wire used because the Legislature's site and LegiScan refuse automated readers. Quotes are from Magnolia Tribune's report as published by the Star-Herald, which carries no date in the copy the Wire read. The ACLU of Mississippi's page on SB 2114 is an early-session update that calls the entry offense a felony and describes the bill before the conference committee. The tracker and the Tribune call it a misdemeanor, and the Wire has not read the enrolled text. The Wire did not contact the Hinds County Sheriff's Office, DPS, the sponsors or the ACLU before publication.",
  },
  {
    slug: "100-million-for-a-cancer-center-in-jackson",
    bill: "SB 2917",
    title: "The state is putting $100 million into a new cancer center in Jackson",
    session: "2026 Regular Session",
    becameLaw: "signed",
    signedOn: "2026-04-13",
    effective: "2026-04-13",
    effectiveNote: "The transfer takes effect with the law; the tracker's summary says the money can be spent once the Legislature appropriates it.",
    topics: ["Health care", "Taxes and budget", "Local government"],
    oneSentence: "A budget-transfer law sets aside $100 million for UMMC's planned cancer center on State Street, plus $253 million for lawmakers' local projects and $150 million for highways.",
    whatItDoes: [
      "The law creates a Cancer Center Fund and moves $100 million into it to help the University of Mississippi Medical Center build and equip a Cancer Center and Research Institute, according to the bill summary the Wire read. The summary says Finance and Administration can spend the money only after the Legislature appropriates it, meaning passes a bill releasing it, and that interest goes to the general fund, the state's main account. UMMC, Mississippi Today and SuperTalk all describe the $100 million as an appropriation already made; the Wire could not resolve that difference from its sources.",
      "The same bill moves money into more than a dozen other funds. The Wire's read: the biggest, a 2026 Local Improvements Projects Fund that gets $233 million now and $20 million on July 1, matches the $253 million 'Christmas tree' bill of lawmakers' district projects that Mississippi Today described. Transportation gets $150 million for capacity projects.",
      "Universities get $75.1 million for buildings and community colleges $40 million. Southern Miss gets $30 million for a science research building and Mississippi State $32 million for its veterinary school. Vicksburg National Military Park's visitor center gets $30 million, industrial site grants $43.5 million, and the Outdoor Stewardship Trust Fund $15 million.",
    ],
    whyItHappened: [
      "Mississippi's cancer death rate is 23% higher than the national average, Mississippi Today reported. Dr. LouAnn Woodward, UMMC's vice chancellor for health affairs, calls it the highest cancer mortality in the nation. About 16,000 Mississippians are diagnosed each year and roughly 6,500 die, SuperTalk reported. There are 73 National Cancer Institute-designated centers in the country and none in Mississippi, Louisiana or Arkansas; patients who want one travel to Alabama, Tennessee or Texas, Mississippi Today reported.",
      "UMMC is the only institution in Mississippi able to earn the designation, Woodward told the Senate Appropriations Committee in January, Mississippi Today reported. 'It's either us, or it doesn't happen,' she said. UMMC says a new building is the key to earning it, and the designation brings federal support and access to early clinical trials.",
    ],
    whatsBehindIt: [
      "By March 30 UMMC's campaign had raised $100 million of its $125 million goal, SuperTalk reported. The gifts included $25 million from Sandy and John Black, $10 million each from the Gertrude C. Ford Foundation and the Bower Foundation, and $5 million from C Spire. 'UMMC didn't just show up with their hand out,' Sen. Daniel Sparks, a Belmont Republican, told SuperTalk, 'so if you want to talk about skin in the game, they have it.'",
      "The House and Senate settled the bill in a conference committee, a small group from both chambers that works out one version; both chambers adopted its report April 2. Gov. Tate Reeves signed the bill April 13, according to the bill history. Senate Appropriations Chairman Briggs Hopson of Vicksburg and Finance Chairman Josh Harkins of Flowood had previously confirmed 'significant' funding, SuperTalk reported.",
    ],
    whatItCosts: [
      "The $100 million comes from the state's capital expenditure funds, SuperTalk reported; those are state accounts for one-time projects such as buildings. The whole building is estimated at $250 million, Mississippi Today reported. UMMC's campaign has raised $100 million toward $125 million, the state is adding $100 million, and the federal government gave $8.5 million for site preparation; by the Wire's arithmetic that is $208.5 million so far. The state also kept the center's annual operating appropriation at $9 million, a level set in 2024, Mississippi Today reported.",
      "As of the April reports the Wire read, the money was set aside but not yet spent. UMMC still has to earn the designation, which Dr. Rod Rocconi, the cancer center's director, told Mississippi Today could take up to a decade.",
    ],
    whatChangesForYou: [
      "The Wire found nothing that changes care at UMMC's existing clinics this year. UMMC planned to break ground later in 2026, Mississippi Today reported. Once open, UMMC says patients will get advanced therapies and clinical trials in Jackson instead of out of state.",
      "If your town or county was in the local projects list, that money is in the same law. The Wire has not yet read the list.",
    ],
    jackson: [
      "A five-story building of more than 250,000 square feet will sit on State Street across from the medical center, SuperTalk and Mississippi Today reported.",
    ],
    watchFor: [
      "The groundbreaking, which UMMC said would come later in 2026 with site work funded by the federal $8.5 million. The Wire has not confirmed a date.",
      "The project list for the $253 million local improvements fund, and whether any Jackson or Hinds County projects are in it. Recipients must report quarterly, and Finance and Administration must report twice a year.",
    ],
    sources: [
      { name: "SB 2917 summary and history (PolicyRisk bill tracker)", url: "https://policyrisk.com/state-bill/MS-SB2917-2026" },
      { name: "Mississippi Today: Reeves approves $100M for new UMMC cancer center (via DeSoto County News)", url: "https://desotocountynews.com/mississippi-news/reeves-approves-100m-for-new-ummc-cancer-center/" },
      { name: "SuperTalk: Mississippi lawmakers approve $100 million for new UMMC cancer center", url: "https://www.supertalk.fm/mississippi-lawmakers-approve-100-million-for-new-ummc-cancer-center/" },
      { name: "SuperTalk: Legislation directing $100 million to new UMMC cancer center signed into law", url: "https://www.supertalk.fm/legislation-directing-100-million-for-new-ummc-cancer-center-signed-into-law/" },
      { name: "UMMC Vice Chancellor's notes, April 17, 2026", url: "https://umc.edu/news/VCNotes/2026/04/17.html" },
      { name: "Mississippi Today: What lived and died in the 2026 Mississippi legislative session (via DeSoto County News)", url: "https://desotocountynews.com/mississippi-news/what-lived-and-died-in-the-2026-mississippi-legislative-session/" },
    ],
    author: "Jackson Wire Staff",
    date: "2026-10-09",
    note: "The fund list and the signing date are from the bill summary and history on PolicyRisk, a commercial bill tracker, which the Wire used because the Legislature's site and LegiScan refuse automated readers; the Wire has not read the enrolled bill or the local projects list. The tracker gives no effective date for the transfer, so the Wire used the signing date. The tracker says the fund can be spent only after a further appropriation, while UMMC, Mississippi Today and SuperTalk call the $100 million an appropriation, and the Wire could not resolve that. Mississippi Today's reports were read through DeSoto County News. Mississippi Today discloses that it receives funding from the Bower Foundation, one of the donors named here. The Wire did not contact UMMC or any lawmaker before publication.",
  },
];

function isPublished(l: Law): boolean {
  return l.date <= todayLocalIso();
}

// True when the slug belongs to a law entry that exists but is future-dated.
// The law page uses it to cap how long its not-found render is cached (see
// lib/not-found-cap.ts); an unknown slug returns false.
export function isScheduledLawSlug(slug: string): boolean {
  const law = LAWS.find((l) => l.slug === slug);
  return law !== undefined && !isPublished(law);
}

const memo = new WeakMap<Law, Law>();
function smartenLaw(law: Law): Law {
  const hit = memo.get(law);
  if (hit) return hit;
  const paras = (ps?: string[]) => ps?.map(smarten);
  const out: Law = {
    ...law,
    title: smarten(law.title),
    ...(law.officialTitle ? { officialTitle: smarten(law.officialTitle) } : {}),
    oneSentence: smarten(law.oneSentence),
    whatItDoes: law.whatItDoes.map(smarten),
    whyItHappened: law.whyItHappened.map(smarten),
    whatsBehindIt: law.whatsBehindIt.map(smarten),
    whatItCosts: law.whatItCosts.map(smarten),
    whatChangesForYou: law.whatChangesForYou.map(smarten),
    watchFor: law.watchFor.map(smarten),
  };
  if (law.jackson) out.jackson = paras(law.jackson);
  if (law.note) out.note = smarten(law.note);
  if (law.effectiveNote) out.effectiveNote = smarten(law.effectiveNote);
  memo.set(law, out);
  return out;
}

// Published laws, the most recently effective first; ties go to the most
// recently published entry.
export const getAllLaws = cache((): Law[] =>
  LAWS.filter(isPublished)
    .sort((a, b) => b.effective.localeCompare(a.effective) || b.date.localeCompare(a.date))
    .map(smartenLaw),
);

export const getLawBySlug = cache((slug: string): Law | undefined => {
  const law = LAWS.find((l) => l.slug === slug);
  return law && isPublished(law) ? smartenLaw(law) : undefined;
});

export function getRelatedLaws(law: Law, limit = 3): Law[] {
  const all = getAllLaws().filter((l) => l.slug !== law.slug);
  const shared = all.filter((l) => l.topics.some((t) => law.topics.includes(t)));
  return shared.concat(all.filter((l) => !shared.includes(l))).slice(0, limit);
}

// Newest entries by publication date, for the front-page rail.
export function getLatestLaws(limit = 3): Law[] {
  return [...getAllLaws()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export function isInEffect(law: Law): boolean {
  return law.effective <= todayLocalIso();
}

// The Legislature's own bill history page. The site refuses automated
// readers, so this pattern (four-digit bill numbers, e.g. HB0003.xml) is
// unverified from here; confirm one live URL by hand if it ever 404s.
export function billHistoryUrl(law: Law): string {
  const m = law.bill.match(/^(HB|SB|HC|SC)\s*(\d+)$/i);
  const year = law.session.match(/\d{4}/)?.[0] ?? "2026";
  if (!m) return `https://billstatus.ls.state.ms.us/${year}/pdf/all_measures/allmsrs.xml`;
  const prefix = m[1].toUpperCase();
  return `https://billstatus.ls.state.ms.us/${year}/pdf/history/${prefix}/${prefix}${m[2].padStart(4, "0")}.xml`;
}

export function becameLawLabel(law: Law): string {
  switch (law.becameLaw) {
    case "without signature":
      return "Became law without the governor's signature";
    case "veto overridden":
      return "Became law after the Legislature overrode a veto";
    default:
      return "Signed by the governor";
  }
}
