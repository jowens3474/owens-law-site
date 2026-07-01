import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

const DEK =
  "How The Jackson Wire is reported, written, and verified. The tools, the sources, the disclosures, the limits.";

export const metadata: Metadata = {
  title: "Methodology",
  description: DEK,
  alternates: { canonical: "/methodology" },
  openGraph: {
    type: "website",
    title: `Methodology — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/methodology"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `Methodology — ${site.name}`,
    description: DEK,
  },
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="border-b border-rule pb-5">
        <div className="mb-4 h-px w-24 bg-gradient-to-r from-crimson/60 to-transparent" />
        <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          How the Wire works
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
          Methodology
        </h1>
        <p className="mt-3 font-serif text-lg italic text-muted">{DEK}</p>
      </header>

      <div className="prose-article mt-8">
        <p>
          The Jackson Wire is an AI-assisted, document-driven local newsroom.
          It publishes daily, covers Jackson and Mississippi government and
          development, and tries to be unambiguous about how each piece is
          produced. This page is the long version of that promise.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          How a Wire article is built
        </h2>
        <ol className="mt-4 space-y-4 text-base leading-relaxed">
          <li>
            <strong>1. Source first.</strong> Each story starts with a primary
            source the Wire can read directly. The federal docket in the
            Owens case is mirrored from CourtListener. City Council agendas
            and Mississippi Public Service Commission filings are fetched as
            HTML or PDF and the actual text is read, not summarized
            second-hand.
          </li>
          <li>
            <strong>2. Cross-check with public news coverage.</strong> Where
            other Mississippi outlets have already reported on the same
            development, the Wire searches that coverage and quotes from it
            with in-line attribution by outlet name. A claim that cannot be
            traced to a document or a published source is cut.
          </li>
          <li>
            <strong>3. Draft with disclosure.</strong> A drafting model
            (Anthropic&apos;s Claude Opus) writes the article under a strict
            system prompt that bans em-dashes, fabricated quotes, and
            paraphrasing from memory. Every concrete claim must trace to a
            tool result the model saw in the same session.
          </li>
          <li>
            <strong>4. Publish under the editorial responsibility of the
            publisher.</strong> The publisher is accountable for the
            content. The byline reads &ldquo;Jackson Wire Staff&rdquo; rather
            than a fabricated reporter name. Corrections are handled openly
            (see below).
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          Sources the Wire monitors
        </h2>
        <ul className="mt-4 space-y-2 text-base leading-relaxed">
          <li>
            <strong>Federal court filings</strong> via CourtListener
            (RECAP). The Wire watches U.S. v. Owens (3:24-cr-103) and adds
            other federal cases as they arise.
          </li>
          <li>
            <strong>City of Jackson</strong> Council agendas, Planning Board
            packets, and zoning notices at jacksonms.gov.
          </li>
          <li>
            <strong>Hinds County Board of Supervisors</strong> meetings and
            documents at hindscountyms.com.
          </li>
          <li>
            <strong>Mississippi Public Service Commission</strong> dockets at
            psc.ms.gov, particularly utility deregulation and data-center
            filings.
          </li>
          <li>
            <strong>Mississippi Legislature</strong> bill text at
            legislature.ms.gov.
          </li>
          <li>
            <strong>Mississippi Secretary of State</strong> business and
            lobbyist filings at sos.ms.gov.
          </li>
          <li>
            <strong>News coverage</strong> from Mississippi Today, WLBT,
            WJTV, Mississippi Free Press, Magnolia Tribune, Jackson
            Jambalaya, The Enterprise Journal, and other outlets, used for
            context and cross-checking.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          AI disclosure
        </h2>
        <div className="prose-article mt-4">
          <p>
            The Wire uses AI tools for research synthesis and drafting on
            most articles. The drafting models are Anthropic&apos;s Claude (Opus
            and Haiku families). The fact-discipline rules in the model&apos;s
            instructions require every claim to trace to a tool result the
            model saw in that session: a court filing, a news article, an
            agenda document. If the model can&apos;t verify a claim, it is
            instructed to leave it out.
          </p>
          <p>
            AI use does not eliminate error. The editorial responsibility,
            and the consequences of error, belong to the publisher. The
            site&apos;s <Link href="/corrections" className="font-bold text-crimson hover:text-crimson-dark">corrections log</Link> is public.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          What the Wire is not
        </h2>
        <div className="prose-article mt-4">
          <p>
            The Wire does not currently conduct shoe-leather reporting:
            in-person interviews, courtroom observation, attendance at City
            Council meetings, or original record requests. Coverage is built
            from public documents and the reporting of other outlets, with
            attribution. When the Wire writes that a thing happened, it is
            because a primary source or another publication says so.
          </p>
          <p>
            The Wire is not a tip line for confidential sources. It is also
            not, at present, a newsletter with a subscriber agreement,
            though that is coming.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          Corrections
        </h2>
        <p className="mt-4 text-base leading-relaxed">
          When the Wire gets something wrong, the affected article is updated
          and a dated correction note is appended. The public list of all
          corrections is here:{" "}
          <Link
            href="/corrections"
            className="font-bold text-crimson hover:text-crimson-dark"
          >
            /corrections
          </Link>
          . To request one, email{" "}
          <a
            href={`mailto:${site.email}?subject=Correction%20request`}
            className="font-bold text-crimson hover:text-crimson-dark"
          >
            {site.email}
          </a>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          Machine-readable feeds
        </h2>
        <ul className="mt-4 space-y-2 text-base leading-relaxed">
          <li>
            <Link
              href="/feed.xml"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              /feed.xml
            </Link>
            <span className="text-muted"> · RSS 2.0 of all articles.</span>
          </li>
          <li>
            <Link
              href="/sitemap.xml"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              /sitemap.xml
            </Link>
            <span className="text-muted"> · Full sitemap.</span>
          </li>
          <li>
            <Link
              href="/news-sitemap.xml"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              /news-sitemap.xml
            </Link>
            <span className="text-muted"> · Google News sitemap (48-hour window).</span>
          </li>
          <li>
            <Link
              href="/llms.txt"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              /llms.txt
            </Link>
            <span className="text-muted"> · LLM-readable index of recent coverage.</span>
          </li>
          <li>
            <Link
              href="/llms-full.txt"
              className="font-bold text-crimson hover:text-crimson-dark"
            >
              /llms-full.txt
            </Link>
            <span className="text-muted"> · LLM-readable full text of every article.</span>
          </li>
          <li>
            <span className="font-bold">/article/&lt;slug&gt;.md</span>
            <span className="text-muted"> · Markdown version of any article.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
