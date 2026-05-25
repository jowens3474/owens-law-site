// Central place to rebrand the publication. Change these and the whole site updates.
export const site = {
  name: "The Magnolia Muckraker",
  shortName: "The Muckraker",
  tagline: "Mississippi real estate and politics, unfiltered.",
  description:
    "Independent reporting on Mississippi real estate, development, and government — and the people who profit from them. Tips welcome, sacred cows not.",
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
    name: "General News",
    slug: "general-news",
    blurb: "City hall, the courts, and what's happening around the capital city.",
  },
  {
    name: "Commercial Real Estate",
    slug: "commercial-real-estate",
    blurb: "Development deals, office and retail, and who's building what.",
  },
  {
    name: "Residential Real Estate",
    slug: "residential-real-estate",
    blurb: "Home sales, neighborhoods, and the local housing market.",
  },
  {
    name: "Politics",
    slug: "politics",
    blurb: "The Capitol, campaigns, and everyone angling for your tax dollars.",
  },
];

export const categoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

export const categoryByName = (name: string): Category | undefined =>
  categories.find((c) => c.name === name);
