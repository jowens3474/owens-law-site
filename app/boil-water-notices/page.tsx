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
import { formatDay, formatInstant } from "@/lib/central-time";
import BoilNoticeList from "@/app/components/BoilNoticeList";

// Rendered on every request: the list is re-read from JXN Water (at most once
// every five minutes, see lib/boil-water.ts), so nobody is shown an old copy.
export const dynamic = "force-dynamic";

const PATH = "/boil-water-notices";
const TITLE = "Jackson, MS Boil Water Notices Today";
const DEK =
  "The boil-water notices JXN Water lists as in effect right now, with the streets and address ranges each one covers. This page re-reads JXN Water’s own list every time it loads.";
const MSDH_NOTICES =
  "https://msdh.ms.gov/safe-food-water-and-housing/water-supply/water-safety-notices";

// What JXN Water's notices page tells customers under a notice to boil water for.
const BOIL_FOR = [
  "Cooking or baking",
  "Making ice",
  "Taking medication",
  "Brushing teeth",
  "Washing food",
  "Mixing baby formula or food",
  "Mixing juices or drinks",
  "Feeding pets",
  "Washing dishes",
];

export const metadata: Metadata = {
  title: TITLE,
  description:
    "See which Jackson streets are under a boil-water notice right now. The list comes straight from JXN Water and is re-read every time this page loads.",
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

function issuedLabel(n: BoilNotice): string {
  // A heading whose date could not be read is shown as JXN Water wrote it.
  return n.issued ? formatDay(n.issued) : n.title;
}

function sumConnections(notices: BoilNotice[]): number | null {
  if (notices.some((n) => n.connections === null)) return null;
  return notices.reduce((sum, n) => sum + (n.connections ?? 0), 0);
}

export default async function BoilWaterNoticesPage() {
  const result = await getBoilWaterNotices();
  const checked = formatInstant(result.checkedAt);
  const active = result.ok ? result.active : [];
  const resolved = result.ok ? result.resolved.slice(0, 12) : [];
  const connections = sumConnections(active);

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

      {/* Status */}
      <section className="glow-card mt-8 border border-rule p-6" aria-live="polite">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          Right now
        </p>
        {result.ok ? (
          <>
            <p className="mt-2 font-serif text-3xl font-black leading-tight">
              {active.length === 0
                ? "JXN Water lists no boil-water notices in effect."
                : `${active.length} boil-water notice${active.length === 1 ? " is" : "s are"} in effect.`}
            </p>
            {active.length > 0 && connections !== null && (
              <p className="mt-2 font-sans text-base">
                Together they cover about {connections.toLocaleString("en-US")} connection
                {connections === 1 ? "" : "s"}, by the Wire&rsquo;s sum of JXN Water&rsquo;s
                figures. Each notice covers only the addresses it lists.
              </p>
            )}
            <p className="mt-3 font-sans text-sm text-muted">
              Read from{" "}
              <a href={BOIL_WATER_SOURCE} className="underline hover:text-crimson">
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
              <a href={BOIL_WATER_SOURCE} className="font-bold underline hover:text-crimson">
                JXN Water&rsquo;s notices page
              </a>{" "}
              or call JXN Water at {JXN_WATER_PHONE}.
            </p>
            <p className="mt-3 font-sans text-sm text-muted">
              Tried at {checked}, Central time. The page tries again when it is reloaded.
            </p>
          </>
        )}
      </section>

      {/* Notices in effect */}
      {active.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            Notices in Effect
          </h2>
          <BoilNoticeList
            notices={active}
            issuedLabels={active.map(issuedLabel)}
            phone={JXN_WATER_PHONE}
          />
        </section>
      )}

      {/* What to do */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            If Your Address Is Listed
          </h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              JXN Water tells customers under a notice to bring water to a rolling boil for
              one minute before using it for:
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
          <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            What a Notice Means
          </h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              JXN Water calls these notices precautionary. It says they follow repair work
              on the water system and do not mean the water is unsafe, only that customers
              should boil it first.
            </p>
            <p>
              Questions about your water go to JXN Water&rsquo;s customer service line,{" "}
              <a href="tel:+16015005200" className="font-bold underline hover:text-crimson">
                {JXN_WATER_PHONE}
              </a>
              , which the utility says is answered around the clock.
            </p>
            <p>
              Not a JXN Water customer? Other water systems post their notices through the
              Mississippi State Department of Health&rsquo;s{" "}
              <a href={MSDH_NOTICES} className="underline hover:text-crimson">
                water safety notices
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Recently lifted */}
      {resolved.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            Recently Lifted
          </h2>
          <p className="mb-4 max-w-3xl font-sans text-sm text-muted">
            The {resolved.length} most recent notices JXN Water lists as resolved. The date
            is the one JXN Water gives each notice; its list does not say when a notice
            was lifted.
          </p>
          <ol className="divide-y divide-rule border-y border-ink">
            {resolved.map((n) => (
              <li
                key={n.title}
                className="grid gap-1 py-3 sm:grid-cols-[200px_220px_1fr] sm:gap-4"
              >
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">
                  {issuedLabel(n)}
                </span>
                <span className="font-serif text-base font-bold leading-snug">{n.place}</span>
                <span className="font-sans text-sm text-muted">
                  {n.areas.map((a) => a.text).join("; ")}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* More guides */}
      <section className="mt-14">
        <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
          More Jackson Guides
        </h2>
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
        Each time this page loads it copies the notices posted on JXN Water&rsquo;s website
        ({BOIL_WATER_SOURCE}), reading that page no more than once every five minutes. The
        street names, address ranges and connection counts are JXN Water&rsquo;s. The total
        is the Wire&rsquo;s arithmetic. The instructions on boiling water are JXN
        Water&rsquo;s, as posted on the same page.
      </p>
    </div>
  );
}
