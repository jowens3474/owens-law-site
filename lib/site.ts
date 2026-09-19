// Central place to rebrand the publication. Change these and the whole site updates.
export const site = {
  name: "The Jackson Wire",
  shortName: "Jackson Wire",
  url: "https://www.thejacksonwire.com",
  tagline: "Business, economics, and what is coming next in Jackson.",
  description:
    "Independent, research-driven reporting on business, economics, and development in Jackson and Mississippi. We read the filings, budgets, contracts, and agendas so readers see what is coming before it is announced.",
  email: "capitolmain42@gmail.com",
  city: "Jackson, Mississippi",
  founded: 2026,
  // Human editor of record. Every article carries this byline and the
  // NewsArticle schema names this Person as editor.
  editor: {
    name: "J. Edward Owens",
    title: "Editor",
    path: "/about/editor",
  },
} as const;

export interface Category {
  name: string;
  slug: string;
  blurb: string;
}

export const categories: Category[] = [
  {
    name: "Business",
    slug: "business",
    blurb:
      "Companies, deals, jobs, and capital moving through metro Jackson, reported from the filings before the press release.",
  },
  {
    name: "Economy",
    slug: "economy",
    blurb:
      "Budgets, taxes, rates, wages, and the numbers that decide what Jackson can afford.",
  },
  {
    name: "Development",
    slug: "development",
    blurb:
      "What is being built, what is proposed, and what is stuck: projects, permits, incentives, and the votes that move them.",
  },
  {
    name: "Real Estate",
    slug: "real-estate",
    blurb: "Home sales, rents, land, and the neighborhoods on the move.",
  },
  {
    name: "Politics",
    slug: "politics",
    blurb: "City Hall, the county, the Capitol, and the money behind the votes.",
  },
  {
    name: "General News",
    slug: "general-news",
    blurb: "Courts, public safety, and the rest of the capital city.",
  },
];

export const categoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

export const categoryByName = (name: string): Category | undefined =>
  categories.find((c) => c.name === name);
