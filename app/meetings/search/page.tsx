import type { Metadata } from "next";
import Link from "next/link";
import { searchTranscripts, formatMeetingDate, fmtTime, videoAt, getBodies } from "@/lib/meetings";
import MeetingSearchForm from "@/app/components/MeetingSearchForm";

// Reads transcripts from disk for each query; never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search the Record",
  description: "Search every word said at Jackson's public meetings.",
  robots: { index: false, follow: true },
};

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        terms.includes(p.toLowerCase()) ? (
          <mark key={i} className="bg-crimson/15 text-ink">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export default async function MeetingSearchPage({ searchParams }: PageProps<"/meetings/search">) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").slice(0, 200).trim();
  const body = typeof sp.body === "string" ? sp.body : "";
  const { terms, hits } = q ? searchTranscripts(q, { limit: 60, body }) : { terms: [], hits: [] };
  const bodies = getBodies();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="border-b border-rule pb-5">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          <Link href="/meetings" className="hover:text-crimson-bright">
            The Record
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-3xl font-black sm:text-4xl">Search the transcripts</h1>
        <div className="mt-5">
          <MeetingSearchForm q={q} body={body} />
        </div>
        {bodies.length > 1 && (
          <p className="mt-3 font-sans text-xs text-muted">
            Searching {body ? <strong className="text-ink">{body}</strong> : "all bodies"}.
            {body && (
              <>
                {" "}
                <Link href={`/meetings/search?q=${encodeURIComponent(q)}`} className="text-crimson">
                  Search everything
                </Link>
              </>
            )}
          </p>
        )}
      </header>

      {q && terms.length === 0 && (
        <p className="mt-8 font-sans text-muted">Try a more specific word. Very short and very common words are ignored.</p>
      )}
      {q && terms.length > 0 && (
        <p className="mt-6 font-sans text-sm text-muted">
          {hits.length === 0
            ? `Nothing in the archive contains ${terms.map((t) => `“${t}”`).join(" and ")}.`
            : `${hits.length === 60 ? "First 60" : hits.length} passage${hits.length === 1 ? "" : "s"} containing ${terms.map((t) => `“${t}”`).join(" and ")}, newest meeting first.`}
        </p>
      )}

      <ol className="mt-4 divide-y divide-rule">
        {hits.map((h) => (
          <li key={`${h.id}-${h.t}`} className="py-5">
            <p className="font-sans text-xs font-bold uppercase tracking-wider text-crimson">{h.body}</p>
            <p className="mt-1 font-sans text-sm">
              <Link href={`/meetings/${h.id}#t-${h.t}`} className="font-semibold hover:text-crimson">
                {formatMeetingDate(h.date)}
              </Link>
              <span className="text-muted"> · at </span>
              <a href={videoAt(h.id, h.t)} target="_blank" rel="noopener" className="font-mono text-xs text-crimson">
                {fmtTime(h.t)} ↗
              </a>
            </p>
            <blockquote className="mt-2 border-l-2 border-rule pl-3 font-serif text-base leading-relaxed">
              <Highlight text={h.text} terms={terms} />
            </blockquote>
          </li>
        ))}
      </ol>
    </div>
  );
}
