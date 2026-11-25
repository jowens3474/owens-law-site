import type { Metadata } from "next";
import Link from "next/link";
import { getPostBySlug, formatDate, type Post } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import {
  HOMICIDES,
  TRACKER_COUNTS,
  YEARS,
  rateRows,
  type Cite,
  type Figure,
  type YearRow,
} from "@/lib/jackson-homicides";
import { formatDay } from "@/lib/central-time";
import MoreGuides from "@/app/components/MoreGuides";

// Every figure on this page is a dated fact from lib/jackson-homicides.ts.
// Nothing here is fetched or computed from today's date, so the page is
// static and changes only when that file does.

const Y = HOMICIDES.ytd;
const S = HOMICIDES.sources;
const C = HOMICIDES.contacts;

const day = (iso: string) => formatDay(iso, { weekday: false });
const shortDay = (iso: string) => formatDay(iso, { weekday: false, year: false });

const AS_OF = shortDay(Y.asOf);
const CHECKED = day(HOMICIDES.checked);
const CHECKED_SHORT = shortDay(HOMICIDES.checked);

const PATH = "/jackson-homicides";
const TITLE = "Jackson, MS Homicides by Year: Counts and Their Sources";
const DEK = `The number of homicides in Jackson for each year since 2015, with who reported each count, and the count so far in ${Y.year}. Police, the FBI and local newsrooms do not always agree, so each number is shown with its source.`;

export const metadata: Metadata = {
  title: TITLE,
  description: `Homicides in Jackson, Mississippi, by year since 2015, with the source of each count, the ${Y.year} count as of ${AS_OF} and the rate per 100,000 residents.`,
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    title: `${TITLE} | ${site.name}`,
    description: DEK,
    url: absoluteUrl(PATH),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${site.name}`,
    description: DEK,
  },
};

const H2 =
  "mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink";
const LINK = "underline hover:text-crimson";

// The table's source columns, in the order they are shown.
const COLUMNS: { key: Exclude<keyof YearRow, "year">; label: string }[] = [
  { key: "wlbt", label: "WLBT" },
  { key: "clarionLedger", label: "Clarion Ledger" },
  { key: "jpd", label: "Jackson police" },
  { key: "fbi", label: "FBI" },
  { key: "other", label: "Also reported" },
];

function citeLabel(c: Cite): string {
  return c.date ? `${c.outlet}, ${day(c.date)}` : c.outlet;
}

function CiteLinks({ cites }: { cites: readonly Cite[] }) {
  return (
    <>
      {cites.map((c, i) => (
        <span key={c.url}>
          {i > 0 ? "; " : ""}
          <a href={c.url} className={LINK}>
            {citeLabel(c)}
          </a>
        </span>
      ))}
    </>
  );
}

function Figures({ figures }: { figures: readonly Figure[] }) {
  return (
    <>
      {figures.map((f) => (
        <div key={`${f.value}-${f.cites.map((c) => c.url).join("|")}`} className="mb-3 last:mb-0">
          <p
            className={
              f.missing
                ? "font-sans text-sm text-muted"
                : "font-serif text-xl font-black leading-tight tabular-nums"
            }
          >
            {f.value}
          </p>
          {(f.note || f.cites.length > 0) && (
            <p className="mt-0.5 font-sans text-xs leading-snug text-muted">
              {f.note}
              {f.note && f.cites.length > 0 ? " " : ""}
              <CiteLinks cites={f.cites} />
            </p>
          )}
        </div>
      ))}
    </>
  );
}

export default function JacksonHomicidesPage() {
  const rates = rateRows();
  const coverage = HOMICIDES.coverageSlugs
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is Post => Boolean(p));

  const facts = [
    {
      label: `${Y.year} so far`,
      value: `${Y.total} as of ${AS_OF} (Clarion Ledger, WLBT)`,
    },
    { label: "All of 2025", value: `${TRACKER_COUNTS[2025]} (WLBT, Clarion Ledger)` },
    { label: "FBI data", value: "None from JPD for 2021 to 2024" },
    {
      label: "Anonymous tips",
      value: (
        <>
          Crime Stoppers, <span className="whitespace-nowrap">{C.crimeStoppers.phone}</span>
        </>
      ),
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DEK,
    url: absoluteUrl(PATH),
    dateModified: HOMICIDES.checked,
    isPartOf: { "@id": absoluteUrl("/#org") },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-rule pb-8">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Jackson Guide · Public Safety
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black leading-[1.02] sm:text-6xl">
          Jackson Homicides by Year: Counts and Their Sources
        </h1>
        <p className="mt-4 max-w-3xl font-sans text-xl leading-relaxed text-muted">{DEK}</p>
      </header>

      {/* At a glance */}
      <section className="glow-card mt-8 border border-rule p-6">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          At a glance
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                {f.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-bold">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* The year so far */}
      <section className="mt-12" id="so-far">
        <h2 className={H2}>The Count So Far in {Y.year}</h2>
        <div className="grid gap-10 md:grid-cols-[3fr_2fr]">
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <h3 className="font-serif text-2xl font-black leading-tight">
              {Y.total} homicides as of {AS_OF}, two newsrooms report
            </h3>
            <p>
              This is a dated count, not a running one. The newest counts the Wire found
              were published {day(Y.asOf)}. The Wire last checked on {CHECKED}.
            </p>
            <p>
              The{" "}
              <a href={S.clNov18} className={LINK}>
                Clarion Ledger reported
              </a>{" "}
              that its records show {Y.total} homicides in the city from Jan. 1 to {AS_OF}.
              It said the Jackson Police Department was investigating {Y.jpd} of the cases
              and Capitol Police {Y.capitolPolice}.{" "}
              <a href={S.wlbtNov18Count} className={LINK}>
                WLBT reported
              </a>{" "}
              the same total, {Y.total}, the same day.
            </p>
            <p>
              The police chief’s figure that day was for JPD’s cases. Chief RaShall Brackney
              said JPD had {Y.chiefOpen} open homicide cases and {Y.chiefCleared} cleared
              cases so far in {Y.year},{" "}
              <a href={S.wlbtNov18Chief} className={LINK}>
                WLBT reported
              </a>
              . WLBT also reported that she said {Y.chiefCleared} of the {Y.jpd} homicides
              JPD has investigated have been solved.
            </p>
            <p>
              WLBT keeps a public case list, its{" "}
              <a href={S.tracker} className={LINK}>
                Homicide Tracker
              </a>
              . On {CHECKED_SHORT}, the tracker displayed {Y.tracker.total} homicides for{" "}
              {Y.year}, the latest dated {shortDay(Y.tracker.latest)}. It showed JPD as the
              investigating agency for {Y.tracker.jpd} and Capitol Police for{" "}
              {Y.tracker.capitolPolice}.
            </p>
            <p>
              The Clarion Ledger wrote on {AS_OF} that, if recent trends continue, Jackson
              is projected to end {Y.year} with an estimated {Y.projection} homicides. That
              is the newspaper’s projection, not a count.
            </p>
          </div>
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
              {Y.year} counts, newest first
            </p>
            <ol className="mt-3 divide-y divide-rule border-y border-ink font-sans text-sm leading-relaxed">
              <li className="py-3">
                <span className="font-serif text-base font-bold">
                  {shortDay(Y.tracker.latest)}: {Y.tracker.total}
                </span>
                <span className="block text-muted">
                  <a href={S.tracker} className={LINK}>
                    WLBT Homicide Tracker
                  </a>
                  , as displayed {CHECKED_SHORT}. JPD {Y.tracker.jpd}, Capitol Police{" "}
                  {Y.tracker.capitolPolice}.
                </span>
              </li>
              <li className="py-3">
                <span className="font-serif text-base font-bold">
                  {AS_OF}: {Y.total}
                </span>
                <span className="block text-muted">
                  <a href={S.clNov18} className={LINK}>
                    Clarion Ledger
                  </a>{" "}
                  and{" "}
                  <a href={S.wlbtNov18Count} className={LINK}>
                    WLBT
                  </a>
                  . JPD {Y.jpd}, Capitol Police {Y.capitolPolice}, the Clarion Ledger said.
                </span>
              </li>
              <li className="py-3">
                <span className="font-serif text-base font-bold">
                  {shortDay(Y.jpdReleaseDate)}: JPD’s own numbering
                </span>
                <span className="block text-muted">
                  A{" "}
                  <a href={S.jpdRelease} className={LINK}>
                    JPD news release
                  </a>{" "}
                  that day labeled two deaths {"“Homicides #67&68.”"}
                </span>
              </li>
              <li className="py-3">
                <span className="font-serif text-base font-bold">
                  Oct. 31: {Y.throughOctober.year}
                </span>
                <span className="block text-muted">
                  <a href={S.clNov12} className={LINK}>
                    Clarion Ledger
                  </a>
                  , which counted {Y.throughOctober.priorYear} for the same period of 2025.
                </span>
              </li>
              <li className="py-3">
                <span className="font-serif text-base font-bold">
                  July 31: {Y.throughJuly.total}
                </span>
                <span className="block text-muted">
                  <a href={S.clAug2026} className={LINK}>
                    Clarion Ledger
                  </a>
                  . JPD {Y.throughJuly.jpd}, Capitol Police {Y.throughJuly.capitolPolice}.
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* By year */}
      <section className="mt-14" id="by-year">
        <h2 className={H2}>Homicides by Year, 2015 to 2025</h2>
        <p className="max-w-3xl font-sans text-base leading-relaxed">
          Each number below is one source’s count. Where sources differ, their counts sit
          side by side. The date beside a source is the day it published the number.
        </p>
        {/* Stacked rows below the lg breakpoint, a table from there up, so the
            page never scrolls sideways. */}
        <table className="mt-5 w-full border-collapse text-left font-sans text-sm">
          <caption className="sr-only">
            Homicides in Jackson, Mississippi, by year, as counted by each source
          </caption>
          <thead className="sr-only lg:not-sr-only">
            <tr className="border-b border-ink text-xs uppercase tracking-widest">
              <th scope="col" className="py-2 pr-4">
                Year
              </th>
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="py-2 pr-4 last:pr-0">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YEARS.map((row) => (
              <tr
                key={row.year}
                className="block border-b border-rule py-4 lg:table-row lg:py-0"
              >
                <th
                  scope="row"
                  className="block font-serif text-3xl font-black tabular-nums lg:table-cell lg:py-4 lg:pr-4 lg:align-top lg:text-2xl"
                >
                  {row.year}
                </th>
                {COLUMNS.map((c) => {
                  const figures = row[c.key];
                  return (
                    <td
                      key={c.key}
                      className={`${
                        figures.length === 0 ? "hidden" : "block"
                      } pt-3 lg:table-cell lg:w-[18%] lg:py-4 lg:pr-4 lg:align-top lg:last:pr-0`}
                    >
                      <p className="mb-1 font-sans text-[0.68rem] font-bold uppercase tracking-widest text-muted lg:hidden">
                        {c.label}
                      </p>
                      <Figures figures={figures} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 max-w-3xl space-y-2 font-sans text-sm leading-relaxed text-muted">
          <p>
            “None found” means the Wire did not find a count from that source for that year.
            It does not mean zero. “No data” means the FBI’s database returned no homicide
            figures from JPD for that year.
          </p>
          <p>
            The Jackson police column holds JPD’s numbers as news outlets reported them. The
            Wire did not find a yearly count published by JPD or the city itself.
          </p>
          <p>
            In the WLBT column, the numbers for 2016 to 2025 that are linked to the Homicide
            Tracker are the yearly totals it displayed on {CHECKED}. WLBT says its data may be
            updated as new cases surface.
            The FBI’s yearly numbers are the Wire’s sums of the monthly homicide figures
            its Crime Data Explorer shows for the Jackson Police Department.
          </p>
        </div>
      </section>

      {/* Why they differ */}
      <section className="mt-14" id="why">
        <h2 className={H2}>Why the Numbers Differ</h2>
        <ul className="max-w-3xl list-disc space-y-4 pl-6 font-sans text-base leading-relaxed">
          <li>
            <strong>Homicide is a wider word than murder.</strong>{" "}
            <a href={S.tracker} className={LINK}>
              WLBT’s tracker
            </a>{" "}
            defines a homicide as one person killing another, regardless of intent, and says
            some homicides, such as justified ones, are not crimes. WLBT says it counts all
            homicides, including justified ones, and leaves out most vehicular homicides.
            The{" "}
            <a href={S.fbi} className={LINK}>
              FBI
            </a>{" "}
            says its murder and nonnegligent manslaughter category does not include
            justifiable homicides. Two of the 2025 homicides in south Jackson were cases of
            self-defense, according to a JPD list given to{" "}
            <a href={S.mississippiToday} className={LINK}>
              Mississippi Today
            </a>
            . In a correction to its story on the 2018 count, the{" "}
            <a href={S.jfp2018} className={LINK}>
              Jackson Free Press
            </a>{" "}
            reported that three of that year’s homicides were ruled justifiable and three
            were deaths in shootings by officers, and that JPD said its Comstat report
            should not include those six.
          </li>
          <li>
            <strong>More than one agency works homicides in the city.</strong>{" "}
            WLBT says it counts every homicide that happens in Jackson, not just those JPD
            investigates, so its totals can differ from an agency’s. Police departments
            count only homicides that happened in their own jurisdiction, Mississippi Today
            reported. A Capitol Police spokesperson told the{" "}
            <a href={S.clNov2023} className={LINK}>
              Clarion Ledger in 2023
            </a>{" "}
            that the department has no homicide statistics from before 2022.
          </li>
          <li>
            <strong>Counts change later.</strong>{" "}
            WLBT says that in 2023 it discovered JPD had not disclosed 24 homicide cases,
            and it corrected its reporting. In November 2024,{" "}
            <a href={S.wlbtCapitolPolice2024} className={LINK}>
              WLBT reported
            </a>{" "}
            that the state Department of Public Safety released information on three
            Capitol Police homicide cases the agency had not disclosed in news releases.
            The same story said a case can begin as a death investigation and be ruled a
            homicide later.
          </li>
          <li>
            <strong>The FBI’s record for Jackson has gaps.</strong>{" "}
            The FBI’s Crime Data Explorer shows no homicide figures from JPD for 2021
            through 2024 and none for December 2020. Mississippi Today reported that JPD
            stopped supplying its figures in late 2020, after the FBI started using a new
            data system, because the department lacked the technology to report to it. For
            2025, the FBI’s data shows 26 homicides reported by JPD, and the state
            Department of Public Safety’s{" "}
            <a href={S.stateStats2025} className={LINK}>
              crime statistics site
            </a>{" "}
            shows 26 under murder. JPD recorded 63 homicides that year, Mississippi Today
            reported. It wrote that the FBI numbers “appear incomplete” and that JPD did
            not respond to its questions about why. For January through October {Y.year},
            the FBI’s data shows 33 from JPD. The Wire does not know why the FBI’s numbers
            for JPD are lower than JPD’s own.
          </li>
          <li>
            <strong>
              JPD stopped routinely releasing its numbers in 2020, Mississippi Today reported.
            </strong>{" "}
            The department once released weekly crime statistics on the city’s website,
            later switched to monthly reports and ceased routinely releasing numbers in the
            summer of 2020, according to the news outlet. In February 2024, the{" "}
            <a href={S.clFeb2024} className={LINK}>
              Clarion Ledger
            </a>{" "}
            cited the city’s website for JPD’s 2023 number. The Wire found no homicide
            statistics on the city’s{" "}
            <a href={S.cityJpd} className={LINK}>
              JPD page
            </a>{" "}
            when it checked on {CHECKED}.
          </li>
          <li>
            <strong>Newsrooms keep their own counts.</strong>{" "}
            The{" "}
            <a href={S.clNov12} className={LINK}>
              Clarion Ledger
            </a>{" "}
            says its data is based on reports from agencies such as JPD, Capitol Police and
            the Hinds County coroner’s office. WLBT says its numbers come from JPD
            releases, confirmations from police and the coroner, and reports from other
            lead agencies. For 2021, Mississippi Today noted, WLBT reported 160 and the
            Clarion Ledger 157.
          </li>
        </ul>
      </section>

      {/* Rate */}
      <section className="mt-14 grid gap-10 md:grid-cols-[2fr_3fr]" id="rate">
        <div>
          <h2 className={H2}>Homicides per 100,000 Residents</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              A rate sets the count beside the city’s population. This is the Wire’s
              arithmetic: WLBT’s count for the year, divided by the Census Bureau’s July 1
              population estimate for Jackson for the same year, times 100,000.
            </p>
            <p>
              A different count or a different population figure gives a different rate.
              The Wire used WLBT’s counts because WLBT is the only source on this page with
              a number for every year from 2016 to 2025. The table leaves out 2026 because
              the year is not over.
            </p>
            <p>
              Other published rates differ for that reason. The{" "}
              <a href={S.clFiveYears} className={LINK}>
                Clarion Ledger
              </a>
              , for example, divided the 2024 count by a 2023 population estimate because
              the Census Bureau had not yet released one for 2024. WLBT’s tracker charts
              its own rate with population figures that differ from these for 2016 through
              2024, so its rates differ too.
            </p>
            <p>
              This page does not rank Jackson against other cities. Mississippi Today
              reported that the FBI discourages using its statistics to compile rankings.
            </p>
          </div>
        </div>
        <div>
          <table className="w-full font-sans text-sm">
            <caption className="sr-only">
              Homicides per 100,000 residents in Jackson, from WLBT counts and Census Bureau
              population estimates
            </caption>
            <thead>
              <tr className="border-b border-ink text-left text-[0.68rem] uppercase tracking-widest text-muted">
                <th scope="col" className="py-2 pr-3 font-bold">
                  Year
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-bold">
                  WLBT count
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-bold">
                  Census estimate
                </th>
                <th scope="col" className="py-2 text-right font-bold">
                  Per 100,000
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule border-b border-rule">
              {rates
                .slice()
                .reverse()
                .map((r) => (
                  <tr key={r.year}>
                    <th scope="row" className="py-2 pr-3 text-left font-serif text-base font-bold">
                      {r.year}
                    </th>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.count}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted">
                      {r.population.toLocaleString("en-US")}
                    </td>
                    <td className="py-2 text-right font-bold tabular-nums">
                      {r.rate.toFixed(1)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
            Population figures for 2016 to 2019 are from the Census Bureau’s{" "}
            <a href={S.census2010s} className={LINK}>
              2010 to 2020 intercensal estimates
            </a>
            . Those for 2020 to 2025 are from its{" "}
            <a href={S.census2020s} className={LINK}>
              2020 to 2025 city estimates
            </a>
            .
          </p>
        </div>
      </section>

      {/* Who investigates, and what readers can do */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className={H2}>Who Investigates</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              <strong>Jackson Police Department.</strong>{" "}
              The{" "}
              <a href={S.cityEmergency} className={LINK}>
                city says
              </a>{" "}
              its police department provides law enforcement services that include patrol
              and investigations. A{" "}
              <a href={S.jpdRelease} className={LINK}>
                JPD news release
              </a>{" "}
              about a {shortDay(Y.jpdReleaseDate)} shooting said the department’s
              Robbery/Homicide Unit was investigating.
            </p>
            <p>
              <strong>Capitol Police.</strong>{" "}
              The{" "}
              <a href={S.stateCapitolPolice} className={LINK}>
                state says
              </a>{" "}
              the Office of Capitol Police is a unit of the Mississippi Department of Public
              Safety, charged with protecting life and property inside the Capitol Complex
              Improvement District in Jackson. The department’s{" "}
              <a href={S.dpsCapitolPoliceInvestigations} className={LINK}>
                website says
              </a>{" "}
              its investigative team conducts the investigations that occur in the district.
            </p>
            <p>
              <strong>Other agencies.</strong>{" "}
              <a href={S.wlbt2025} className={LINK}>
                WLBT reported
              </a>{" "}
              that the Hinds County Sheriff’s Office was the lead agency for one 2025
              homicide inside the city limits, and that Jackson State’s police department{" "}
              <a href={S.wlbt2023} className={LINK}>
                handled one in 2023
              </a>
              .
            </p>
          </div>
        </div>
        <div>
          <h2 className={H2}>If You Know Something</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              <strong>An emergency or a crime in progress:</strong> call 911.
            </p>
            <p>
              <strong>Jackson police:</strong>{" "}
              <a
                href={`tel:${C.jpdNonEmergency.tel}`}
                className="whitespace-nowrap font-bold underline hover:text-crimson"
              >
                {C.jpdNonEmergency.phone}
              </a>
              . The city lists it as JPD’s{" "}
              <a href={S.cityJpd} className={LINK}>
                non-emergency number
              </a>
              , and JPD’s {shortDay(Y.jpdReleaseDate)} news release asked anyone with
              information to call it.
            </p>
            <p>
              <strong>Capitol Police:</strong>{" "}
              <a
                href={`tel:${C.capitolPolice.tel}`}
                className="whitespace-nowrap font-bold underline hover:text-crimson"
              >
                {C.capitolPolice.phone}
              </a>
              , the number on the department’s{" "}
              <a href={S.dpsCapitolPolice} className={LINK}>
                web page
              </a>
              .
            </p>
            <p>
              <strong>Anonymous tips:</strong>{" "}
              <a href={S.crimeStoppers} className={LINK}>
                {C.crimeStoppers.name}
              </a>{" "}
              takes them at{" "}
              <a
                href={`tel:${C.crimeStoppers.tel}`}
                className="whitespace-nowrap font-bold underline hover:text-crimson"
              >
                {C.crimeStoppers.phone}
              </a>{" "}
              or{" "}
              <a
                href={`tel:${C.crimeStoppers.tollFreeTel}`}
                className="whitespace-nowrap font-bold underline hover:text-crimson"
              >
                {C.crimeStoppers.tollFree}
              </a>
              , and through its{" "}
              <a href={S.crimeStoppersTipForm} className={LINK}>
                online tip form
              </a>
              . It says a tip that leads to an arrest could be eligible for a reward of up to
              $2,500, depending on the nature of the crime. It also says to report an
              immediate danger by calling 911.
            </p>
            <p>
              <strong>To see the cases behind a count:</strong>{" "}
              WLBT’s{" "}
              <a href={S.tracker} className={LINK}>
                Homicide Tracker
              </a>{" "}
              can be searched by year back to 2016, WLBT says.
            </p>
          </div>
        </div>
      </section>

      {/* Coverage */}
      {coverage.length > 0 && (
        <section className="mt-14">
          <h2 className={H2}>From the Wire: Police and Public Safety</h2>
          <ol className="divide-y divide-rule border-y border-ink">
            {coverage.map((p) => (
              <li key={p.slug} className="py-4">
                <Link
                  href={`/article/${p.slug}`}
                  className="grid grid-cols-[100px_1fr] gap-4 hover:text-crimson sm:grid-cols-[140px_1fr]"
                >
                  <span className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">
                    {formatDate(p.date)}
                  </span>
                  <span className="font-serif text-lg font-bold leading-snug">{p.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <MoreGuides current="/jackson-homicides" headingClassName={H2} />

      <p className="mt-12 max-w-3xl border-t border-rule pt-6 font-sans text-sm leading-relaxed text-muted">
        Reporting note: The Wire did not count homicide cases itself. Each count on this
        page was published by the source named beside it, with one exception: each FBI
        number is the Wire’s sum of the monthly figures the FBI’s{" "}
        <a href={S.fbi} className={LINK}>
          Crime Data Explorer
        </a>{" "}
        showed for JPD. The explorer showed a last refresh date of Nov. 15, 2026. The rates
        are also the Wire’s arithmetic, from WLBT’s counts and the Census Bureau’s
        population estimates. The WLBT tracker totals for 2016 through {Y.year} are what
        its{" "}
        <a href={S.tracker} className={LINK}>
          Homicide Tracker
        </a>{" "}
        displayed on {CHECKED}. In the tracker’s data file, one entry dated July 12, 2016,
        is labeled 2026 and one dated Dec. 27, 2018, is labeled 2019; the tracker’s display
        goes by the date, so its totals for 2016, 2018, 2019 and 2026 would each shift by
        one if WLBT changed those dates to match the labels. The date of the tracker’s
        latest case is from its data file. Clarion Ledger stories were read in the copies
        carried by Yahoo News and AOL because the newspaper’s own site refused the Wire’s
        automated requests. The Mississippi Today story was read in a republished copy, and
        the passages used here were checked against the original on {CHECKED}. The
        Department of Public Safety’s Capitol Police pages were read on its site the same
        day. The Wire did not ask JPD, Capitol Police, the FBI or any newsroom to comment
        for this page, and it has not checked any count against police case files. Hinds
        County’s sheriff page does not say when the sheriff’s office leads a homicide case
        inside the city. This page does not name victims or suspects. Last checked{" "}
        {CHECKED}. If a source’s own page and this one differ, the source is right about its
        own number.
      </p>
    </div>
  );
}
