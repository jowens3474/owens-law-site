import { cache } from "react";

export interface TimelineEntry {
  date: string;
  text: string;
  highlight?: boolean; // jury/venue development; rendered with a crimson accent
}

export interface TimelineSection {
  heading: string;
  entries: TimelineEntry[];
}

export interface Post {
  slug: string;
  title: string;
  dek: string;
  category: string; // primary section; shown as the article's tag
  categories?: string[]; // optional extra sections to cross-file the story under
  author: string;
  date: string; // ISO yyyy-mm-dd
  views: number;
  featured?: boolean;
  image?: string; // path under /public, e.g. "/aaron-banks.webp"
  imageAlt?: string; // describes the image for screen readers
  body: string[];
  tags?: string[]; // optional topic tags used by hub pages (e.g. ["corruption-case"])
  timeline?: TimelineSection[]; // optional grouped dated entries, rendered after the body
  note?: string; // optional muted source/editor's note shown at the end
}

// All articles live here. To publish a new story, add an object to this array.
// The newest date appears first automatically. Mark one with `featured: true`
// to make it the big lead story on the homepage.
//
// SCHEDULING: An article's `date` controls when it goes live. Set `date` to a
// future YYYY-MM-DD and the article stays hidden from the site, sitemap, RSS,
// llms.txt, and search until that day arrives (compared in Central time).
// Batch-write 3–4 pieces on one day and stagger their dates across the week
// to drip-publish — no manual rebuild needed (pages revalidate every 10 min).
//
// Template:
// {
//   slug: "url-friendly-headline",            // becomes /article/url-friendly-headline
//   title: "Headline As It Appears",
//   dek: "One-sentence summary shown under the headline.",
//   category: "General News",                 // must match a section name exactly:
//                                             // "General News" | "Commercial Real Estate"
//                                             // | "Residential Real Estate" | "Politics"
//   author: "Byline Name",
//   date: "2026-05-25",                       // format: YYYY-MM-DD
//   views: 0,                                 // used only for "Most Read" ranking
//   featured: true,                           // optional; set on the lead story only
//   image: "/photo.webp",                     // optional; file lives in /public.
//                                             // Omit to fall back to a generated plate.
//   imageAlt: "Describe the photo.",          // optional; for screen readers
//   body: [
//     "First paragraph.",
//     "Second paragraph.",
//   ],
// },
const POSTS: Post[] = [
  {
    slug: "morning-brief-2026-06-20",
    title: "Morning Brief: Jun 20 — Smith Appeal Clouds July 14 Vote; City Centre Sale Collapses",
    dek: "Hinds Supervisor Tony Smith has taken his fight to the Mississippi Supreme Court, throwing the scheduled July 14 do-over election into doubt.",
    category: "General News",
    tags: ["morning-brief"],
    author: "Jackson Wire Staff",
    date: "2026-06-20",
    views: 0,
    body: [
      "Smith appeal clouds July 14 election: Hinds County Supervisor Anthony \"Tony\" Smith filed a notice of appeal to the Mississippi Supreme Court on June 15, challenging Special Judge Barry Ford's order for a do-over election in District 2, WJTV reported. The move casts doubt on whether the July 14 special election, a rematch with former Supervisor David Archie, proceeds on schedule. Ford ruled June 3 that mishandled ballots and a broken chain of custody made the 2023 Democratic primary unverifiable, saying \"I cannot determine the will of the voters,\" per Mississippi Today. Smith stays in office pending the outcome and told Mississippi Today a \"big announcement\" would come within days. The seat stretches through western Hinds, Edwards, Bolton and parts of Clinton, Raymond and Jackson.",
      "City Centre office sale collapses: The planned sale of City Centre, the two-tower office complex at 200 S. Lamar Street, has fallen through, the Clarion Ledger reported. Listed at $7.25 million, the 266,922-square-foot property went under contract in February, but three months later it remains unsold with no buyer in sight, broker Isabel Eiler confirmed. Owner Hertz Investment Group, which paid $6.2 million in 2015, has steadily shed downtown holdings including The Pinnacle and Regions Plaza. The Mississippi Department of Human Services anchors the complex, occupying 69 percent on a lease with 14 years left. The stalled deal stands in contrast to New Jersey developer Kumar Bhavanasi, who the Clarion Ledger says has poured more than $5 million into nearby downtown upgrades.",
      "Who pays for the data center boom: As Mississippi chases AI data centers, the question of who foots the power bill is sharpening. Entergy Mississippi says deals with Amazon, Meta and others will save its existing customers roughly $2 billion over 20 years, Mississippi Today reported. Critics counter that the 2024 law fast-tracking the projects gutted Public Service Commission oversight, and Earthjustice estimates ratepayers could already be paying about $11 more a month. Amazon's rate terms with Entergy remain confidential. Separately, developer Gabriel Prado is pressing ahead with a private power plant and AI campus somewhere in the Jackson metro after the PSC declined to rule on his request June 1, calling it premature. Entergy and Mississippi Power both oppose his plan.",
      "JTRAN talks stuck on 24 articles: Jackson's bus drivers and operator MV Transportation remain deadlocked on 24 of 56 contract articles, union president Charles Tornes told WLBT, with a strike possible by mid-July if no deal lands within 30 days. Of 38 union members voting June 12, 32 backed strike authorization. Starting pay is a rare point of agreement, with MV proposing a jump from about $17 to $22 an hour. The fights are over top pay and MV's push to hire 38 non-CDL drivers, drop Saturday service and two routes, and move to microtransit, changes the company ties to the city's $23 million shortfall. Roughly 1,000 riders depend on the system. Drivers walked for 14 days in 2024.",
      "Juneteenth action links freedom to ballots: Jackson marked Juneteenth on Friday with organizing that tied the holiday to voter registration, WLBT reported, part of a wider Juneteenth voter push some activists are billing as a Freedom Summer revival. The timing lands as Mississippi lawmakers prepare to redraw voting districts and as the Legislature weighs same-day registration under House Bill 22, per the ACLU of Mississippi. Celebrations continued across the metro through the weekend, with the Mississippi Free Press cataloguing events statewide. In a capital city where turnout fights and a contested supervisor race are back in the headlines, the message connecting emancipation to the franchise carried local weight. Organizers framed registration as the day's unfinished work.",
    ],
  },
  {
    slug: "jtran-strike-authorization-route-cuts",
    title: "Jackson's Bus Drivers Voted to Strike. The Real Fight Is Over Shrinking JTRAN.",
    dek: "ATU Local 1208 authorized a mid-July walkout in a 32-to-6 vote. Behind the wage dispute sits a $23 million city shortfall and a contractor's plan to cut routes, end Saturday service and pivot to microtransit.",
    category: "General News",
    author: "Jackson Wire Staff",
    date: "2026-06-19",
    views: 0,
    body: [
      "Jackson's bus drivers have started a 30-day clock. If their union and the company that runs JTRAN cannot close a contract, the buses could stop in the middle of July, in the hottest stretch of a Mississippi summer.",
      "The vote itself was lopsided. According to WLBT, 32 of the 38 members of Amalgamated Transit Union Local 1208 who were present Friday night voted to authorize a strike, with six opposed. The union has been bargaining with MV Transportation, the private contractor that has operated the city system since early 2024, for months. Local 1208 president Charles Tornes Jr. told WLBT the two sides are \"at a standstill\" and \"at an impasse.\"",
      "On paper, the fight looks like a wage fight, and it partly is. WLBT reported that starting pay sits just above $17 an hour and that MV has proposed raising it to about $22. Tornes said he supports that bump. His concern is the top of the scale: he told WLBT that competitors, including school bus operators, have passed JTRAN on top pay, and that without a competitive ceiling the system cannot keep the drivers it trains.",
      "The deeper dispute is about whether JTRAN gets smaller. The proposals on the table would cut two fixed routes, end Saturday service, shorten the operating day, let MV hire drivers without commercial licenses, and shift part of the system to an on-demand \"microtransit\" model. Gary Coles, MV's chief customer success officer, told WLBT the company built the proposal after hearing the city wanted to save money. Jackson is facing a roughly $23 million shortfall.",
      "That is the part other coverage has mostly framed as a labor story. It is also a budget story. The cost-saving menu did not originate with the drivers. It traces back to a city under fiscal pressure asking its contractor to spend less, and the easiest place to find savings in a transit contract is service: fewer routes, fewer hours, fewer career drivers. The question Jackson has not squarely answered is whether it intends to balance part of a $23 million gap on the residents least able to absorb it.",
      "The numbers frame the stakes. The collective bargaining agreement runs to 56 articles, and Tornes said the two sides remain split on 24 of them, nearly half the contract. The city says JTRAN provides tens of thousands of rides each month. For many of those riders, the bus is not a convenience. Jane Carroll of Disability Rights Mississippi told WLBT that a July walkout would hit disabled riders hardest, picturing someone in a power wheelchair forced onto a sidewalk in peak heat, or priced into a taxi they cannot afford.",
      "Jackson has been here before, and recently. In 2024, JTRAN workers walked off the job for 14 days before reaching a compromise. That strike ended only after ATU's international president flew to Jackson and met with then-Mayor Chokwe Antar Lumumba and city attorneys to press MV to settle. The contract that resolved it expired at the end of 2025. This time the mayor's office belongs to John Horhn, and the route-cutting plan landed in front of a City Council that tabled it on June 2 rather than vote.",
      "Horhn has tried to keep distance from both sides. In a statement to WLBT, he said he respects the operators' concerns and is weighing the union's objection to microtransit against the provider's argument that it saves money, to find \"what makes the most sense for our riders, our workers and our taxpayers.\" Council President Brian Grizzell, the Ward 4 representative, said he supports the right to collectively bargain but warned that a prolonged strike would disrupt access to jobs, healthcare and schools across the city.",
      "Those are careful words, and they leave the central choice unmade. The council controls the MV contract and the budget it is squeezing. It can fund transit at current service levels, or it can let the contractor shrink the system through attrition and on-demand vans. The drivers' strike authorization is a way of forcing that decision into the open before the buses go quiet.",
      "Talks are expected to continue against the 30-day deadline. If the pattern of 2024 repeats, the resolution will come late, under pressure, and only after riders have spent days wondering whether a bus is coming. The cheaper outcome, for everyone, is a deal that arrives before mid-July rather than after it.",
    ],
  },
  {
    slug: "morning-brief-2026-06-19",
    title: "Morning Brief: Jun 19 — Bus Drivers Eye July Strike; Hinds Election in Limbo",
    dek: "Jackson's bus drivers have authorized a mid-July walkout that could strand roughly a thousand daily riders, even as the city wrestles with a $23 million shortfall.",
    category: "General News",
    tags: ["morning-brief"],
    author: "Jackson Wire Staff",
    date: "2026-06-19",
    views: 0,
    body: [
      "JTRAN drivers set mid-July strike deadline: Jackson's bus drivers have voted to authorize a strike against MV Transportation, the contractor that runs JTRAN, if no contract deal is reached within 30 days, WLBT reported. Of 38 union members voting June 12, 32 backed a walkout. ATU Local 1208 president Charles Tornes Jr. said the two sides are at an impasse on 24 of the 56 contract articles, with top-tier pay the central fight. Starting pay sits just above $17 an hour, and MV has proposed raising it to $22. The company, citing the city's $23 million shortfall, also wants to cut Saturday service and two routes. Roughly a thousand riders depend on the system daily. Mayor John Horhn said he is weighing all sides. A 2024 strike lasted 14 days.",
      "Hinds supervisor appeals do-over election order: District 2 Supervisor Anthony \"Tony\" Smith has appealed the ruling that ordered a special election for his seat, WJTV reported, a move that could stall the July 14 do-over of the disputed 2023 Democratic primary against predecessor David Archie. Special Judge Barry Ford ordered the rerun June 3, finding no fraud but faulting the chain of custody and safekeeping of voter materials and criticizing Circuit Clerk Zack Wallace. Smith, who has until July 9 to appeal, told Mississippi Today he has new evidence and is involving the FBI. The winner serves through Dec. 31, 2027, in a district spanning Edwards, Bolton, parts of Clinton, Raymond and Jackson. Election officials say 26 precincts will open if the vote proceeds.",
      "Amazon opens fourth Mississippi data center: Amazon Web Services cut the ribbon June 9 on its fourth Mississippi data center, a Clinton facility in Hinds County that local officials say will bring more than 100 jobs and was built in 11 months on a previously abandoned site. AWS has now committed more than $25 billion across the state, with locations in Madison County, Ridgeland, Vicksburg and Clinton. The expansion is drawing scrutiny. Central District PSC Commissioner De'Keither Stamps says the industry is outpacing Mississippi's regulatory framework, and he is pushing lawmakers for expanded oversight authority. He likened the moment to the railroad era, warning the state could cede local control to Washington without proactive rules. The Clinton site will operate without water coolants, the company said.",
      "4,100 water customers still on 1980s rates: About 4,100 JXN Water customers living more than a mile outside Jackson are still paying water rates set more than 40 years ago, a gap city leaders want closed. The City Council unanimously passed a non-binding resolution urging JXN Water to file a rate case with the Public Service Commission, WLBT reported. Ward 1 Councilman Ashby Foote, who wrote it, said those customers pay far less than residents for essentially the same water while the city and utility both strain for revenue. Interim manager Ted Henifin said in March he would file, but as of late May nothing had appeared on the PSC's site. The last such request, in 1992 under Mayor Kane Ditto, was later withdrawn.",
      "Juneteenth fills Jackson with free events: Jackson marks Juneteenth today with a slate of mostly free events, the Mississippi Free Press reported. The Medgar and Myrlie Evers Home National Monument hosts \"The Transformation of Freedom,\" with yard games and a ranger talk at 9 a.m., while the Two Mississippi Museums open their Juneteenth Jubilee at 4 p.m. with food trucks, dancing in the Hall of History and spoken-word performances. The Mississippi Children's Museum runs a daytime celebration for $13. Festivities continue Saturday with the 10th Annual Juneteenth on Farish festival at 5 p.m. in the historic Farish Street district and a community tennis day at the Dorothy Vest Tennis Center. The federal holiday commemorates the end of slavery.",
    ],
  },
  {
    slug: "owens-pretrial-conference-anonymous-jury-strikes",
    title:
      "Pretrial Conference Done. Anonymous-Jury Briefing Ordered. Defense Gets Two Extra Strikes.",
    dek: "Judge Jordan held the final pretrial conference June 16, then a separate in-chambers session the same day. By the end of it, the defendants had a bigger strike sheet, a tighter deadline stack, and an order to start drafting anonymous-jury instructions.",
    category: "Politics",
    categories: ["General News"],
    tags: ["corruption-case"],
    author: "Jackson Wire Staff",
    date: "2026-06-16",
    views: 0,
    body: [
      "The final pretrial conference is done. Chief U.S. District Judge Daniel P. Jordan III held the open-court session in the Owens corruption case on the morning of June 16, then convened a separate in-chambers conference the same day with the same lawyers. By the end of it, the defense had two more peremptory strikes, the court had ordered briefing on anonymous-jury instructions, and a tight new pretrial calendar was on the docket. Trial begins July 13. That is 27 days.",
      "TWO MORE STRIKES FOR THE DEFENSE. The headline from the open courtroom was an oral motion by Lumumba attorney Gerald K. Evelyn, on behalf of all three defendants, for additional peremptory challenges. Jordan granted it from the bench. As entered: defendants shall have an additional 2 challenges, for a total of 12. The standard federal rule allots co-defendants 10 peremptory strikes between them when tried together. Adding two reflects the judge's recognition that three defendants splitting a single pot in a high-publicity case need more room than a single-defendant trial would. No further written order will issue.",
      "ANONYMOUS-JURY BRIEFING. The second piece of news comes from a single line buried in the text order setting the new pretrial calendar: \"Defendants are instructed to provide proposed instructions related to anonymous jurors by July 6.\" Federal judges use anonymous juries sparingly, usually in cases involving organized crime, witness intimidation, or sustained pretrial publicity. The court has not said the jury here will be anonymous. It has said the defense needs to draft the cautionary instructions a judge would deliver if it is. That is a request defense lawyers do not get unless the judge thinks the question is live.",
      "THE NEW DEADLINE STACK. The same June 16 text order locks in a tight cascade. The defense response to the government's motion to exclude the Owens experts is due June 22. The government's reply is due June 23. All objections to recording designations are due June 24, in the manner the judge laid out at the conference but did not put on the docket. A proposed jury questionnaire, if the parties want to submit one, is due June 29. The government's final 404(b) notices, identifying any other-acts evidence prosecutors plan to put before the jury, are due July 1. Bench briefs, voir dire questions, and the anonymous-juror instructions are all due July 6. The court also set July 6 as the working deadline for the parties to swap trial PowerPoints and discuss block introduction of unobjected-to exhibits.",
      "STATUS OF THE OWENS EXPERTS. The government's motion to strike all five defense experts, filed June 12 as Docket No. 191, is now on a briefing schedule. Owens has until June 22 to respond. Assistant U.S. Attorney David H. Fulcher gets one day to reply on June 23. Judge Jordan can rule from there at any time. The five experts on the disclosure list are Burns, R. King, Sparks, C. King, and Webb. If the motion is granted in whole, the heart of the Owens affirmative case shrinks markedly before opening statements.",
      "A WITHDRAWAL MOTION. Docket No. 192, filed June 16, is a motion by Assistant U.S. Attorney Madison Mumma to withdraw from the case as to all three defendants. The same day, the clerk attached a procedural note: proposed orders are not to be filed as attachments to a motion, but instead sent to chambers by email under Section 5.B of the court's Administrative Procedures for Electronic Case Filing. The withdrawal of one AUSA from a multi-prosecutor case is common as a long trial approaches. The lead prosecutor remains Fulcher, and the courtroom team that appeared June 16 was a five-AUSA lineup: Fulcher, Charles W. Kirkham, Kimberly T. Purdie, Herbert S. Carraway III, and Kabah S. Ealy.",
      "ON THE DEFENSE TABLE. Owens was represented in the open session by W. Gary Kohlman, T. Gary Bufkin, Luke E. Whitaker, and Joel J. Averitt. Lumumba was represented by Gerald K. Evelyn and Thomas J. Bellinder. Banks was represented by E. Carlos Tanner III and R. Thomas Rich. The same lineup reconvened with the judge in chambers later that day.",
      "THE IN-CHAMBERS CONFERENCE. The minute entry shows that after the open-court pretrial conference, Jordan brought the same lawyers back to chambers for a separate session. Federal judges hold in-chambers conferences when the subject touches sealed materials, cooperator logistics, evidentiary previews, or anything else the court does not want to put on the public record. The docket does not say what was discussed. The fact that it happened is itself information.",
      "WHAT IT MEANS GOING IN. The shape of the trial is fixing fast. The strike sheet is two bigger. Anonymous-jury procedures are at least being prepared. The recording designations and the questionnaire are due before the end of the month. The 404(b) notice lands the first week of July. Bench briefs and voir dire questions follow within days of that.",
      "Twenty-seven days.",
    ],
    note: "Source: U.S. District Court for the Southern District of Mississippi, Northern Division, Docket No. 3:24-cr-103, entries of June 16, 2026 (Docket Nos. 191–192, text orders and minute entries).",
  },
  {
    slug: "morning-brief-2026-06-16",
    title: "Morning Brief: Jun 16 — Data Center Vote Nears; Hinds County Election Do-Over",
    dek: "A contentious plan to rezone 230 acres of northwest Jackson for a data center heads toward a June 24 Planning Board vote, with a citywide public hearing set for June 22.",
    category: "General News",
    tags: ["morning-brief"],
    author: "Jackson Wire Staff",
    date: "2026-06-16",
    views: 0,
    body: [
      "Data center rezoning heads to a vote: The Jackson Planning Board is set to take up Saxum Investment's request to rezone roughly 230 acres of northwest Jackson from residential and commercial to heavy industrial use on June 24, after attorneys postponed an earlier vote. Mississippi Today reported the land sits near the Presidential Hills neighborhood and currently holds a horse track. Ahead of that, the city has scheduled a 6 p.m. public hearing June 22 in City Council chambers on data centers and a possible zoning ordinance. The city's own education forum on June 12 drew only about 30 people and, per Mississippi Today, was announced just two days in advance. Residents left with more questions than answers.",
      "Hinds County faces a do-over election: Hinds County will hold a special election July 14 for the District 2 seat on the Board of Supervisors, the county Election Commission announced. Mississippi Today reported that Special Judge Barry Ford ruled in favor of former Supervisor David Archie, who challenged his 2023 loss to current Supervisor Anthony Smith, finding that materials from the Democratic primary were not properly handled and made the winner unverifiable. The decision effectively reopens a contest settled nearly three years ago. Voters in the district, which includes parts of Jackson, will return to the polls in under a month. Smith holds the seat for now, and the campaign is restarting on a compressed timeline.",
      "Arrest in deadly trail ride shooting: Jackson police have arrested 18-year-old Amarien Carmichael in connection with the June 6 shooting at a trail ride event that left one person dead and five wounded, SuperTalk Mississippi reported this morning. Officers responded to the 2900 block of Forrest Avenue around 12:30 a.m., where 18-year-old Joidan Worthy was killed by a single gunshot, according to WJTV, with five others injured. The arrest follows earlier detentions tied to the gathering. The violence struck the same northwest Jackson corridor where Saxum is seeking its data center rezoning. Investigators have urged anyone with information to contact the Jackson Police Department or Crime Stoppers.",
      "4,100 water customers, 1980s rates: About 4,100 JXN Water customers who live more than a mile outside Jackson have paid essentially the same rates they did 40 years ago, WLBT reported. In May, the City Council unanimously approved a non-binding resolution, authored by Ward 1 Councilman Ashby Foote, urging JXN Water to file a rate case with the Mississippi Public Service Commission to close the gap. By comparison, customers inside and within a mile of the city now pay a minimum of $7.48 per CCF. Interim third-party manager Ted Henifin, who has raised in-city rates twice since 2023, has signaled he intends to bring the outlying rates before the PSC.",
      "Juneteenth Jubilee returns downtown: The Two Mississippi Museums will host a free Juneteenth celebration starting June 19 and running through the weekend, with the Jubilee from 4 p.m. to 8 p.m. Friday, according to WJTV and Visit Jackson. Sponsored by Ingalls Shipbuilding, the event includes specialized flash tours at 5 p.m. at the Museum of Mississippi History and 6 p.m. at the Mississippi Civil Rights Museum, plus performances by local talent and family activities. Admission is free all weekend. City offices are scheduled to close June 18 for the holiday observance, according to the City Council's meeting agenda. It is one of a dozen Juneteenth events listed around the capital city.",
    ],
  },
  {
    slug: "how-to-watch-the-jackson-bribery-trial",
    title: "Want to Watch the Jackson Bribery Trial? Here's How.",
    dek: "When the federal corruption trial of Jody Owens, Chokwe Antar Lumumba, and Aaron Banks opens July 13, the courtroom is open to the public. No ticket, no press pass. A reader's guide to getting in.",
    category: "Politics",
    categories: ["General News"],
    tags: ["corruption-case", "explainer"],
    author: "Jackson Wire Staff",
    date: "2026-06-16",
    views: 0,
    body: [
      "When the federal corruption trial of Jody Owens, Chokwe Antar Lumumba, and Aaron Banks begins July 13, 2026, the courtroom doors at the Thad Cochran U.S. Courthouse in downtown Jackson will be open to the public. Anyone can walk in. No ticket, no invitation, no press pass.",
      "Here's what you need to know.",
      "WHO CAN ATTEND. Anyone. Federal criminal trials are open to the public by long-standing constitutional tradition. Seating is first-come, first-served. In a case this big, that means people will line up early.",
      "WHAT YOU NEED. A valid government-issued photo ID to clear courthouse security. That's it.",
      "WHAT YOU CAN'T DO. No photos. No video. No audio recording. No livestreaming. Cell phones must be silenced or off. Federal rules have banned cameras and broadcasting from federal criminal trials since 1946, and there are no exceptions for high-profile cases. If you want a live view of what happens, you have to be in the room.",
      "WHAT HAPPENS IF THE COURTROOM FILLS UP. Federal courtrooms have fixed seating, and in trials drawing this much attention, the main room often runs out of seats. When that happens, judges commonly open an overflow courtroom in the same building, where the proceedings are piped in live by closed-circuit video and audio for spectators who couldn't fit. Reporters and defendants' families are sometimes given reserved seats. In the highest-interest federal trials, courts have used numbered passes or daily line systems to manage crowds.",
      "The court has not announced specific seating or overflow arrangements for this trial. Those decisions are typically made closer to the trial date and will be posted by the court when made.",
      "A FEW PRACTICAL NOTES FOR PEOPLE PLANNING TO GO. Arrive early on key days: opening statements, the testimony of cooperating witnesses, and the verdict are the moments that fill the room. Leave recording devices at home or in your car. Be ready to wait in line. If the main courtroom is full, ask a court security officer where the overflow room is.",
      "WHERE TO CHECK FOR UPDATES. Schedule changes, overflow procedures, and any special access arrangements will be posted on the U.S. District Court for the Southern District of Mississippi's website at mssd.uscourts.gov.",
    ],
  },
  {
    slug: "jackson-water-data-centers",
    title:
      "Jackson Can't Keep Its Own Water On. Now They Want to Sell It to a Server Farm.",
    dek: "A city that begged the federal government for drinking water in 2022 is being courted to host the thirstiest machines in America.",
    category: "Politics",
    categories: ["General News"],
    tags: ["data-centers"],
    author: "Jackson Wire Staff",
    date: "2026-06-15",
    views: 0,
    featured: true,
    body: [
      "The pitch always sounds like prosperity. Historic investment. Billions of dollars. The biggest deal anyone can remember. What it never mentions is water.",
      "Three summers ago, Jackson couldn't produce a glass of tap water its own residents could safely drink. The Pearl River flooded, the O.B. Curtis plant failed, and a slow collapse went loud. For years the system had been losing half the water it produced to broken meters and leaking pipes, breaking lines at nearly four times the safe rate.",
      "Jackson doesn't even run its own water anymore. It can't. A federal court took it over and handed it to a third-party manager, propped up by more than $600 million in federal money. Full repairs were once pegged at $2 billion.",
      "And it is still broke. In early 2026 the utility told the court it couldn't make a $1.5 million debt payment. A judge approved a 12 percent rate hike, the second in three years, and called it a “tragic catch-22”: the people the system failed are now charged more to keep it alive, in a city where the median income is around $40,000.",
      "That is the system someone wants to plug a server farm into.",
      "WHAT THESE THINGS DRINK. One large data center can use 5 million gallons of water a day, the daily use of a town of 50,000 people. A mid-sized one burns through 100 million gallons a year. Much of it evaporates into the sky and never comes back.",
      "Need a picture? A single Meta data center in Newton County, Georgia uses 10 percent of the entire county's water. One building. One company. A tenth of a county.",
      "Now drop that onto a metro sharing one strained water table, one river basin, and one Entergy grid. Amazon's $10 billion campus is in Madison County. The proposed center in Clinton sits in Hinds, Jackson's own county. They don't need to be inside the city limits to drink from the same well.",
      "DON'T FALL FOR “IT'S JUST A ROUNDING ERROR.” The industry's rehearsed answer goes like this: data centers are under 1 percent of national water use, a golf course is thirstier, a burger takes 400 gallons. All true. All beside the point.",
      "Water stress isn't a national statistic. It's a local emergency. A national average means nothing to a South Jackson household losing pressure, or a utility that can't make a debt payment. There is no worse place in America to drop a concentrated, water-hungry tenant than a city with zero margin to spare. That's not an argument for Jackson. It's an argument for anywhere but Jackson.",
      "WHO PAYS, AND WHO PROFITS. You pay first.",
      "Your power bill. An Earthjustice analysis found Entergy's residential customers had already been charged about $38 million by March 2026 to serve these facilities, roughly $10.60 more a month, for data centers you will never enter.",
      "Your tax base. State law hands these projects up to a decade of tax exemptions that can wipe out the entire local bill, locked in for 20 to 30 years, gutting the very revenue that's supposed to fix things like water. Madison County borrowed $215 million just to build the infrastructure Amazon needed.",
      "The jobs? Clinton is selling its center as the biggest deal in Hinds County history. The payoff: at least 50 jobs. The Continental Tire plant in the same city was pitched at $1.4 billion and 2,500 jobs. Fifty is the going rate for an industry that demands the water of a small city and employs the staff of a car dealership.",
      "And notice what you can't see: the Clinton company won't even say its name, citing “ongoing negotiations.” That is not an accident. It is the model. You can't weigh a deal you're not allowed to read.",
      "THE PART NO ONE IN THE SUITES WILL SAY. Jackson is more than 80 percent Black, with a quarter of residents in poverty, double the national rate. A city failed for a generation, now paying higher rates to dig out, is being asked to hand over its water, its grid, and its tax base so out-of-state companies can run AI at a profit.",
      "The profits leave on the fiber line. The evaporated water and the higher bills stay right here, with the same people told to boil their water in 2022.",
      "WHAT JACKSON SHOULD DEMAND. A moratorium with a study. Oklahoma paused big data centers until 2029 to study water, rates, and property values. Approve nothing until we know how much water, from where, and who pays if the system buckles.",
      "Names on the table. No incentive, no infrastructure, no zoning for any company that won't identify itself and disclose its water and power draw in public, before a vote.",
      "Water-first, in writing. Bring your own cooling water, with hard caps, legally last in line behind residents during any shortage. A binding term, not a pledge.",
      "Jackson spent three years and $600 million in federal money learning that water isn't infinite and a city that loses its utilities loses its future.",
      "The industry is betting we already forgot. We didn't.",
    ],
    note: "Sources: Mississippi Today; Earthjustice and Synapse Energy Economics; Brookings Institution; EESI; Lincoln Institute of Land Policy; U.S. EPA Jackson drinking water docket (3:22-cv-00686); JXN Water quarterly reports; Mississippi Free Press; Capital B News; Center for Economic Accountability.",
  },
  {
    slug: "owens-trial-what-each-side-will-say",
    title: "The Owens Trial Starts July 13. Here's What Each Side Will Say.",
    dek: "A plain-language guide to the federal bribery trial of DA Jody Owens, former Mayor Chokwe Antar Lumumba, and former Councilman Aaron Banks. The arguments, the witnesses, and what to listen for in opening statements.",
    category: "Politics",
    categories: ["General News"],
    tags: ["corruption-case", "explainer"],
    author: "Jackson Wire Staff",
    date: "2026-06-15",
    views: 0,
    body: [
      "The federal trial of Hinds County District Attorney Jody Owens, former Mayor Chokwe Antar Lumumba, and former Councilman Aaron Banks begins July 13 in downtown Jackson. It will last about a month. By the time it ends, twelve jurors drawn from across the 18 counties of the U.S. District Court's Northern Division will have decided whether Jackson's top elected officials sold their offices for cash, plane rides, and a stay on a yacht. Here is how to follow it without a law degree.",
      "The case began as an FBI sting. In 2023, undercover agents posing as private developers offered city officials money in exchange for help moving a convention center hotel project forward. The city had been trying to develop the empty lot across from the Jackson Convention Complex for two decades. The fake developers had everything the real ones never produced: a private jet, money to spend, and a willingness to fly local officials to Nashville and Fort Lauderdale. By the time the FBI was done, prosecutors had recordings of three city officials taking money or promising help. Two more, former Councilwoman Angelique Lee and Owens's cousin Sherik “Marve” Smith, pleaded guilty in 2024 and are expected to testify against the others.",
      "The indictment is 17 counts spread unevenly across the three defendants. Owens carries 8. Lumumba carries 5. Banks carries 2. The lopsidedness reflects how the government sees their roles. Owens, prosecutors say, designed the scheme, recruited participants, and moved the money. Lumumba allegedly took $50,000 routed through campaign checks in exchange for moving a paperwork deadline. Banks allegedly took about $10,000, plus a protective detail and a job offer for his daughter, in exchange for promising to vote a certain way on a future council motion.",
      "When prosecutors stand up to address the jury, expect them to lead with the most damning material first. They have hundreds of hours of recordings, including conversations about “cleaning” money and a reference to a “bag of information” on the city council. They have video of the trips. They have cash recovered during search warrants, including bills the FBI says were found inside a hollowed-out copy of the U.S. Constitution. The government will tell the jury this case is about three public officials who took private money to bend public process, and it will promise to prove every count beyond a reasonable doubt. Watch for the opening to lean heavily on Owens. The 8 counts against him include not only bribery and honest services wire fraud but also money laundering, a Travel Act count tied to the interstate trips, and a false statement count for allegedly lying to FBI agents.",
      "The Owens defense, led by Washington attorney Warren Gary Kohlman, will tell the jury this is not a corruption case. It is an entrapment case. The FBI, the defense will argue, spent two years and more than a million dollars manufacturing a crime that would not have existed without their undercover agents. The hotel was never going to be built. The vote was never going to be held. The government created the temptation, lured Owens into it, and now wants twelve jurors drawn from central Mississippi to call the result a felony. Kohlman has argued before the U.S. Supreme Court and once defended a congressman caught in the FBI's original ABSCAM corruption sting in the 1980s. The legal playbook he used then is the same one he will use here.",
      "The Lumumba defense, led by Gerald K. Evelyn, will tell the jury a different story. Lumumba does not deny that he made the phone call moving the deadline. He denies that doing so was a federal crime. Defense lawyers will lean on a 2016 U.S. Supreme Court decision called McDonnell, which overturned the bribery conviction of Virginia's then-governor. The Court ruled there that ordinary courtesies of political life, things like phone calls, meetings, and hosting an event, do not automatically become felonies just because money changed hands somewhere. Lumumba's lawyers will argue that nudging a paperwork deadline two weeks is exactly the kind of ministerial errand McDonnell says cannot anchor a bribery conviction. The city employee who carried out the change later said it raised no red flags. No developer was shut out. The judge has ruled the statute used here does not strictly require an “official act,” but he has left the hardest question, what exactly Lumumba had to agree to do, for the jury.",
      "The Banks defense, led by E. Carlos Tanner III, will be the simplest of the three. Banks did not get on the private jet. He did not take the yacht trip. The two counts against him are the smallest charging package the government brought, just conspiracy and one count of federal program bribery. Tanner will tell the jury Banks was a small participant in someone else's scheme, and that the city never even held the vote he supposedly sold. The kind of paperwork the developers ended up submitting does not go before the council at all. No vote, the defense says, means no bribe. Just a promise about something that was never going to happen.",
      "The government's witness list will be heavy with FBI personnel and the cooperators. Expect the undercover agents who played the developers to testify in detail about each trip, each conversation, and each handoff of money. Expect Angelique Lee and Marve Smith, the two who pleaded guilty, to walk the jury through the inside of the scheme. Expect forensic analysts to authenticate the recordings, the cash, and the financial records. The government recently filed a notice that it will introduce certain business records as “self-authenticating,” which means fewer custodian witnesses on the stand and more documents going up on the screen. Watch for that to speed things up.",
      "The defense witness list is shorter and shakier. The Owens team had planned to call five experts: Burns, R. King, Sparks, C. King, and Webb. The government has moved to exclude all five for failure to comply with discovery rules, and Judge Jordan has not yet ruled. If the experts go, the heart of the Owens defense narrows considerably. Whether Owens himself takes the stand is the biggest unknown of the trial. So is Lumumba. Defendants in federal criminal cases are never required to testify, and there are obvious risks to doing so. The case may end up turning more on what the jury is told to think about the recordings than on any single witness.",
      "Opening statements are not evidence. They are road maps. From the government, listen for which tape clips they preview to the jury. Those are the ones they intend to lead with. From Kohlman, listen for the word entrapment early and often. From Evelyn, listen for the word McDonnell and any framing of his client's phone call as routine. From Tanner, listen for an immediate effort to separate Banks from his co-defendants. All three defense attorneys asked the judge to try their clients separately. He refused. The three openings will be the first attempt at the same separation in front of the jury.",
      "A trial of this scale rarely arrives at opening statements unchanged. A last-minute plea agreement remains legally possible up until trial begins, even though the formal plea deadline has passed. The judge can reject any deal the parties strike. Pretrial motions are still active. The recording designations and objections are due in less than two weeks, and the final pretrial conference is set for the morning of June 16, in the same courtroom where the trial will be held. Anything could move. The address and the date, finally, will not.",
      "For Jackson, the trial is not just about three men. It is about whether a federal jury, drawn from across the 18 counties of the court's Northern Division, decides that the city's elected officials were running it for the highest bidder. The recordings will be played. The cash will be photographed. The cooperators will name names. Then twelve Mississippians will go behind a closed door and decide. The trial is scheduled to last about a month. The verdict, whenever it comes, will outlast the trial by years.",
    ],
    note: "Correction (June 15, 2026): An earlier version of this article said the jury would be drawn from Hinds County. The U.S. District Court's Northern Division draws jurors from 18 central Mississippi counties, of which Hinds is one. The article has been updated.",
  },
  {
    slug: "owens-experts-jurors-sealed-withdrawal",
    title: "Five Owens Experts in the Crosshairs. A Sealed Withdrawal. Jurors Already Cut.",
    dek: "The corruption case has been quieter on the docket than in the headlines. The last two weeks changed that. Twenty-eight days from trial, the pretrial motions are picking up.",
    category: "Politics",
    categories: ["General News"],
    tags: ["corruption-case"],
    author: "Jackson Wire Staff",
    date: "2026-06-15",
    views: 0,
    body: [
      "The corruption case has been louder in the headlines than on the docket. That changed last week.",
      "In the seven business days between June 2 and June 12, Chief U.S. District Judge Daniel P. Jordan III held a status conference, scheduled the final pretrial conference, signed an order striking a list of jurors for cause, watched the government withdraw a sealed motion, and saw prosecutors file a new one aimed at gutting the defense's expert witness lineup. Twenty-eight days from trial, the rhythm of motions is starting to pick up.",
      "The biggest filing in the stretch is Docket No. 191, filed June 12 by Assistant U.S. Attorney David H. Fulcher. The government is asking Judge Jordan to exclude testimony from five witnesses the Owens defense plans to call as experts. The names appear in the exhibit list attached to the motion: Burns, R. King, Sparks, C. King, and Webb. Fulcher's theory is procedural rather than substantive. The motion argues the defense failed to comply with the discovery rules that govern expert disclosure in federal criminal cases. If Jordan agrees, the heart of Owens's affirmative case could shrink before the jury hears a word.",
      "On the same day, Jordan signed Docket No. 190, an order striking a list of jurors for cause. The order is brief and incorporates a sealed list. The substance is procedural but the timing is not. Jury questionnaires went out to the Northern Division pool in May. The parties met June 8 to compare strike sheets. June 12's order is the first public confirmation that a portion of that pool has been removed before voir dire even begins. Anyone struck for cause will not appear in the courtroom on July 13.",
      "Docket No. 187, filed by the government on June 10, was a one-page unopposed motion to withdraw an earlier filing. Two days later, on June 12, Jordan granted it in a text-only order. The original motion being withdrawn is Docket No. 93, and the order is marked RESTRICTED, which means the underlying document is sealed. There is no public way to know yet what the government took back. The court signaled finality with the standard line: “No further written order shall issue.”",
      "A smaller item, Docket No. 188 on June 12, gave the first public look at how prosecutors plan to streamline their case at trial. The Notice of Intent to Introduce Self-Authenticating Business Records is the federal mechanism that lets the government enter bank statements, phone records, and similar documents without calling a custodian to lay foundation. It is housekeeping, but it is meaningful housekeeping. It tells the defense which records to expect on the screen and which witnesses the government will not bother to call.",
      "Per Jordan's June 2 text order, both sides had until June 9 to file their Rule 106 designations naming the recording clips they want played at trial. By June 16, they have to sit down with each other and hash out objections. The final pretrial conference is set for the same morning at 9 a.m. in Courtroom 5A. That is the last formal gate before opening statements on July 13.",
      "The shape of the trial is beginning to fix itself. The address is set. The plea window is closed. The jury pool is being trimmed. The recording fight is real and dated. And the government is moving to take pieces off the defense's table before the table is even set.",
      "Twenty-eight days.",
    ],
  },
  {
    slug: "morning-brief-2026-06-15",
    title: "Morning Brief: Jun 15 — Airport Takeover Trial Opens; Supervisor Vows Appeal",
    dek: "The decade-long legal fight over who controls Jackson's airport goes to trial today before U.S. District Judge Carlton Reeves.",
    category: "General News",
    tags: ["morning-brief"],
    author: "Jackson Wire Staff",
    date: "2026-06-15",
    views: 0,
    body: [
      "Airport takeover trial opens: Jackson's decade-long airport fight reaches a federal courtroom today, with a bench trial set to begin before U.S. District Judge Carlton Reeves. Court records show Magistrate Judge Andrew Harris scheduled the trial for June 15, and filings indicate it could run as long as two weeks. At issue is a 2016 state law that would dissolve the city-appointed Jackson Municipal Airport Authority and hand Jackson-Medgar Wiley Evers International to a state-dominated regional board. The city and JMAA argue lawmakers acted with racially motivated intent to seize the airport from a majority-Black city, WLBT and Mississippi Today have reported, while the state is asking the court to bar the phrase 'airport takeover' from trial. The case opens just weeks after Gov. Tate Reeves vetoed a state funding match for the authority.",
      "Smith vows to appeal District 2 ouster: Hinds County Supervisor Tony Smith plans to appeal the order that voids his 2023 win and forces a new District 2 election, even as he prepares to run in it, WJTV reported. Circuit Judge Barry Ford set the do-over for July 14 and limited the ballot to Smith and challenger David Archie, with 26 precincts open from 7 a.m. to 7 p.m. Mississippi Today reported that Ford found no evidence of fraud but ruled that errors in the safekeeping of voter materials had compromised the chain of custody. Archie says Smith should accept the result and let voters decide again. Smith's attorney, Warren Martin, has called the ruling an invalidation of Black votes. An appeal could scramble the tight July timeline election commissioners are already racing to meet.",
      "Data center reckoning in nine days: Two meetings in the next nine days will shape whether a large data center rises in Jackson. The Planning Commission is set to take up Saxum Investment Company's rezoning request on June 24 at the Warren A. Hood building, while a public hearing on data centers and a possible six-month moratorium is scheduled for June 22 in City Council chambers, Mississippi Today and the Mississippi Free Press reported. Saxum wants to rezone roughly 230 acres now split among residential, commercial and light-industrial districts to make the site data-center-ready. Mississippi Today reported that residents left the city's June forum with questions still unanswered about the project's water and power demands. Opponents who packed earlier planning meetings have promised to come back.",
      "Brackney lays out prevention strategy: Jackson Police Chief RaShall Brackney laid out more of her crime-fighting approach in a televised interview this week, WJTV reported, the second part of an on-camera sit-down on her strategy. Brackney, who took over the department April 1, has framed her plan around prevention and community partnerships rather than enforcement alone, telling reporters she wants residents to help co-produce public safety. WLBT reported earlier that she also wants to fight the fear of crime by giving residents ways to engage with police without being identified. The push follows a violent stretch in the capital, including a deadly June shooting at Grant's Field in northwest Jackson. How quickly the new approach shows measurable results is the question residents will be watching.",
      "Juneteenth weekend lands in a busy week: Jackson heads into a Juneteenth weekend with city offices set to close Thursday, June 18, for the holiday observance, according to a City Council agenda. Downtown Jackson Partners lists a cluster of events running June 19 through 21 across the Mississippi Street and Farish Street corridors, and an Eventbrite calendar shows a 'Faith and Freedom' gospel celebration among the gatherings. The weekend also overlaps with United in Song, a Mississippi America250 celebration booked for June 20 at the Mississippi Coliseum. Residents should plan for closed government offices and busier downtown streets. It is a fuller civic calendar than usual heading into a week that will also bring the city's data center reckoning.",
    ],
  },
  {
    slug: "jackson-data-center-power-plant-prado-psc",
    title: "The Loudest Data Center Fight Is in Jackson. The Bigger One Just Got a Green Light by Silence.",
    dek: "A rezoning brawl over 230 acres in northwest Jackson has the protests and the deadline. But a separate developer's off-grid gas plant — the project state regulators just declined to touch — may set the precedent that lasts.",
    category: "General News",
    categories: ["Commercial Real Estate","Politics"],
    author: "Jackson Wire Staff",
    date: "2026-06-15",
    views: 0,
    tags: ["data-centers"],
    body: [
      "Two data center stories are unfolding in the Jackson metro at once. One is loud, local, and on a clock. The other is quieter, slipperier, and may matter more.",
      "The loud one belongs to Saxum Investment Company, a New Jersey developer asking the city to rezone roughly 230 acres in northwest Jackson from residential and commercial use to heavy industrial, according to Mississippi Today. The site sits south of Forest Avenue, between Interstate 220 and Medgar Evers Boulevard — land that is mostly trees and brush, save for a small two-acre farm in the middle of it. Protesters packed a Planning Board meeting over it in late May. The board is scheduled to take the application back up on June 24.",
      "That fight has the public hearings, the residents and the deadline. It is the one most people in Jackson are watching. But the more consequential precedent was set not at City Hall, and not by a vote at all.",
      "In April, a company called Prado AI — run by Jackson developer Gabriel Prado — asked the Mississippi Public Service Commission for a declaratory opinion in Docket 2026-AD-10, according to The Enterprise Journal. The question: whether Prado could build a 350-megawatt natural gas power plant to run a proposed AI data center and semiconductor campus without being regulated as a public utility. Prado's filing argued the plant would run off-grid, serving only on-site demand, with no electricity sold to the public.",
      "On a Friday in late May, the commission declined to answer. Commissioners said in their order that Prado AI had not given them enough to work with, calling the request “premature and primarily hypothetical,” WLBT reported.",
      "Prado treated the non-answer as a win. “We're celebrating,” he told WLBT. “It's actually in our favor.” His reasoning: if the commission won't narrow the statute, the plain language of the state's utility exemption stands, and his power plant doesn't need the commission's blessing. He told reporters he would now seek a permit — and that the campus he has in mind is no longer 350 megawatts but one gigawatt.",
      "The state's incumbent utilities saw the stakes differently. In its motion to intervene, Mississippi Power warned that letting Prado proceed could open the door to “potentially widespread industrial and commercial deregulation,” according to WLBT. Entergy Mississippi argued that because Prado's tenants would effectively be the public, the operation looks like a public utility no matter how it is described, as the trade outlet Jackson Jambalaya reported from the docket filings.",
      "Prado's pitch leans on the one argument that lands hardest in a city exhausted by utility bills. “By self-generating energy on site, we ensure that 100% of the cost of powering AI semiconductor and AI cloud computing operations is borne by the company and is not passed on to Mississippi rate payers over time,” he said in remarks reported by AOL. He has put the project's cost above the roughly $25 billion Amazon Web Services is investing in data centers across Madison County, Ridgeland, Clinton and Warren County, WLBT reported — though he has not produced an exact figure, or, lately, an exact location.",
      "That last part is its own problem. In filings and at an earlier press conference, Prado said the campus would be in Ridgeland. By June 1, speaking to reporters, he would only confirm it was somewhere “in the Jackson metro area,” even as social media speculation tried to tie him to the Forest Avenue site — the one that actually belongs to Saxum, according to WLBT. A roughly $25-billion-plus industrial campus whose developer won't say where it goes is a hard thing for any city to plan around.",
      "Back at City Hall, the council has struggled to get ahead of any of it. Council President Brian Grizzell proposed a six-month moratorium on data center construction and permitting — a “cooling period,” he called it — to give the city time to write rules on water, sewer, electricity and environmental impact, Mississippi Today reported. The measure was tabled after City Attorney Drew Martin warned it functioned as a zoning ordinance and would need public notice and a hearing first. The day after the council balked, Saxum filed its rezoning request.",
      "The money on the table is real. Saxum's attorney, Robert Ireland of Watkins & Eager, told officials that a data center the size of the one proposed in Clinton would generate about $60 million for the city and more than $80 million for the school district over ten years, according to Mississippi Today. Mississippi had two announced data center projects at the start of 2025; it now has seven in the works.",
      "The June 24 Planning Board hearing will produce a vote, a headline and another round of protest. The Prado question already got its answer, and the answer was a shrug. In a state where the regulator just chose not to regulate, the precedent that sticks may be the one nobody got to vote on.",
    ],
  },
  {
    slug: "prosecutors-drop-jury-fight-jackson-corruption-trial",
    title: "The Government Stops Fighting Over the Jury. Trial Still Lands July 13.",
    dek: "After months arguing that pretrial publicity had poisoned the local jury pool, federal prosecutors told the court last week they are satisfied a fair jury can be seated in Jackson — quietly ending the last skirmish before the corruption trial of Jody Owens, Chokwe Antar Lumumba and Aaron Banks.",
    category: "General News",
    categories: ["Politics"],
    author: "Jackson Wire Staff",
    date: "2026-06-14",
    views: 0,
    tags: ["corruption-case"],
    body: [
      "The government blinked. On Wednesday, June 10, federal prosecutors filed a motion to withdraw their request to move the Jackson bribery trial to another court or to expand the jury pool, telling the court they are, in their own words, satisfied that a fair and impartial jury can be seated in this case. That is according to WLBT, which first reported the filing.",
      "It is a quiet end to a loud fight. For months, the venue and the jury pool were the live questions in the case against Hinds County District Attorney Jody Owens, former Mayor Chokwe Antar Lumumba and former Ward Six Councilman Aaron Banks. With this withdrawal, both questions are effectively settled. The trial stays in Jackson, and the jurors will be drawn from where they always would have been.",
      "Back in February, Assistant U.S. Attorney Kimberly Purdie asked U.S. District Judge Daniel Jordan to transfer the case to the Southern District's court in Gulfport, or, failing that, to pull jurors from all of the district's counties rather than the 18 in the Northern Division. The argument, as reported by WLBT and WLOX, was that months of media coverage had likely tainted the local pool — coverage prosecutors tied in large part to Owens' own decision in January to release dozens of documents from the FBI investigation as part of a motion to dismiss.",
      "Owens pushed back. In a May filing reported by WLBT, he refuted the claim that he was the reason the government wanted a new venue, and argued that the speaking indictment itself — nearly 30 pages of quotes and photographs unsealed in November 2024 — was designed to taint the pool first. Judge Jordan, for his part, noted that Owens appeared to have responded in kind.",
      "On April 1, Jordan drew the first line. He was blunt from the bench: he was not moving the trial to Gulfport, according to WLBT. But he left the harder question open. He signaled he might use a juror questionnaire to measure bias, and said he remained open to expanding the venire if a fair jury could not be seated in the Northern Division after months of headlines.",
      "That is what changed. In May, the court sent a questionnaire to hundreds of potential jurors gauging their familiarity with the case. Attorneys met on Monday, June 8, to review the responses and began striking jurors the next day, per WLBT. Two days after they got their first real look at what local jurors actually knew and believed, the government dropped its bid to look elsewhere.",
      "The geography here is not incidental. The Southern District of Mississippi has four divisions — Northern, Eastern, Western and Southern. As WLBT noted, the Southern Division, seven counties along the Gulf Coast, has the highest percentage of white residents of the four. The government's fallback — a district-wide jury or a move to Gulfport — would have pulled the panel away from majority-Black Hinds County and Central Mississippi. Withdrawing the motion keeps the jury rooted where the alleged crimes happened.",
      "The plea window has also closed. All three defendants kept their not-guilty pleas past Judge Jordan's May 29 deadline, court records show. Two other figures in the scheme have already pleaded guilty and are positioned to cooperate: former City Councilwoman Angelique Lee, and Sherik “Marve” Smith, described in coverage as Owens' cousin and associate.",
      "The three men still facing trial answer to 17 federal charges tied to what prosecutors describe as a scheme to bring a convention center hotel to downtown Jackson, with undercover FBI agents posing as developers, according to WJTV. Lumumba, per WLBT, is charged with conspiracy, bribery, racketeering, wire fraud and money laundering; Magnolia Tribune has reported he faces five counts tied to allegedly moving a bid deadline for the project. The men were indicted in October 2024.",
      "The trial is set to begin July 13 at the Thad Cochran United States Courthouse in downtown Jackson, and is expected to run about six weeks, according to multiple outlets covering the case. Jury selection is already underway.",
      "What is left, then, is the trial itself. The arguments over where it would happen, and who would sit in judgment, are over. The next twelve people to decide the fate of a sitting district attorney, a former mayor and a former councilman will come from Central Mississippi — the same place that elected them.",
    ],
  },
  {
    slug: "jackson-data-center-forum-rezoning-vote-june-2026",
    title: "Jackson Held a Data Center Forum. The Real Decisions Come June 22 and 24.",
    dek: "The city convened a panel at Jackson State to ask whether it wants a 230-acre data center in northwest Jackson — a question it has not answered, with a rezoning vote now days away.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-06-13",
    views: 0,
    tags: ["data-centers"],
    body: [
      "On Friday afternoon, in an auditorium at Jackson State University, the city gathered a panel to ask a question it has not yet answered out loud: does Jackson want a data center? Mayor John Horhn put it plainly at the start, according to Mississippi Today. “What we’re trying to do today is just have a conversation so that we can educate ourselves about what makes sense for us,” he said. “Do we want this in our community? And if so, under what conditions?”",
      "The framing matters, because the city is running short on time to answer it. The forum, hosted by Jackson’s Planning and Development Department, was billed as a public education event and announced just two days before it was held, Mississippi Today reported. About 30 people attended the roughly 90-minute session; WLBT described dozens filling the seats at JSU’s College of Science, Engineering and Technology Auditorium. Attendees were invited to submit written questions, only some of which were taken up from the stage.",
      "The panel was not local government. It was moderated by two Butler Snow attorneys, Tray Hairston and Charity Karanja — Hairston noted that the firm serves as the city’s outside counsel on public finance and other matters and was asked to run the discussion, according to Mississippi Today. The panelists included Bean Path founder Nashlie Sephus, Clinton Ward 6 Alderman James Lott, and Natasha Parker of the Georgia Institute of Technology’s real estate and development office, who appeared on screen. The session covered what artificial intelligence and data centers are, how many jobs they might bring, and how a community can extract the most benefit. The city said it would summarize the questions and publish answers online.",
      "At the center of all this is a specific proposal. New Jersey-based Saxum Investment Company is asking Jackson to rezone 230 acres in northwest Jackson from mostly residential and commercial use to heavy industrial use, Mississippi Today reported. The company quietly expanded the request from 190 acres to 230, according to the Mississippi Free Press. Most of the land is undeveloped — trees and brush near the Presidential Hills and Ashley Acres neighborhoods — but a two-acre family farm, WurmWorks, sits in the middle of it.",
      "The opposition has been loud. At a packed Planning Board meeting on May 27, residents pushed back hard on both the project and the process. “Even if we wanted a data center here … this process has not been transparent,” said Matt Casteel, whose farm is inside the proposed footprint, in remarks reported by Mississippi Today. One 19-year-old resident, Vada Vero, shouted from the crowd, “You drink the same water we do,” according to the Mississippi Free Press. In a city that has spent years living through a water system on the edge of collapse, the worry about a facility’s water and power demands lands differently than it might elsewhere.",
      "The developer’s case is built on numbers. Saxum’s attorney, Robert Ireland of Watkins & Eager, told the May 27 meeting that a center the size of one proposed for Clinton could bring roughly $60 million to the city and more than $80 million to the school district over ten years, Mississippi Today reported. Ireland also warned there is a “finite window” for the project — the kind of clock that tends to favor a developer over a deliberating council.",
      "The council tried to slow that clock and stumbled. In May, Ward 4 Council Member Brian Grizzell proposed a six-month ban on data-center construction and permitting. “This is a six-month cooling period to give us time to put our heads together, figure this out, to work with zoning, work with planning,” Grizzell said, according to Mississippi Today. The council debated the moratorium but voted to table it after the city attorney warned that such a ban could amount to a zoning change — one requiring a public hearing with 15 days’ notice, and one that, done improperly, could create a due-process problem. A few days later, Saxum postponed its own rezoning hearing.",
      "None of this is happening in isolation. Mississippi has gone from two announced data-center projects at the start of 2025 to seven in the works, Mississippi Today reported, part of a national construction boom that has repeatedly pitted these facilities against the neighborhoods around them over electricity, water, and noise. Amazon and other operators have been expanding in central Mississippi, and developers have floated far larger campuses in the metro area.",
      "Angela Brown, the city’s Planning and Development director, framed Friday’s forum as a chance to surface those worries rather than dismiss them. She acknowledged that early data centers brought noise and other problems, said the technology had advanced, and added that residents have a right to have their concerns heard and addressed through the process, in comments to WLBT.",
      "But the education is arriving late in the calendar. The Planning Board is set to take the rezoning application back up at its June 24 meeting, according to WLBT — two days after a June 22 public hearing before the City Council. That leaves a narrow stretch between a forum the city announced on 48 hours’ notice and the votes that will actually decide whether 230 acres of northwest Jackson become heavy industrial land.",
      "Horhn asked the right question on Friday: not just whether Jackson wants a data center, but under what conditions. The trouble is that the answer is due in less than two weeks, and the city has spent the run-up educating itself rather than setting the terms. Whether the council writes those conditions before the vote — or after the bulldozers — is the whole story now.",
    ],
  },
  {
    slug: "feds-drop-venue-fight-owens-trial-stays-in-jackson",
    title: "The Venue Fight Is Over: Owens, Lumumba and Banks Go to Trial in Jackson",
    dek: "A month before the July 13 trial, prosecutors withdrew their bid to move the case to Gulfport or widen the jury pool — telling the court they are satisfied a fair jury can be seated in Jackson.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-06-13",
    views: 0,
    tags: ["corruption-case"],
    body: [
      "For four months, the most consequential question in the Jackson bribery case wasn't whether the three defendants would stand trial. It was where. On June 10, the government answered it by walking away from the question entirely.",
      "Prosecutors filed a motion to withdraw their request to transfer the case to another court or to expand the jury pool, telling the court they are now “satisfied that a fair and impartial jury can be seated in this case,” according to WLBT. The trial of Hinds County District Attorney Jody Owens, former Mayor Chokwe Antar Lumumba and former Ward 6 Councilman Aaron Banks will begin July 13 at the Thad Cochran U.S. Courthouse in downtown Jackson, where the indictment was returned and where the defendants have always wanted it.",
      "That ends a fight the government picked in February. Prosecutors moved to transfer the case to the federal courthouse in Gulfport, or, failing that, to draw jurors from across the district rather than the 18 counties of the Northern Division. Their argument was pretrial publicity. The filing cited a wave of local coverage — WLBT alone, prosecutors noted, posted twelve stories between January 12 and January 23, 2026, as sensitive documents in the case were briefly unsealed — and faulted Owens for the press conferences and news releases he has held since his indictment.",
      "The unspoken part of the venue fight was demographic, and Owens's lawyers said so out loud. In a March response, the defense pointed to Census figures showing Jackson is 82% Black while Gulfport is 37.6% Black, and accused the government of chasing an “eleventh-hour advantage” by trying to move the case to the coast. Owens also argued the government's own “speaking indictment” — never sealed — had shaped public opinion at least as much as anything he filed.",
      "Judge Daniel Jordan had already signaled where this was headed. At an April 1 status conference he was blunt: “I am not moving this trial to Gulfport.” His compromise was procedural rather than geographic — a juror questionnaire sent early in the process to measure how much of the local pool had already made up its mind, and whether twelve impartial people could be found in central Mississippi.",
      "That machinery is now turning. Court filings show questionnaires went out to hundreds of potential jurors, and the parties were scheduled to meet June 8 to review the results and begin striking candidates the following day, according to WLBT. With the government's withdrawal, the early returns from that questionnaire appear to have satisfied both the court and the prosecution that a jury can be assembled here.",
      "The other deadline that loomed over the spring has also come and gone without changing the board. The court set May 29 as the date for any defendant to change a plea. All three kept their not-guilty pleas. Owens said he is not changing his, and court records showed Lumumba and Banks holding firm as well, WLBT reported.",
      "That deadline, however, was never as hard as it sounded. Matt Steffey, a Mississippi College School of Law professor, told Mississippi Today there is “nothing that prevents the parties from at any time agreeing to a negotiated plea,” though a judge is free to reject the terms and, in that event, the defendant can withdraw the plea. In other words, a last-minute deal remains legally possible right up to trial — it is just no longer the expectation.",
      "What the defendants face has not changed either. The three are charged in a 17-count case tied to an alleged scheme to steer a convention center hotel project to developers who turned out to be undercover FBI agents. Owens, whom investigators describe as the organizer, faces up to 90 years in prison and a $2 million fine if convicted and is mounting an entrapment defense; Lumumba faces up to 75 years and a $1.5 million fine; Banks is charged with conspiracy and bribery. Two others, former Councilwoman Angelique Lee and Owens's cousin Sherik “Marve” Smith, have already pleaded guilty.",
      "Jordan has told the parties to expect a proceeding lasting roughly a month. Jury selection alone, he has warned, could take days or weeks, given how thoroughly the case has saturated the metro.",
      "With venue settled, the plea window quiet and the questionnaires returned, the remaining unknowns have narrowed to the ones a trial is built to resolve: which of the hundreds of hours of recordings the jury hears, and what twelve Jacksonians make of them. The address, at least, is finally fixed.",
    ],
  },
  {
    slug: "hinds-county-district-2-special-election-archie-smith",
    title: "A Judge Threw Out the 2023 Vote. Hinds County District 2 Does It Over July 14.",
    dek: "Special Judge Barry Ford couldn't find the will of the voters in the boxes, so he ordered a new election between David Archie and Anthony Smith. The ballots reopen the same week the federal bribery trial begins downtown.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-06-10",
    views: 0,
    body: [
      "Nearly three years after the votes were counted, they will be counted again. On June 3, Special Judge Barry Ford ordered a do-over of the 2023 Democratic primary for the Hinds County Board of Supervisors District 2 seat, ruling in favor of former Supervisor David Archie. The Hinds County Election Commission has since set the new contest for July 14.",
      "Ford did not find fraud. He found that the county could not prove what its own voters had done. According to Mississippi Today, Ford ruled that significant errors occurred in the safekeeping of ballots, and he cited Circuit Clerk Zack Wallace's testimony about the lack of a chain of custody for voter materials.",
      "The judge framed his decision as a matter of arithmetic he could not perform. “I cannot determine the will of the voters,” Ford said, per Mississippi Today, adding that case law requires a do-over when that will cannot be established.",
      "The mechanics are narrow. WJTV reported that only Archie and current Supervisor Anthony “Tony” Smith will appear on the ballot, with 26 precincts across District 2 open from 7 a.m. to 7 p.m. on July 14. Smith keeps the seat in the meantime.",
      "The case turned on what happened to the ballots after the polls closed. WJTV reported that during the proceedings Archie's attorney showed videos of what they described as empty and unsealed ballot boxes, and that Wallace, called to the stand, testified he was no longer in possession of the boxes and related materials. “I never had possession of it,” Wallace said, according to WJTV, describing a county split across two buildings.",
      "WLBT reported a blunter moment from the earlier hearings: asked under oath, Wallace said he could not say the election was run with integrity. WLBT also reported that the judge found negligence in the vote counting and noted the election was certified despite missing votes, with three members of the Hinds County Democratic Executive Committee having signed the 2023 certification.",
      "The numbers being erased were not close. After the August 2023 runoff, the Secretary of State's office certified Smith with 67 percent of the vote to Archie's 33 percent, according to SuperTalk Mississippi. Archie kept the challenge alive after a lower judge dismissed it; the Mississippi Supreme Court revived the suit in September 2024.",
      "Smith is not conceding the rematch. He told Mississippi Today he has no plan to appeal and that he is confident he can beat Archie again.",
      "His attorney, Warren Martin, cast the ruling in starker terms. Martin told reporters the decision invalidated thousands of Black votes in District 2, called it “an abomination,” and argued that Wallace, not Smith, should be held accountable for the missing materials, according to Mississippi Today.",
      "Archie, for his part, claimed the outcome as a win for the ballot itself. He said outside the courthouse that Hinds County would now take every vote seriously regardless of party, and that the nation would be watching how the county handled it, Mississippi Today reported.",
      "There is a calendar coincidence worth noting. The federal bribery trial of District Attorney Jody Owens, former Mayor Chokwe Antar Lumumba and former Councilman Aaron Banks is set to begin July 13 in downtown Jackson. The day after jurors are seated to weigh how Hinds County's officials behaved, the county's voters in District 2 will be asked to redo an election its own clerk could not vouch for.",
      "Polls open July 14. This time, the chain of custody is the whole story.",
    ],
  },
  {
    slug: "warren-kohlman-jody-owens-defense",
    title: "Meet the DC Lawyer at the Center of Jody Owens's Defense",
    dek: "Warren Gary Kohlman has argued before the U.S. Supreme Court, served as general counsel to the National Basketball Players Association, and once defended a congressman caught in the FBI's ABSCAM sting. Now he is in Jackson, defending the district attorney.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-06-07",
    views: 0,
    tags: ["corruption-case", "explainer"],
    body: [
      "When Hinds County District Attorney Jody Owens walks into a federal courtroom in Jackson this summer, one of the lead voices speaking for him will be a Washington, DC, attorney most people in Mississippi have never heard of. His name is Warren Gary Kohlman, and his career reads like a tour through some of the biggest federal cases of the last fifty years.",
      "Kohlman has been on the Owens defense team since the very beginning. He appeared at the November 2024 arraignment, alongside local counsel from Carroll Bufkin in Ridgeland, and he is still appearing in May and June of this year as the case heads to trial. He is admitted to practice in his home jurisdiction and has been brought into this case by special permission of the court.",
      "His background is striking.",
      "Kohlman graduated from the University of Michigan in 1968 and from the University of Michigan Law School in 1971, where he was elected to the Order of the Coif for finishing in the top ten percent of his class. After a clerkship on the Pennsylvania Supreme Court, he joined the Public Defender Service for the District of Columbia, where he worked from 1973 to 1982, eventually serving as Training Director and Chief of the Trial Division. The Public Defender Service in DC is widely considered one of the most prestigious indigent defense offices in the country.",
      "While he was Training Director, Kohlman trained a young lawyer named Charles Ogletree, who later became one of the most influential civil rights lawyers in America and a longtime Harvard Law School professor. A DC Superior Court judge once called him an outstanding trial attorney. He has argued before the United States Supreme Court.",
      "For Jackson readers, the most resonant chapter of his career may be one that began more than forty years ago. In the wake of the FBI's notorious ABSCAM sting, Kohlman represented former Congressman John Jenrette. ABSCAM was the operation in which the FBI, using undercover agents posing as wealthy Arab investors, captured members of Congress on hidden camera accepting bribes. It became the template for almost every federal corruption sting that followed, including, in many of its features, the one that produced the case against Owens. The lawyer who fought the FBI's playbook in the 1980s is the lawyer at the defense table in 2026.",
      "That is not the only headline case on his resume. In the 1980s, Kohlman defended an FBI agent, H. Edward Tickel, in a series of criminal cases including a robbery of the FBI credit union. From 1985 to 1986 he represented Larry Wu-tai Chin, the CIA Chinese language translator convicted of selling classified documents to the People's Republic of China.",
      "After leaving the Public Defender Service, Kohlman moved into private practice, eventually joining the DC firm Bredhoff & Kaiser, where he worked until 2014. He later became general counsel to the National Basketball Players Association, the union for NBA players. There, according to the DC Attorney General's office, he successfully represented players in a $70 billion collective bargaining negotiation. In 2018, DC Attorney General Karl A. Racine appointed Kohlman as Senior Counsel for Litigation, calling him “one of the country's best trial lawyers.”",
      "His specialty over the decades, according to the DC Attorney General's office, has been labor law, complex civil litigation, employee tax and benefits law, and white collar criminal defense. The Owens case sits squarely in that last category.",
      "What it means for the trial here is hard to predict. Resumes do not win cases. But the defense Jody Owens has assembled is not local talent alone. It includes a Washington lawyer who has spent half a century in federal courtrooms, including against the same kind of FBI sting operation now at the heart of this prosecution.",
      "Jackson is about to see what that experience looks like in practice.",
    ],
  },
  {
    slug: "wingate-freezes-metro-jackson-water-authority",
    title: "Wingate Freezes the State's Water Takeover Before It Can Start",
    dek: "A federal judge let the new Metro Jackson Water Authority seat a board and do almost nothing else, keeping the city's water and sewer systems under his own control for now.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-06-07",
    views: 0,
    body: [
      "The Legislature built a new authority to take Jackson's water and sewer systems away from the city. On June 1, a federal judge told that authority to sit still.",
      "U.S. District Judge Henry Wingate granted part of Jackson's request for an injunction against the Metro Jackson Water Authority, the body created this year to eventually run the capital city's utilities. According to Mississippi Today, the order lets the authority's board appoint and seat its members, and nothing more. The board cannot pick a president, write regulations, sign leases, issue bonds, or take any operational control of the systems unless Wingate says so.",
      "Wingate's language left little room to maneuver. The authority “shall enact no regulatory measures, finalize no lease agreements, issue no bonds, and assume no managerial influence or deputy control over Jackson’s water and sewer systems,” his order read, per Mississippi Today, until the court alters the decree or steps back from the systems itself.",
      "The authority is the product of House Bill 1677, which Gov. Tate Reeves signed in April. It sets up a nine-member board drawn from state and local officials. Jackson leaders fought the law because it does not give the city a majority of the appointments — the central grievance that has driven the dispute from the start, as WLBT and Mississippi Today have reported.",
      "The case turns on a question of who is already in charge. Jackson argued the new law collided with the federal receivership Wingate opened in 2022, when the court installed an interim third-party manager over the failing systems. That manager, Ted Henifin, and his organization, JXN Water, have run day-to-day operations since. “When a federal court takes control of property through a receivership, it draws to itself the sole power to decide all questions concerning the management and disposition of that property,” Wingate wrote, according to WLBT.",
      "For now, the judge framed the state law as a structure with no power to use. As things stand, he wrote, HB 1677 doesn't interfere with his 2022 order because the authority only takes over once the court allows JXN Water to step down, Mississippi Today reported. Wingate described the law as an unexecuted contingency — and signaled he could reject the authority altogether.",
      "Mayor John Horhn, who spent months pushing for a city-controlled authority, claimed the moment. “This is a victory for our city and for the residents who depend on a lawful, orderly process,” he said at a June 2 press conference, as reported by the Mississippi Free Press. He was blunter about the law itself the next day: “House Bill 1677 was a classic example of the state not listening to the local interests of the city of Jackson,” he said, per WLBT. “We don’t mind if you want to have some involvement, but not control.”",
      "The appointments are the one thing still moving. Mississippi Today reported that Horhn selected water treatment professional Daniel Walker, longtime political operative Austin Barbour, and Jackson businesswoman Shirley Tucker, though the City Council still has to confirm his picks. Lt. Gov. Delbert Hosemann named Jackson businessman Sandy Carter, Ridgeland put forward its city engineer Paul Forster, and Byram chose engineer Tramone Smith. Reeves, who controls two seats, declined to name them, citing Wingate's earlier hold.",
      "The governor has not softened his read of the city's record. Reeves has said Jackson “proven they do not need majority control” of the board, pointing back to the 2022 emergency that put the state's hand on the system in the first place, according to WLBT. That is the gap the court now sits inside: a state that does not trust the city to run its water, and a city that does not trust the state to take it.",
      "Nothing is settled. Wingate has tasked Henifin with producing a transition plan by Oct. 5, and the interim manager's tenure is expected to run into 2027, the Magnolia Tribune reported. Until the receivership ends, the new authority is a board with names and no job. The fight over who controls Jackson's water is paused, not finished — and the next move belongs to the judge.",
    ],
  },
  {
    slug: "jackson-corruption-recording-fight",
    title: "Jackson Corruption Case Hits the Recording Fight as Trial Date Closes In",
    dek: "The federal corruption case against Hinds County District Attorney Jody Owens, former Mayor Chokwe Antar Lumumba, and former Councilman Aaron Banks moved another inch toward the jury this week. The inches are starting to add up.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-06-07",
    views: 0,
    image: "/wiretap.webp",
    imageAlt:
      "A man in headphones at a desk, listening to a reel-to-reel tape recorder beside backlit window blinds — a surveillance-style illustration.",
    tags: ["corruption-case"],
    body: [
      "On Monday, Chief U.S. District Judge Daniel P. Jordan III pulled the lawyers onto a Zoom and ran through the kind of housekeeping that says, plainly, we are going to try this case. No grand pronouncements. Just deadlines, and the deadlines all point at the courthouse door.",
      "The fight, as everyone in the room knows, is going to be about tape. The FBI ran an undercover operation here. Yachts, a private jet, cash, the works. And it recorded a lot of it. Judge Jordan told both sides to come back by June 9 with the clips they want played and the portions they want included for context. By June 16, the lawyers have to sit down with each other and hash out the objections. Then the same day, a pretrial conference. That is the last big stop before testimony.",
      "A few things worth noting from the call.",
      "The government brought a four-prosecutor team: David H. Fulcher, Charles W. Kirkham, Herbert S. Carraway III, and Kabah S. Ealy. Carraway and Ealy only entered the case in early May. The bench is full. Reinforcements are seated.",
      "Owens had Warren Gary Kohlman, Luke E. Whitaker, and Joel J. Averitt. Lumumba had Gerald K. Evelyn, Thomas J. Bellinder, and Jeffrey L. Edison. Banks had E. Carlos Tanner III. Eleven lawyers on one Zoom call about one case. That is not the staffing of a case anyone is settling.",
      "And nobody settled. The court's deadline for a guilty plea was May 29. It came. It went. Nothing. Jury selection started May 11. The big motions to dismiss died on May 14. The off-ramps are closed and the highway is one way now.",
      "The deals didn't come. The motions didn't land. Jackson is getting a trial.",
    ],
  },
  {
    slug: "what-the-charge-sheet-tells-you",
    title: "What the Charge Sheet Tells You About Who Did What",
    dek: "Three Jackson officials, three different indictments. The numbers aren't an accident.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-28",
    views: 0,
    image: "/indictment.webp",
    imageAlt:
      "A black book titled “Indictment” next to a wooden judge's gavel on a desk.",
    tags: ["corruption-case", "explainer"],
    body: [
      "Look closely at the charging document in the federal corruption case against Hinds County District Attorney Jody Owens, former Mayor Chokwe Antar Lumumba, and former Councilman Aaron Banks, and you'll notice something most coverage skips. The three men are charged together, but they are not charged equally. The numbers reveal a hierarchy.",
      "Owens faces eight counts. Lumumba faces five. Banks faces two.",
      "That spread is not random. Federal prosecutors don't load counts onto a defendant for emphasis. Each count requires its own provable conduct, its own statute, its own elements. So when the United States Attorney decides to charge eight against one man and two against another, the indictment is telling you exactly how the government sees the roles in the alleged scheme. Reading it carefully is like reading an organizational chart of the conspiracy the prosecutors believe they can prove.",
      "Start at the bottom. Banks gets two counts: conspiracy and one count of federal program bribery. That is the minimum viable charging package for a public official the government believes took a bribe. There is no money laundering count, because Banks isn't alleged to have moved the money through layers to disguise it. There is no honest services wire fraud, because Banks isn't alleged to have used wires the way the indictment says Owens and Lumumba did. And there is no Travel Act charge, the one that says “use of an interstate facility in aid of racketeering” on the docket. That label scares people, but it doesn't mean what it sounds like.",
      "Here's the part worth understanding. The Travel Act, 18 U.S.C. § 1952, is not the federal racketeering statute. RICO is. The Travel Act is a narrower law that makes it a federal crime to cross state lines, or use an interstate facility like a phone or a plane, to further an underlying state or federal offense. In this case, the underlying offense is bribery. The interstate hook is the travel: the private jet to Nashville, the yacht in Fort Lauderdale, the calls and wires that crossed state lines along the way.",
      "That is why Owens and Lumumba carry a Travel Act count and Banks does not. Owens and Lumumba, according to the government's allegations, got on the airplanes and got on the boat. They took the trips. Banks, as far as the indictment alleges, stayed in Mississippi. His meetings, his payments, and his conversations are all alleged to have happened here. No interstate trip, no Travel Act charge. The absence of one count tells you the prosecutors believe Banks was a local player in a scheme whose center of gravity was elsewhere.",
      "Move up the ladder. Lumumba's five counts add money laundering and honest services wire fraud to the Banks template, plus the Travel Act. The honest services count is the white-collar workhorse. It alleges that a public official deprived the people he served of his honest, conflict-free judgment, and used the wires, phones, emails, electronic transfers, to do it. Adding it to Lumumba means the government believes it can show specific electronic communications that carried the corrupt agreement. The money laundering count, in turn, says the government can trace the bribe money through the financial system in a way it could not for Banks. Five $10,000 checks, written to a campaign account and then cashed personally, is the kind of paper trail money laundering counts are built on.",
      "Then there is Owens, with eight counts. He carries everything Lumumba carries, plus two extra bribery counts, because the government alleges he was paid for and facilitated multiple corrupt deals, not one, plus a false statement count, which is what you get when the government interviews you and believes you lied. Eight counts is what federal prosecutors call the architect's package. It is what the government charges when it believes a single defendant designed the structure, recruited the participants, moved the money, and then lied about it to the agents who came to ask. Whether Owens did any of that is the question for the jury. But what the charge sheet says, with eight different counts requiring eight different sets of evidence, is unmistakable: the government is telling the world it believes he was the center of the alleged scheme.",
      "There is one more tell, the one that travels furthest in conversation about this case. Look at the docket and you will see, for Owens and Lumumba, a charge labeled with the words “in aid of racketeering.” That is the Travel Act citation, and the label is part of the statute's full name. It does not mean the men are charged with running a racket in the mob movie sense. It does not mean RICO. None of these defendants are charged under RICO. The federal racketeering statute is 18 U.S.C. § 1961, and it does not appear on this docket anywhere. The phrase on the page is doing legal labeling, not narrative.",
      "For Banks, the absence of that label is meaningful in a way the casual reader would miss. He did not take the trips. He did not catch the count. The shape of his indictment is the shape of a man the government believes was a participant, not a planner.",
      "This is why charge sheets are worth reading slowly. Three men. Three different stacks. Two, five, eight. Federal prosecutors are not subtle people, but they are precise ones, and the precision is right there in the count numbers. The indictment isn't just an accusation. It's a diagram.",
      "The plea deadline is May 29. Trial begins July 13. Which of these pieces will fall before the courtroom doors open?",
    ],
  },
  {
    slug: "jackson-home-prices-top-metro",
    title:
      "The City Everyone Wrote Off Is Suddenly the Metro's Top Real Estate Story",
    dek: "Home prices in Jackson rose 32.4 percent over the past year, the biggest jump in the metro. Local agents say it isn't a fluke. It's the payoff for a city that finally started fixing things.",
    category: "Residential Real Estate",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-28",
    views: 0,
    image: "/jackson-prices-chart.png",
    imageAlt:
      "Bar chart: year-over-year change in median sale price through April 2026 — Jackson +32.4%, Ridgeland +23.0%, Pearl +8.9%. Source: Redfin.",
    body: [
      "Something is shifting in Jackson's housing market, and it's showing up in the data.",
      "Home prices in the city of Jackson rose 32.4 percent over the past year, the largest jump in the metro area, according to Redfin. The median sale price climbed to $144,000, with Ridgeland up 23 percent and Pearl up 8.9 percent over the same period. Over the three months ending April 2026, Jackson prices were up 25.5 percent compared with the same stretch a year earlier, and homes are moving faster. The typical Jackson home now sells in 44 days. A year ago, it took 60.",
      "For agents on the ground, the numbers match what they're seeing in the field.",
      "“There's been this resurgence in Jackson,” said Janelle Hederman of Nix-Tann Associates. “I really feel like the last 12 to 18 months, we are seeing families come back to Jackson.”",
      "Her colleague Jamil Jackson, also with Nix-Tann, points to a stack of changes happening at once. “The improvements in infrastructure, the changes in city government and ratings for the schools have improved. It's a collection of improvements increasing values.”",
      "That collection is more than talk. Jackson's water system reached Safe Drinking Water Act compliance by the middle of 2025 after a decade of failures, leak repairs, and federal oversight. The city closed out 2025 with 75 homicides, down 32 percent from 111 the year before. That's the fourth straight year of declining homicide numbers and the lowest total since 2017. Mayor John Horhn, sworn in last July after defeating two-term incumbent Chokwe Antar Lumumba in a landslide runoff, has built bridges with state lawmakers and the business community that the previous administration could not. Jackson Public Schools has held its C accountability rating and cleared most of its outstanding accreditation concerns. Downtown, the $29 million reconstruction of State Street is closing in on completion this summer.",
      "And the gains aren't just landing in the usual upscale corners of the city. Hederman noted that South and West Jackson residents “are trying really hard to take care of their neighborhoods. You've got great things happening in Presidential Hills, Norwood.” Buyers are looking at parts of town that for years didn't show up on appreciation maps at all.",
      "A word of honesty on the headline number. The 32.4 percent figure is a change in the median sale price, which means it captures the prices of homes that actually changed hands this year. Other indexes that try to control for which homes sold, like the FHFA repeat-sales index, show the Jackson metro up closer to 3 to 5 percent over the year. The truth is probably somewhere in the middle. Some of the surge reflects more renovated, higher-value homes coming to market, and some of it reflects genuine, broad-based recovery. Both can be true at once.",
      "For sellers, the math is plain. Homes are moving faster, and asking prices are landing. For buyers, the window of bargain-bin Jackson real estate is closing on the better-located properties. And for a city that spent the better part of a decade in the national news for everything that was broken, the most striking number may be the one no spreadsheet captures. People are choosing to come back.",
      "The trend is still young. Population data still shows Jackson losing residents overall, water rates just went up 12 percent to cover the system's operating shortfall, and the city's challenges have not vanished. But for the first time in years, the price signal is pointing up rather than down.",
      "For a market that has been written off more than once, that signal matters.",
    ],
  },
  {
    slug: "plea-deadline-may-29-will-banks-plead",
    title: "Plea Deadline May 29th: Will Banks Plead?",
    dek: "An analysis: of the three men headed to trial in Jackson's biggest corruption case, Aaron Banks has always been the quiet one — and the quiet may be calculated.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/aaron-banks.webp",
    imageAlt:
      "Former Jackson city councilman Aaron Banks, right, arrives at the federal courthouse alongside his attorney.",
    tags: ["corruption-case"],
    body: [
      "Of the three men headed to trial in Jackson's biggest corruption case, Aaron Banks has always been the quiet one. The former city councilman has said almost nothing in public — \"I have nothing to say,\" he told one reporter — while District Attorney Jody Owens calls the case an \"assassination\" of his character and the former mayor argues constitutional theory in the press.",
      "But quiet may be the smartest move in the room. And it makes Banks the man to watch as the May 29 plea deadline closes in.",
      "Here's why. Banks faces the fewest counts of the three. He's accused of accepting the smallest amount — roughly $10,000, plus a protective detail and a job offer for his daughter. Two of his co-conspirators, Angelique Lee and Marve' Smith, already pleaded guilty and are sitting unsentenced, the classic sign of cooperators waiting to testify. The math for Banks is simple and brutal: a single-count plea caps his exposure at five years, while a trial loss alongside the man prosecutors call the scheme's \"lynchpin\" could be far worse.",
      "There's also a wrinkle in his favor. Banks asked the judge to sever his trial from Owens's — to not be tried beside a man caught on tape talking about \"cleaning\" money and keeping a \"bag of information\" on the council. The judge said no. So unless Banks pleads, he sits at the same table as the loudest defendant in Mississippi, while a jury hears weeks of recordings that mostly aren't his. The defense does have a real argument that could tempt Banks to roll the dice: the city never actually held the vote he supposedly sold. The council doesn't vote on the kind of application the developers submitted. No vote, the defense says, means no bribe — just a promise about something that was never going to happen.",
      "So the calculation comes down to nerve. Plead now, take the cap, and try for the lightest sentence of anyone charged. Or bet that a jury sees a quiet councilman who got swept up in someone else's scheme.",
      "May 29 is the tell. If Banks is going to fold, he'll do it before he ever sees that courtroom.",
    ],
  },
  {
    slug: "lofts-at-eastover-office-conversion",
    title:
      "State Street Group Bets on the Office-to-Apartment Playbook Again, This Time in Northeast Jackson",
    dek: "A quiet office building on Ridgewood Road is becoming luxury lofts. The developer has done this before, and the math is the reason.",
    category: "Commercial Real Estate",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/lofts-at-eastover.webp",
    imageAlt:
      "A green-and-white “Coming Soon — The Lofts at Eastover” sign on the lawn at 2625 Ridgewood Road, with the converted townhouse-style building behind it.",
    body: [
      "There's a “Coming Soon” sign up at 2625 Ridgewood Road in Northeast Jackson, where a modest Class B office building called Eastover Commons is being reborn as The Lofts at Eastover. The pitch on the sign is simple: “New, Luxury Style Lofts.” The strategy behind it is more interesting than the marketing.",
      "The developer is State Street Group, the Jackson firm founded in 1971 by J. Kane Ditto, the former two-term mayor of Jackson, who remains the company's principal. Day-to-day operations run through president Justin Peterson. Grant Ethridge Construction, out of Lafayette, is the general contractor, and Ridgeland's Dean Architecture is handling design. The building is being converted into roughly 15 loft-style apartments, one and two bedrooms, ranging from about 530 to 1,190 square feet, with asking rents listed between $1,321 and $2,630 a month.",
      "What makes this worth a commercial real estate reader's attention isn't that it's an office conversion. It's that it isn't being driven by office distress.",
      "The national story everyone knows is empty towers and gutted downtowns, conversions born of desperation. That isn't what's happening here. The I-55 and Lakeland corridor where this building sits has an office vacancy rate around 10.7 percent, one of the tightest submarkets in the metro. This building wasn't bleeding tenants. State Street simply ran the numbers and saw that apartment rents on this corridor, $1,300 to $2,600 a door, clear the economics of small office suites that once rented for a few hundred dollars a month. When multifamily rents have climbed more than 20 percent since 2020 and office rents have barely moved, the better use of an aging office asset becomes obvious. This is optimization, not triage.",
      "And State Street has run this exact play before. In 2018, the firm converted upstairs office space along Lakeland Drive into a dozen units it called The Quarter Lofts. In 2024, it took over Walthall Lofts and The Courthouse downtown, leasing a large block of those units to Jackson State for student housing. The Lofts at Eastover is the same template at a familiar scale: take a tired commercial building in a good location, reposition it as residential, keep it in-house to manage. For a firm that owns more than 35 assets and 2.3 million square feet, adaptive reuse isn't an experiment. It's a line of business.",
      "The location does the selling. The site sits a block off Lakeland, less than a mile from I-55, and within easy reach of UMMC, St. Dominic and Baptist, a built-in renter base of medical workers, plus the restaurants and walkability of nearby Fondren. The “Eastover” name borrows shine from the upscale enclave and the larger District at Eastover development nearby, though this is a separate, smaller project.",
      "For the broader market, the signal is the takeaway. If a developer is converting office to residential in a 10-percent-vacancy submarket, it says the rent gap between the two uses has gotten wide enough that conversion pays even where office isn't failing. Watch whether State Street announces a second phase or a downtown conversion next. If it does, this stops being a one-off and becomes a pipeline.",
      "The Lofts at Eastover is taking applications now.",
    ],
    note: "Reporting note: Unit count and rents reflect current leasing listings (Apartments.com, RentCafe) and on-site signage; State Street Group has not issued a press release on the project and no figures are independently confirmed by the developer. J. Kane Ditto is the founder and principal of the developer, not the personal developer of the building, and is distinct from his son Raymond Ditto, who runs the unrelated Ditto Residential in Washington, D.C. This project is also separate from the “District Lofts at Eastover” at the larger District at Eastover development.",
  },
  {
    slug: "the-lot",
    title: "The Lot",
    dek: "An essay: for twenty years Jackson couldn't give away a downtown lot — and when investors finally arrived with a private jet and a yacht, they turned out to be the FBI.",
    category: "Politics",
    categories: ["General News", "Commercial Real Estate"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/the-lot.webp",
    imageAlt:
      "Aerial view of the undeveloped parcels (outlined and labeled A through D) across from the Jackson Convention Complex in downtown Jackson.",
    tags: ["corruption-case", "explainer"],
    body: [
      "For twenty years, the City of Jackson could not give away a parking lot.",
      "It sits downtown, across from the convention center — a flat, hopeful rectangle of nothing that generations of city officials have dreamed of turning into a hotel. They issued the paperwork. They held the meetings. They waited. And year after year, the developers of America looked at Jackson, Mississippi, and looked away. Not one serious bid. Not once. The lot stayed a lot.",
      "Then, in 2023, the perfect developers finally arrived. They had money to burn and grand plans for the convention-center hotel the city had been begging for. They flew the right people to Nashville on a private jet. They hosted them on a yacht in Fort Lauderdale. They were everything Jackson had been waiting two decades to see.",
      "They were the FBI.",
      "What unfolded next is now the largest public-corruption case in modern Mississippi history — Hinds County District Attorney Jody Owens, then-Mayor Chokwe Antar Lumumba, and Councilman Aaron Banks, charged in a bribery scheme built around that empty downtown lot. There are recordings. There is cash, including bills the FBI later found stuffed inside a hollowed-out copy of the U.S. Constitution. There is talk, captured on tape, of \"cleaning\" money and a \"bag of information\" on the city council. It is, by any measure, an ugly story, and a jury will weigh it starting July 13.",
      "But here is the strange, almost literary heart of the case, the part that should make you sit up: the thing the city could never develop in real life, it could not quite manage to be bribed over either.",
      "The government's whole trap depended on a vote — the kind of formal council approval that turns a campaign check into a federal crime. But somewhere in the machinery, worn down by a decade of soliciting proposals that drew no response, the city switched the type of paperwork it was using. The new version never goes before the council at all. There was, the defense argues, no vote to sell. The single \"official act\" the mayor allegedly performed for his money was a phone call nudging a deadline two weeks earlier on a calendar — a deadline that locked nobody out, that the city employee who carried it out said raised no red flags.",
      "The FBI spent over a million dollars, two years, and a yacht to catch a crime built on a hotel that was never going to be built, on land that has defeated everyone who ever touched it.",
      "The judge has ruled the case will go to a jury — these are questions for twelve citizens, not for him to dismiss. The government's evidence is real and, in places, damning. The men may well be convicted. This is not a story about innocence.",
      "It's a story about a city. About what it does to a place when nothing gets built, when the only outside investor who ever showed real interest in twenty years turned out to be a federal agent wearing a wire. About a downtown lot so cursed that even the corruption attached to it may have been, in the end, a fiction.",
      "The trial starts in July. Whatever the verdict, the lot will still be there.",
      "Empty.",
    ],
  },
  {
    slug: "the-mayor-who-made-one-phone-call",
    title: "The Mayor Who Made One Phone Call",
    dek: "For readers who want to understand Chokwe Antar Lumumba's case: of the three men charged, his alleged crime is the thinnest — and his defense the most purely legal.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/lumumba.jpg",
    imageAlt:
      "Former Jackson Mayor Chokwe Antar Lumumba, hands pressed together, listens during a public meeting.",
    tags: ["corruption-case", "explainer"],
    body: [
      "He was supposed to be the future. Chokwe Antar Lumumba inherited not just a name but a movement — his father had been Jackson's mayor before him, a civil-rights radical turned city executive, and the son carried that legacy into office promising to make Jackson \"the most radical city on the planet.\" Now he's a former mayor, beaten badly at the ballot box while under federal indictment, waiting for a July trial that will decide whether he's also a felon.",
      "But here's what makes Lumumba's case genuinely different from his co-defendants', and worth understanding on its own terms: of the three men charged, his alleged crime is the thinnest. And his defense is the most purely legal.",
      "Strip away the yacht and the cash and the cigar-bar theatrics, and the government's case against Lumumba comes down to a single act. One phone call. In April 2024, he told a city employee to move a submission deadline forward by two weeks — from April 30 to April 16. For that, prosecutors say, he took $50,000, routed through campaign checks so it would look like it came from inside Mississippi.",
      "Lumumba doesn't deny the call. He admits he made it. His entire defense is that the call wasn't a crime.",
      "This is where his case turns on a 2016 Supreme Court decision called McDonnell — the case that overturned the bribery conviction of Virginia's governor. The Court ruled there that not everything a politician does for a donor is an \"official act.\" Setting up a meeting, making a call, hosting an event — those ordinary courtesies of political life don't automatically become federal felonies just because money changed hands somewhere. There has to be a real exercise of government power: a vote, a hearing, a formal decision.",
      "Lumumba's argument is that moving a deadline is exactly the kind of ministerial errand McDonnell says is not a crime. The employee who carried out the change later said it didn't strike him as unusual. No developer was shut out. The deadline could have been any date on the calendar. Where, his lawyers ask, is the formal exercise of governmental power in nudging a date two weeks?",
      "The government's answer is that you can't look at one phone call in isolation — that the call was one move in a larger agreement, and that Lumumba's real value was his power to \"do damage\" to the project if he wanted, to make life difficult for developers who didn't pay. The bribe, prosecutors say, bought his cooperation across the whole scheme, not just the calendar.",
      "The judge sided with the government on a crucial technical point in May. He ruled that the specific bribery statute used here doesn't even require an \"official act\" in the strict McDonnell sense — only a corrupt deal in exchange for influence. But he also left the hardest question unanswered, handing it to the jury and to a fight over how they'll be instructed: what, exactly, did Lumumba have to agree to do for that $50,000 to be a crime? That instruction may matter more to his fate than any witness.",
      "There's a human layer underneath the law, too. Lumumba asked to be tried separately from Owens — he didn't want to sit beside a man recorded talking about \"cleaning\" money and keeping dirt on the city council, didn't want that spectacle bleeding onto him in front of a jury. The judge said no. So the quietest defense in the case will be heard in the same room as the loudest, and Lumumba will have to hope twelve jurors can keep the two men separate in their minds.",
      "The political verdict is already in. Jackson voters threw him out in 2025 by a landslide, ending a family dynasty on a wave of scandal. What's left is the legal one. And it rests on a question that sounds almost too small to carry a man's freedom:",
      "Is moving a deadline a crime?",
      "In July, a jury will answer.",
    ],
  },
  {
    slug: "judge-lets-owens-take-his-fight-to-a-jury",
    title: "Judge Lets Owens Take His Fight to a Jury",
    dek: "Why the defense sees an opening: the judge denied the motion to dismiss, but kept Owens's entrapment defense alive and left the central legal question for the jury.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/owens.jpg",
    imageAlt:
      "Hinds County District Attorney Jody Owens arrives at the federal courthouse as a reporter follows with a microphone.",
    tags: ["corruption-case"],
    body: [
      "A federal judge would not throw out the corruption case against Hinds County District Attorney Jody Owens this week. But read the order closely and the defense may have come out better than the headlines suggest.",
      "It is true that Judge Daniel P. Jordan III denied the motion to dismiss. That was always the likely result. Federal judges rarely toss a case before trial. They leave the big questions for a jury. But what a judge says while denying a motion can matter more than the denial itself. And here, Jordan said two things the defense wanted to hear.",
      "First, he refused to block Owens from arguing entrapment at trial. Prosecutors asked him to take that defense off the table. He said no. \"The Court will not prevent him from attempting to prove his theory of the case,\" he wrote. So a jury will get to hear Owens's main argument. That argument is simple. The FBI did not catch a crime. It built one. Agents flew him on private jets, pushed him at every step, and spent more than a million dollars chasing a development deal that was never real.",
      "Second, Jordan left the most important legal question in the case wide open. To convict, the government has to prove a corrupt deal, a this for that exchange. But Jordan said how that has to be explained to the jury is not settled yet. The two sides, he wrote, will have to sort it out when the jury instructions are written. In plain words, the fight over what prosecutors actually have to prove is not over. It is just moving to the stage where it may count the most.",
      "That matters because the defense's best argument lives right in that gap. Owens's lawyers say the one official act at the center of the case, a phone call moving a paperwork deadline, is not the kind of serious government action the bribery laws were meant to punish. Jordan ruled that this is a question for the jury, not a reason to dismiss. But a question for the jury is a long way from case closed. It means twelve people from Jackson, not a prosecutor, will decide it.",
      "None of this makes the path easy. The government has a lot of evidence, and Owens still goes to trial in July. But the defense filed a bold, heavy challenge, and this ruling kept its best tools instead of taking them away. Owens did not get the case dismissed. He got something his lawyers may value almost as much. He gets to make his full case to a jury, and the rules of that fight are still up for grabs.",
      "The trial begins July 13.",
    ],
  },
  {
    slug: "one-investor-bought-the-heart-of-downtown-jackson",
    title:
      "One Investor Just Bought the Heart of Downtown Jackson, and He's Just Getting Started",
    dek: "In barely a year, New Jersey tech founder Kumar Bhavanasi has quietly bought five of downtown's most important buildings — and he's planning to spend more than $100 million bringing them back to life.",
    category: "Commercial Real Estate",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/bhavanasi.jpg",
    imageAlt:
      "Investor Kumar Bhavanasi stands before the office towers he has acquired in downtown Jackson.",
    body: [
      "Something big is happening in downtown Jackson, and it has a name: Kumar Bhavanasi.",
      "In barely a year, this New Jersey tech founder has quietly bought up five of the most important buildings in the city's business district. The Regions Building. The Pinnacle. The Deposit Guaranty Building. The Electric Building. And now the old Marriott Hotel. Put them together and Bhavanasi owns the spine of downtown Jackson.",
      "His Jackson story started by accident. He first rolled through town in 2019 to look at a shopping center and fell in love with the skyline. \"Wow, beautiful downtown,\" he remembers thinking. A few years later, a broker called him about the Deposit Guaranty Building while he was on vacation in Italy. He bought it almost sight unseen. Then he kept going.",
      "The Marriott was the one that nearly got away. He bid in an online auction last December and lost. But when the winning bid fell through, he jumped back in and closed the deal in January 2026. \"It was so attractive that I could not pass it up,\" he said.",
      "Now he's swinging big. Bhavanasi plans to pour more than $100 million into these buildings. The Deposit Guaranty Building is set to become up to 200 apartments with shops on the ground floor, maybe even a small grocery store. The Marriott will be gutted to the studs and reopened as a full hotel. He's bringing the kind of energy downtown hasn't felt in years.",
      "And it's already working. In February 2026, the law firm Cosmich Simmons & Brown moved nearly 50 employees into the Pinnacle Building, his first major tenant. People who'll buy lunch, grab coffee, and bring life back to the streets.",
      "\"I knew it was going to work,\" Bhavanasi said. \"But when you get your first lease, you know it's working.\"",
      "Downtown Jackson is waking up. And the best part? This is only the beginning.",
    ],
  },
  {
    slug: "data-centers-coming-to-metro-jackson",
    title: "Data Centers Are Coming to Metro Jackson, and the Debate Is Heating Up",
    dek: "A New Jersey firm wants to rezone 190 acres for what looks like a data center, just as the City Council weighs a moratorium — part of a boom that's made Mississippi one of the country's hottest markets.",
    category: "Commercial Real Estate",
    categories: ["General News", "Politics"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/data-center.webp",
    imageAlt:
      "An aerial view of a large data center complex next to a suburban subdivision.",
    tags: ["data-centers"],
    body: [
      "The race to build data centers in Mississippi has officially reached Jackson's front door, and not everyone is rolling out the welcome mat.",
      "Just one day after the Jackson City Council tabled a temporary ban on data centers, WLBT learned that a rezoning request tied to one is headed to the Planning Board on May 27. A New Jersey real estate firm, Saxum Investment Company, wants to rezone roughly 190 acres along Forest Avenue, near I-220 and Medgar Evers Boulevard, for heavy industrial use.",
      "Here's the twist: the application never actually says \"data center.\" But almost everyone seems to know that's the plan. \"When you read that application it doesn't say data center,\" said Ward Two Councilwoman Tina Clay, who worries about the impact on the nearby Ashley Acres subdivision. \"But that's what it is. We all know that.\"",
      "So why all the buzz over a building full of servers? Money, for one. The company's attorney told the council a new data center could pump tens of millions of dollars in fresh property taxes into the city and school district over the next decade. But Council President Brian Grizzell, who authored the proposed moratorium, has concerns about what these power-hungry, water-thirsty facilities could do to Jackson's already strained water and sewer systems. \"All money is not good money,\" he told the council.",
      "Whatever Jackson decides, it's not happening in a vacuum. Mississippi has quietly become one of the hottest data center markets in the country. Amazon alone now plans to invest a staggering $25 billion across the state, with projects in Madison County, Ridgeland, Warren County, and a $1 billion build in Hinds County at the old Delphi plant. Just down the road in Clinton, Amazon is putting up a $750 million data center on the former Milwaukee Tool site, a deal the mayor called the biggest economic development project in the city and county's history.",
      "The pitch is hard to ignore: billions in investment, thousands of high-paying jobs, and a serious tech footprint for a state that's used to being overlooked. The catch is that all those servers need enormous amounts of power and water, and cities are now wrestling with whether the payoff is worth the strain.",
      "For Jackson, that decision is coming fast. The Planning Board meets May 27, and if it approves the rezoning, the matter heads to the council in June for a final vote.",
      "The bottom line? The data center boom that's been sweeping Mississippi is now knocking on Jackson's door, and the next few weeks will tell us whether the city says come on in, or not so fast.",
    ],
  },
  {
    slug: "one-courtroom-three-defendants",
    title:
      "One Courtroom, Three Defendants, and a Trial That Isn't What It Looks Like",
    dek: "As the Jackson corruption case heads toward trial, here's what the headlines won't tell you about how it will actually unfold.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/courtroom.webp",
    imageAlt:
      "An empty courtroom with rows of jury chairs, the judge's bench, and a U.S. flag.",
    tags: ["corruption-case", "explainer"],
    body: [
      "This summer, a federal jury in Jackson is set to hear one of the most closely watched public corruption cases this city has seen in years. Former Hinds County District Attorney Jody Owens, former Mayor Chokwe Antar Lumumba, and former City Councilman Aaron Banks are charged together in a single indictment. Most people assume that means one trial, one jury, and one verdict, guilty or not guilty all the way around.",
      "It is almost never that simple. Understanding why is worth a few minutes, because what happens in that courtroom will say something about how the justice system treats all of us, not just the powerful.",
      "Start with a basic fact most people don't know. Federal prosecutors strongly prefer to try co-defendants together, and the law presumes they should. Joint trials save money, spare witnesses from testifying twice, and prevent different juries from reaching contradictory results. But there is a strategic edge too. When jurors hear the entire alleged scheme in one sitting, every meeting, every dollar, every text message, the conduct can feel bigger and more coordinated than the evidence against any one person might show on its own.",
      "Defense lawyers have a word for that effect. They call it spillover, and it is the central risk of a joint trial. A defendant can be judged not only by what the government proves against him, but by the mood the evidence against everyone else creates in the room. That is why defense attorneys routinely ask the judge to sever the case, meaning they want each client tried separately. It is also why those requests usually fail. Courts trust juries to keep each defendant's evidence in its own box. In this case, the judge denied severance, so all three men are currently set to be tried together.",
      "Now picture the room. On one side sits a single prosecution team telling one clean story. On the other sit three separate defendants, each with his own lawyers and his own theory, and those theories do not have to agree. Often they don't. Every objection and every cross-examination by one defense team ripples onto the other two. A point that helps one defendant can quietly damage another.",
      "Even jury selection reflects the strain. In a federal felony trial, the defense as a group typically gets ten peremptory strikes, which is the power to remove a potential juror without giving a reason. The phrase that matters is as a group. Three defendants often must share strikes that a single defendant would have had to himself, which forces their lawyers to negotiate over which jurors to cut. The juror one defendant fears may be the very juror another wants to keep.",
      "Then there are the cooperators. Two people originally charged in this matter have already pleaded guilty and now await sentencing. That is one of the most common turns in federal practice, and it is rarely an accident of timing. A defendant who cooperates usually does so before sentencing, because the most valuable thing he can give the government is testimony, and that testimony can shorten his own punishment. For the defendants still standing trial, a former co-defendant on the witness stand is both a danger and an opening. A danger, because an insider's account is persuasive. An opening, because that witness can be questioned about the deal he made and the powerful incentive he has to tell prosecutors what they want to hear. Jurors are allowed to weigh that, and good lawyers make sure they do.",
      "All of this points to the part the headlines tend to miss. Because a joint trial puts three people, with three different levels of alleged involvement, in front of the same twelve jurors, the ending is rarely all or nothing. A jury can convict one defendant and acquit another. It can convict on some charges and reject others. It can even fail to agree at all about one person while reaching a verdict on the rest. Each defendant is judged separately, on each count, even though they shared a courtroom, a judge, and a jury.",
      "None of this is about whether these particular men are guilty. That is for the jury, and every one of them is presumed innocent until the government proves otherwise beyond a reasonable doubt. It is about recognizing that the pretrial motions, the jury math, and the cooperation deals are not lawyer's trivia. They are the architecture that decides what a jury is ever allowed to see, and in the end what justice in this case will look like.",
      "When the verdict comes, it may not be a single word. Pay attention to the pieces, because that is where the real story usually lives.",
    ],
  },
  {
    slug: "the-jackson-bribery-case-a-timeline",
    title: "The Jackson Bribery Case: A Timeline",
    dek: "An updated chronology of United States v. Owens — from the FBI's 2022 tip through the July 13 trial date, with the jury and venue fight in focus.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    tags: ["corruption-case", "explainer"],
    body: [
      "United States v. Jody E. Owens II, et al. — No. 3:24-cr-103-DPJ-LGI (S.D. Miss.). Updated through May 25, 2026.",
      "Highlighted entries mark jury and venue developments. Trial is set to begin July 13, 2026. All three defendants have pleaded not guilty and are presumed innocent unless and until proven guilty beyond a reasonable doubt.",
    ],
    timeline: [
      {
        heading: "2022–2024 · Investigation, Sting, Indictment",
        entries: [
          {
            date: "May 2022",
            text: "FBI receives the tip that launches the Jackson public-corruption probe.",
          },
          {
            date: "Aug–Sept 2022",
            text: "Source reporting references Owens and the cigar shop; Owens added as a \"subject\" (Sept. 12 email). Sept. 2: Capitol Police gun-pointing incident.",
          },
          {
            date: "Dec 2022",
            text: "FBI confidential sources begin operating in Jackson as fake developers.",
          },
          {
            date: "July 26, 2023",
            text: "First government contact with Owens at the cigar bar (defense's key predisposition date).",
          },
          {
            date: "Aug 14, 2023",
            text: "Meeting where the defense says Owens showed reluctance.",
          },
          {
            date: "Oct 2023",
            text: "Nashville trip (private jet); Owens allegedly becomes a target. Oct. 16: indictment's claimed \"predisposed\" date.",
          },
          {
            date: "Nov 2023",
            text: "Owens reelected; designated a subject of the investigation.",
          },
          {
            date: "Dec 2023",
            text: "First Florida yacht trip; $125,000 cash.",
          },
          {
            date: "Jan–April 2024",
            text: "Payments around Banks and Lee; the \"War Room\"; RFQ deadline moved (Lumumba call, April 12); 2nd Florida trip, five $10K checks to Lumumba.",
          },
          {
            date: "May 22, 2024",
            text: "Search warrants; hollow-Constitution cash recovered; Owens interview (false-statement count).",
          },
          {
            date: "Aug 14, 2024",
            text: "Angelique Lee resigns and pleads guilty.",
          },
          {
            date: "Oct 17, 2024",
            text: "Sherik Marve' Smith pleads guilty.",
          },
          {
            date: "Oct 31 / Nov 7, 2024",
            text: "Grand jury indicts; indictment unsealed; all three plead not guilty.",
          },
        ],
      },
      {
        heading: "2025 · Scheduling and the Election",
        entries: [
          {
            date: "Feb 19, 2025",
            text: "Smith's first sentencing date; later continued (cooperation posture).",
          },
          {
            date: "March 4, 2025",
            text: "Mayfield sentenced (24 months).",
          },
          {
            date: "March 7, 2025",
            text: "Trial set for July 13, 2026. DOJ estimates 1–2 days for jury selection; Jordan corrects him, citing the 2009 Frank Melton trial (a full week; ~90% of pool had seen coverage).",
            highlight: true,
          },
          {
            date: "April 22, 2025",
            text: "Lumumba loses the runoff to John Horhn (~75–25); leaves office July 1.",
          },
        ],
      },
      {
        heading: "2026 · The Pretrial Run-Up",
        entries: [
          {
            date: "Jan 12, 2026",
            text: "Owens files 68-page motion to dismiss with ~50 FBI exhibits (entrapment / outrageous conduct).",
          },
          {
            date: "Jan 13–15, 2026",
            text: "Government emergency seal; temporary seal granted; Owens contests it.",
          },
          {
            date: "Feb 11, 2026",
            text: "Status conference: Jordan says jury selection \"could take a while\"; signals reluctance to move to Gulfport.",
            highlight: true,
          },
          {
            date: "Feb 17, 2026",
            text: "Jordan formally seals filings pending redaction review.",
          },
          {
            date: "Feb 2026",
            text: "Government moves to transfer venue to Gulfport OR draw a district-wide venire (sealed; AUSA Purdie).",
            highlight: true,
          },
          {
            date: "March 11, 2026",
            text: "Lumumba files his own motion to dismiss (McDonnell \"no official act\").",
          },
          {
            date: "March 15, 2026",
            text: "Banks moves to sever.",
          },
          {
            date: "March 25, 2026",
            text: "Owens opposes transfer: \"forum shopping\" brief (Jackson 82% Black vs. Gulfport ~38%).",
            highlight: true,
          },
          {
            date: "April 1, 2026",
            text: "Status conference: Jordan — \"I am not moving this trial to Gulfport.\" Adopts a questionnaire-first plan; district-wide venire as backup. Sets discovery deadlines.",
            highlight: true,
          },
          {
            date: "Early May 2026",
            text: "Court mails the Frank Melton-style juror questionnaire to the Northern Division pool.",
            highlight: true,
          },
          {
            date: "May 11, 2026",
            text: "New protective order restricting discovery to defense teams; return/destruction post-trial.",
          },
          {
            date: "May 14, 2026",
            text: "Omnibus order: denies all dismissal and severance motions; PRESERVES entrapment for the jury; holds §666 needs no \"official act\" but still requires quid pro quo (jury-instruction fight); defers jury-taint to selection.",
            highlight: true,
          },
          {
            date: "May 15, 2026",
            text: "Venue briefing and questionnaire unsealed and reported.",
            highlight: true,
          },
          {
            date: "May 19, 2026",
            text: "Owens's \"forum shopping\" response published.",
            highlight: true,
          },
        ],
      },
      {
        heading: "The Road Ahead",
        entries: [
          {
            date: "May 29, 2026",
            text: "Plea-change deadline.",
            highlight: true,
          },
          {
            date: "June 8, 2026",
            text: "Parties meet to identify jurors to strike (lawyers' work session, NOT in-court voir dire).",
            highlight: true,
          },
          {
            date: "June 9, 2026",
            text: "Strike lists due to the court.",
            highlight: true,
          },
          {
            date: "June 15, 2026",
            text: "Final supplemental briefing on the transfer / venire question due.",
            highlight: true,
          },
          {
            date: "June 9 – July 1",
            text: "Watch for Jordan's written ruling on the venire: stand pat, enlarge the Northern Division pool, or go district-wide.",
            highlight: true,
          },
          {
            date: "July 13, 2026",
            text: "Trial begins; in-court voir dire starts this day (projected ~1 week, within a ~6-week trial).",
            highlight: true,
          },
        ],
      },
    ],
    note: "Correction from earlier drafts: in-court jury selection begins July 13, 2026, not June 8 — June 8 is the lawyers' strike-list meeting on questionnaire results. Compiled from public court filings and Mississippi news reporting (WLBT, WLOX, Mississippi Today, WJTV, Magnolia Tribune). Dates involving sealed filings reflect news accounts of unsealed versions; some exact dates are approximate. Informal analysis, not legal advice.",
  },
  {
    slug: "republicans-built-bennie-thompsons-district",
    title:
      "Republicans Built Bennie Thompson's \"Super-Democratic\" District. Now They Want to Burn It Down.",
    dek: "How Mississippi already mastered the gerrymander everyone's suddenly talking about.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    image: "/ms-districts.png",
    imageAlt:
      "Two maps of Mississippi's congressional districts shaded red and blue by party.",
    body: [
      "The country is having a loud new argument about gerrymandering. The Supreme Court reshaped voting-rights law this spring, Louisiana lost a majority-Black district, and politicians from Washington to Baton Rouge are treating racial redistricting like some shocking frontier being crossed for the first time.",
      "In Mississippi, the reaction is drier.",
      "\"Being it the country now gets to know what it's like living in the state of Mississippi,\" says Rep. Robert Johnson, the Democratic leader in the state House, from Natchez. \"This old gerrymandering thing that everybody's excited about, what they're gonna do in Louisiana? We've already done it. We just call it Tuesday.\"",
      "It's a good line because it's true, and because it cuts against the story both parties prefer to tell. To understand why, you have to start with a fact that flips the usual assumption on its head.",
      "The one Black district was never a gift. It was a remedy.",
      "The instinct is to look at Mississippi's 2nd Congressional District, the majority-Black seat that runs through the Delta and has elected Bennie Thompson since 1993, and assume it was drawn to hand Democrats a safe seat. The history says the opposite.",
      "The Delta, home to the largest Black population in the state, was a single congressional district from 1882 all the way through the maps of 1932, 1952, and 1962. Then in 1966, immediately after the Voting Rights Act passed, the Legislature deliberately split the Delta across three districts at once, producing a white voting-age majority in all five of Mississippi's districts. That was the original gerrymander, and it ran the other direction from what most people assume. The goal was to crack Black voters apart so they could not elect anyone.",
      "That split held for nearly twenty years. It was undone only by lawsuit. In Jordan v. Winter (1984), following a Justice Department objection under the Voting Rights Act, a federal court ruled that fracturing the Black population diluted its voting strength illegally and ordered a new map with one Black-majority district. In 1986 Mike Espy won it, becoming the first Black congressman from Mississippi since Reconstruction. Thompson followed him.",
      "So when Mississippi officials describe the 2nd as a district \"drawn to protect Bennie Thompson,\" they are telling the end of the story and skipping the beginning. It was drawn to remedy nearly a century of vote dilution, by federal courts, because the state would not do it on its own.",
      "Here's the part the outrage leaves out.",
      "Johnson's deeper point is that Republicans don't actually mind the packed Black district. They have quietly relied on it.",
      "\"This is some capital-H hypocrisy, some of this outcry about Bennie's super-Democratic district,\" Johnson says. \"It's that way because Republicans wanted it. To protect all the other seats.\"",
      "The math explains the move. Mississippi is about 40 percent Black, the highest share of any state, and that vote is overwhelmingly Democratic. Concentrate as much of it as possible into one district and you get a single overwhelmingly Democratic seat, and three comfortably Republican ones. Spread it out, and you risk creating two competitive districts instead of one safe Democratic one. Johnson is blunt about the consequence: if cracking the 2nd actually helped Republicans, they would already have done it.",
      "\"If there was any chance of getting rid of a Democratic congressional seat, we'd be doing it, trust me,\" he says, describing the Republican calculation. \"You couldn't do that without ending up with at least two competitive districts.\"",
      "He points back to the 2022 redistricting fight, when he says House Democrats wanted to anchor the 2nd in the Delta and add all of Hinds and Madison counties, and Republicans, including Republican congressional candidates, declined. The packed map served the majority. Until, suddenly, a new legal weapon made unpacking it look attractive.",
      "The weapon is Callais.",
      "On April 29, 2026, the Supreme Court decided Louisiana v. Callais 6-3, striking down Louisiana's second majority-Black district as an unconstitutional racial gerrymander. The Court did not formally erase Section 2 of the Voting Rights Act, the provision that bars vote dilution. But it heightened what plaintiffs must prove, pushing back toward a requirement of intentional discrimination rather than the \"results\" test Congress deliberately wrote into the law in 1982. In dissent, Justice Kagan warned the ruling leaves Section 2 \"all but a dead letter.\"",
      "That doctrinal shift matters more than it sounds. Congress restored the results test in 1982 precisely because an earlier decision, Mobile v. Bolden, had demanded proof of intent, a bar so high it was nearly impossible to clear. Callais swings the law back toward that bar. And it gave Mississippi Republicans the opening they had not previously had a reason to use.",
      "The reaction was immediate. State Auditor Shad White, eyeing a 2027 run for governor, posted that Mississippi \"might no longer have a district drawn to protect Bennie Thompson.\" A state senator said it was time to \"erase\" the district. Gov. Tate Reeves declared Thompson's \"reign of terror on MS-2 is over.\" The president has pushed Mississippi to redraw its maps as part of a national effort to flip Democratic seats.",
      "The irony Johnson is pointing at sits right there in the open.",
      "Mississippi is the Blackest state in the country, 38 percent by population. It has four House seats. One is held by a Black representative. Both of its U.S. senators are white Republicans. The move now on the table is to eliminate that one district, in that state, by spreading its Black voters thin enough across white-majority districts that they cannot decide an outcome anywhere.",
      "What has stayed constant across sixty years, from the 1966 split to Jordan v. Winter to the post-Callais scramble, is not the law. The law has lurched back and forth. What has stayed constant is the instinct of the state's leadership about how Black voting strength should be arranged. Only the tools have changed.",
      "\"We just call it Tuesday,\" Johnson says.",
      "A special session on the maps has not been formally scheduled. But in Mississippi, the people who draw the lines have rarely waited long once the courts handed them a reason.",
    ],
  },
];

const sortByDateDesc = (a: Post, b: Post) => b.date.localeCompare(a.date);

// Today's calendar date (YYYY-MM-DD) in the publication's local time zone
// (America/Chicago). Used to schedule article publication by date so writers
// can batch-write multiple pieces and drip-publish across the week without
// rebuilding — pages revalidate every 10 minutes (see `revalidate` exports).
function todayLocalIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

// An article is "live" once its `date` is today or earlier (Chicago time).
// Future-dated articles stay hidden from every public surface until then.
function isPublished(p: Post): boolean {
  return p.date <= todayLocalIso();
}

export const getAllPosts = cache((): Post[] =>
  POSTS.filter(isPublished).sort(sortByDateDesc),
);

export const getPostBySlug = cache((slug: string): Post | undefined => {
  const post = POSTS.find((p) => p.slug === slug);
  return post && isPublished(post) ? post : undefined;
});

export const getFeaturedPost = cache((): Post | undefined =>
  getAllPosts().find((p) => p.featured) ?? getAllPosts()[0],
);

export function getPostsByCategorySlug(categorySlug: string): Post[] {
  return getAllPosts().filter((p) =>
    [p.category, ...(p.categories ?? [])].some(
      (c) => slugifyCategory(c) === categorySlug,
    ),
  );
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags?.includes(tag));
}

// Returns today's Morning Brief if one has been published today (Chicago time).
export function getTodaysBrief(): Post | undefined {
  const today = todayLocalIso();
  return getAllPosts().find(
    (p) => p.tags?.includes("morning-brief") && p.date === today,
  );
}

export function getMostRead(limit = 5): Post[] {
  return POSTS.filter(isPublished)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .concat(getAllPosts().filter((p) => p.slug !== post.slug && p.category !== post.category))
    .slice(0, limit);
}

export function slugifyCategory(name: string): string {
  return name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function readingTime(post: Post): number {
  const words = post.body.join(" ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
