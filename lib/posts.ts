import { cache } from "react";

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
