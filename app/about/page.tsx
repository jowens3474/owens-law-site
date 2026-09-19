import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

const description = `About ${site.name} — independent business, economics, and development reporting from Jackson, Mississippi. Beats, editorial standards, AI policy, corrections, and how to send a tip.`;

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: `About ${site.name}`,
    description,
    url: absoluteUrl("/about"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `About ${site.name}`,
    description,
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="border-b border-rule pb-5">
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">
          About
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
          {site.name}
        </h1>
        <p className="mt-3 font-sans text-xl text-muted">
          {site.tagline}
        </p>
      </header>

      <div className="prose-article mt-8">
        <p>
          {site.name} is an independent newsroom covering business, economics,
          and development in and around {site.city}. We work like a research
          desk: we read the filings, budgets, bond documents, contracts, and
          agendas that decide what gets built and who pays for it, and we
          publish what they say before it turns up in a press release.
        </p>
        <p>
          Two promises. First, information you would not otherwise obtain,
          ahead of the crowd. Second, a clear view of what is coming: the
          projects, votes, rate changes, and deadlines on the calendar, so
          readers can see the metro&rsquo;s next two years before they
          arrive. The{" "}
          <Link
            href="/pipeline"
            className="font-bold text-crimson hover:text-crimson-bright"
          >
            Pipeline
          </Link>{" "}
          is where we keep that calendar.
        </p>
        <p>
          We are reader-supported and beholden to no party, donor, chamber,
          or development authority.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          What we cover
        </h2>
        <ul className="mt-4 space-y-3 text-base leading-relaxed">
          <li>
            <Link
              href="/category/business"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              Business
            </Link>{" "}
            <span className="text-muted">·</span> Companies, deals, jobs, and capital moving through metro Jackson, reported from the filings before the press release.
          </li>
          <li>
            <Link
              href="/category/economy"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              Economy
            </Link>{" "}
            <span className="text-muted">·</span> Budgets, taxes, rates, wages, and the numbers that decide what Jackson can afford.
          </li>
          <li>
            <Link
              href="/category/development"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              Development
            </Link>{" "}
            <span className="text-muted">·</span> What is being built, what is proposed, and what is stuck: projects, permits, incentives, and the votes that move them.
          </li>
          <li>
            <Link
              href="/pipeline"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              The Pipeline
            </Link>{" "}
            <span className="text-muted">·</span> Our running tracker of every project and money decision on the calendar, with the dates that will decide them.
          </li>
          <li>
            <Link
              href="/category/real-estate"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              Real estate
            </Link>{" "}
            <span className="text-muted">·</span> Home sales, rents, land, and the neighborhoods on the move.
          </li>
          <li>
            <Link
              href="/data-centers"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              Data Centers
            </Link>{" "}
            <span className="text-muted">·</span> The AI-infrastructure rush into Mississippi: Saxum, Prado AI, AWS, and the water, power, and zoning fights that come with it.
          </li>
          <li>
            <Link
              href="/category/politics"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              Politics
            </Link>{" "}
            <span className="text-muted">·</span> City Hall, the county, the Capitol, and the money behind the votes.
          </li>
          <li>
            <Link
              href="/corruption-case"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              Corruption Case Archive
            </Link>{" "}
            <span className="text-muted">·</span> The federal case against DA Jody Owens, former Mayor Chokwe Antar Lumumba, and former Councilman Aaron Banks, from indictment through the guilty pleas and sentencing.
          </li>
          <li>
            <Link
              href="/explainers"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              Explainers
            </Link>{" "}
            <span className="text-muted">·</span> Background pieces, profiles, and analysis for anyone arriving mid-story.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          How we work
        </h2>
        <div className="prose-article mt-4">
          <p>
            <strong>Attribution.</strong> Every concrete claim &mdash; names,
            dates, dollar figures, quotes, court rulings, vote counts &mdash;
            is sourced in-line, by outlet, in the article itself. If we got it
            from Mississippi Today or WLBT or a court filing, we say so on the
            same page.
          </p>
          <p>
            <strong>Original documents over press summaries.</strong> When
            possible, we read the court filing, the city agenda, or the
            regulatory order directly and link to it. The Wire&rsquo;s value
            is helping readers understand the document, not paraphrasing
            someone else&rsquo;s read of it.
          </p>
          <p>
            <strong>AI assistance, with disclosure.</strong> The Wire uses
            AI tools for research synthesis and drafting on certain articles.
            Every piece on this site is published under the editorial
            judgment of the publisher: the topic, the framing, the facts
            checked against primary sources, and the decision to publish are
            human calls. If you ever see something on the Wire that looks
            like a hallucination or a fabricated quote, write us &mdash; we
            want to know immediately.
          </p>
          <p>
            <strong>Sources are protected.</strong> If you send a tip or a
            document, your identity stays with the Wire. We will publish or
            redact at your request.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          Corrections &amp; methodology
        </h2>
        <p className="mt-4 text-base leading-relaxed">
          When we get something wrong, we fix it at the top of the affected
          article and append a dated correction note. We do not quietly
          edit. The public list of every correction we&rsquo;ve issued is at{" "}
          <Link
            href="/corrections"
            className="font-bold text-crimson hover:text-crimson-bright"
          >
            /corrections
          </Link>
          .
        </p>
        <p className="mt-3 text-base leading-relaxed">
          For the long-form version of how a Wire article is built &mdash;
          source policy, AI disclosure, what we monitor, what we don&rsquo;t
          do &mdash; see{" "}
          <Link
            href="/methodology"
            className="font-bold text-crimson hover:text-crimson-bright"
          >
            /methodology
          </Link>
          .
        </p>
        <p className="mt-3 text-base leading-relaxed">
          To request a correction, email{" "}
          <a
            href={`mailto:${site.email}?subject=Correction%20request`}
            className="font-bold text-crimson hover:text-crimson-bright"
          >
            {site.email}
          </a>{" "}
          with a link to the article and the specific factual error.
        </p>
      </section>

      <section className="mt-12 border border-rule bg-paper p-6">
        <h2 className="font-serif text-2xl font-bold">Send us a tip</h2>
        <p className="mt-2 font-sans text-muted">
          Leaked documents, a meeting we should be at, or a number that does
          not add up? We protect our sources and read everything.
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-4 inline-block bg-ink px-5 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson"
        >
          {site.email}
        </a>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          Who runs the Wire
        </h2>
        <div className="prose-article mt-4">
          <p>
            Every article is published under the editorial responsibility of{" "}
            <Link
              href={site.editor.path}
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              {site.editor.name}
            </Link>
            , the Wire&rsquo;s editor of record. The byline reads
            &ldquo;Jackson Wire Staff&rdquo; because the drafting is
            AI-assisted; the judgment about what to cover, what the documents
            say, and what to publish is his.
          </p>
        </div>
      </section>
    </div>
  );
}
