import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import { TRASH, HOLIDAY_NOTES, upcomingHolidays } from "@/lib/jackson-trash";
import { centralToday, formatDay } from "@/lib/central-time";

// "Next holiday" depends on today's date, so refresh hourly; deploys rebuild
// it sooner.
export const revalidate = 3600;

const PATH = "/trash-pickup";
const TITLE = "Jackson, MS Trash Pickup: Schedule, Holidays and Rules";
const DEK =
  "When Jackson collects garbage, what changes around the holidays, what can go to the curb and who to call when a pickup is missed. Taken from the city’s Solid Waste Division.";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Jackson, Mississippi, garbage pickup: twice-a-week collection, the holiday schedule, bulk item rules, what the trucks will not take, and who to call about a missed pickup.",
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

export default function TrashPickupPage() {
  const today = centralToday();
  const holidays = upcomingHolidays(today);
  const next = holidays[0];
  const note = HOLIDAY_NOTES[next.date];
  const coverage = getAllPosts()
    .filter((p) => /landfill|garbage|trash|richard.s disposal/i.test(`${p.title} ${p.dek}`))
    .filter((p) => !p.slug.startsWith("morning-brief"))
    .slice(0, 5);

  const facts = [
    { label: "Collection", value: "Twice a week" },
    { label: "Hours", value: "7 a.m. to 9 p.m., Monday through Saturday" },
    {
      label: "Hauler",
      value: (
        <>
          {TRASH.hauler.name}, <span className="whitespace-nowrap">{TRASH.hauler.phone}</span>
        </>
      ),
    },
    { label: "Next holiday", value: `${next.name}, ${formatDay(next.date, { year: false })}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DEK,
    url: absoluteUrl(PATH),
    dateModified: TRASH.checked,
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
          Jackson Guide · Solid Waste
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black leading-[1.02] sm:text-6xl">
          Jackson Trash Pickup: Schedule, Holidays and Rules
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

      {/* Holidays */}
      <section className="mt-12" id="holidays">
        <h2 className={H2}>Holiday Schedule</h2>
        <div className="grid gap-10 md:grid-cols-[3fr_2fr]">
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <h3 className="font-serif text-2xl font-black leading-tight">
              Next: {next.name}, {formatDay(next.date)}
            </h3>
            {note ? (
              <>
                {note.text.map((t) => (
                  <p key={t}>{t}</p>
                ))}
                <p className="text-sm text-muted">
                  Checked {formatDay(note.checked, { weekday: false })}. Source:{" "}
                  {note.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 ? "; " : ""}
                      <a href={s.url} className="underline hover:text-crimson">
                        {s.label}
                      </a>
                    </span>
                  ))}
                  .
                </p>
              </>
            ) : (
              <p>
                The Wire has not yet checked for a city announcement about this holiday.
                The city&rsquo;s standing rule is below. Call {TRASH.hauler.name}{" "}
                to confirm your pickup.
              </p>
            )}
            <p>
              <strong>The standing rule.</strong>{" "}
              The city says collection days change around five holidays only. A pickup day that &ldquo;falls on or after&rdquo; one of
              them is collected &ldquo;on the following collection day,&rdquo; its website
              says. Watch for a city announcement before each holiday: in 2024 it posted
              its Thanksgiving schedule on social media, WLBT reported.
            </p>
            <p>
              To confirm your pickup in a holiday week, call {TRASH.hauler.name} at{" "}
              <a
                href={`tel:${TRASH.hauler.tel}`}
                className="whitespace-nowrap font-bold underline hover:text-crimson"
              >
                {TRASH.hauler.phone}
              </a>
              .
            </p>
          </div>
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
              The five collection holidays
            </p>
            <ol className="mt-3 divide-y divide-rule border-y border-ink">
              {holidays.map((h) => (
                <li key={h.date} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="font-serif text-base font-bold">{h.name}</span>
                  <span className="font-sans text-sm text-muted">{formatDay(h.date)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 font-sans text-sm text-muted">
              These are the calendar dates. When a holiday falls on a weekend, check the
              city&rsquo;s announcement for the day it observes.
            </p>
          </div>
        </div>
      </section>

      {/* Regular service */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className={H2}>Your Two Pickup Days</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              The city collects household garbage twice a week from single-family homes,
              duplexes and triplexes.
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>First day:</strong> household garbage only.
              </li>
              <li>
                <strong>Second day:</strong> household garbage, plus up to two bulk items and
                bagged leaves.
              </li>
            </ul>
            <p>
              Bulk items include {TRASH.bulkItems.slice(0, -1).join(", ").toLowerCase()} and{" "}
              {TRASH.bulkItems.at(-1)?.toLowerCase()}.
            </p>
            <p>
              Appliances and tires are collected on Wednesdays and must be at the curb
              before 7 a.m.
            </p>
            <p>
              The city pages the Wire checked do not list pickup days by address. To confirm
              yours, call {TRASH.hauler.name} at{" "}
              <span className="whitespace-nowrap">{TRASH.hauler.phone}</span>.
            </p>
          </div>
        </div>
        <div>
          <h2 className={H2}>Putting It Out</h2>
          <ul className="list-disc space-y-2 pl-6 font-sans text-base leading-relaxed">
            <li>
              Bins go to the road before 7 a.m. on pickup day, and no earlier than 6 p.m. the
              evening before.
            </li>
            <li>
              Bulk items go out before 7 a.m. on pickup day, and no earlier than 24 hours
              before.
            </li>
            <li>
              Crews collect from 7 a.m. to 9 p.m., Monday through Saturday.
            </li>
            <li>Bag household garbage and put the bags in a container.</li>
          </ul>
        </div>
      </section>

      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className={H2}>What the Trucks Will Not Take</h2>
          <ul className="list-disc space-y-2 pl-6 font-sans text-base leading-relaxed">
            {TRASH.notAllowed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 font-sans text-base leading-relaxed">
            Hazardous household waste goes to the city&rsquo;s{" "}
            {TRASH.hazardousDropOff.name}, {TRASH.hazardousDropOff.address}. The city says
            the drop-off is for residents only and accepts:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 font-sans text-base leading-relaxed">
            {TRASH.hazardousDropOff.accepts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 font-sans text-base leading-relaxed">
            The city&rsquo;s pages do not list the center&rsquo;s hours and ask residents
            not to leave items after hours, so call 311 before you go.
          </p>
        </div>
        <div>
          <h2 className={H2}>Missed Pickup or a Problem</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              <strong>{TRASH.hauler.name}</strong>, the city&rsquo;s hauler:{" "}
              <a
                href={`tel:${TRASH.hauler.tel}`}
                className="whitespace-nowrap font-bold underline hover:text-crimson"
              >
                {TRASH.hauler.phone}
              </a>{" "}
              or{" "}
              <a
                href={`mailto:${TRASH.hauler.email}`}
                className="underline hover:text-crimson"
              >
                {TRASH.hauler.email}
              </a>
              .
            </p>
            <p>
              <strong>The city:</strong> dial 311. The city says its{" "}
              <a href={TRASH.sources.city311} className="underline hover:text-crimson">
                311 Action Line
              </a>{" "}
              takes reports about garbage collection, bulk trash and recycling, and routes
              them to the right department.
            </p>
            <p>
              <strong>New address?</strong> Garbage service starts when water and sewer
              service is set up. The city says to apply at the {TRASH.newService.office},{" "}
              {TRASH.newService.address}.
            </p>
          </div>
        </div>
      </section>

      {/* Coverage */}
      {coverage.length > 0 && (
        <section className="mt-14">
          <h2 className={H2}>From the Wire: Trash, Landfill and the Money</h2>
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

      {/* More guides */}
      <section className="mt-14">
        <h2 className={H2}>More Jackson Guides</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="border border-rule bg-paper p-4">
            <Link
              href="/boil-water-notices"
              className="font-serif text-base font-bold hover:text-crimson"
            >
              Jackson boil-water notices in effect today
            </Link>
          </li>
          <li className="border border-rule bg-paper p-4">
            <Link href="/city-council" className="font-serif text-base font-bold hover:text-crimson">
              Jackson City Council: members, meetings and how to speak
            </Link>
          </li>
        </ul>
      </section>

      <p className="mt-12 max-w-3xl border-t border-rule pt-6 font-sans text-sm leading-relaxed text-muted">
        Reporting note: The collection rules, hours, bulk items, holiday rule, drop-off site
        and contacts are from the City of Jackson&rsquo;s{" "}
        <a href={TRASH.sources.schedule} className="underline hover:text-crimson">
          Garbage Collection Schedule
        </a>
        ,{" "}
        <a href={TRASH.sources.division} className="underline hover:text-crimson">
          Solid Waste Division
        </a>
        ,{" "}
        <a href={TRASH.sources.residents} className="underline hover:text-crimson">
          Trash and Recycling
        </a>
        ,{" "}
        <a href={TRASH.sources.hazardous} className="underline hover:text-crimson">
          Household Hazardous Waste
        </a>{" "}
        and{" "}
        <a href={TRASH.sources.city311} className="underline hover:text-crimson">
          311
        </a>{" "}
        pages, last checked {formatDay(TRASH.checked, { weekday: false })}. Holiday dates are
        the Wire&rsquo;s calculation from the calendar. The Wire did not ask the city or{" "}
        {TRASH.hauler.name}{" "}
        to comment for this page. If the city&rsquo;s pages and this one differ, the city is
        right.
      </p>
    </div>
  );
}
