import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import { getPostsByTag, formatDate } from "@/lib/posts";
import SalesTaxChart from "@/app/components/SalesTaxChart";
import dataset from "@/data/sales-tax-diversions.json";

export const revalidate = 3600;

interface CityMonth {
  amount: number;
  fytd?: number | null;
}
interface Dataset {
  updated: string | null;
  cities: string[];
  months: Record<string, Record<string, CityMonth>>;
  reports: Record<string, { url: string; fetched: string; revised?: boolean }>;
}
const data = dataset as unknown as Dataset;

const DOR_LISTING =
  "https://www.dor.ms.gov/forms-resources/statistics-publications/diversions-cities-sales-tax-collections";
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function label(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
function shift(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}
function pct(now: number, then: number | undefined): string {
  if (!then) return "";
  const v = ((now - then) / then) * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

const DEK =
  "Every month the state pays each city its share of the sales tax collected inside its limits. The Wire reads the Department of Revenue's report the day it posts and tracks Jackson against the suburbs.";

export const metadata: Metadata = {
  title: "Sales Tax Tracker",
  description: DEK,
  alternates: { canonical: "/economy/sales-tax" },
  openGraph: {
    type: "website",
    title: `Sales Tax Tracker — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/economy/sales-tax"),
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title: `Sales Tax Tracker — ${site.name}`, description: DEK },
};

function Tile({ label: l, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div>
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">{l}</p>
      <p className="mt-1 font-sans text-3xl font-semibold text-ink">{value}</p>
      {delta && <p className="mt-0.5 font-sans text-sm text-muted">{delta}</p>}
    </div>
  );
}

export default function SalesTaxPage() {
  const reportMonths = Object.keys(data.reports).sort();
  const latest = reportMonths[reportMonths.length - 1];
  const stories = getPostsByTag("by-the-numbers").slice(0, 8);

  if (!latest) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">By the numbers</p>
        <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">Sales Tax Tracker</h1>
        <p className="mt-3 font-sans text-lg text-muted">{DEK}</p>
        <p className="mt-8 font-sans text-sm text-muted">
          The first report has not been loaded yet. The tracker fills in automatically the day the desk reads the Department of Revenue&apos;s next monthly report.
        </p>
      </div>
    );
  }

  const prior = shift(latest, -12);
  const jackson = data.months[latest]?.Jackson;
  const jacksonPrior = data.months[prior]?.Jackson;
  const series = Object.keys(data.months)
    .filter((ym) => typeof data.months[ym]?.Jackson?.amount === "number")
    .sort()
    .slice(-24)
    .map((ym) => ({ month: ym, amount: data.months[ym].Jackson.amount }));

  const rows = data.cities
    .map((city) => ({ city, now: data.months[latest]?.[city], then: data.months[prior]?.[city] }))
    .filter((r) => r.now)
    .sort((a, b) => (b.now?.amount ?? 0) - (a.now?.amount ?? 0));
  let metroNow = 0;
  let metroThen = 0;
  for (const r of rows) {
    if (r.now && r.then) {
      metroNow += r.now.amount;
      metroThen += r.then.amount;
    }
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Sales tax diversions to metro Jackson cities",
    description: DEK,
    url: absoluteUrl("/economy/sales-tax"),
    creator: { "@id": absoluteUrl("/#org") },
    isBasedOn: DOR_LISTING,
    temporalCoverage: `${series[0]?.month ?? latest}/${latest}`,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b-4 border-double border-ink pb-6">
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">By the numbers</p>
        <h1 className="mt-2 font-serif text-4xl font-black leading-tight sm:text-5xl">Sales Tax Tracker</h1>
        <p className="mt-3 max-w-3xl font-sans text-lg leading-relaxed text-muted">{DEK}</p>
        <p className="mt-2 font-sans text-sm text-muted">
          Latest report: {label(latest)}, read {data.reports[latest].fetched}.
        </p>
      </header>

      {jackson && (
        <div className="mt-8 grid gap-6 border-b border-rule pb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label={`Jackson, ${label(latest)}`} value={money(jackson.amount)} delta={jacksonPrior ? `${pct(jackson.amount, jacksonPrior.amount)} vs ${label(prior)}` : undefined} />
          <Tile label="Jackson, fiscal year to date" value={jackson.fytd != null ? money(jackson.fytd) : "n/a"} delta={jackson.fytd != null && jacksonPrior?.fytd != null ? `${pct(jackson.fytd, jacksonPrior.fytd)} vs a year earlier` : undefined} />
          <Tile label="Metro cities, this month" value={money(metroNow)} delta={metroThen ? `${pct(metroNow, metroThen)} vs a year earlier` : undefined} />
          <Tile label="Jackson's share of the metro" value={metroNow ? `${((jackson.amount / metroNow) * 100).toFixed(1)}%` : "n/a"} delta={metroThen && jacksonPrior ? `${((jacksonPrior.amount / metroThen) * 100).toFixed(1)}% a year earlier` : undefined} />
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <section>
            <h2 className="mb-4 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">
              Jackson, month by month
            </h2>
            <SalesTaxChart points={series} city="Jackson" />
          </section>

          <section className="mt-12">
            <h2 className="mb-4 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">
              The metro, {label(latest)}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="text-left text-[0.68rem] uppercase tracking-widest text-muted">
                    <th className="py-2 pr-3 font-bold">City</th>
                    <th className="py-2 pr-3 text-right font-bold">{label(latest)}</th>
                    <th className="py-2 pr-3 text-right font-bold">{label(prior)}</th>
                    <th className="py-2 pr-3 text-right font-bold">Change</th>
                    <th className="py-2 pr-3 text-right font-bold">FYTD</th>
                    <th className="py-2 text-right font-bold">FYTD change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule border-y border-rule">
                  {rows.map((r) => (
                    <tr key={r.city} className={r.city === "Jackson" ? "font-semibold" : ""}>
                      <td className="py-2 pr-3">{r.city}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{r.now ? money(r.now.amount) : ""}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-muted">{r.then ? money(r.then.amount) : ""}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{r.now && r.then ? pct(r.now.amount, r.then.amount) : ""}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-muted">{r.now?.fytd != null ? money(r.now.fytd) : ""}</td>
                      <td className="py-2 text-right tabular-nums">{r.now?.fytd != null && r.then?.fytd != null ? pct(r.now.fytd, r.then.fytd) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="min-w-0 lg:col-span-4 lg:border-l lg:border-rule lg:pl-6">
          <section>
            <h2 className="mb-4 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">How to read it</h2>
            <div className="space-y-3 font-sans text-sm leading-relaxed text-muted">
              <p>
                Mississippi collects a 7 percent sales tax and returns 18.5 percent of what was collected inside a city&apos;s limits to that city. The Department of Revenue publishes the payments each month, by city, with the same month a year earlier and fiscal-year-to-date totals. The fiscal year begins July 1.
              </p>
              <p>
                A month&apos;s diversion reflects sales tax that businesses remitted in the prior month, so it trails the sales themselves by roughly two months. Compare a month with the same month a year earlier, not with the month before.
              </p>
              <p>
                Percent changes, the metro total, and Jackson&apos;s share are Wire calculations from the state&apos;s figures. The metro total counts only the cities listed above.
              </p>
              <p>
                Source:{" "}
                <a href={DOR_LISTING} className="font-semibold text-crimson hover:text-crimson-bright" target="_blank" rel="noopener noreferrer">
                  Diversions to Cities from Sales Tax Collections
                </a>
                , Mississippi Department of Revenue.
              </p>
            </div>
          </section>

          {stories.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">Monthly reports</h2>
              <ul className="divide-y divide-rule">
                {stories.map((p) => (
                  <li key={p.slug} className="py-3">
                    <Link href={`/article/${p.slug}`} className="font-serif text-base font-bold leading-snug hover:text-crimson">
                      {p.title}
                    </Link>
                    <p className="mt-1 font-sans text-[0.7rem] uppercase tracking-wider text-muted">{formatDate(p.date)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
