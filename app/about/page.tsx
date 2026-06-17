import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

const description = `About ${site.name} — independent local news from Jackson, Mississippi. Beats, editorial standards, AI policy, corrections, and how to send a tip.`;

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
      <header className="border-b-4 border-double border-ink pb-5">
        <p className="font-serif text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">
          About
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
          {site.name}
        </h1>
        <p className="mt-3 font-serif text-xl italic text-muted">
          {site.tagline}
        </p>
      </header>

      <div className="prose-article mt-8">
        <p>
          {site.name} is an independent newsroom covering government, courts,
          and money in and around {site.city}. We read the agendas nobody else
          reads, sit through the meetings that run past midnight, and file the
          public-records requests that make press officers sigh.
        </p>
        <p>
          We are reader-supported and beholden to no party, donor, or
          development authority. If a story makes a powerful person
          uncomfortable, that is usually a sign we are doing our job.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          What we cover
        </h2>
        <ul className="mt-4 space-y-3 text-base leading-relaxed">
          <li>
            <Link
              href="/corruption-case"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              The Trial
            </Link>{" "}
            <span className="text-muted">·</span> The federal corruption case
            against DA Jody Owens, former Mayor Chokwe Antar Lumumba, and
            former Councilman Aaron Banks. Trial begins July 13, 2026. Full
            timeline, defendant profiles, and every filing as it lands.
          </li>
          <li>
            <Link
              href="/category/politics"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              Politics
            </Link>{" "}
            <span className="text-muted">·</span> City council, the Hinds
            County Board of Supervisors, the Capitol, and the campaigns shaping
            them.
          </li>
          <li>
            <Link
              href="/data-centers"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              Data Centers
            </Link>{" "}
            <span className="text-muted">·</span> The AI-infrastructure rush
            into Mississippi. Saxum, Prado AI, AWS, and the PSC fights that
            will set precedent.
          </li>
          <li>
            <Link
              href="/category/commercial-real-estate"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              Commercial real estate
            </Link>{" "}
            <span className="text-muted">·</span> Office, retail, industrial,
            and the development that is reshaping the metro.
          </li>
          <li>
            <Link
              href="/category/residential-real-estate"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              Residential real estate
            </Link>{" "}
            <span className="text-muted">·</span> Home sales, the rental
            market, and the neighborhoods on the move.
          </li>
          <li>
            <Link
              href="/explainers"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              Explainers
            </Link>{" "}
            <span className="text-muted">·</span> Background pieces, profiles,
            and analysis for anyone arriving mid-story.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
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
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          Corrections &amp; methodology
        </h2>
        <p className="mt-4 text-base leading-relaxed">
          When we get something wrong, we fix it at the top of the affected
          article and append a dated correction note. We do not quietly
          edit. The public list of every correction we&rsquo;ve issued is at{" "}
          <Link
            href="/corrections"
            className="font-bold text-crimson hover:text-crimson-dark"
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
            className="font-bold text-crimson hover:text-crimson-dark"
          >
            /methodology
          </Link>
          .
        </p>
        <p className="mt-3 text-base leading-relaxed">
          To request a correction, email{" "}
          <a
            href={`mailto:${site.email}?subject=Correction%20request`}
            className="font-bold text-crimson hover:text-crimson-dark"
          >
            {site.email}
          </a>{" "}
          with a link to the article and the specific factual error.
        </p>
      </section>

      <section className="mt-12 border-2 border-ink bg-paper p-6">
        <h2 className="font-serif text-2xl font-bold">Send us a tip</h2>
        <p className="mt-2 text-muted">
          Leaked documents, a meeting we should be at, or a number that does
          not add up? We protect our sources and read everything.
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-4 inline-block bg-crimson px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-crimson-dark"
        >
          {site.email}
        </a>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          Who runs the Wire
        </h2>
        <div className="prose-article mt-4">
          <p>
            <em>
              The Wire is published by a Jackson-area editor. A short personal
              bio belongs here — name, background, why this beat. Email the
              tip line above to suggest copy, or edit
              <code> app/about/page.tsx</code> directly.
            </em>
          </p>
        </div>
      </section>
    </div>
  );
}
