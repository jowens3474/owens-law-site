// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the firm. Edit these values and the whole site
// updates. Items marked PLACEHOLDER must be replaced with real, verified info
// before launch — especially phone, address, bar number, results, and reviews.
// Mississippi Bar advertising rules require that results be truthful and not
// misleading, and that the ad identify a responsible attorney.
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  name: "Owens Injury Law",
  shortName: "Owens Injury Law",
  attorney: "Jason Owens",
  // PLACEHOLDER: confirm the live domain (Vercel + new domain).
  url: "https://www.owensinjurylaw.com",
  tagline: "Mississippi personal injury attorneys",
  heroline: "Hurt in a wreck? We make the at-fault driver pay.",
  description:
    "Owens Injury Law represents people seriously hurt in car, truck, and motorcycle wrecks across Mississippi. No fee unless we win. Free, no-pressure case review — call today.",

  // Contact — PLACEHOLDERS, replace with the firm's real details.
  phone: "(601) 555-0100",
  phoneHref: "tel:+16015550100",
  email: "jason@owensowens.com",
  address: {
    street: "123 Capitol Street, Suite 400",
    city: "Jackson",
    state: "MS",
    zip: "39201",
  },
  // Used for the Google Maps embed/links and LocalBusiness geo. PLACEHOLDER.
  geo: { lat: 32.2988, lng: -90.1848 },

  // Trust signals shown across the site.
  stats: {
    yearsExperience: "25+",
    casesHandled: "2,000+",
    feePromise: "No fee unless we win",
  },

  founded: 2026,
} as const;

// Cities/areas served — fuels local SEO and the "areas we serve" section.
export const serviceAreas = [
  "Jackson",
  "Madison",
  "Ridgeland",
  "Brandon",
  "Pearl",
  "Flowood",
  "Clinton",
  "Hattiesburg",
  "Gulfport",
  "Biloxi",
  "Meridian",
  "Tupelo",
  "Vicksburg",
  "Natchez",
] as const;

export interface PracticeArea {
  slug: string;
  name: string;
  short: string; // card blurb
  headline: string; // page H1 support
  summary: string; // intro paragraph
  bullets: string[]; // "we handle" list
}

export const practiceAreas: PracticeArea[] = [
  {
    slug: "car-accidents",
    name: "Car Accidents",
    short:
      "Rear-end, T-bone, distracted, and drunk-driving wrecks across Mississippi.",
    headline: "Mississippi Car Accident Lawyers",
    summary:
      "A car wreck can upend your life in seconds — medical bills, a totaled vehicle, time off work, and an insurance company that wants to pay you as little as possible. We deal with the adjusters so you can focus on healing, and we fight for every dollar you are owed.",
    bullets: [
      "Rear-end and intersection collisions",
      "Distracted and texting-driver crashes",
      "Drunk and impaired driving wrecks",
      "Hit-and-run and uninsured/underinsured motorist claims",
      "Totaled vehicles, medical bills, and lost wages",
    ],
  },
  {
    slug: "truck-accidents",
    name: "Truck & 18-Wheeler Wrecks",
    short:
      "Commercial trucking crashes involving serious injuries and complex liability.",
    headline: "Mississippi Truck & 18-Wheeler Accident Lawyers",
    summary:
      "Crashes with commercial trucks cause some of the most devastating injuries on Mississippi highways. Trucking companies send investigators to the scene within hours — you need someone moving just as fast to preserve the black-box data, logs, and evidence that prove fault.",
    bullets: [
      "18-wheeler and tractor-trailer collisions",
      "Fatigued and hours-of-service violations",
      "Improperly loaded or overweight trucks",
      "Trucking company and insurer liability",
      "Black-box (ECM) and driver-log preservation",
    ],
  },
  {
    slug: "motorcycle-accidents",
    name: "Motorcycle Accidents",
    short: "Protecting riders against biased insurers after serious crashes.",
    headline: "Mississippi Motorcycle Accident Lawyers",
    summary:
      "Riders are too often blamed for crashes that were not their fault. We push back on the bias, build the case for what really happened, and pursue full compensation for catastrophic road injuries.",
    bullets: [
      "Left-turn and lane-change collisions",
      "Catastrophic road-rash and orthopedic injuries",
      "Helmet and 'rider fault' defense rebuttals",
      "Property damage to your bike and gear",
    ],
  },
  {
    slug: "wrongful-death",
    name: "Wrongful Death",
    short:
      "Compassionate, determined representation for grieving Mississippi families.",
    headline: "Mississippi Wrongful Death Lawyers",
    summary:
      "Nothing can replace a loved one. When a death is caused by someone else's negligence, Mississippi law allows the family to seek justice and financial security. We handle these cases with the care they deserve while holding the responsible parties accountable.",
    bullets: [
      "Fatal car, truck, and motorcycle wrecks",
      "Loss of companionship, support, and income",
      "Funeral and final medical expenses",
      "Claims on behalf of the estate and heirs",
    ],
  },
  {
    slug: "catastrophic-injury",
    name: "Catastrophic Injury",
    short:
      "Life-altering injuries that demand lifetime care and maximum compensation.",
    headline: "Mississippi Catastrophic Injury Lawyers",
    summary:
      "When an injury changes everything — a spinal cord injury, traumatic brain injury, amputation, or severe burns — the compensation has to account for a lifetime of care. We build cases with the medical and economic experts needed to prove the full, long-term cost.",
    bullets: [
      "Traumatic brain and spinal cord injuries",
      "Amputations and severe burns",
      "Lifetime medical care and lost earning capacity",
      "Life-care planning and expert economic analysis",
    ],
  },
  {
    slug: "premises-liability",
    name: "Slip & Fall / Premises",
    short:
      "Injuries on unsafe property — stores, apartments, and businesses.",
    headline: "Mississippi Premises Liability & Slip-and-Fall Lawyers",
    summary:
      "Property owners have a duty to keep their premises reasonably safe. When they ignore a hazard and someone gets hurt, we hold them accountable for the harm they caused.",
    bullets: [
      "Slip, trip, and fall injuries",
      "Unsafe stairs, walkways, and parking lots",
      "Negligent security and assault claims",
      "Store, restaurant, and apartment-complex hazards",
    ],
  },
];

export const practiceAreaBySlug = (slug: string): PracticeArea | undefined =>
  practiceAreas.find((p) => p.slug === slug);

export interface Result {
  amount: string;
  type: string;
  blurb: string;
}

// PLACEHOLDER results. Replace with real, verifiable case results or delete.
// Each result on the live site should be true and accompanied by the disclaimer
// in the footer ("Past results do not guarantee a similar outcome.").
export const results: Result[] = [
  {
    amount: "$1.2M",
    type: "Trucking Collision",
    blurb:
      "Recovery for a client with spinal injuries after an 18-wheeler ran a red light. (Illustrative — replace with verified result.)",
  },
  {
    amount: "$750K",
    type: "Car Accident",
    blurb:
      "Settlement for a family rear-ended by a distracted driver. (Illustrative — replace with verified result.)",
  },
  {
    amount: "$2.5M",
    type: "Wrongful Death",
    blurb:
      "Recovery for the family of a motorist killed by an impaired driver. (Illustrative — replace with verified result.)",
  },
];

export interface Review {
  name: string;
  location: string;
  rating: number;
  quote: string;
}

// PLACEHOLDER reviews. Replace with real client testimonials (with permission).
export const reviews: Review[] = [
  {
    name: "Sample Client",
    location: "Jackson, MS",
    rating: 5,
    quote:
      "They handled everything with the insurance company and kept me updated every step of the way. (Replace with a real testimonial.)",
  },
  {
    name: "Sample Client",
    location: "Madison, MS",
    rating: 5,
    quote:
      "After my wreck I didn't know where to turn. They got me far more than the insurance company first offered. (Replace with a real testimonial.)",
  },
  {
    name: "Sample Client",
    location: "Brandon, MS",
    rating: 5,
    quote:
      "Honest, responsive, and genuinely cared about my recovery. (Replace with a real testimonial.)",
  },
];

// Full list (used in the footer). The header uses the leaner `primaryNav`.
export const nav = [
  { label: "Home", href: "/" },
  { label: "Practice Areas", href: "/practice-areas" },
  { label: "Areas We Serve", href: "/areas-we-serve" },
  { label: "Results", href: "/results" },
  { label: "Reviews", href: "/reviews" },
  { label: "About", href: "/about" },
  { label: "For Attorneys", href: "/for-attorneys" },
  { label: "Contact", href: "/contact" },
] as const;

// Trimmed set shown in the desktop header so it doesn't overflow.
export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Practice Areas", href: "/practice-areas" },
  { label: "Areas We Serve", href: "/areas-we-serve" },
  { label: "Results", href: "/results" },
  { label: "About", href: "/about" },
  { label: "For Attorneys", href: "/for-attorneys" },
] as const;
