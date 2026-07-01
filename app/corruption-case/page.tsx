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

// Refresh every 10 minutes so the countdown stays current and new
// corruption-case articles appear without a redeploy.
export const revalidate = 600;

const TRIAL_DATE_ISO = "2026-07-13";
const TRIAL_LABEL = "July 13, 2026";
const DEK =
  "Complete coverage of U.S. v. Owens, Lumumba, and Banks — the federal bribery prosecution headed for trial July 13 in the Thad Cochran U.S. Courthouse in downtown Jackson.";

const FACTS = [
  { label: "Trial begins", value: TRIAL_LABEL },
  { label: "Court", value: "U.S. District Court, S.D. Miss." },
  { label: "Courthouse", value: "Thad Cochran, downtown Jackson" },
  { label: "Judge", value: "Daniel P. Jordan III, Chief Judge" },
  { label: "Docket", value: "3:24-cr-103" },
  { label: "Counts", value: "17 across three defendants" },
];

const DEFENDANTS: {
  name: string;
  role: string;
  counts: string;
  exposure: string;
  posture: string;
  image?: string;
  alt?: string;
}[] = [
  {
    name: "Jody Owens",
    role: "Hinds County District Attorney",
    counts: "8 counts",
    exposure: "Up to 90 years · $2M",
    posture:
      "Alleged organizer. Mounting an entrapment defense. Has held press conferences and disputed the indictment publicly.",
  },
  {
    name: "Chokwe Antar Lumumba",
    role: "Former Mayor, City of Jackson",
    counts: "5 counts",
    exposure: "Up to 75 years · $1.5M",
    posture:
      'Lost re-election in 2025. Charged with bribery, conspiracy, honest services wire fraud, Travel Act, and money laundering. Defense built on the McDonnell "official act" standard.',
    image: "/lumumba.jpg",
    alt: "Former Jackson Mayor Chokwe Antar Lumumba.",
  },
  {
    name: "Aaron Banks",
    role: "Former Ward 6 Councilman",
    counts: "2 counts",
    exposure: "Up to 10 years",
    posture:
      "Smallest charging package: conspiracy + § 666 bribery only. Did not take the alleged interstate trips. Asked to be tried separately; denied.",
    image: "/aaron-banks.webp",
    alt: "Former Councilman Aaron Banks.",
  },
];

const COOPERATORS = [
  {
    name: "Angelique Lee",
    role: "Former Councilwoman",
    note: "Pleaded guilty in 2024. Sitting unsentenced — classic cooperator posture.",
  },
  {
    name: 'Sherik "Marve" Smith',
    role: "Owens's cousin",
    note: "Pleaded guilty in 2024. Sitting unsentenced.",
  },
];

const KEY_DATES: { date: string; text: string; highlight?: boolean }[] = [
  {
    date: "April 2024",
    text: "Lumumba allegedly directs the call moving a submission deadline from April 30 to April 16.",
  },
  {
    date: "Nov 2024",
    text: "Indictment unsealed. First court appearance for all three defendants in Jackson.",
  },
  {
    date: "Feb 2026",
    text: "Government moves to transfer venue to Gulfport, citing pretrial publicity.",
  },
  {
    date: "Apr 1, 2026",
    text: '"I am not moving this trial to Gulfport." — Judge Jordan at status conference.',
    highlight: true,
  },
  {
    date: "May 11, 2026",
    text: "Juror questionnaires mailed to the Northern Division pool. Protective order tightens discovery.",
  },
  {
    date: "May 14, 2026",
    text: "Omnibus order denies all motions to dismiss. Preserves entrapment defense for the jury. § 666 official-act question left for jury instructions.",
    highlight: true,
  },
  {
    date: "May 29, 2026",
    text: "Plea deadline passes. All three defendants keep their not-guilty pleas.",
  },
  {
    date: "Jun 8, 2026",
    text: "Lawyers meet to review juror questionnaires and prepare strike lists.",
  },
  {
    date: "Jun 10, 2026",
    text: "Government withdraws the motion to transfer venue. Trial stays in Jackson.",
    highlight: true,
  },
  {
    date: "Jun 16, 2026",
    text: "Tape-clip designations and objections due. Final pretrial conference.",
  },
  {
    date: "Jul 13, 2026",
    text: "Trial begins. Jury selection projected ~1 week. Whole proceeding projected ~1 month.",
    highlight: true,
  },
];

export const metadata: Metadata = {
  title: "The Corruption Case",
  description: DEK,
  alternates: { canonical: "/corruption-case" },
  openGraph: {
    type: "website",
    title: `The Corruption Case — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/corruption-case"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `The Corruption Case — ${site.name}`,
    description: DEK,
  },
};

function daysUntilTrial() {
  // Compute in America/Chicago time so the count flips at midnight Central.
  const today = new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
    }).format(new Date()),
  );
  const trial = new Date(TRIAL_DATE_ISO);
  const ms = trial.getTime() - today.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export default function CorruptionCasePage() {
  const articles = getPostsByTag("corruption-case");
  const days = daysUntilTrial();
  const trialPassed = days === 0;
  const latest = articles.slice(0, 4);
  const explainers = articles.filter((p) =>
    [
      "what-the-charge-sheet-tells-you",
      "warren-kohlman-jody-owens-defense",
      "the-mayor-who-made-one-phone-call",
      "one-courtroom-three-defendants",
      "the-jackson-bribery-case-a-timeline",
      "the-lot",
    ].includes(p.slug),
  );
  const all = articles;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The Corruption Case",
    description: DEK,
    url: absoluteUrl("/corruption-case"),
    hasPart: articles.map((p) => ({
      "@type": "NewsArticle",
      headline: p.title,
      datePublished: p.date,
      url: absoluteUrl(`/article/${p.slug}`),
    })),
  };

  // FAQ schema — Google's rich results surface for hub pages. Pulls real
  // questions readers search for around this case.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "When does the Owens trial start?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `The trial begins ${TRIAL_LABEL} in Courtroom 5A of the Thad Cochran U.S. Courthouse in downtown Jackson, Mississippi, before Chief U.S. District Judge Daniel P. Jordan III.`,
        },
      },
      {
        "@type": "Question",
        name: "Who is on trial in the Jackson corruption case?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Three Jackson elected officials: Hinds County District Attorney Jody Owens (8 counts), former Mayor Chokwe Antar Lumumba (5 counts), and former Ward 6 Councilman Aaron Banks (2 counts). Two others, former Councilwoman Angelique Lee and Sherik Marve Smith, pleaded guilty in 2024.",
        },
      },
      {
        "@type": "Question",
        name: "What is the docket number?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "3:24-cr-103, in the U.S. District Court for the Southern District of Mississippi, Northern Division.",
        },
      },
      {
        "@type": "Question",
        name: "What are the charges?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bribery, conspiracy, honest services wire fraud, money laundering, and a Travel Act count for the interstate trips. Owens also faces a false statement count. The total indictment is 17 counts spread across the three defendants.",
        },
      },
      {
        "@type": "Question",
        name: "What is the defense argument?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Each defendant has a different defense. Owens is mounting an entrapment defense, arguing the FBI manufactured the crime through its undercover operation. Lumumba is relying on McDonnell v. United States to argue that moving a paperwork deadline is not an official act. Banks argues that the city never held the vote he was allegedly paid to influence.",
        },
      },
      {
        "@type": "Question",
        name: "Where do the jurors come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The jury is drawn from the 18 counties of the U.S. District Court's Northern Division of the Southern District of Mississippi. Hinds County is one of those 18.",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-rule pb-8">
        <div className="mb-4 h-px w-24 bg-gradient-to-r from-crimson/60 to-transparent" />
        <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Federal Criminal Case · Docket 3:24-cr-103
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black leading-[1.02] sm:text-6xl">
          The Corruption Case
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-xl italic leading-relaxed text-muted">
          {DEK}
        </p>
      </header>

      {/* Countdown + facts */}
      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="border-2 border-ink bg-paper p-6 text-center md:col-span-1">
          {trialPassed ? (
            <>
              <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
                Trial underway
              </p>
              <p className="mt-2 font-serif text-3xl font-black leading-tight">
                In progress
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
                Trial begins
              </p>
              <p className="mt-2 font-serif text-7xl font-black leading-none text-ink">
                {days}
              </p>
              <p className="mt-1 font-serif text-sm font-bold uppercase tracking-widest">
                day{days === 1 ? "" : "s"} away
              </p>
              <p className="mt-4 border-t border-rule pt-3 font-serif text-base">
                {TRIAL_LABEL}
              </p>
            </>
          )}
        </div>

        <div className="border-2 border-ink bg-paper p-6 md:col-span-2">
          <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
            At a glance
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
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
        </div>
      </section>

      {/* Defendants */}
      <section className="mt-12">
        <h2 className="mb-5 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
          The Defendants
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {DEFENDANTS.map((d) => (
            <article
              key={d.name}
              className="border-2 border-ink bg-paper p-5"
            >
              {d.image ? (
                <div className="relative aspect-square w-full overflow-hidden border border-rule">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.image}
                    alt={d.alt ?? d.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center border border-rule bg-newsprint">
                  <span className="font-serif text-5xl font-black text-muted">
                    {d.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
              )}
              <h3 className="mt-4 font-serif text-2xl font-black leading-tight">
                {d.name}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted">
                {d.role}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-serif text-sm font-bold">
                <span>{d.counts}</span>
                <span className="text-crimson">{d.exposure}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{d.posture}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 border border-rule bg-paper p-5">
          <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
            Already pleaded guilty (cooperators)
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {COOPERATORS.map((c) => (
              <li key={c.name}>
                <span className="font-serif font-bold">{c.name}</span>
                <span className="text-muted"> · {c.role}</span>
                <span className="block text-muted">{c.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Latest coverage */}
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

      {/* Timeline */}
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
        <p className="mt-4 text-sm text-muted">
          Need more detail? See{" "}
          <Link
            href="/article/the-jackson-bribery-case-a-timeline"
            className="font-bold text-crimson hover:text-crimson-dark"
          >
            our full chronology
          </Link>
          .
        </p>
      </section>

      {/* Explainers */}
      {explainers.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
            Explainers & Analysis
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {explainers.map((p) => (
              <Link
                key={p.slug}
                href={`/article/${p.slug}`}
                className="block border-2 border-ink bg-paper p-5 hover:border-crimson"
              >
                <p className="text-xs uppercase tracking-widest text-muted">
                  {formatDate(p.date)}
                </p>
                <h3 className="mt-1 font-serif text-xl font-black leading-tight">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {p.dek}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All coverage */}
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
          {all.length} article{all.length === 1 ? "" : "s"} on the corruption
          case. New coverage is added automatically as filings drop.
        </p>
      </section>
    </div>
  );
}
