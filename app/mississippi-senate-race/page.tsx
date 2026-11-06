import type { Metadata } from "next";
import Link from "next/link";
import {
  SENATE_FIRST_PUBLISHED,
  SENATE_RACE,
  SENATE_SHARE_IMAGE,
  apDate,
  apDateTimeCT,
  getSenateDeadlines,
  getSenateMargin,
  getSenatePosts,
  senateMarginLine,
  senateStatusLabel,
  type SenateSource,
} from "@/lib/senate-race";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import ArticleCard from "@/app/components/ArticleCard";
import NewsletterSignup from "@/app/components/NewsletterSignup";

// Content changes by deploy, so refresh at most daily. Each refresh is a
// billed cache write on Vercel.
export const revalidate = 86400;

const TITLE = "Mississippi Senate race results: Colom vs. Hyde-Smith count tracker";
const DESCRIPTION =
  "Where the count stands in the uncalled Nov. 3, 2026 Mississippi U.S. Senate race between Scott Colom and Sen. Cindy Hyde-Smith, with independent Ty Pinkins: votes, what is still to be counted, key dates and answers, with a source and a time on every number.";

// The root layout's share image is replaced by any page that sets its own
// openGraph or twitter, so this page names the image outright.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/${SENATE_RACE.slug}` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl(`/${SENATE_RACE.slug}`),
    siteName: site.name,
    images: [SENATE_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SENATE_SHARE_IMAGE],
  },
};

function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}

function Sources({ sources }: { sources: SenateSource[] }) {
  if (sources.length === 0) return null;
  return (
    <p className="mt-2 font-sans text-xs text-muted">
      Source:{" "}
      {sources.map((s, i) => (
        <span key={`${s.url}-${i}`}>
          {i > 0 && "; "}
          {isExternal(s.url) ? (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-crimson"
            >
              {s.name}
            </a>
          ) : (
            <Link href={s.url} className="underline hover:text-crimson">
              {s.name}
            </Link>
          )}
        </span>
      ))}
    </p>
  );
}

const PILL: Record<string, string> = {
  uncalled: "border-crimson text-crimson",
  called: "border-ink bg-ink text-newsprint",
  certified: "border-ink bg-ink text-newsprint",
};

export default function SenateRacePage() {
  const race = SENATE_RACE;
  const margin = getSenateMargin();
  const marginLine = senateMarginLine(margin);
  const hasVotes = race.candidates.some((c) => typeof c.votes === "number");
  const deadlines = getSenateDeadlines();
  const posts = getSenatePosts();
  const url = absoluteUrl(`/${race.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LiveBlogPosting",
    headline: "Mississippi Senate Race: Where the Count Stands",
    url,
    datePublished: SENATE_FIRST_PUBLISHED,
    dateModified: race.lastUpdated,
    coverageStartTime: SENATE_FIRST_PUBLISHED,
    ...(race.status === "certified" ? { coverageEndTime: race.lastUpdated } : {}),
    publisher: { "@id": absoluteUrl("/#org") },
    liveBlogUpdate: race.updates.map((u) => ({
      "@type": "BlogPosting",
      headline: u.headline,
      datePublished: u.at,
      articleBody: u.body.join(" "),
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Escape "<" so no text in the data can close the script tag early
          (the Next.js JSON-LD guide). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="border-b border-rule pb-5">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          Mississippi Senate race 2026
        </p>
        <h1 className="mt-1 text-balance font-serif text-4xl font-black leading-tight sm:text-5xl">
          Mississippi Senate Race: Where the Count Stands
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-sm">
          <span
            className={`inline-block border px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest ${PILL[race.status]}`}
          >
            {senateStatusLabel(race.status)}
          </span>
          <span className="text-muted">Updated {apDateTimeCT(race.lastUpdated)}</span>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="count">
        <h2 id="count" className="border-b border-ink pb-1 font-serif text-2xl font-bold">
          The count
        </h2>
        {hasVotes ? (
          <>
            <ul className="mt-3 divide-y divide-rule">
              {race.candidates.map((c) => (
                <li
                  key={c.name}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 py-3"
                >
                  <span>
                    <span className="font-serif text-xl font-bold">{c.name}</span>{" "}
                    <span className="font-sans text-sm text-muted">{c.party}</span>
                  </span>
                  <span className="font-sans text-lg tabular-nums">
                    {typeof c.votes === "number" && (
                      <span className="font-bold">{c.votes.toLocaleString("en-US")}</span>
                    )}
                    {typeof c.share === "number" && (
                      <span className="ml-2 text-muted">{c.share}%</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {marginLine && (
              <p className="mt-2 font-serif text-xl font-bold text-crimson">{marginLine}</p>
            )}
            <p className="mt-2 font-sans text-xs text-muted">
              As of {apDateTimeCT(race.countAsOf)},{" "}
              <a
                href={race.countSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-crimson"
              >
                {race.countSource.name}
              </a>
            </p>
          </>
        ) : (
          <p className="mt-3 font-sans text-base text-muted">Vote totals are being updated.</p>
        )}
      </section>

      {race.outstanding.length > 0 && (
        <section className="mt-10" aria-labelledby="outstanding">
          <h2
            id="outstanding"
            className="border-b border-ink pb-1 font-serif text-2xl font-bold"
          >
            Still to be counted
          </h2>
          <ul className="mt-3 divide-y divide-rule">
            {race.outstanding.map((o) => (
              <li key={o.label} className="py-3">
                <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-serif text-lg font-bold">{o.label}</span>
                  <span className="font-sans text-lg font-bold tabular-nums">{o.value}</span>
                </p>
                {o.note && <p className="mt-1 font-sans text-sm text-muted">{o.note}</p>}
                {o.source && <Sources sources={[o.source]} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {deadlines.length > 0 && (
        <section className="mt-10" aria-labelledby="dates">
          <h2 id="dates" className="border-b border-ink pb-1 font-serif text-2xl font-bold">
            Key dates
          </h2>
          <ul className="mt-3 divide-y divide-rule">
            {deadlines.map((d) => (
              <li key={`${d.date}-${d.label}`} className="py-3">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-sans text-sm font-bold uppercase tracking-wider text-crimson">
                    {apDate(d.date)}
                  </span>
                  {d.state === "passed" && (
                    <span className="border border-rule px-1.5 font-sans text-[0.65rem] font-bold uppercase tracking-widest text-muted">
                      passed
                    </span>
                  )}
                  {d.state === "next" && (
                    <span className="bg-crimson px-1.5 font-sans text-[0.65rem] font-bold uppercase tracking-widest text-newsprint">
                      next
                    </span>
                  )}
                </p>
                <p
                  className={`mt-1 font-serif text-lg font-bold ${d.state === "passed" ? "text-muted" : ""}`}
                >
                  {d.label}
                </p>
                <p className="mt-1 font-sans text-sm text-muted">{d.detail}</p>
                {d.source && <Sources sources={[d.source]} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {race.faq.length > 0 && (
        <section className="mt-10" aria-labelledby="faq">
          <h2 id="faq" className="border-b border-ink pb-1 font-serif text-2xl font-bold">
            Questions people are asking
          </h2>
          <div className="divide-y divide-rule">
            {race.faq.map((f) => (
              <div key={f.q} className="py-4">
                <h3 className="font-serif text-xl font-bold leading-snug">{f.q}</h3>
                {f.a.map((p, i) => (
                  <p key={i} className="mt-2 font-sans text-base leading-relaxed">
                    {p}
                  </p>
                ))}
                <Sources sources={f.sources} />
              </div>
            ))}
          </div>
        </section>
      )}

      {race.updates.length > 0 && (
        <section className="mt-10" aria-labelledby="updates">
          <h2 id="updates" className="border-b border-ink pb-1 font-serif text-2xl font-bold">
            Latest updates
          </h2>
          <ol className="mt-3 divide-y divide-rule">
            {race.updates.map((u) => (
              <li key={u.at + u.headline} className="py-4">
                <p className="font-sans text-xs font-bold uppercase tracking-wider text-crimson">
                  <time dateTime={u.at}>{apDateTimeCT(u.at)}</time>
                </p>
                <h3 className="mt-1 font-serif text-xl font-bold leading-snug">{u.headline}</h3>
                {u.body.map((p, i) => (
                  <p key={i} className="mt-2 font-sans text-base leading-relaxed">
                    {p}
                  </p>
                ))}
                <Sources sources={u.sources} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {race.circuitClerks.length > 0 && (
        <section className="mt-10" aria-labelledby="clerks">
          <h2 id="clerks" className="border-b border-ink pb-1 font-serif text-2xl font-bold">
            Affidavit ballots: where to bring your ID
          </h2>
          <p className="mt-2 font-sans text-sm text-muted">
            Only voters who cast an affidavit ballot because they had no acceptable photo ID, or
            who have a religious objection to being photographed, need to act: they have until
            Tuesday, Nov. 10, to go to the circuit clerk&apos;s office in their county. Offices
            are usually in the county courthouse, and hours vary, so call ahead. Where a number
            is missing, sources disagreed and we are confirming it; the state Elections Hotline
            is 1-800-829-6786.
          </p>
          {/* Stacked rows on phones, a table from the sm breakpoint up, so the
              page never scrolls sideways. */}
          <table className="mt-3 w-full border-collapse text-left font-sans text-sm">
            <thead className="sr-only sm:not-sr-only">
              <tr className="border-b border-ink text-xs uppercase tracking-widest">
                <th scope="col" className="py-2 pr-3">County</th>
                <th scope="col" className="py-2 pr-3">Phone</th>
                <th scope="col" className="py-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {race.circuitClerks.map((c) => (
                <tr
                  key={c.county}
                  className="block border-b border-rule py-3 sm:table-row sm:py-0"
                >
                  <th
                    scope="row"
                    className="block font-serif text-lg font-bold sm:table-cell sm:py-3 sm:pr-3 sm:align-top sm:text-base"
                  >
                    {c.sourceUrl ? (
                      <a
                        href={c.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-crimson"
                      >
                        {c.county}
                      </a>
                    ) : (
                      c.county
                    )}
                    {c.clerk && (
                      <span className="block font-sans text-xs font-normal text-muted">
                        {c.clerk}
                      </span>
                    )}
                  </th>
                  <td className="block sm:table-cell sm:py-3 sm:pr-3 sm:align-top">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                        className="font-semibold text-crimson hover:text-crimson-bright"
                      >
                        {c.phone}
                      </a>
                    )}
                  </td>
                  <td className="block break-words text-muted sm:table-cell sm:py-3 sm:align-top">
                    {[c.address, c.city].filter(Boolean).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-10" aria-labelledby="coverage">
        <h2 id="coverage" className="border-b border-ink pb-1 font-serif text-2xl font-bold">
          Our coverage
        </h2>
        {posts.length > 0 && (
          <div>
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} variant="row" />
            ))}
          </div>
        )}
      </section>

      <div className="mt-12">
        <NewsletterSignup
          variant="block"
          heading="Get an alert when the race is called"
          blurb="We'll email you when AP or the state calls it, plus the Morning Dispatch each weekday. Unsubscribe in one click."
          successMessage="You're in. We'll email you when the race is called."
        />
      </div>

      <p className="mt-8 border-t border-rule pt-4 font-sans text-xs leading-relaxed text-muted">
        The Wire does not call races. We report the Associated Press and the Mississippi Secretary
        of State, and every number here carries its source and time.
      </p>
    </div>
  );
}
