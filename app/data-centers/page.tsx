import type { Metadata } from "next";
import Link from "next/link";
import {
  getPostsByTag,
  formatDate,
  readingTime,
} from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import ArticleImage from "@/app/components/ArticleImage";
import CategoryTag from "@/app/components/CategoryTag";

export const revalidate = 600;

const DEK =
  "Mississippi went from two announced data center projects to seven in a year. The Wire is tracking every one, every hearing, every regulatory filing.";

const FACTS = [
  { label: "Projects in metro Jackson", value: "7 announced" },
  { label: "Largest disclosed investment", value: "$25B+ (AWS, Madison)" },
  { label: "Next major decision", value: "Jun 24 · Saxum rezoning vote" },
  { label: "Open PSC docket", value: "2026-AD-10 (Prado AI)" },
];

const PROJECTS = [
  {
    name: "Saxum (Northwest Jackson)",
    developer: "Saxum Investment Company",
    location: "230 acres south of Forest Ave, between I-220 and Medgar Evers Blvd",
    status: "Rezoning request before Jackson Planning Board",
    nextDate: "Jun 24, 2026 — board reconsiders application",
  },
  {
    name: "Prado AI (location undisclosed)",
    developer: "Prado AI / Gabriel Prado",
    location: "Ridgeland or undisclosed Jackson metro site",
    status: "Pursuing off-grid permit after PSC declined declaratory ruling",
    nextDate: "Permit application pending; opposed by Miss. Power, Entergy",
  },
  {
    name: "AWS Madison County campuses",
    developer: "Amazon Web Services",
    location: "Madison County, Ridgeland, Clinton, Warren County",
    status: "Announced — ~$25B disclosed investment",
    nextDate: "Construction ongoing",
  },
];

const KEY_DATES: { date: string; text: string; highlight?: boolean }[] = [
  {
    date: "Apr 2026",
    text: "Prado AI files PSC Docket 2026-AD-10 seeking off-grid power-plant ruling.",
  },
  {
    date: "Late May 2026",
    text: "PSC declines to rule, calling Prado's request \"premature and primarily hypothetical.\" Mississippi Power and Entergy Mississippi intervene.",
  },
  {
    date: "Late May 2026",
    text: "Saxum files rezoning request for 230 acres in northwest Jackson. Planning Board meeting draws protesters.",
  },
  {
    date: "Early Jun 2026",
    text: "Council President Brian Grizzell proposes six-month moratorium on data center construction. Tabled after City Attorney warns of procedural defect.",
    highlight: true,
  },
  {
    date: "Jun 24, 2026",
    text: "Saxum rezoning application returns to Planning Board.",
    highlight: true,
  },
];

const PLAYERS = [
  { name: "Saxum Investment Company", role: "Developer (New Jersey)" },
  { name: "Prado AI / Gabriel Prado", role: "Developer (Jackson)" },
  { name: "Amazon Web Services", role: "Operating four metro campuses" },
  { name: "Mississippi Public Service Commission", role: "State utility regulator" },
  { name: "Mississippi Power", role: "Incumbent utility opposing Prado deregulation" },
  { name: "Entergy Mississippi", role: "Incumbent utility opposing Prado deregulation" },
  { name: "Jackson City Council", role: "Considers zoning and moratorium" },
  { name: "Council President Brian Grizzell", role: "Moratorium sponsor" },
];

export const metadata: Metadata = {
  title: "Data Centers",
  description: DEK,
  alternates: { canonical: "/data-centers" },
  openGraph: {
    type: "website",
    title: `Data Centers — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/data-centers"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `Data Centers — ${site.name}`,
    description: DEK,
  },
};

export default function DataCentersPage() {
  const articles = getPostsByTag("data-centers");
  const latest = articles.slice(0, 4);
  const all = articles;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Data Centers in Jackson, Mississippi",
    description: DEK,
    url: absoluteUrl("/data-centers"),
    hasPart: articles.map((p) => ({
      "@type": "NewsArticle",
      headline: p.title,
      datePublished: p.date,
      url: absoluteUrl(`/article/${p.slug}`),
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <header className="border-b-4 border-double border-ink pb-8">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          The Beat · AI Infrastructure in Mississippi
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black leading-[1.02] sm:text-6xl">
          Data Centers
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-xl italic leading-relaxed text-muted">
          {DEK}
        </p>
      </header>

      {/* At a glance */}
      <section className="mt-8 border-2 border-ink bg-paper p-6">
        <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
          At a glance
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                {f.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-bold">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Active projects */}
      <section className="mt-12">
        <h2 className="mb-5 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          Active Projects
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {PROJECTS.map((p) => (
            <article
              key={p.name}
              className="border-2 border-ink bg-paper p-5"
            >
              <h3 className="font-serif text-xl font-black leading-tight">
                {p.name}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted">
                {p.developer}
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Location
                  </dt>
                  <dd className="mt-0.5">{p.location}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Status
                  </dt>
                  <dd className="mt-0.5">{p.status}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Next
                  </dt>
                  <dd className="mt-0.5 font-bold text-crimson">{p.nextDate}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* Latest coverage */}
      {latest.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between border-b-2 border-ink pb-1">
            <h2 className="font-serif text-2xl font-black uppercase tracking-wide">
              Latest Coverage
            </h2>
            <Link
              href="#all-coverage"
              className="text-xs font-bold uppercase tracking-widest text-crimson hover:text-crimson-dark"
            >
              All articles ↓
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {latest.map((p) => (
              <Link
                key={p.slug}
                href={`/article/${p.slug}`}
                className="group block"
              >
                {p.image && (
                  <ArticleImage
                    post={p}
                    label={p.category}
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="mb-3 aspect-[16/9] w-full"
                  />
                )}
                <CategoryTag category={p.category} />
                <h3 className="mt-1 font-serif text-2xl font-black leading-[1.1] group-hover:text-crimson">
                  {p.title}
                </h3>
                <p className="mt-2 font-serif text-base leading-relaxed text-muted">
                  {p.dek}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-muted">
                  {formatDate(p.date)} · {readingTime(p)} min read
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Key dates */}
      <section className="mt-14">
        <h2 className="mb-5 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          Key Dates
        </h2>
        <ol className="space-y-3 border-l-2 border-rule pl-6">
          {KEY_DATES.map((e, i) => (
            <li
              key={i}
              className={`relative ${e.highlight ? "border-l-4 border-crimson pl-3 -ml-5" : ""}`}
            >
              <p
                className={`font-serif text-xs font-bold uppercase tracking-widest ${
                  e.highlight ? "text-crimson" : "text-muted"
                }`}
              >
                {e.date}
              </p>
              <p className="mt-0.5 font-serif text-base leading-snug">
                {e.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Players */}
      <section className="mt-14">
        <h2 className="mb-5 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          The Players
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PLAYERS.map((p) => (
            <li
              key={p.name}
              className="border border-rule bg-paper p-4"
            >
              <p className="font-serif text-base font-bold">{p.name}</p>
              <p className="mt-0.5 text-sm text-muted">{p.role}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* All coverage */}
      {all.length > 0 && (
        <section id="all-coverage" className="mt-14 scroll-mt-8">
          <h2 className="mb-5 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
            All Coverage
          </h2>
          <ol className="divide-y divide-rule border-y-2 border-ink">
            {all.map((p) => (
              <li key={p.slug} className="py-4">
                <Link
                  href={`/article/${p.slug}`}
                  className="grid grid-cols-[100px_1fr] gap-4 sm:grid-cols-[140px_1fr_auto] hover:text-crimson"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {formatDate(p.date)}
                  </span>
                  <span className="font-serif text-lg font-bold leading-snug">
                    {p.title}
                  </span>
                  <span className="hidden text-xs uppercase tracking-wider text-muted sm:block">
                    {readingTime(p)} min
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">
            {all.length} article{all.length === 1 ? "" : "s"} on data centers in
            metro Jackson. New coverage is added automatically.
          </p>
        </section>
      )}
    </div>
  );
}
