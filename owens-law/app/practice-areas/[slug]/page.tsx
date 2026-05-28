import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  practiceAreas,
  practiceAreaBySlug,
  faqsForPractice,
  site,
} from "@/lib/site";
import { absoluteUrl } from "@/lib/seo";
import CtaBand from "../../components/CtaBand";
import FaqSection from "../../components/FaqSection";

export function generateStaticParams() {
  return practiceAreas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = practiceAreaBySlug(slug);
  if (!area) return {};
  return {
    title: area.headline,
    description: area.summary.slice(0, 155),
    alternates: { canonical: `/practice-areas/${area.slug}` },
    openGraph: {
      title: `${area.headline} | ${site.name}`,
      description: area.summary.slice(0, 155),
      url: absoluteUrl(`/practice-areas/${area.slug}`),
    },
  };
}

export default async function PracticeAreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = practiceAreaBySlug(slug);
  if (!area) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
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
    ],
  };

  const others = practiceAreas.filter((p) => p.slug !== area.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
            / <span className="text-gold">{area.name}</span>
          </nav>
          <h1 className="mt-4 font-serif text-4xl font-black sm:text-5xl">
            {area.headline}
          </h1>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-14">
        <p className="text-lg leading-relaxed text-ink">{area.summary}</p>

        <h2 className="mt-10 font-serif text-2xl font-bold text-navy">
          Cases we handle
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
            Talk to {site.attorney} for free
          </h2>
          <p className="mt-2 text-muted">
            There’s no cost to find out what your case is worth, and no fee
            unless we win. Call{" "}
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

        <h2 className="mt-12 font-serif text-2xl font-bold text-navy">
          Other practice areas
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {others.map((p) => (
            <Link
              key={p.slug}
              href={`/practice-areas/${p.slug}`}
              className="rounded-full border border-rule bg-paper px-4 py-1.5 text-sm text-ink hover:border-gold hover:text-gold-dark"
            >
              {p.name}
            </Link>
          ))}
        </div>

        <FaqSection
          faqs={faqsForPractice(area.slug)}
          heading={`${area.name}: frequently asked questions`}
        />
      </article>

      <CtaBand />
    </>
  );
}
