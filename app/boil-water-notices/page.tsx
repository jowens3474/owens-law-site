import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import {
  getBoilWaterNotices,
  BOIL_WATER_SOURCE,
  JXN_WATER_PHONE,
} from "@/lib/boil-water";
import type { BoilNotice } from "@/lib/boil-water-parse";
import { streetWords } from "@/lib/street-match";
import { formatDay, formatInstant } from "@/lib/central-time";
import BoilNoticeList from "@/app/components/BoilNoticeList";

// Rendered on every request: the list is read from JXN Water (or reused from
// a read in the last five minutes, see lib/boil-water.ts), so nobody is shown
// an old copy.
export const dynamic = "force-dynamic";

const PATH = "/boil-water-notices";
const TITLE = "Jackson, MS Boil-Water Notices Today";
const DEK =
  "The boil-water notices JXN Water lists as in effect, with the streets and address ranges each one covers. The Wire reads JXN Water’s own list within five minutes of every visit and shows the time of the read.";
const MSDH_NOTICES =
  "https://msdh.ms.gov/safe-food-water-and-housing/water-supply/water-safety-notices";

// What JXN Water's notices page tells customers under a notice to boil water
// for. JXN Water's list ends "and all other consumption".
const BOIL_FOR = [
  "Drinking",
  "Cooking or baking",
  "Making ice",
  "Taking medication",
  "Brushing teeth",
  "Washing food",
  "Mixing baby formula or food",
  "Mixing juices or drinks",
  "Feeding pets",
  "Washing dishes",
  "Any other consumption",
];

export const metadata: Metadata = {
  title: TITLE,
  description:
    "See which Jackson streets JXN Water lists under a boil-water notice. The Wire reads JXN Water’s own list within five minutes of every visit and shows when it was read.",
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

// "Monday, Nov. 23, 2026", or "" for a heading whose date could not be read
// (the heading itself is then shown as the notice's name).
function dateLabel(n: BoilNotice): string {
  return n.issued ? formatDay(n.issued) : "";
}

function sumConnections(notices: BoilNotice[]): number | null {
  if (notices.some((n) => n.connections === null)) return null;
  return notices.reduce((sum, n) => sum + (n.connections ?? 0), 0);
}

const H2 =
  "mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink";
const LINK = "underline hover:text-crimson";

export default async function BoilWaterNoticesPage() {
  const result = await getBoilWaterNotices();
  const checked = formatInstant(result.checkedAt);
  const active = result.ok ? result.active : [];
  const resolved = result.ok ? result.resolved.slice(0, 12) : [];
  const other = result.ok ? result.other : [];
  const connections = sumConnections(active);
  // Streets with a notice in effect, to flag an older, lifted notice for the
  // same street in the "recently lifted" list.
  const activePlaces = new Set(active.map((n) => streetWords(n.place).join(" ")));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DEK,
    url: absoluteUrl(PATH),
    dateModified: result.checkedAt,
    isPartOf: { "@id": absoluteUrl("/#org") },
    about: { "@type": "Organization", name: "JXN Water", url: "https://jxnwater.com/" },
    isBasedOn: BOIL_WATER_SOURCE,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-rule pb-8">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Jackson Water · Read from JXN Water
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black leading-[1.02] sm:text-6xl">
          Jackson Boil-Water Notices Today
        </h1>
        <p className="mt-4 max-w-3xl font-sans text-xl leading-relaxed text-muted">{DEK}</p>
      </header>

      {/* Status. Kept out of search snippets, which would go stale. */}
      <section
        className="glow-card mt-8 border border-rule p-6"
        aria-live="polite"
        data-nosnippet
      >
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          Right now
        </p>
        {result.ok ? (
          <>
            <p className="mt-2 font-serif text-3xl font-black leading-tight">
              {active.length === 0
                ? "The Wire found no notices listed as in effect on JXN Water’s notices page."
                : `JXN Water lists ${active.length} boil-water notice${active.length === 1 ? "" : "s"} in effect.`}
            </p>
            {active.length === 0 ? (
              <p className="mt-2 font-sans text-base">
                That is not an all-clear. This page shows only what JXN Water has posted in
                its list. If your water looks or smells wrong, or you have heard of a notice,
                call JXN Water at {JXN_WATER_PHONE}.
              </p>
            ) : (
              <p className="mt-2 font-sans text-base">
                {connections !== null && (
                  <>
                    Together they cover about {connections.toLocaleString("en-US")}{" "}
                    connection{connections === 1 ? "" : "s"}, by the Wire&rsquo;s sum of JXN
                    Water&rsquo;s figures.{" "}
                  </>
                )}
                Each notice covers only the addresses it lists.
              </p>
            )}
            <p className="mt-3 font-sans text-sm text-muted">
              Read from{" "}
              <a href={BOIL_WATER_SOURCE} className={LINK}>
                JXN Water&rsquo;s notices page
              </a>{" "}
              at {checked}, Central time. If this page and JXN Water differ, JXN Water is
              right.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-serif text-3xl font-black leading-tight">
              The Wire could not read JXN Water&rsquo;s list just now.
            </p>
            <p className="mt-2 font-sans text-base">
              This is a problem reaching the list, not news about your water. See{" "}
              <a href={BOIL_WATER_SOURCE} className={`font-bold ${LINK}`}>
                JXN Water&rsquo;s notices page
              </a>{" "}
              or call JXN Water at {JXN_WATER_PHONE}.
            </p>
            <p className="mt-3 font-sans text-sm text-muted">
              Tried at {checked}, Central time. Reload this page in a minute to try again.
            </p>
          </>
        )}
      </section>

      {/* Text on JXN Water's page that is not one of its usual notices */}
      {other.length > 0 && (
        <section className="mt-8 border-2 border-crimson p-6" data-nosnippet>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
            Also on JXN Water&rsquo;s page
          </p>
          <p className="mt-2 font-sans text-base">
            JXN Water&rsquo;s notices page carries text that is not in its usual list
            format. It may be a wider notice. It reads:
          </p>
          <ul className="mt-3 space-y-2 font-serif text-lg font-bold">
            {other.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 font-sans text-sm text-muted">
            Read it in full on{" "}
            <a href={BOIL_WATER_SOURCE} className={LINK}>
              JXN Water&rsquo;s notices page
            </a>
            .
          </p>
        </section>
      )}

      {/* Notices in effect */}
      {active.length > 0 && (
        <section className="mt-12" data-nosnippet>
          <h2 className={H2}>Notices in Effect</h2>
          <BoilNoticeList
            notices={active}
            dateLabels={active.map(dateLabel)}
            phone={JXN_WATER_PHONE}
          />
        </section>
      )}

      {/* What to do */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className={H2}>If Your Address Is Listed</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              JXN Water tells customers under a notice to boil their drinking water, and to
              bring water to a rolling boil for one minute before using it for:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              {BOIL_FOR.map((use) => (
                <li key={use}>{use}</li>
              ))}
            </ul>
            <p>
              Keep boiling until JXN Water lifts the notice. The utility says it tells
              residents when that happens. Its page lists lifted notices as
              &ldquo;recently resolved,&rdquo; and the latest are below.
            </p>
          </div>
        </div>
        <div>
          <h2 className={H2}>What a Notice Means</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              JXN Water calls these notices precautionary. It says they follow repair work
              on the water system and do not mean the water is unsafe, but that customers
              must take precautions and boil their water before using it.
            </p>
            <p>
              Questions about your water go to JXN Water&rsquo;s customer service line,{" "}
              <a href="tel:+16015005200" className={`whitespace-nowrap font-bold ${LINK}`}>
                {JXN_WATER_PHONE}
              </a>
              , which the utility says is answered around the clock.
            </p>
            <p>
              The Mississippi State Department of Health posts{" "}
              <a href={MSDH_NOTICES} className={LINK}>
                water safety notices
              </a>{" "}
              that the state issues, and notices that water systems issue themselves when
              the systems report them to it. The department says each water system is
              responsible for telling its own customers, so check with your water system
              first.
            </p>
          </div>
        </div>
      </section>

      {/* Recently lifted */}
      {resolved.length > 0 && (
        <section className="mt-14" data-nosnippet>
          <h2 className={H2}>Recently Lifted</h2>
          <p className="mb-4 max-w-3xl font-sans text-sm text-muted">
            The {resolved.length} most recent notices JXN Water lists as resolved. The date
            is the one JXN Water gives each notice; its list does not say when a notice
            was lifted.
          </p>
          <ol className="divide-y divide-rule border-y border-ink">
            {resolved.map((n, i) => (
              <li
                key={`${i}-${n.title}`}
                className="grid gap-1 py-3 sm:grid-cols-[200px_220px_1fr] sm:gap-4"
              >
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">
                  {dateLabel(n)}
                </span>
                <span className="font-serif text-base font-bold leading-snug">{n.place}</span>
                <span className="font-sans text-sm text-muted">
                  {n.areas.map((a) => a.text).join("; ")}
                  {activePlaces.has(streetWords(n.place).join(" ")) && (
                    <strong className="block text-crimson">
                      A separate notice for this street is in effect. See the list above.
                    </strong>
                  )}
                </span>
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
        How this page works: The Wire does not issue, confirm or lift boil-water notices.
        Each time this page loads it shows the notices posted on JXN Water&rsquo;s website
        ({BOIL_WATER_SOURCE}), from a read made within the previous five minutes. The time
        shown is when the Wire read the page, not when JXN Water last changed it. The
        street names, address ranges and connection counts are JXN Water&rsquo;s. The total
        is the Wire&rsquo;s arithmetic. The instructions on boiling water are JXN
        Water&rsquo;s, as posted on the same page. The description of the state&rsquo;s
        notices is from the Mississippi State Department of Health&rsquo;s water safety
        notices page.
      </p>
    </div>
  );
}
