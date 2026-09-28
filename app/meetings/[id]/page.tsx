import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import {
  MEETINGS,
  getMeeting,
  getMeetingEntry,
  fmtTime,
  fmtDuration,
  videoAt,
  isYouTube,
  formatMeetingDate,
} from "@/lib/meetings";
import MeetingSearchForm from "@/app/components/MeetingSearchForm";

export const revalidate = 600;

export function generateStaticParams() {
  return MEETINGS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/meetings/[id]">): Promise<Metadata> {
  const { id } = await params;
  const m = getMeetingEntry(id);
  if (!m) return { title: "Meeting not found" };
  const title = `${m.body}, ${formatMeetingDate(m.date)}`;
  const description = m.summary || `Transcript and index of the ${m.body} meeting of ${formatMeetingDate(m.date)}.`;
  return {
    title,
    description,
    alternates: { canonical: `/meetings/${m.id}` },
    openGraph: { type: "article", title: `${title} — ${site.name}`, description, url: absoluteUrl(`/meetings/${m.id}`), siteName: site.name },
    twitter: { card: "summary", title: `${title} — ${site.name}`, description },
  };
}

function Stamp({ m, t }: { m: { id: string; url: string }; t: number }) {
  return (
    <a
      href={videoAt(m, t)}
      target="_blank"
      rel="noopener"
      className="font-mono text-xs text-crimson hover:text-crimson-bright"
      title="Open the video at this moment"
    >
      {fmtTime(t)}
    </a>
  );
}

export default async function MeetingPage({ params }: PageProps<"/meetings/[id]">) {
  const { id } = await params;
  const m = getMeeting(id);
  if (!m) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${m.body}, ${formatMeetingDate(m.date)}`,
    description: m.summary || m.title,
    uploadDate: m.date,
    url: absoluteUrl(`/meetings/${m.id}`),
    ...(isYouTube(m)
      ? { embedUrl: `https://www.youtube.com/embed/${m.id}`, thumbnailUrl: `https://i.ytimg.com/vi/${m.id}/hqdefault.jpg` }
      : { contentUrl: m.url }),
    publisher: { "@id": absoluteUrl("/#org") },
    transcript: m.blocks.map((b) => b.text).join(" ").slice(0, 5000),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b-4 border-double border-ink pb-6">
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">
          <Link href="/meetings" className="hover:text-crimson-bright">
            The Record
          </Link>{" "}
          · {m.body}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black leading-tight sm:text-5xl">{formatMeetingDate(m.date)}</h1>
        <p className="mt-3 font-sans text-sm text-muted">
          {m.title}
          {m.duration ? ` · ${fmtDuration(m.duration)}` : ""} · {m.words.toLocaleString("en-US")} words ·{" "}
          {m.agenda && (
            <>
              <a href={m.agenda} target="_blank" rel="noopener" className="text-crimson">
                Agenda (PDF) ↗
              </a>{" "}
              ·{" "}
            </>
          )}
          <a href={m.url} target="_blank" rel="noopener" className="text-crimson">
            Watch on the {isYouTube(m) ? "city's YouTube channel" : "city's video archive"} ↗
          </a>
        </p>
        {m.summary && <p className="mt-4 max-w-3xl font-sans text-lg leading-relaxed">{m.summary}</p>}
      </header>

      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          {m.topics.length > 0 && (
            <section>
              <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">
                What came up
              </h2>
              <ol className="space-y-3">
                {m.topics.map((t, i) => (
                  <li key={i} className="font-sans text-sm">
                    <a href={`#t-${nearestBlock(m.blocks, t.start)}`} className="font-semibold hover:text-crimson">
                      {t.title}
                    </a>{" "}
                    <Stamp m={m} t={t.start} />
                    {t.note && <p className="mt-0.5 text-muted">{t.note}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {m.votes.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">Votes</h2>
              <ul className="space-y-2 font-sans text-sm">
                {m.votes.map((v, i) => (
                  <li key={i}>
                    <span className={`mr-2 rounded-sm px-1.5 py-0.5 text-[11px] font-bold uppercase ${/pass|approv|adopt/i.test(v.outcome) ? "bg-ink text-paper" : "border border-rule text-muted"}`}>
                      {v.outcome || "unclear"}
                    </span>
                    {v.item} <Stamp m={m} t={v.start} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {m.money.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">Money</h2>
              <ul className="list-disc space-y-1 pl-5 font-sans text-sm">
                {m.money.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {m.people.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">Who spoke</h2>
              <p className="font-sans text-sm text-muted">{m.people.join(" · ")}</p>
              <p className="mt-2 font-sans text-xs text-muted">Names as heard by the captioning; spellings are not verified.</p>
            </section>
          )}
        </aside>

        <main className="min-w-0 lg:col-span-8">
          <div className="mb-6">
            <MeetingSearchForm body={m.body} />
          </div>
          <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest">Transcript</h2>
          <p className="mb-4 font-sans text-xs text-muted">
            {m.captions === "manual"
              ? "Captions supplied with the video."
              : m.captions === "transcribed"
                ? "Transcribed by the Wire from the city's recording with speech recognition; names and numbers may be misheard."
                : "Machine-generated captions; names and numbers may be misheard."}{" "}
            Each timestamp opens the video at that moment.
          </p>
          <div className="space-y-4">
            {m.blocks.map((b) => (
              <p key={b.t} id={`t-${b.t}`} className="scroll-mt-24 font-serif text-base leading-relaxed">
                <Stamp m={m} t={b.t} />{" "}
                {b.text}
              </p>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

/** The transcript block anchor at or just before a topic's start time. */
function nearestBlock(blocks: { t: number }[], start: number): number {
  let best = blocks[0]?.t ?? 0;
  for (const b of blocks) {
    if (b.t <= start) best = b.t;
    else break;
  }
  return best;
}
