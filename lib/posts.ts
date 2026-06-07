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
    featured: true,
    image: "/wiretap.webp",
    imageAlt:
      "A man in headphones at a desk, listening to a reel-to-reel tape recorder beside backlit window blinds — a surveillance-style illustration.",
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
