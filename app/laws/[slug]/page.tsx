import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllLaws,
  getLawBySlug,
  getRelatedLaws,
  isInEffect,
  billHistoryUrl,
  becameLawLabel,
} from "@/lib/laws";
import { formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import ReadingProgress from "@/app/components/ReadingProgress";
import ShareBar from "@/app/components/ShareBar";

// Refresh every 10 minutes so scheduled entries render on schedule.
export const revalidate = 600;

export function generateStaticParams() {
  return getAllLaws().map((law) => ({ slug: law.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/laws/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const law = getLawBySlug(slug);
  if (!law) return {};
  const url = absoluteUrl(`/laws/${slug}`);
  return {
    title: `${law.title} (${law.bill})`,
    description: law.oneSentence,
    alternates: { canonical: `/laws/${slug}` },
    openGraph: {
      type: "article",
      title: law.title,
      description: law.oneSentence,
      url,
      siteName: site.name,
      publishedTime: `${law.date}T12:00:00-05:00`,
      modifiedTime: `${law.updated ?? law.date}T12:00:00-05:00`,
      section: "What Passed",
    },
    twitter: {
      card: "summary_large_image",
      title: law.title,
      description: law.oneSentence,
    },
  };
}

function Section({
  id,
  heading,
  paragraphs,
}: {
  id: string;
  heading: string;
  paragraphs?: string[];
}) {
  if (!paragraphs || paragraphs.length === 0) return null;
  return (
    <section id={id} className="mt-9 scroll-mt-16">
      <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
        {heading}
      </h2>
      <div className="prose-plain mt-4">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

export default async function LawPage({ params }: PageProps<"/laws/[slug]">) {
  const { slug } = await params;
  const law = getLawBySlug(slug);
  if (!law) notFound();

  const url = absoluteUrl(`/laws/${law.slug}`);
  const live = isInEffect(law);
  const related = getRelatedLaws(law, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: law.title,
    description: law.oneSentence,
    datePublished: law.date,
    dateModified: law.updated ?? law.date,
    author: { "@type": "Organization", name: site.name, url: absoluteUrl("/") },
    publisher: { "@id": absoluteUrl("/#org") },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    about: {
      "@type": "Legislation",
      name: law.officialTitle ? `${law.officialTitle} (${law.bill})` : `${law.bill}, ${law.session}`,
      legislationIdentifier: law.bill,
      legislationDate: law.signedOn ?? law.effective,
      legislationJurisdiction: { "@type": "AdministrativeArea", name: "Mississippi" },
      url: billHistoryUrl(law),
    },
  };

  const sections = [
    { id: "what-it-does", heading: "What it does", paragraphs: law.whatItDoes },
    { id: "why-it-happened", heading: "Why it happened", paragraphs: law.whyItHappened },
    { id: "behind-it", heading: "What's behind it", paragraphs: law.whatsBehindIt },
    { id: "what-it-costs", heading: "What it costs, and who pays", paragraphs: law.whatItCosts },
    { id: "for-you", heading: "What changes for you", paragraphs: law.whatChangesForYou },
    { id: "jackson", heading: "What it means for Jackson", paragraphs: law.jackson },
    { id: "watch-for", heading: "Watch for", paragraphs: law.watchFor },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ReadingProgress targetId="law" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-6 font-sans text-xs uppercase tracking-widest text-muted">
        <Link href="/" className="hover:text-crimson">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href="/laws" className="font-bold text-crimson hover:text-crimson-bright">
          What Passed
        </Link>
      </nav>

      <article id="law">
        <header>
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-crimson">
            {law.bill} · {law.session}
            {law.officialTitle ? ` · ${law.officialTitle}` : ""}
          </p>
          <h1 className="mt-2 text-balance font-serif text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {law.title}
          </h1>
          <p className="mt-4 font-sans text-xl leading-relaxed text-ink">
            {law.oneSentence}
          </p>
          <dl className="mt-5 grid gap-x-8 gap-y-3 border-y border-rule py-4 font-sans text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                {live ? "In effect since" : "Takes effect"}
              </dt>
              <dd className="mt-0.5 font-semibold">
                <time dateTime={law.effective}>{formatDate(law.effective)}</time>
                {law.effectiveNote && (
                  <span className="block font-normal text-muted">{law.effectiveNote}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                How it became law
              </dt>
              <dd className="mt-0.5 font-semibold">
                {becameLawLabel(law)}
                {law.signedOn && (
                  <span className="block font-normal text-muted">
                    <time dateTime={law.signedOn}>{formatDate(law.signedOn)}</time>
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                Topics
              </dt>
              <dd className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 font-semibold">
                {law.topics.map((t) => (
                  <Link key={t} href={`/laws?topic=${encodeURIComponent(t)}`} className="hover:text-crimson">
                    {t}
                  </Link>
                ))}
              </dd>
            </div>
          </dl>
          <p className="mt-3 font-sans text-xs uppercase tracking-wider text-muted">
            By {law.author} · {formatDate(law.date)}
            {law.updated && law.updated !== law.date && (
              <> · Updated {formatDate(law.updated)}</>
            )}
          </p>
        </header>

        {sections.map((s) => (
          <Section key={s.id} id={s.id} heading={s.heading} paragraphs={s.paragraphs} />
        ))}

        <aside className="mt-10 border-t border-rule pt-4">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
            Sources
          </p>
          <ul className="mt-2 space-y-1 font-sans text-sm">
            <li>
              <a
                href={billHistoryUrl(law)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink hover:text-crimson"
              >
                {`${law.bill} on the Legislature's website ↗`}
              </a>
            </li>
            {law.sources.map((s) => (
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

        {law.note && (
          <aside className="mt-6 border-t border-rule pt-4">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              Reporting note
            </p>
            <p className="mt-2 font-sans text-sm text-muted">{law.note}</p>
          </aside>
        )}

        <footer className="mt-10 border-t border-rule pt-5">
          <ShareBar url={url} title={law.title} />
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
            More laws, explained
          </h2>
          <ul className="divide-y divide-rule">
            {related.map((r) => (
              <li key={r.slug} className="py-3">
                <p className="font-sans text-[0.7rem] font-bold uppercase tracking-wider text-crimson">
                  {r.bill}
                </p>
                <Link href={`/laws/${r.slug}`} className="font-serif text-lg font-bold leading-snug hover:text-crimson">
                  {r.title}
                </Link>
                <p className="mt-1 line-clamp-2 font-sans text-sm text-muted">{r.oneSentence}</p>
              </li>
            ))}
          </ul>
          <Link href="/laws" className="mt-3 inline-block font-sans text-xs font-bold uppercase tracking-wide text-crimson hover:text-crimson-bright">
            Every law →
          </Link>
        </section>
      )}
    </div>
  );
}
