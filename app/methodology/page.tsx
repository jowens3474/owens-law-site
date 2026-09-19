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
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          How the Wire works
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
          Methodology
        </h1>
        <p className="mt-3 font-sans text-lg text-muted">{DEK}</p>
      </header>

      <div className="prose-article mt-8">
        <p>
          The Jackson Wire is an AI-assisted, document-driven newsroom
          focused on business, economics, and development in metro Jackson.
          It publishes daily, works from primary sources, and tries to be
          unambiguous about how each piece is produced. This page is the long
          version of that promise.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          How a Wire article is built
        </h2>
        <ol className="mt-4 space-y-4 text-base leading-relaxed">
          <li>
            <strong>1. Source first.</strong> Each story starts with a primary
            source the Wire can read directly: a council packet, a bond
            resolution, a contract, a rate filing, a business registration,
            a layoff notice, a budget, a federal docket. The document is
            fetched as HTML or PDF and the actual text is read, not
            summarized second-hand. The goal is to publish what the document
            says before it becomes a press release.
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
            writes the article under a strict
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
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          Sources the Wire monitors
        </h2>
        <ul className="mt-4 space-y-2 text-base leading-relaxed">
          <li>
            <strong>Money and business filings</strong> Mississippi Secretary of State business registrations (sos.ms.gov), Mississippi Development Authority project and incentive announcements, MDES WARN layoff notices, Department of Revenue monthly sales-tax diversions by city, and SEC filings for public companies with Jackson operations.
          </li>
          <li>
            <strong>Public money</strong> City of Jackson and Hinds, Madison, and Rankin County budgets and millage orders; municipal bond documents on EMMA; federal contracts and grants on USASpending.gov; Mississippi State Auditor and PEER reports.
          </li>
          <li>
            <strong>Development and land</strong> Jackson City Council agendas, Planning Board packets, and zoning notices at jacksonms.gov; suburban city and county agendas across the metro; building permits; Hinds County land and assessor records; Jackson Redevelopment Authority and Capitol Complex Improvement District actions.
          </li>
          <li>
            <strong>Utilities and rates</strong> JXN Water rate filings and the federal receivership docket; Mississippi Public Service Commission dockets at psc.ms.gov, particularly data-center and utility rate cases; Entergy Mississippi and Atmos filings.
          </li>
          <li>
            <strong>Labor and economic data</strong> Bureau of Labor Statistics Jackson-metro employment and wage series, MDES labor-market reports, Census building-permit and population estimates.
          </li>
          <li>
            <strong>Legislature</strong> Bill text, fiscal notes, and committee actions at legislature.ms.gov.
          </li>
          <li>
            <strong>Federal court filings</strong> CourtListener (RECAP) for U.S. v. Owens (3:24-cr-103), business litigation, and bankruptcies in the Southern District of Mississippi.
          </li>
          <li>
            <strong>News coverage</strong> Mississippi Today, WLBT, WJTV, Mississippi Free Press, Magnolia Tribune, the Clarion Ledger, Mississippi Business Journal, and other outlets, used for context and cross-checking, never as the spine of a story.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
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
            site&apos;s <Link href="/corrections" className="font-bold text-crimson hover:text-crimson-bright">corrections log</Link> is public.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
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
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          Corrections
        </h2>
        <p className="mt-4 text-base leading-relaxed">
          When the Wire gets something wrong, the affected article is updated
          and a dated correction note is appended. The public list of all
          corrections is here:{" "}
          <Link
            href="/corrections"
            className="font-bold text-crimson hover:text-crimson-bright"
          >
            /corrections
          </Link>
          . To request one, email{" "}
          <a
            href={`mailto:${site.email}?subject=Correction%20request`}
            className="font-bold text-crimson hover:text-crimson-bright"
          >
            {site.email}
          </a>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          Machine-readable feeds
        </h2>
        <ul className="mt-4 space-y-2 text-base leading-relaxed">
          <li>
            <Link
              href="/feed.xml"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              /feed.xml
            </Link>
            <span className="text-muted"> · RSS 2.0 of all articles.</span>
          </li>
          <li>
            <Link
              href="/sitemap.xml"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              /sitemap.xml
            </Link>
            <span className="text-muted"> · Full sitemap.</span>
          </li>
          <li>
            <Link
              href="/news-sitemap.xml"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              /news-sitemap.xml
            </Link>
            <span className="text-muted"> · Google News sitemap (48-hour window).</span>
          </li>
          <li>
            <Link
              href="/llms.txt"
              className="font-bold text-crimson hover:text-crimson-bright"
            >
              /llms.txt
            </Link>
            <span className="text-muted"> · LLM-readable index of recent coverage.</span>
          </li>
          <li>
            <Link
              href="/llms-full.txt"
              className="font-bold text-crimson hover:text-crimson-bright"
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
