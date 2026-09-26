import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { pro, stripeConfigured } from "@/lib/pro";
import { absoluteUrl } from "@/lib/markdown";
import { getUpcomingMilestones, formatMilestoneDate, PROJECTS } from "@/lib/pipeline";
import ProSignup from "@/app/components/ProSignup";

export const revalidate = 600;

const DEK = `${pro.tagline} A Monday briefing, same-day alerts, and a members-only desk built on the Wire's research pipeline, for the people whose money is on the line.`;

export const metadata: Metadata = {
  title: pro.name,
  description: DEK,
  alternates: { canonical: pro.path },
  openGraph: {
    type: "website",
    title: `${pro.name} — ${site.name}`,
    description: DEK,
    url: absoluteUrl(pro.path),
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title: `${pro.name} — ${site.name}`, description: DEK },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is in the Monday briefing?",
    a: "Every dated decision on the metro calendar for the week ahead (council votes, county board items, PSC hearings, bond sales, rate cases), the federal awards and grants that landed in Hinds, Madison, and Rankin counties in the past week, new federal filings naming local governments and companies, the SEC filings of public companies with Jackson operations, the week's labor and fuel numbers, and what the Wire published, with every document linked.",
  },
  {
    q: "How is this different from the free site?",
    a: "The free site publishes stories. Pro publishes the calendar and the documents behind them, before the story exists, and sends them to you the hour they appear. Free readers learn what happened. Members learn what is scheduled.",
  },
  {
    q: "Who reads it?",
    a: pro.audiences.join(", ") + ". Anyone whose next decision depends on what the city, the county, or a state agency does next.",
  },
  {
    q: "Can my firm share one subscription?",
    a: "Each seat is one person and one inbox. Firms that want five or more seats can email us for a group rate.",
  },
  {
    q: "How do I cancel?",
    a: "Any time. Card subscribers use the Manage billing button on the desk, which opens Stripe's portal; founding members billed by invoice email us and we cancel the same day. Monthly seats end at the end of the billing month. Annual seats are prorated. The unsubscribe link in an email stops the mail but does not cancel billing, so use the portal or email us.",
  },
];

export default function ProPage() {
  const upcoming = getUpcomingMilestones(4);
  const stripe = stripeConfigured();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${site.name} ${pro.name}`,
    description: DEK,
    brand: { "@type": "Brand", name: site.name },
    offers: [
      { "@type": "Offer", price: pro.monthly, priceCurrency: "USD", url: absoluteUrl(pro.path), category: "subscription" },
      { "@type": "Offer", price: pro.annual, priceCurrency: "USD", url: absoluteUrl(pro.path), category: "subscription" },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b-4 border-double border-ink pb-8">
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">
          {site.name} · Members
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black leading-[1.05] sm:text-6xl">{pro.name}</h1>
        <p className="mt-4 max-w-3xl font-sans text-xl leading-relaxed text-muted">{pro.tagline}</p>
        <p className="mt-3 max-w-3xl font-sans text-base leading-relaxed">
          The Wire reads the council packets, the bond resolutions, the permits, the federal award
          records, and the court dockets every day. {pro.name} sends you what they say the hour
          they say it, and the calendar of what is coming, so you are never the last to know that the
          vote is Tuesday.
        </p>
        <a
          href="#join"
          className="mt-6 inline-block bg-ink px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson"
        >
          Join {pro.name} →
        </a>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <section>
            <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">
              What you get
            </h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {pro.features.map((f) => (
                <div key={f.title}>
                  <h3 className="font-serif text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">
              A sample of this week&apos;s calendar
            </h2>
            <ol className="divide-y divide-rule border-y border-rule">
              {upcoming.map((m) => (
                <li key={`${m.date}-${m.text}`} className="py-3">
                  <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-crimson">
                    <time dateTime={m.date}>{formatMilestoneDate(m)}</time>
                  </p>
                  <p className="mt-1 font-sans text-sm leading-snug">{m.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-3 font-sans text-sm text-muted">
              The free{" "}
              <Link href="/pipeline" className="font-semibold text-crimson hover:text-crimson-bright">
                Pipeline
              </Link>{" "}
              shows the tracker: {PROJECTS.length} projects and their dates. Members get that
              calendar in their inbox every Monday, an alert the hour a record posts, and the live
              feeds behind it.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">
              Questions
            </h2>
            <dl className="divide-y divide-rule">
              {FAQ.map((f) => (
                <div key={f.q} className="py-4">
                  <dt className="font-serif text-lg font-bold">{f.q}</dt>
                  <dd className="mt-1.5 font-sans text-sm leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <ProSignup
            stripeReady={stripe}
            mailto={site.email}
            foundingPrice={pro.founding}
            monthly={pro.monthly}
            annual={pro.annual}
          />
          <p className="mt-4 font-sans text-xs text-muted">
            Already a member?{" "}
            <Link href="/pro/dashboard" className="font-semibold text-crimson hover:text-crimson-bright">
              Sign in to the desk
            </Link>
            .
          </p>
          <div className="mt-8 border-t border-rule pt-4 font-sans text-xs leading-relaxed text-muted">
            <p>
              {pro.name} is edited by {site.editor.name}. It draws on public records and the same
              research desk that produces the Wire. It is not legal, investment, or brokerage advice.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
