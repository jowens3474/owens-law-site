import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  practiceAreas,
  practiceAreaBySlug,
  practiceFaqs,
  site,
  type Faq,
} from "@/lib/site";
import { cities, cityBySlug } from "@/lib/locations";
import { absoluteUrl } from "@/lib/seo";
import CtaBand from "../../../components/CtaBand";
import FaqSection from "../../../components/FaqSection";

export function generateStaticParams() {
  return practiceAreas.flatMap((p) =>
    cities.map((c) => ({ slug: p.slug, city: c.slug })),
  );
}

// Keep the practice-area name in a phrase like "Car Accident Lawyer".
function lawyerPhrase(name: string): string {
  return name
    .replace(/&.*$/, "") // drop "& 18-Wheeler Wrecks" etc.
    .replace(/Wrecks?|Accidents?/i, "Accident")
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}): Promise<Metadata> {
  const { slug, city } = await params;
  const area = practiceAreaBySlug(slug);
  const loc = cityBySlug(city);
  if (!area || !loc) return {};

  const title = `${loc.name}, MS ${lawyerPhrase(area.name)} Lawyer`;
  const description = `${area.name.replace(/&.*/, "").trim()} attorney serving ${loc.name} and ${loc.county} County, Mississippi. No fee unless we win — free case review. Call ${site.phone}.`;
  return {
    title,
    description,
    alternates: { canonical: `/practice-areas/${area.slug}/${loc.slug}` },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: absoluteUrl(`/practice-areas/${area.slug}/${loc.slug}`),
    },
  };
}

export default async function PracticeCityPage({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}) {
  const { slug, city } = await params;
  const area = practiceAreaBySlug(slug);
  const loc = cityBySlug(city);
  if (!area || !loc) notFound();

  const phrase = lawyerPhrase(area.name);
  const path = `/practice-areas/${area.slug}/${loc.slug}`;
  const lower = phrase.toLowerCase();

  // City-specific questions keep each page distinct, prefixed with the
  // practice-specific FAQ for real substance.
  const localFaqs: Faq[] = [
    ...(practiceFaqs[area.slug] ?? []),
    {
      q: `How long do I have to file a ${lower} claim in ${loc.name}, Mississippi?`,
      a: "In most Mississippi injury cases the deadline is three years from the date of injury (Miss. Code Ann. § 15-1-49), but some claims — such as those against a city, county, or state agency — have much shorter notice deadlines. Don't wait; call as soon as you can so you don't lose your right to recover.",
    },
    {
      q: `How much does a ${loc.name} ${lower} lawyer cost?`,
      a: `${site.name} works on a contingency fee — no money up front and no attorney fee unless we win your case. Your consultation is always free.`,
    },
    {
      q: `Can I still recover if I was partly at fault for a ${lower} in ${loc.name}?`,
      a: "Likely yes. Mississippi's pure comparative negligence rule lets you recover even if you were partially at fault — your compensation is simply reduced by your percentage of fault.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          {
            "@type": "ListItem",
            position: 2,
            name: "Practice Areas",
            item: absoluteUrl("/practice-areas"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: area.name,
            item: absoluteUrl(`/practice-areas/${area.slug}`),
          },
          { "@type": "ListItem", position: 4, name: loc.name, item: absoluteUrl(path) },
        ],
      },
      {
        "@type": ["LegalService", "Attorney"],
        name: `${site.name} — ${loc.name}, MS`,
        url: absoluteUrl(path),
        telephone: site.phone,
        priceRange: "Free Consultation — No Fee Unless We Win",
        areaServed: [
          { "@type": "City", name: `${loc.name}, Mississippi` },
          { "@type": "AdministrativeArea", name: `${loc.county} County, Mississippi` },
        ],
        knowsAbout: area.name,
      },
    ],
  };

  // Same practice area in nearby cities, and the other practice areas here.
  const otherCities = cities.filter((c) => c.slug !== loc.slug).slice(0, 8);
  const otherAreas = practiceAreas.filter((p) => p.slug !== area.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <nav className="text-xs uppercase tracking-wider text-white/60">
            <Link href="/" className="hover:text-gold">
              Home
            </Link>{" "}
            /{" "}
            <Link href="/practice-areas" className="hover:text-gold">
              Practice Areas
            </Link>{" "}
            /{" "}
            <Link href={`/practice-areas/${area.slug}`} className="hover:text-gold">
              {area.name}
            </Link>{" "}
            / <span className="text-gold">{loc.name}</span>
          </nav>
          <h1 className="mt-4 font-serif text-4xl font-black leading-tight sm:text-5xl">
            {loc.name}, Mississippi {phrase} Lawyers
          </h1>
          <p className="mt-3 text-white/75">
            Serving {loc.name} and all of {loc.county} County · No fee unless we
            win
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-14">
        {/* Local-specific intro (unique per city via the locations dataset) */}
        <p className="text-lg leading-relaxed text-ink">
          If you&apos;ve been hurt in a {phrase.toLowerCase()} in {loc.name},{" "}
          {site.name} is ready to help. {loc.note} When a crash leaves you
          injured, the at-fault driver&apos;s insurance company will move fast to
          limit what they pay you — and you deserve someone moving just as fast
          for you.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink">
          {area.summary}
        </p>

        <div className="mt-8 rounded-lg border border-rule bg-surface p-5 text-sm text-muted">
          <p>
            <strong className="text-ink">Local note:</strong> {loc.name} sits
            along {loc.highways.join(", ")}. Cases for {loc.county} County
            residents are generally handled in the {loc.county} County courts,
            and we represent injured people throughout the {loc.region} area.
          </p>
        </div>

        <h2 className="mt-10 font-serif text-2xl font-bold text-navy">
          {area.name} cases we handle in {loc.name}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {area.bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 rounded border border-rule bg-surface p-3 text-sm text-ink"
            >
              <span className="mt-0.5 font-bold text-gold-dark">✓</span>
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-lg border-l-4 border-gold bg-surface p-6">
          <h2 className="font-serif text-xl font-bold text-navy">
            Free case review for {loc.name} injury victims
          </h2>
          <p className="mt-2 text-muted">
            Find out what your case is worth at no cost and with no obligation —
            and pay no fee unless we win. Call{" "}
            <a href={site.phoneHref} className="font-bold text-gold-dark">
              {site.phone}
            </a>{" "}
            or{" "}
            <Link href="/contact" className="font-bold text-gold-dark">
              request a free case review
            </Link>
            .
          </p>
        </div>

        {/* Internal links: same practice in other cities */}
        <h2 className="mt-12 font-serif text-xl font-bold text-navy">
          {phrase} lawyers in nearby Mississippi cities
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {otherCities.map((c) => (
            <Link
              key={c.slug}
              href={`/practice-areas/${area.slug}/${c.slug}`}
              className="rounded-full border border-rule bg-paper px-4 py-1.5 text-sm text-ink hover:border-gold hover:text-gold-dark"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Internal links: other practice areas in this city */}
        <h2 className="mt-10 font-serif text-xl font-bold text-navy">
          Other ways we help injured people in {loc.name}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {otherAreas.map((p) => (
            <Link
              key={p.slug}
              href={`/practice-areas/${p.slug}/${loc.slug}`}
              className="rounded-full border border-rule bg-paper px-4 py-1.5 text-sm text-ink hover:border-gold hover:text-gold-dark"
            >
              {p.name}
            </Link>
          ))}
        </div>

        <FaqSection
          faqs={localFaqs}
          heading={`${phrase} claims in ${loc.name}: FAQs`}
        />
      </article>

      <CtaBand heading={`Hurt in ${loc.name}? Let's talk — free.`} />
    </>
  );
}
