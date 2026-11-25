import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import {
  TAX,
  homesteadWindow,
  upcomingTaxDates,
  type TaxDateKind,
} from "@/lib/hinds-property-tax";
import { centralToday, formatDay } from "@/lib/central-time";

// "Next deadline" depends on today's date, so refresh hourly; deploys rebuild
// it sooner.
export const revalidate = 3600;

const PATH = "/hinds-county-property-tax";
const TITLE = "Hinds County Property Tax: Due Dates, Homestead, Tax Sale";
const DEK =
  "When property taxes are due in Hinds County, how to pay, what a late payment costs, who gets a homestead exemption, and how the tax sale and redemption work. Taken from the county’s offices, the Mississippi Department of Revenue and the state code.";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Hinds County, Mississippi, property tax: when bills are due, how to pay, late interest, homestead exemption, the August tax sale and how to redeem property.",
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
const BODY = "space-y-4 font-sans text-base leading-relaxed";
const LIST = "list-disc space-y-2 pl-6 font-sans text-base leading-relaxed";

const SHORT: Record<TaxDateKind, string> = {
  "taxes-due": "Taxes due",
  homestead: "Homestead deadline",
  "installment-2": "Second installment due",
  "installment-3": "Final installment due",
  "tax-sale": "Tax sale",
};

// One sentence under the "Next" heading, by kind of date.
const NEXT_NOTE: Record<TaxDateKind, string> = {
  "taxes-due":
    "The whole bill is due by this date, or the first half for owners paying in installments. Interest runs on what is unpaid after Feb. 1.",
  homestead:
    "State law says a homestead application that is not on file by April 1 cannot be accepted.",
  "installment-2":
    "For owners paying in installments, one-fourth of the tax is due, with the interest owed.",
  "installment-3":
    "For owners paying in installments, the last one-fourth of the tax is due, with the interest owed.",
  "tax-sale": "State law sets the sale of land with unpaid taxes for the last Monday in August.",
};

function tel(phone: string): string {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}

function Phone({ number, bold = false }: { number: string; bold?: boolean }) {
  return (
    <a href={tel(number)} className={`whitespace-nowrap ${bold ? "font-bold " : ""}${LINK}`}>
      {number}
    </a>
  );
}

export default function HindsPropertyTaxPage() {
  const today = centralToday();
  const dates = upcomingTaxDates(today);
  const next = dates[0];
  const nextSale = upcomingTaxDates(today, 10).find((d) => d.kind === "tax-sale");
  const homestead = homesteadWindow(today);
  const homesteadDeadline = upcomingTaxDates(today, 10).find((d) => d.kind === "homestead");
  const { collector, assessor, chancery } = TAX;
  const S = TAX.sources;

  // Wire stories on millage and property tax. Tax-increment financing stories
  // mention property tax but are about project financing, so they stay out.
  const coverage = getAllPosts()
    .filter((p) => /millage|property tax|tax sale|homestead/i.test(`${p.title} ${p.dek}`))
    .filter((p) => !/\bTIF\b|tax-increment/i.test(`${p.title} ${p.dek}`))
    .filter((p) => !p.slug.startsWith("morning-brief"))
    .slice(0, 6);

  const facts = [
    { label: "Next deadline", value: `${SHORT[next.kind]} ${formatDay(next.date)}` },
    {
      label: homestead.open ? "Homestead filing, open now" : "Homestead filing",
      value: `${formatDay(homestead.opens, { weekday: false, year: false })} to ${formatDay(
        homestead.closes,
        { weekday: false },
      )}`,
    },
    {
      label: "Tax sale date in state law",
      value: nextSale ? formatDay(nextSale.date) : "Last Monday in August",
    },
    {
      label: "Tax Collector",
      value: <span className="whitespace-nowrap">{collector.jackson.phones[0]}</span>,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DEK,
    url: absoluteUrl(PATH),
    dateModified: TAX.checked,
    isPartOf: { "@id": absoluteUrl("/#org") },
    about: {
      "@type": "GovernmentOrganization",
      name: "Hinds County Tax Collector",
      url: S.collector,
      address: collector.jackson.address,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-rule pb-8">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Hinds County Guide · Property Tax
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black leading-[1.02] sm:text-6xl">
          Hinds County Property Tax: Due Dates, Homestead Exemption and the Tax Sale
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

      {/* Key dates */}
      <section className="mt-12" id="dates">
        <h2 className={H2}>Key Dates</h2>
        <div className="grid gap-10 md:grid-cols-[3fr_2fr]">
          <div className={BODY}>
            <h3 className="font-serif text-2xl font-black leading-tight">
              Next: {SHORT[next.kind]}, {formatDay(next.date)}
            </h3>
            <p>{NEXT_NOTE[next.kind]}</p>
            {next.weekend && (
              <p>This date falls on a weekend. The weekend rule is below.</p>
            )}
            <p>
              <strong>The calendar comes from state law.</strong>{" "}
              Property taxes are due on or before Feb. 1 of the year after the property is
              assessed, under Section 27-41-1 of the Mississippi Code. The same section
              says a tax collector must begin taking payments no later than Dec. 26.
            </p>
            <p>
              Hinds County&rsquo;s Tax Collector says tax statements go out the first week
              of December.
            </p>
            <p>
              <strong>When a due date lands on a weekend.</strong>{" "}
              The law says that when a payment&rsquo;s due date falls on &ldquo;a Saturday,
              Sunday or legal holiday,&rdquo; the tax collector takes the payment &ldquo;on
              the first working day after such day or days without any interest being owed
              by the taxpayer&rdquo; (Section 27-41-9). The Mississippi Department of
              Revenue says that when Feb. 1 falls on a weekend or legal holiday, taxes
              &ldquo;may be paid the following Monday without penalties or interest.&rdquo;
            </p>
          </div>
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
              The next five dates
            </p>
            <ol className="mt-3 divide-y divide-rule border-y border-ink">
              {dates.map((d) => (
                <li key={`${d.kind}-${d.date}`} className="py-3">
                  <p className="font-serif text-base font-bold">{formatDay(d.date)}</p>
                  <p className="font-sans text-sm text-muted">
                    {d.label}
                    {d.weekend ? ". Falls on a weekend." : ""}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-3 font-sans text-sm text-muted">
              These are the calendar dates the law names. The Wire does not move a date
              that falls on a weekend or holiday. Confirm with the office.
            </p>
          </div>
        </div>
      </section>

      {/* Installments and late payment */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div id="installments">
          <h2 className={H2}>Paying in Installments</h2>
          <div className={BODY}>
            <p>
              State law lets a county take partial payments if its Board of Supervisors
              orders it. The schedule in Section 27-41-1:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Feb. 1:</strong> half of the tax.
              </li>
              <li>
                <strong>May 1:</strong> one-fourth, with interest and penalty due.
              </li>
              <li>
                <strong>July 1:</strong> one-fourth, with interest and penalty due.
              </li>
            </ul>
            <p>
              In Hinds County, the Chancery Clerk&rsquo;s page says current taxes may be
              paid in three installments. The Tax Collector&rsquo;s FAQ says an
              installment can be paid by mail or at the office.
            </p>
            <p>
              Installments carry interest. The FAQ says the monthly charge applies to
              taxes paid after Feb. 1, &ldquo;including installment payments.&rdquo;
            </p>
            <p>
              If any balance is unpaid on Aug. 1, the law says the land is sold at the tax
              sale on the last Monday in August.
            </p>
          </div>
        </div>
        <div id="late">
          <h2 className={H2}>What a Late Payment Costs</h2>
          <div className={BODY}>
            <p>
              Unpaid tax draws interest of one-half of 1% a month, &ldquo;or fractional
              part thereof,&rdquo; from Feb. 1 until it is paid (Section 27-41-9). The
              Legislature cut the rate from 1% a month in 2020.
            </p>
            <p>
              On $1,000 of unpaid tax, that is $5 for each month or part of a month, by
              the Wire&rsquo;s arithmetic.
            </p>
            <p>
              A late payer also owes &ldquo;all other fees, penalties and costs prescribed
              by law&rdquo; (Section 27-41-11).
            </p>
            <p>
              <strong>Paying by mail.</strong>{" "}
              The Tax Collector&rsquo;s FAQ says a payment with a postmark past the due
              date &ldquo;will be considered late.&rdquo;
            </p>
            <p>
              Land with taxes still unpaid in August is advertised and sold. See{" "}
              <a href="#tax-sale" className={LINK}>
                the tax sale
              </a>{" "}
              below.
            </p>
          </div>
        </div>
      </section>

      {/* How to pay */}
      <section className="mt-14 grid gap-10 md:grid-cols-2" id="pay">
        <div>
          <h2 className={H2}>How to Pay: In Person or by Mail</h2>
          <div className={BODY}>
            <p>
              Property taxes are paid to the Hinds County Tax Collector, {collector.name}.
              The office has two locations. Both are open {TAX.hours}.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Jackson:</strong> {collector.jackson.address}. Phone{" "}
                {collector.jackson.phones.map((p, i) => (
                  <span key={p}>
                    {i > 0 ? ", " : ""}
                    <Phone number={p} />
                  </span>
                ))}
                . Mail to {collector.jackson.mail}.
              </li>
              <li>
                <strong>Raymond:</strong> {collector.raymond.address}. Phone{" "}
                <Phone number={collector.raymond.phone} />. Mail to {collector.raymond.mail}.
              </li>
            </ul>
            <p>
              The office&rsquo;s FAQ says it takes cash, checks drawn on local banks and
              payment by internet.
            </p>
            <p>
              <strong>Paying by card.</strong>{" "}
              The Tax Collector&rsquo;s page, in its instructions for car tags, lists a
              2.25% surcharge on credit card payments. The county pages the Wire read do
              not say whether that applies to property tax, and they do not list what to
              bring. Ask the office before you go.
            </p>
          </div>
        </div>
        <div>
          <h2 className={H2}>How to Pay: Online</h2>
          <div className={BODY}>
            <p>
              The county&rsquo;s{" "}
              <a href={S.payOnline} className={LINK}>
                Pay Online
              </a>{" "}
              page links to a{" "}
              <a href={S.payLookup} className={LINK}>
                real property lookup
              </a>
              . Search by taxpayer name, street name or parcel number. The county writes
              parcel numbers as 9999-9999-999, with no leading zeroes.
            </p>
            <p>
              <strong>No bill?</strong>{" "}
              If a statement does not come soon after the first week of December, the Tax
              Collector&rsquo;s FAQ says to call <Phone number={collector.billPhone} bold />.
            </p>
            <p>
              The bill carries the name of the person who owned the property on Jan. 1, the
              FAQ says. The Chancery Clerk&rsquo;s page tells owners to make sure the Tax
              Collector has their current mailing address.
            </p>
          </div>
        </div>
      </section>

      {/* Homestead */}
      <section className="mt-14" id="homestead">
        <h2 className={H2}>Homestead Exemption</h2>
        <div className="grid gap-10 md:grid-cols-2">
          <div className={BODY}>
            <p>
              Homestead exemption lowers the property tax on a home you own and live in.
              You have to apply for it, the Department of Revenue says.
            </p>
            <p>
              <strong>Where to file.</strong>{" "}
              The Hinds County Tax Assessor, {assessor.name}, {assessor.jackson.address}.
              Homestead line: <Phone number={assessor.jackson.phone} bold />. Raymond
              office: <Phone number={assessor.raymond.phone} />.
            </p>
            <p>
              <strong>When to file.</strong>{" "}
              Jan. 1 through April 1, during the office&rsquo;s business hours. The next
              filing period{" "}
              {homestead.open ? "is open now and closes" : "opens Jan. 1 and closes"}{" "}
              {formatDay(homestead.closes)}. An application &ldquo;not on file on or before
              April 1&rdquo; cannot be accepted, the law says (Section 27-33-31). The one
              exception in that rule: the governor may extend the period up to 30 days
              when the assessor&rsquo;s office is too damaged to take applications.
            </p>
            {homesteadDeadline?.weekend && (
              <p>
                That April 1 falls on a weekend. The homestead law says only &ldquo;on or
                before the first day of April,&rdquo; so ask the Tax Assessor&rsquo;s
                office for the last day it will take applications.
              </p>
            )}
            <p>
              <strong>Who qualifies.</strong>{" "}
              The Department of Revenue lists these requirements, among others:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>You own the home and live in it as your primary residence on Jan. 1.</li>
              <li>
                Ownership is in place before Jan. 1, and the deed or other ownership
                document is filed with the Chancery Clerk before Jan. 7.
              </li>
              <li>
                You and your spouse comply with Mississippi&rsquo;s income tax laws and
                its road and bridge privilege tax laws, which cover car tags.
              </li>
            </ul>
            <p>
              You do not have to apply again each year. The department says you must
              file a new application when something changes, such as a marriage, divorce,
              death or deed change, or when you turn 65 and want the larger exemption.
            </p>
            <p>
              <strong>What to bring.</strong>{" "}
              The assessor&rsquo;s{" "}
              <a href={S.homesteadWorksheet} className={LINK}>
                homestead worksheet
              </a>{" "}
              asks for:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Social Security numbers for you and your spouse.</li>
              <li>A copy of your deed and closing papers.</li>
              <li>The total purchase price and the down payment.</li>
              <li>
                Tag numbers for every vehicle you own or have in your possession, company
                vehicles included.
              </li>
              <li>
                Proof of age, such as a driver&rsquo;s license or birth certificate, if you
                or your spouse is 65 or older.
              </li>
              <li>An award letter, if you are claiming a disability exemption.</li>
            </ul>
            <p>
              The worksheet asks for closing papers. A 2026 change to the homestead law
              says: &ldquo;No applicant shall be required to produce a copy of any closing
              statement or disclosure in order to qualify for homestead exemption&rdquo;
              (Section 27-33-31, as amended by Senate Bill 2882).
            </p>
          </div>
          <div className={BODY}>
            <h3 className="font-serif text-2xl font-black leading-tight">What It Is Worth</h3>
            <p>
              <strong>Regular exemption.</strong>{" "}
              For homeowners under 65 who are not totally disabled: a credit of up to
              $300 against the tax, on a sliding scale set by assessed value (Section
              27-33-75). The full $300 starts at $7,351 of assessed value. Half of the
              credit comes off school district taxes and half off county general fund
              taxes, the law says.
            </p>
            <p>
              <strong>65 or older, or totally disabled.</strong>{" "}
              Exempt from all property taxes on the first $7,500 of assessed value
              (Section 27-33-75). The Department of Revenue describes that as the first
              $75,000 of the home&rsquo;s true value. You must be 65 or totally disabled
              by Jan. 1 of the year you apply. After the first year, the department says,
              the exemption can grow to cover most later increases in value.
            </p>
            <p>
              The department accepts as proof of total disability a classification under
              the Social Security Act or the Railroad Retirement Act, among other
              records, or detailed letters from two physicians.
            </p>
            <p>
              <strong>Total exemption.</strong>{" "}
              The department lists these homeowners as exempt from all property taxes on
              a qualifying homestead:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Honorably discharged veterans with a service-connected total disability,
                and their unremarried surviving spouses.
              </li>
              <li>
                Honorably discharged veterans who are 90 or older on Jan. 1, and their
                unremarried surviving spouses.
              </li>
              <li>
                Unremarried surviving spouses of members of the armed forces who were
                killed or died on active duty, or of reserve or National Guard members
                who were killed or died on active duty for training.
              </li>
            </ul>
            <p>
              <strong>From Jan. 1, 2027.</strong>{" "}
              Two laws passed in 2026 apply from that date:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                The age for the veterans&rsquo; total exemption is 85 instead of 90
                (Section 27-33-75, as amended by House Bill 420).
              </li>
              <li>
                State law has barred the exemption when a homeowner or spouse has not
                complied with the state&rsquo;s income tax laws. From Jan. 1, 2027, that
                homeowner is eligible, but the exemption is not taken off the tax bill.
                The tax collector sends that amount, up to what is owed, to the
                Department of Revenue to apply to the income tax debt (Sections 27-33-51
                and 27-33-63, as amended by House Bill 4044).
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How the bill is calculated */}
      <section className="mt-14" id="bill">
        <h2 className={H2}>How the Bill Is Calculated</h2>
        <div className="grid gap-10 md:grid-cols-2">
          <div className={BODY}>
            <p>
              The Department of Revenue gives the formula in three parts: true value,
              times the assessment ratio, times the millage rate.
            </p>
            <p>
              <strong>True value.</strong>{" "}
              State law requires the county Tax Assessor to appraise property at its true
              value, the department says. It says assessors must revalue real property at
              least once every four years.
            </p>
            <p>
              <strong>Assessment ratio.</strong>{" "}
              The share of true value that is taxed. The state constitution sets it by
              class of property (Section 112; Mississippi Code Section 27-35-4):
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Class I, 10%:</strong> single-family, owner-occupied residential
                real property.
              </li>
              <li>
                <strong>Class II, 15%:</strong> all other real property, except public
                utility property.
              </li>
              <li>
                <strong>Class III, 15%:</strong> personal property, such as business
                inventory and equipment, except motor vehicles and utility property.
              </li>
              <li>
                <strong>Class IV and Class V, 30%:</strong> public utility property and
                motor vehicles.
              </li>
            </ul>
            <p>
              The Tax Assessor posts a{" "}
              <a href={S.tenPercentForm} className={LINK}>
                proof of residency form
              </a>{" "}
              for owners filing for the 10% classification. It asks for a current light
              bill and a driver&rsquo;s license or ID card that shows the property
              address.
            </p>
          </div>
          <div className={BODY}>
            <p>
              <strong>Millage rate.</strong>{" "}
              The tax rate. One mill is one-thousandth of a dollar, so 100 mills is $100
              for every $1,000 of assessed value, the department says. The county, the
              city and the school district where the property sits each levy their own.
            </p>
            <p>
              The department&rsquo;s example: a Class II property with a true value of
              $10,000 is assessed at $1,500. At 100 mills, the tax is $150.
            </p>
            <p>
              <strong>Estimate your own.</strong>{" "}
              The Tax Assessor&rsquo;s{" "}
              <a href={S.valueLookupSheet} className={LINK}>
                instruction sheet
              </a>{" "}
              says to find the property&rsquo;s appraised value in the county&rsquo;s{" "}
              <a href={S.landRoll} className={LINK}>
                Land Roll Query
              </a>
              , then enter it in the{" "}
              <a href={S.estimator} className={LINK}>
                Estimated Taxes
              </a>{" "}
              calculator and choose one of its {TAX.estimatorDistricts.length} tax
              districts. The county labels the result an estimate. For help, the sheet
              gives <Phone number={assessor.valuePhones[0]} /> and{" "}
              <Phone number={assessor.valuePhones[1]} />.
            </p>
            <p>
              This page does not list mill rates. The calculator page says the rate for a
              new year is not set until September. The Wire&rsquo;s{" "}
              <a href="#coverage" className={LINK}>
                stories on city and county millage
              </a>{" "}
              are below.
            </p>
            <p>
              <strong>If you think the value is wrong.</strong>{" "}
              The Tax Assessor&rsquo;s page says the office will review a property&rsquo;s
              value at a taxpayer&rsquo;s request at any time of year. Formal objections
              go to the Board of Supervisors, which meets the first Monday of August to
              hear them (Section 27-35-89). An owner who files no written objection at
              that meeting cannot question the assessment after it is approved, with
              exceptions for minors and persons not of sound mind (Section 27-35-93).
            </p>
          </div>
        </div>
      </section>

      {/* Tax sale */}
      <section className="mt-14" id="tax-sale">
        <h2 className={H2}>The Tax Sale</h2>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="font-serif text-2xl font-black leading-tight">
              What State Law Says
            </h3>
            <ul className={`mt-4 ${LIST}`}>
              <li>
                <strong>When.</strong>{" "}
                The last Monday in August (Section 27-41-59).
                {nextSale ? ` The next one is ${formatDay(nextSale.date)}.` : ""} A tax
                collector may also choose to hold a sale on the first Monday in April
                (Section 27-41-55).
              </li>
              <li>
                <strong>Notice.</strong>{" "}
                After Aug. 5, the tax collector advertises the land for two weeks in a
                newspaper published in the county. The notice lists the parcels and says
                where or how the sale will be held. If the sale is online, it must say
                how to bid and when (Section 27-41-55).
              </li>
              <li>
                <strong>Two districts.</strong>{" "}
                In a county with two court districts, land is advertised and sold in the
                district where it lies. Hinds County has two, with offices in Jackson and
                Raymond.
              </li>
              <li>
                <strong>The sale.</strong>{" "}
                Each parcel goes &ldquo;to the highest and best bidder for cash.&rdquo; If
                no one bids the full taxes and costs, the tax collector strikes the land
                off to the state (Section 27-41-59).
              </li>
              <li>
                <strong>Online sales.</strong>{" "}
                A tax collector may hold the sale online through a provider, under an
                agreement the Board of Supervisors must ratify (Section 27-41-59).
              </li>
              <li>
                <strong>After the sale.</strong>{" "}
                A sale does not put the buyer in possession. Under Section 27-41-79, the
                tax collector&rsquo;s certified list of the lands sold gives the buyer, or
                the state, title &ldquo;without the right of possession for the period of
                and subject to the right of redemption.&rdquo;
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-black leading-tight">
              In Hinds County
            </h3>
            <div className={`mt-4 ${BODY}`}>
              <p>
                The Chancery Clerk&rsquo;s page says property with taxes not paid &ldquo;by
                the last Monday in August&rdquo; is auctioned to the highest bidder, or
                struck off to the state if no one bids.
              </p>
              <p>
                <strong>How the county has run it.</strong>{" "}
                The Tax Collector&rsquo;s page links, under &ldquo;Tax Sale FAQ,&rdquo; to
                a{" "}
                <a href={S.taxSaleFlyer} className={LINK}>
                  flyer for the 2024 sale
                </a>
                . The flyer announced that the sale &ldquo;will be held online,&rdquo;
                provided by GovEase, on Monday, Aug. 26, at 8:30 a.m., with separate
                sales for District 1 and District 2 and registration opening July 30,
                2024. It said the county would handle payments.
              </p>
              <p>
                The Wire did not find a county posting that says how the 2026 sale was
                run or how the next one will be. Call the Tax Collector at{" "}
                <Phone number={collector.jackson.phones[0]} bold /> to confirm.
              </p>
              <p>
                <strong>Where the lists are.</strong>{" "}
                Besides the newspaper notice, the county posts files on its{" "}
                <a href={S.taxSaleFiles} className={LINK}>
                  Tax Sale Files
                </a>{" "}
                page. An Internet Archive copy of the page from Sept. 11, 2026, carried the
                parcels advertised for the 2026 sale, the parcels in that sale, the final
                results of the 2025 sale and the parcels that matured to the state in
                August 2025.
              </p>
              <p>
                To see whether one parcel was sold, the county&rsquo;s{" "}
                <a href={S.redemptionLookup} className={LINK}>
                  tax sale lookup
                </a>{" "}
                searches by owner&rsquo;s name, buyer&rsquo;s name or parcel number.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Redemption */}
      <section className="mt-14 grid gap-10 md:grid-cols-2" id="redeem">
        <div>
          <h2 className={H2}>Redeeming Property After a Tax Sale</h2>
          <div className={BODY}>
            <p>
              Redemption is made through the Chancery Clerk (Section 27-45-1). The rules
              are in Section 27-45-3.
            </p>
            <p>
              <strong>How long.</strong>{" "}
              Two years after the day of the sale.
            </p>
            <p>
              <strong>Who can redeem.</strong>{" "}
              The owner, someone acting for the owner with the owner&rsquo;s consent, or
              &ldquo;any person interested in the land.&rdquo;
            </p>
            <p>
              <strong>What it costs.</strong>{" "}
              The amount is set by the taxes, &ldquo;regardless of the amount of the
              purchaser&rsquo;s bid at the tax sale&rdquo;:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>The taxes the land was sold for.</li>
              <li>All costs of the sale.</li>
              <li>Damages of 5% of those taxes.</li>
              <li>
                Interest of 1.5% a month, or any part of a month, on the taxes and costs,
                from the date of the sale.
              </li>
              <li>Costs added since the sale, with interest at the same rate.</li>
            </ul>
            <p>
              Twelve months of that interest comes to 18% of the taxes and costs, by the
              Wire&rsquo;s arithmetic, before the 5% damages.
            </p>
            <p>
              When the amount is paid, the clerk signs a release of the buyer&rsquo;s or
              the state&rsquo;s claim. It can be recorded the way deeds are.
            </p>
          </div>
        </div>
        <div>
          <h2 className={H2}>Redeeming in Hinds County</h2>
          <div className={BODY}>
            <p>
              The Chancery Clerk&rsquo;s page says delinquent taxes cannot be paid in
              installments. It says payment is by cash or money order, and personal checks
              are not accepted.
            </p>
            <p>
              The page also says the clerk collects the taxes for all delinquent years
              before the current year can be paid.
            </p>
            <p>
              For the exact amount, call the Chancery Clerk&rsquo;s office at{" "}
              <Phone number={chancery.jackson.phone} bold /> in Jackson or{" "}
              <Phone number={chancery.raymond.phone} /> in Raymond.
            </p>
            <p>
              <strong>Notice.</strong>{" "}
              The chancery clerk must issue a notice to the record owner no more than 180
              days and no fewer than 60 days before the redemption period ends (Section
              27-43-1).
            </p>
            <p>
              The law keeps a longer period for certain minors and for persons of unsound
              mind (Section 27-45-3).
            </p>
            <p>
              <strong>If the property is not redeemed.</strong>{" "}
              When the period ends, the chancery clerk must give the tax sale buyer a deed
              on demand, and the law says the deed carries &ldquo;the immediate right of
              possession&rdquo; (Section 27-45-23). Land that was struck off to the state
              is certified to the Secretary of State (Section 27-45-21). If the land sold
              for more than the taxes and costs, the owner can ask the county for the
              excess, but must ask within two years after the redemption period ends
              (Section 27-41-77).
            </p>
          </div>
        </div>
      </section>

      {/* Who to call */}
      <section className="mt-14" id="contacts">
        <h2 className={H2}>Who to Call</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          <li className="glow-card border border-rule p-5">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              Bills and payments
            </p>
            <h3 className="mt-1 font-serif text-xl font-black leading-tight">
              Tax Collector {collector.name}
            </h3>
            <p className="mt-3 font-sans text-sm">
              Jackson: {collector.jackson.address}.{" "}
              {collector.jackson.phones.map((p, i) => (
                <span key={p}>
                  {i > 0 ? ", " : ""}
                  <Phone number={p} />
                </span>
              ))}
            </p>
            <p className="mt-2 font-sans text-sm">
              Raymond: {collector.raymond.address}. <Phone number={collector.raymond.phone} />
            </p>
            <p className="mt-3 font-sans text-xs uppercase tracking-wider">
              <a href={S.collector} className="text-muted hover:text-crimson">
                County page →
              </a>
            </p>
          </li>
          <li className="glow-card border border-rule p-5">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              Values and homestead
            </p>
            <h3 className="mt-1 font-serif text-xl font-black leading-tight">
              Tax Assessor {assessor.name}
            </h3>
            <p className="mt-3 font-sans text-sm">
              Jackson: {assessor.jackson.address}. <Phone number={assessor.jackson.phone} />
            </p>
            <p className="mt-2 font-sans text-sm">
              Raymond: <Phone number={assessor.raymond.phone} />. Mail to{" "}
              {assessor.raymond.mail}.
            </p>
            <p className="mt-3 font-sans text-xs uppercase tracking-wider">
              <a href={S.assessor} className="text-muted hover:text-crimson">
                County page →
              </a>
            </p>
          </li>
          <li className="glow-card border border-rule p-5">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              Redemption and deeds
            </p>
            <h3 className="mt-1 font-serif text-xl font-black leading-tight">
              Chancery Clerk {chancery.name}
            </h3>
            <p className="mt-3 font-sans text-sm">
              Jackson: {chancery.jackson.address}. <Phone number={chancery.jackson.phone} />
            </p>
            <p className="mt-2 font-sans text-sm">
              Raymond: {chancery.raymond.address}. <Phone number={chancery.raymond.phone} />
            </p>
            <p className="mt-3 font-sans text-xs uppercase tracking-wider">
              <a href={S.chancery} className="text-muted hover:text-crimson">
                County page →
              </a>
            </p>
          </li>
        </ul>
        <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed">
          All three offices list the same hours: {TAX.hours}.
        </p>
      </section>

      {/* Coverage */}
      {coverage.length > 0 && (
        <section className="mt-14" id="coverage">
          <h2 className={H2}>From the Wire: Millage and Property Tax</h2>
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
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="border border-rule bg-paper p-4">
            <Link
              href="/boil-water-notices"
              className="font-serif text-base font-bold hover:text-crimson"
            >
              Jackson boil-water notices in effect today
            </Link>
          </li>
          <li className="border border-rule bg-paper p-4">
            <Link href="/trash-pickup" className="font-serif text-base font-bold hover:text-crimson">
              Jackson trash pickup: schedule, holidays and rules
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
        Reporting note: This page is general information, not legal or tax advice. It was
        last checked {formatDay(TAX.checked, { weekday: false })}. Office names, addresses,
        phone numbers, hours and county practice are from Hinds County&rsquo;s{" "}
        <a href={S.collector} className={LINK}>
          Tax Collector
        </a>
        ,{" "}
        <a href={S.assessor} className={LINK}>
          Tax Assessor
        </a>
        ,{" "}
        <a href={S.chancery} className={LINK}>
          Chancery Clerk
        </a>{" "}
        and{" "}
        <a href={S.payOnline} className={LINK}>
          Pay Online
        </a>{" "}
        pages and the forms they link to. The county&rsquo;s database site, which holds
        the{" "}
        <a href={S.collectorFaq} className={LINK}>
          Tax Collector FAQ
        </a>
        , the lookups, the calculator, the tax sale files and the{" "}
        <a href={S.phoneDirectory} className={LINK}>
          phone directory
        </a>
        , did not answer on Nov. 25, 2026, so the Wire read Internet Archive copies of
        those pages captured from Sept. 6 to Nov. 5, 2026. The Chancery Clerk&rsquo;s page
        gives 601-968-6508 for the clerk; the phone directory gives 601-968-6507. The
        Homestead Requirements link on the Tax Assessor&rsquo;s page returned an error, so
        this page relies on the worksheet. State guidance is from the Department of
        Revenue&rsquo;s{" "}
        <a href={S.dorFaq} className={LINK}>
          property tax FAQ
        </a>
        ,{" "}
        <a href={S.dorHomestead} className={LINK}>
          homestead exemption
        </a>{" "}
        and{" "}
        <a href={S.dorLaws2026} className={LINK}>
          2026 legislation
        </a>{" "}
        pages. Its homestead page gives 90 as the veterans&rsquo; age; the change to 85 is
        from the text of House Bill 420. Statutes: the Wire read Sections 27-35-4,
        27-35-89, 27-35-93, 27-41-1, 27-41-11, 27-41-55, 27-41-59, 27-41-79, 27-43-1,
        27-45-3, 27-45-21 and 27-45-23, and Section 112 of the constitution, in{" "}
        <a href={S.code2020} className={LINK}>
          Public.Resource.Org&rsquo;s copy
        </a>{" "}
        of the official code as released July 8, 2020. For each of those code sections
        it then checked the Legislature&rsquo;s{" "}
        <a href={S.billLookup} className={LINK}>
          index of bills by code section
        </a>{" "}
        for the sessions from 2020 through 2026 and found no enacted change. The
        Department of Revenue&rsquo;s FAQ gives the same classes and ratios as Section
        112. Section 27-41-9 is as amended by{" "}
        <a href={S.hb859of2020} className={LINK}>
          House Bill 859 of 2020
        </a>
        . Sections 27-33-51, 27-33-63, 27-33-75, 27-41-77 and 27-45-1 are as printed in{" "}
        <a href={S.hb4044of2026} className={LINK}>
          House Bill 4044 of 2026
        </a>
        , Section 27-33-31 as printed in{" "}
        <a href={S.sb2882of2026} className={LINK}>
          Senate Bill 2882 of 2026
        </a>
        , and the veterans&rsquo; change is in{" "}
        <a href={S.hb420of2026} className={LINK}>
          House Bill 420 of 2026
        </a>
        . The dates on this page are the Wire&rsquo;s calculation from the calendar. The
        Wire did not ask the county offices or the Department of Revenue to comment for
        this page. If their pages or the statutes and this page differ, they are right.
      </p>
    </div>
  );
}
