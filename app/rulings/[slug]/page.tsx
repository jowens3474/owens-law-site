import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  courtShort,
  getAllRulings,
  getRelatedRulings,
  getRulingBySlug,
  isScheduledRulingSlug,
  outcomeLabel,
  RULING_SHARE_IMAGE,
} from "@/lib/rulings";
import { formatDate } from "@/lib/posts";
import { capNotFoundLife } from "@/lib/not-found-cap";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import EntrySection from "@/app/components/EntrySection";
import ReadingProgress from "@/app/components/ReadingProgress";
import ShareBar from "@/app/components/ShareBar";

// Rebuilt on every deploy and otherwise served from cache. Each refresh is a
// billed cache write on Vercel, and the daily automated commits redeploy the
// site anyway. A future-dated entry renders on its first visit after its date;
// if its URL is opened early, the not-found render is cached for at most an
// hour (lib/not-found-cap.ts).
export const revalidate = false;

export function generateStaticParams() {
  return getAllRulings().map((ruling) => ({ slug: ruling.slug }));
}

// The root layout's share image is replaced by any page that sets its own
// openGraph or twitter, so each ruling names the image outright.
export async function generateMetadata({
  params,
}: PageProps<"/rulings/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const ruling = getRulingBySlug(slug);
  if (!ruling) return {};
  const url = absoluteUrl(`/rulings/${slug}`);
  return {
    title: `${ruling.title} (${ruling.docket})`,
    description: ruling.oneSentence,
    alternates: { canonical: `/rulings/${slug}` },
    openGraph: {
      type: "article",
      title: ruling.title,
      description: ruling.oneSentence,
      url,
      siteName: site.name,
      publishedTime: `${ruling.date}T12:00:00-05:00`,
      modifiedTime: `${ruling.updated ?? ruling.date}T12:00:00-05:00`,
      section: "What the Courts Decided",
      images: [RULING_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: ruling.title,
      description: ruling.oneSentence,
      images: [RULING_SHARE_IMAGE],
    },
  };
}

export default async function RulingPage({ params }: PageProps<"/rulings/[slug]">) {
  const { slug } = await params;
  const ruling = getRulingBySlug(slug);
  if (!ruling) {
    if (isScheduledRulingSlug(slug)) await capNotFoundLife();
    notFound();
  }

  const url = absoluteUrl(`/rulings/${ruling.slug}`);
  const related = getRelatedRulings(ruling, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: ruling.title,
    description: ruling.oneSentence,
    datePublished: ruling.date,
    dateModified: ruling.updated ?? ruling.date,
    author: { "@type": "Organization", name: site.name, url: absoluteUrl("/") },
    publisher: { "@id": absoluteUrl("/#org") },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    about: {
      "@type": "Thing",
      name: ruling.caseName,
      identifier: ruling.docket,
      url: ruling.opinionUrl,
    },
  };

  const sections = [
    { id: "what-happened", heading: "What happened", paragraphs: ruling.whatHappened },
    { id: "what-the-court-decided", heading: "What the court decided", paragraphs: ruling.whatTheCourtDecided },
    { id: "why-it-matters", heading: "Why it matters", paragraphs: ruling.whyItMatters },
    { id: "for-you", heading: "What changes for you", paragraphs: ruling.whatChangesForYou },
    { id: "jackson", heading: "What it means for Jackson", paragraphs: ruling.jackson },
    { id: "watch-for", heading: "Watch for", paragraphs: ruling.watchFor },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ReadingProgress targetId="ruling" />
      {/* Escape "<" so no text in an entry can close the script tag early
          (the Next.js JSON-LD guide). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav className="mb-6 font-sans text-xs uppercase tracking-widest text-muted">
        <Link href="/" className="hover:text-crimson">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/rulings" className="font-bold text-crimson hover:text-crimson-bright">
          What the Courts Decided
        </Link>
      </nav>

      <article id="ruling">
        <header>
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-crimson">
            {ruling.court} · {ruling.docket}
          </p>
          <h1 className="mt-2 text-balance font-serif text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {ruling.title}
          </h1>
          <p className="mt-4 font-sans text-xl leading-relaxed text-ink">
            {ruling.oneSentence}
          </p>
          <p className="mt-3 font-sans text-sm text-muted">
            The case: <span className="font-semibold text-ink">{ruling.caseName}</span>
            {ruling.citation ? `, ${ruling.citation}` : ""}
          </p>
          <dl className="mt-5 grid gap-x-8 gap-y-3 border-y border-rule py-4 font-sans text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                Decided
              </dt>
              <dd className="mt-0.5 font-semibold">
                <time dateTime={ruling.decided}>{formatDate(ruling.decided)}</time>
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                Result
              </dt>
              <dd className="mt-0.5 font-semibold">
                {outcomeLabel(ruling.outcome)}
                {ruling.appealedFrom && (
                  <span className="block font-normal text-muted">from {ruling.appealedFrom}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                Written by
              </dt>
              <dd className="mt-0.5 font-semibold">
                {ruling.writtenBy}
                <span className="block font-normal text-muted">Vote: {ruling.vote}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                Topics
              </dt>
              <dd className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 font-semibold">
                {ruling.topics.map((t) => (
                  <Link key={t} href={`/rulings?topic=${encodeURIComponent(t)}`} className="hover:text-crimson">
                    {t}
                  </Link>
                ))}
              </dd>
            </div>
          </dl>
          <p className="mt-3 font-sans text-xs uppercase tracking-wider text-muted">
            By {ruling.author} · {formatDate(ruling.date)}
            {ruling.updated && ruling.updated !== ruling.date && (
              <> · Updated {formatDate(ruling.updated)}</>
            )}
          </p>
        </header>

        {sections.map((s) => (
          <EntrySection key={s.id} id={s.id} heading={s.heading} paragraphs={s.paragraphs} />
        ))}

        <aside className="mt-10 border-t border-rule pt-4">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
            Sources
          </p>
          <ul className="mt-2 space-y-1 font-sans text-sm">
            <li>
              <a
                href={ruling.opinionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink hover:text-crimson"
              >
                Read the opinion ↗
              </a>
            </li>
            {ruling.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-ink hover:text-crimson"
                >
                  {s.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {ruling.note && (
          <aside className="mt-6 border-t border-rule pt-4">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              Reporting note
            </p>
            <p className="mt-2 font-sans text-sm text-muted">{ruling.note}</p>
          </aside>
        )}

        <p className="mt-6 border-t border-rule pt-4 font-sans text-sm text-muted">
          A plain-language summary of a court opinion, not legal advice. The
          opinion is the official record.
        </p>

        <footer className="mt-10 border-t border-rule pt-5">
          <ShareBar url={url} title={ruling.title} />
          <p className="mt-5 font-sans text-sm text-muted">
            See something we got wrong, or a consequence we missed?{" "}
            <a href={`mailto:${site.email}`} className="font-semibold text-crimson hover:text-crimson-bright">
              Tell the newsroom.
            </a>
          </p>
        </footer>
      </article>

      {related.length > 0 && (
        <section className="mt-14 border border-rule p-6">
          <h2 className="mb-2 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            More court rulings, explained
          </h2>
          <ul className="divide-y divide-rule">
            {related.map((r) => (
              <li key={r.slug} className="py-3">
                <p className="font-sans text-[0.7rem] font-bold uppercase tracking-wider text-crimson">
                  {courtShort(r.court)} · {r.docket}
                </p>
                <Link href={`/rulings/${r.slug}`} className="font-serif text-lg font-bold leading-snug hover:text-crimson">
                  {r.title}
                </Link>
                <p className="mt-1 line-clamp-2 font-sans text-sm text-muted">{r.oneSentence}</p>
              </li>
            ))}
          </ul>
          <Link href="/rulings" className="mt-3 inline-block font-sans text-xs font-bold uppercase tracking-wide text-crimson hover:text-crimson-bright">
            Every ruling →
          </Link>
        </section>
      )}
    </div>
  );
}
