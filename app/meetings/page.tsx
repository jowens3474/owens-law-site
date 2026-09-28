import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import {
  MEETINGS,
  ARCHIVE_UPDATED,
  getBodies,
  fmtDuration,
  formatMeetingDate,
} from "@/lib/meetings";
import MeetingSearchForm from "@/app/components/MeetingSearchForm";

export const revalidate = 600;

const DEK =
  "Every word said at Jackson's public meetings, transcribed, indexed, and searchable. Find who said what about a parcel, a contract, or a dollar figure, then jump to that moment in the video.";

export const metadata: Metadata = {
  title: "The Record",
  description: DEK,
  alternates: { canonical: "/meetings" },
  openGraph: {
    type: "website",
    title: `The Record — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/meetings"),
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title: `The Record — ${site.name}`, description: DEK },
};

function monthLabel(ym: string): string {
  return new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long" });
}

export default async function MeetingsPage({ searchParams }: PageProps<"/meetings">) {
  const { body: bodyParam } = await searchParams;
  const body = typeof bodyParam === "string" ? bodyParam : "";
  const bodies = getBodies();
  const list = body ? MEETINGS.filter((m) => m.body === body) : MEETINGS;
  const hours = Math.round(MEETINGS.reduce((n, m) => n + (m.duration || 0), 0) / 3600);
  const words = MEETINGS.reduce((n, m) => n + m.words, 0);

  const groups = new Map<string, typeof list>();
  for (const m of list) {
    const ym = m.date.slice(0, 7);
    if (!groups.has(ym)) groups.set(ym, []);
    groups.get(ym)!.push(m);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `The Record — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/meetings"),
    isPartOf: { "@id": absoluteUrl("/#org") },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b-4 border-double border-ink pb-6">
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">
          Meeting archive
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black leading-tight sm:text-5xl">The Record</h1>
        <p className="mt-3 max-w-3xl font-sans text-lg leading-relaxed text-muted">{DEK}</p>
      </header>

      <div className="mt-8 grid gap-6 border-b border-rule pb-8 sm:grid-cols-3">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Meetings archived</p>
          <p className="mt-1 font-serif text-3xl font-bold">{MEETINGS.length}</p>
        </div>
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Hours of video</p>
          <p className="mt-1 font-serif text-3xl font-bold">{hours}</p>
        </div>
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Words on the record</p>
          <p className="mt-1 font-serif text-3xl font-bold">{words.toLocaleString("en-US")}</p>
        </div>
      </div>

      <section className="mt-8">
        <MeetingSearchForm />
      </section>

      {bodies.length > 1 && (
        <nav aria-label="Filter by body" className="mt-6 flex flex-wrap gap-2 font-sans text-xs">
          <Link
            href="/meetings"
            className={`rounded-full border px-3 py-1 ${body ? "border-rule text-muted hover:text-crimson" : "border-ink bg-ink text-paper"}`}
          >
            All bodies
          </Link>
          {bodies.map((b) => (
            <Link
              key={b.body}
              href={`/meetings?body=${encodeURIComponent(b.body)}`}
              className={`rounded-full border px-3 py-1 ${body === b.body ? "border-ink bg-ink text-paper" : "border-rule text-muted hover:text-crimson"}`}
            >
              {b.body} <span className="opacity-70">({b.count})</span>
            </Link>
          ))}
        </nav>
      )}

      {list.length === 0 ? (
        <p className="mt-10 font-sans text-muted">
          The archive is filling in. The first transcripts appear here as soon as the desk has processed them.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {[...groups].map(([ym, items]) => (
            <section key={ym}>
              <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
                {monthLabel(ym)}
              </h2>
              <div className="divide-y divide-rule">
                {items.map((m) => (
                  <article key={m.id} className="py-5">
                    <p className="font-sans text-xs font-bold uppercase tracking-wider text-crimson">{m.body}</p>
                    <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">
                      <Link href={`/meetings/${m.id}`} className="hover:text-crimson">
                        {formatMeetingDate(m.date)}
                      </Link>
                    </h3>
                    <p className="mt-1 font-sans text-xs text-muted">
                      {m.title}
                      {m.duration ? ` · ${fmtDuration(m.duration)}` : ""}
                      {m.topics.length ? ` · ${m.topics.length} items indexed` : ""}
                    </p>
                    {m.summary && <p className="mt-2 max-w-3xl font-sans text-sm leading-relaxed">{m.summary}</p>}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="mt-14 border-t border-rule pt-6 font-sans text-sm text-muted">
        <h2 className="font-bold uppercase tracking-widest text-ink">How the Record is made</h2>
        <p className="mt-2 max-w-3xl leading-relaxed">
          The Wire pulls each meeting from the city&apos;s own video archive, transcribes it with speech recognition,
          and has its research desk index what was discussed, who spoke, and what the votes were, using the published
          agenda for item names. Speech recognition mishears names and numbers, so treat the transcript as a finding aid
          and the video as the record. Every timestamp links to that moment in the original video.
          {ARCHIVE_UPDATED ? ` Last updated ${formatMeetingDate(ARCHIVE_UPDATED.slice(0, 10))}.` : ""}
        </p>
      </section>
    </div>
  );
}
