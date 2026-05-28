// Curated Mississippi locations for local SEO. The factual details (county,
// region, and the highways that run through each city) make every location
// page genuinely distinct rather than thin/duplicate "doorway" pages — which
// Google penalizes. Keep these accurate; add real, city-specific detail
// (office address, local results, an embedded map) over time to strengthen them.

export interface City {
  name: string;
  slug: string;
  county: string; // county seat / county the city sits in
  region: string;
  highways: string[]; // major routes through/near the city (true)
  note: string; // one truthful local-context sentence
}

export const cities: City[] = [
  {
    name: "Jackson",
    slug: "jackson",
    county: "Hinds",
    region: "Jackson Metro",
    highways: ["I-55", "I-20", "US-49"],
    note: "As the state capital, Jackson sits at the I-55/I-20 interchange — some of the busiest and most crash-prone roadway in Mississippi.",
  },
  {
    name: "Madison",
    slug: "madison",
    county: "Madison",
    region: "Jackson Metro",
    highways: ["I-55", "US-51"],
    note: "Madison's stretch of the I-55 corridor sees heavy commuter traffic between the suburbs and downtown Jackson.",
  },
  {
    name: "Ridgeland",
    slug: "ridgeland",
    county: "Madison",
    region: "Jackson Metro",
    highways: ["I-55", "County Line Road"],
    note: "Ridgeland's retail corridor along County Line Road and I-55 is a frequent site of intersection and rear-end collisions.",
  },
  {
    name: "Brandon",
    slug: "brandon",
    county: "Rankin",
    region: "Jackson Metro",
    highways: ["I-20", "US-80"],
    note: "Brandon's growth along the I-20 and US-80 corridors east of Jackson has brought heavier traffic and more serious wrecks.",
  },
  {
    name: "Pearl",
    slug: "pearl",
    county: "Rankin",
    region: "Jackson Metro",
    highways: ["I-20", "US-49"],
    note: "Pearl sits where I-20 meets US-49 near the Jackson airport, mixing commuter, commercial, and truck traffic.",
  },
  {
    name: "Flowood",
    slug: "flowood",
    county: "Rankin",
    region: "Jackson Metro",
    highways: ["Lakeland Drive (MS-25)", "I-20"],
    note: "Flowood's busy Lakeland Drive medical and retail district is a hotspot for parking-lot and intersection crashes.",
  },
  {
    name: "Clinton",
    slug: "clinton",
    county: "Hinds",
    region: "Jackson Metro",
    highways: ["I-20", "US-80"],
    note: "Clinton's position on I-20 west of Jackson puts residents on a heavily traveled interstate every day.",
  },
  {
    name: "Hattiesburg",
    slug: "hattiesburg",
    county: "Forrest",
    region: "Pine Belt",
    highways: ["I-59", "US-49", "US-98"],
    note: "Known as the Hub City, Hattiesburg's convergence of I-59, US-49, and US-98 funnels regional traffic through Forrest County.",
  },
  {
    name: "Gulfport",
    slug: "gulfport",
    county: "Harrison",
    region: "Gulf Coast",
    highways: ["I-10", "US-49", "US-90"],
    note: "Gulfport's mix of interstate, port, and coastal Highway 90 traffic produces frequent and often severe collisions.",
  },
  {
    name: "Biloxi",
    slug: "biloxi",
    county: "Harrison",
    region: "Gulf Coast",
    highways: ["I-10", "US-90"],
    note: "Biloxi's casino corridor along US-90 draws heavy out-of-town and nighttime traffic on the Gulf Coast.",
  },
  {
    name: "Meridian",
    slug: "meridian",
    county: "Lauderdale",
    region: "East Mississippi",
    highways: ["I-20", "I-59"],
    note: "Meridian sits at the I-20/I-59 junction, a major freight route where truck and car traffic meet.",
  },
  {
    name: "Tupelo",
    slug: "tupelo",
    county: "Lee",
    region: "North Mississippi",
    highways: ["US-78 (I-22)", "US-45", "Natchez Trace Parkway"],
    note: "Tupelo's role as a North Mississippi commercial hub along I-22 brings steady regional and commercial traffic.",
  },
  {
    name: "Vicksburg",
    slug: "vicksburg",
    county: "Warren",
    region: "Southwest Mississippi",
    highways: ["I-20", "US-61"],
    note: "Vicksburg's I-20 Mississippi River crossing and US-61 corridor carry significant interstate and truck traffic.",
  },
  {
    name: "Natchez",
    slug: "natchez",
    county: "Adams",
    region: "Southwest Mississippi",
    highways: ["US-61", "US-84"],
    note: "Natchez anchors the southwest corner of the state where US-61 and US-84 meet along the Mississippi River.",
  },
];

export const cityBySlug = (slug: string): City | undefined =>
  cities.find((c) => c.slug === slug);

// Cities grouped by region, for tidy display on the "Areas We Serve" index.
export const citiesByRegion = (): Record<string, City[]> => {
  const groups: Record<string, City[]> = {};
  for (const c of cities) (groups[c.region] ??= []).push(c);
  return groups;
};
