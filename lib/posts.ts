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
    slug: "plea-deadline-may-29-will-banks-plead",
    title: "Plea Deadline May 29th: Will Banks Plead?",
    dek: "An analysis: of the three men headed to trial in Jackson's biggest corruption case, Aaron Banks has always been the quiet one — and the quiet may be calculated.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    featured: true,
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

export const getAllPosts = cache((): Post[] =>
  [...POSTS].sort(sortByDateDesc),
);

export const getPostBySlug = cache((slug: string): Post | undefined =>
  POSTS.find((p) => p.slug === slug),
);

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
  return [...POSTS].sort((a, b) => b.views - a.views).slice(0, limit);
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
