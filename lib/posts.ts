import { cache } from "react";

export interface Post {
  slug: string;
  title: string;
  dek: string;
  category: string;
  author: string;
  date: string; // ISO yyyy-mm-dd
  views: number;
  featured?: boolean;
  body: string[];
}

// Sample/placeholder stories. Swap these out for real reporting — the site
// reads everything from this array, so adding a post is just adding an object.
const POSTS: Post[] = [
  {
    slug: "garbage-contract-vote",
    title: "Council Approves No-Bid Garbage Contract in 4–3 Vote",
    dek: "Two members walked out before the vote. The winning hauler donated to three of the four who stayed.",
    category: "Politics",
    author: "R.E. Caldwell",
    date: "2026-05-24",
    views: 8421,
    featured: true,
    body: [
      "After a meeting that stretched past midnight, the City Council voted 4–3 Tuesday to award a seven-year, $58 million solid-waste contract to Delta Sanitation Group without putting the work out for competitive bid.",
      "The administration argued an emergency extension was necessary to avoid a lapse in pickup. Critics on the dais were not buying it. \"We have known this contract was expiring for two years,\" said Ward 5 Councilwoman Brenda Tatum, who voted no. \"There is no emergency except the one we manufactured.\"",
      "Campaign finance records reviewed by the Muckraker show Delta Sanitation's principals and their spouses contributed a combined $14,500 to three of the four council members who voted yes, all within the last eighteen months. None of the members disclosed the contributions before the vote.",
      "Two members — both of whom had filed written objections to the no-bid process — left chambers before the roll was called, denying the meeting a quorum on a separate ethics measure that had been scheduled to follow.",
      "City Attorney Lionel Frost defended the procurement, telling the council that state law permits emergency awards \"when a delay would threaten public health.\" When pressed on whether uncollected garbage met that bar after only a brief gap, Frost said he would \"provide a written opinion at a later date.\"",
      "The contract takes effect July 1. A coalition of neighborhood associations said Wednesday it is weighing a legal challenge.",
    ],
  },
  {
    slug: "office-tower-distressed-sale",
    title: "Downtown's Biggest Office Tower Hits the Market at Half Its 2019 Price",
    dek: "The 22-story Capitol Center is the latest casualty of empty floors and refinancing that never came.",
    category: "Commercial Real Estate",
    author: "Hollis Mayfield",
    date: "2026-05-23",
    views: 7180,
    body: [
      "Capitol Center, the 22-story tower that has anchored the downtown skyline since the 1980s, has been listed for sale at $31 million — roughly half what it last traded for in 2019, according to marketing materials circulating among brokers.",
      "The building is less than half occupied. Two of its largest tenants, a regional bank and a state agency, did not renew leases that expired over the past eighteen months, and the owner has been unable to refinance a balloon loan that came due in the spring.",
      "\"This is the price discovery everyone in the market has been dreading,\" said one commercial broker who reviewed the listing. \"When the trophy building downtown sells at a number like this, it reprices everything around it.\"",
      "City officials, who have floated converting older office floors to apartments, said the sale could be \"an opportunity\" — but acknowledged that the math on office-to-residential conversions rarely works without subsidy.",
      "The lender declined to comment. A broker on the listing said only that there was \"strong interest from value-add investors.\"",
    ],
  },
  {
    slug: "spring-housing-market-cools",
    title: "Home Prices Cooled 4% This Spring as Listings Pile Up",
    dek: "After three years of bidding wars, sellers are cutting prices and houses are sitting longer.",
    category: "Residential Real Estate",
    author: "Hollis Mayfield",
    date: "2026-05-21",
    views: 6640,
    body: [
      "The median home price across the metro fell about 4% from a year earlier this spring, the first sustained decline since the pandemic-era run-up, according to local multiple-listing data.",
      "Inventory tells the clearer story: active listings are up sharply, and the typical home now sits on the market for more than seven weeks before going under contract, compared with under two weeks at the 2022 peak.",
      "\"Sellers are still anchored to last year's prices, and buyers know it,\" said a longtime agent in northeast Jackson. \"The houses that are priced right still move. The ones chasing the market down are the ones sitting.\"",
      "Higher mortgage rates continue to squeeze first-time buyers, while many existing owners — locked into cheaper loans — are reluctant to sell and trade up. Agents say price cuts have become routine, with roughly one in three active listings now reduced at least once.",
    ],
  },
  {
    slug: "school-board-indictment",
    title: "Ex-School Board Chief Indicted on Six Counts of Embezzlement",
    dek: "Prosecutors say district credit cards funded vacations, electronics, and a riding lawnmower.",
    category: "General News",
    author: "Marcus Bell",
    date: "2026-05-20",
    views: 9530,
    body: [
      "A grand jury returned a six-count indictment Friday against the former president of the county school board, accusing him of using district funds for personal expenses over a four-year period.",
      "The indictment alleges roughly $73,000 in improper charges, including airfare, a beachfront rental, two laptops, and a riding lawnmower delivered to a residential address. Prosecutors say the charges were coded as \"professional development\" and \"facilities.\"",
      "The former official, who resigned last year citing health reasons, surrendered Friday afternoon and was released on bond. His attorney called the charges \"a political hit dressed up as accounting\" and said his client \"looks forward to his day in court.\"",
      "The district said in a statement that it has since adopted new card-approval controls and \"cooperated fully\" with investigators.",
    ],
  },
  {
    slug: "riverfront-tax-break",
    title: "Riverfront Developer Wants 20-Year Tax Break for Promised Jobs",
    dek: "The pitch: 200 jobs and a hotel. The fine print: the city eats the risk if neither materializes.",
    category: "Commercial Real Estate",
    author: "Dana Pruitt",
    date: "2026-05-18",
    views: 4109,
    body: [
      "A developer pitching a mixed-use project on the riverfront is asking the city for a 20-year tax abatement, promising 200 permanent jobs and a 140-room hotel in return.",
      "Under the proposed agreement, the developer would pay no city property taxes on the improvements for two decades. There is no clawback provision requiring repayment if the job targets are missed — a detail that drew sharp questions at this week's economic development committee hearing.",
      "\"We have seen this movie before,\" said one committee member. \"We give away the taxes, the jobs never show, and there's nothing on paper to get our money back.\"",
      "The developer's representative said the firm has \"a track record\" and that financing is contingent on the abatement. A vote is expected next month.",
    ],
  },
  {
    slug: "apartment-rezoning-fight",
    title: "Neighbors Pack Hearing to Fight 180-Unit Apartment Rezoning",
    dek: "Supporters call it badly needed housing. Opponents call it traffic, density, and a broken promise.",
    category: "Residential Real Estate",
    author: "Dana Pruitt",
    date: "2026-05-17",
    views: 5021,
    body: [
      "More than a hundred residents packed a planning commission hearing this week to oppose a request to rezone a wooded 12-acre parcel for a 180-unit apartment complex.",
      "The developer says the project would add desperately needed mid-priced rentals in a market where vacancy is near record lows. Neighbors counter that the surrounding streets cannot handle the traffic and that the parcel had long been understood to be zoned for single-family homes.",
      "\"We are not anti-housing,\" one homeowner told the commission. \"We are anti-getting-blindsided.\" Several speakers pointed to a 2018 neighborhood plan that envisioned far lower density on the site.",
      "The commission deferred a vote for thirty days and asked the developer to return with a traffic study and a revised unit count. The full council would still have to approve any rezoning.",
    ],
  },
  {
    slug: "welfare-nonprofit-subpoena",
    title: "State Auditor Subpoenas Records From Embattled Welfare Nonprofit",
    dek: "The organization received $9M in federal block-grant money. Investigators want to know where it went.",
    category: "Politics",
    author: "R.E. Caldwell",
    date: "2026-05-16",
    views: 7044,
    body: [
      "The state auditor has issued subpoenas for the financial records of a Jackson-based nonprofit that received roughly $9 million in federal welfare block-grant funds over five years.",
      "The organization, which says it provides job training and family services, has not published an annual report since 2022. Several listed program addresses are vacant storefronts, according to a Muckraker visit this week.",
      "The auditor's office declined to characterize the investigation beyond confirming the subpoenas were issued. The nonprofit's director did not respond to multiple requests for comment.",
      "Federal welfare block grants give states wide latitude over spending, a flexibility that watchdogs say has repeatedly invited abuse in Mississippi.",
    ],
  },
  {
    slug: "water-billing-glitch",
    title: "Residents Hit With $900 Water Bills After 'System Glitch'",
    dek: "The utility blames a software migration. Customers blame years of broken meters.",
    category: "General News",
    author: "Marcus Bell",
    date: "2026-05-14",
    views: 5377,
    body: [
      "Hundreds of residents opened their mailboxes this month to water bills several times higher than usual, some topping $900, in what the utility is calling a billing \"system glitch.\"",
      "The utility says a software migration caused estimated reads to be miscalculated and that affected customers will be credited. But many residents say their meters have not been read in person for years.",
      "\"They estimated me into the poorhouse,\" said one south-side resident who received a $940 bill on a house she says sat empty for two months. \"How do you use that much water in an empty house?\"",
      "The utility has set up a dispute hotline. Residents report hold times exceeding an hour.",
    ],
  },
  {
    slug: "county-software-audit",
    title: "County Quietly Spent $1.2M on Software It Never Installed",
    dek: "An internal memo shows the licenses sat unused for three years while the vendor billed annually.",
    category: "General News",
    author: "Dana Pruitt",
    date: "2026-05-12",
    views: 6210,
    body: [
      "Hinds-area county government paid more than $1.2 million over three years for an enterprise permitting system that was never deployed, according to an internal memo obtained by the Muckraker.",
      "The software, purchased in 2023 to modernize building and zoning permits, still runs on a paper-and-spreadsheet workflow that predates most of the current staff. The vendor, MeridianGov Solutions, continued to invoice the county for annual licensing and \"premium support\" the entire time.",
      "\"Nobody could tell me who signed off on the renewal,\" wrote the county's interim IT director in the memo, which was circulated to supervisors last month. \"The original project manager left in 2023 and the contract auto-renewed twice after that.\"",
      "Supervisors have asked the state auditor's office for guidance on whether any of the money can be recovered. A spokesperson for MeridianGov said the company \"delivered the licensed product and stands by its contract.\"",
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

export const getFeaturedPost = cache((): Post =>
  getAllPosts().find((p) => p.featured) ?? getAllPosts()[0],
);

export function getPostsByCategorySlug(categorySlug: string): Post[] {
  return getAllPosts().filter(
    (p) => slugifyCategory(p.category) === categorySlug,
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
