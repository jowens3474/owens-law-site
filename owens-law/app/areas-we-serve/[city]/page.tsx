import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cities, cityBySlug } from "@/lib/locations";
import { practiceAreas, site } from "@/lib/site";
import { absoluteUrl } from "@/lib/seo";
import CtaBand from "../../components/CtaBand";

export function generateStaticParams() {
  return cities.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const loc = cityBySlug(city);
  if (!loc) return {};

  const title = `${loc.name}, MS Personal Injury Lawyer`;
  const description = `Injured in ${loc.name}, Mississippi? ${site.name} handles car wrecks, truck accidents, and wrongful death across ${loc.county} County. Free case review — no fee unless we win.`;
  return {
    title,
    description,
    alternates: { canonical: `/areas-we-serve/${loc.slug}` },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: absoluteUrl(`/areas-we-serve/${loc.slug}`),
    },
  };
}

export default async function CityHubPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const loc = cityBySlug(city);
  if (!loc) notFound();

  const path = `/areas-we-serve/${loc.slug}`;
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
            name: "Areas We Serve",
            item: absoluteUrl("/areas-we-serve"),
          },
          { "@type": "ListItem", position: 3, name: loc.name, item: absoluteUrl(path) },
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
      },
    ],
  };

  const nearby = cities.filter((c) => c.region === loc.region && c.slug !== loc.slug);

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
            <Link href="/areas-we-serve" className="hover:text-gold">
              Areas We Serve
            </Link>{" "}
            / <span className="text-gold">{loc.name}</span>
          </nav>
          <h1 className="mt-4 font-serif text-4xl font-black sm:text-5xl">
            {loc.name}, Mississippi Personal Injury Lawyers
          </h1>
          <p className="mt-3 text-white/75">
            Serving {loc.name} and {loc.county} County · No fee unless we win
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-14">
        <p className="text-lg leading-relaxed text-ink">
          {site.name} represents people seriously injured in and around{" "}
          {loc.name}, Mississippi. {loc.note} If someone else&apos;s negligence
          hurt you or someone you love, we&apos;ll take on the insurance company
          and fight for everything you&apos;re owed — and you pay no attorney fee
          unless we win.
        </p>

        <h2 className="mt-10 font-serif text-2xl font-bold text-navy">
          How we help injured people in {loc.name}
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {practiceAreas.map((p) => (
            <Link
              key={p.slug}
              href={`/practice-areas/${p.slug}/${loc.slug}`}
              className="group rounded-lg border border-rule bg-paper p-5 transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-md"
            >
              <h3 className="font-serif text-lg font-bold text-navy group-hover:text-gold-dark">
                {p.name} in {loc.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{p.short}</p>
            </Link>
          ))}
        </div>

        {nearby.length > 0 && (
          <>
            <h2 className="mt-12 font-serif text-xl font-bold text-navy">
              Also serving the {loc.region}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {nearby.map((c) => (
                <Link
                  key={c.slug}
                  href={`/areas-we-serve/${c.slug}`}
                  className="rounded-full border border-rule bg-surface px-4 py-1.5 text-sm text-ink hover:border-gold hover:text-gold-dark"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </article>

      <CtaBand heading={`Hurt in ${loc.name}? Let's talk — free.`} />
    </>
  );
}
