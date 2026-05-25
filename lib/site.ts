// Central place to rebrand the publication. Change these and the whole site updates.
export const site = {
  name: "The Magnolia Muckraker",
  shortName: "The Muckraker",
  tagline: "Mississippi politics, unfiltered.",
  description:
    "Independent reporting and commentary on Mississippi government, courts, and the people who run them. Tips welcome, sacred cows not.",
  email: "jason@owensowens.com",
  city: "Jackson, Mississippi",
  founded: 2026,
} as const;

export interface Category {
  name: string;
  slug: string;
  blurb: string;
}

export const categories: Category[] = [
  {
    name: "Politics",
    slug: "politics",
    blurb: "City hall, the Capitol, and everyone angling for your tax dollars.",
  },
  {
    name: "Crime & Courts",
    slug: "crime-courts",
    blurb: "Indictments, verdicts, and the cases nobody else is covering.",
  },
  {
    name: "Business",
    slug: "business",
    blurb: "Development deals, tax breaks, and who really benefits.",
  },
  {
    name: "Education",
    slug: "education",
    blurb: "School boards, charters, and the fight over how kids learn.",
  },
  {
    name: "Around Town",
    slug: "around-town",
    blurb: "The potholes, the water bills, and life in the capital city.",
  },
  {
    name: "Opinion",
    slug: "opinion",
    blurb: "Where we say the quiet part out loud.",
  },
];

export const categoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

export const categoryByName = (name: string): Category | undefined =>
  categories.find((c) => c.name === name);
