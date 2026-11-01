import type { Metadata } from "next";
import Link from "next/link";
import {
  courtShort,
  getAllRulings,
  LAW_TOPICS,
  outcomeLabel,
  RULING_COURTS,
  RULING_SHARE_IMAGE,
  type Ruling,
} from "@/lib/rulings";
import { formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import { rulingMatches } from "@/lib/search";

const DEK =
  "Decisions of the Mississippi Supreme Court and Court of Appeals that matter to Jackson, explained so a seventh grader could follow them: what happened, what the court decided, why it matters, and what changes for you.";

// The root layout's share image is replaced by any page that sets its own
// openGraph or twitter, so this page names the image outright.
export const metadata: Metadata = {
  title: "What the Courts Decided: court rulings, explained",
  description: DEK,
  alternates: { canonical: "/rulings" },
  openGraph: {
    type: "website",
    title: `What the Courts Decided: ${site.name}`,
    description: DEK,
    url: absoluteUrl("/rulings"),
    siteName: site.name,
    images: [RULING_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `What the Courts Decided: ${site.name}`,
    description: DEK,
    images: [RULING_SHARE_IMAGE],
  },
};

const chip =
  "inline-block border px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors";
const chipOff = `${chip} border-rule text-ink hover:border-ink hover:text-crimson`;
const chipOn = `${chip} border-ink bg-ink text-newsprint`;

// A /rulings link that carries the filters given, so choosing a topic keeps
// the court and the search words, and the other way round.
function hubHref(f: { topic?: string; court?: string; q?: string }): string {
  const parts = [
    f.topic && `topic=${encodeURIComponent(f.topic)}`,
    f.court && `court=${encodeURIComponent(f.court)}`,
    f.q && `q=${encodeURIComponent(f.q)}`,
  ].filter(Boolean);
  return parts.length > 0 ? `/rulings?${parts.join("&")}` : "/rulings";
}

function RulingCard({ ruling }: { ruling: Ruling }) {
  return (
    <li className="py-5">
      <p className="font-sans text-[0.72rem] font-bold uppercase tracking-wider text-crimson">
        {courtShort(ruling.court)}
        <span className="font-medium text-muted">
          {" "}
          · {ruling.docket} · Decided {formatDate(ruling.decided)}
        </span>
      </p>
      <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">
        <Link href={`/rulings/${ruling.slug}`} className="headline-link">
          {ruling.title}
        </Link>
      </h3>
      <p className="mt-2 font-sans text-base leading-relaxed text-muted">
        {ruling.oneSentence}
      </p>
      <p className="mt-2 font-sans text-sm text-ink">
        <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
          Result:
        </span>{" "}
        <span className="font-semibold">{outcomeLabel(ruling.outcome)}</span>
      </p>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-sans text-[0.7rem] uppercase tracking-wider text-muted">
        {ruling.topics.map((t) => (
          <Link key={t} href={hubHref({ topic: t })} className="hover:text-crimson">
            {t}
          </Link>
        ))}
      </p>
    </li>
  );
}

export default async function RulingsPage({ searchParams }: PageProps<"/rulings">) {
  const sp = await searchParams;
  const topic = typeof sp.topic === "string" ? sp.topic : "";
  const court = typeof sp.court === "string" ? sp.court : "";
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const all = getAllRulings();
  const topicCounts = new Map<string, number>();
  const courtCounts = new Map<string, number>();
  for (const r of all) {
    for (const t of r.topics) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    courtCounts.set(r.court, (courtCounts.get(r.court) ?? 0) + 1);
  }

  // `all` is already newest decision first, and filtering keeps that order.
  const filtered = all.filter(
    (r) =>
      (!topic || (r.topics as string[]).includes(topic)) &&
      (!court || r.court === court) &&
      (!q || rulingMatches(r, q)),
  );
  const filtering = Boolean(topic || court || q);
  const knownCourt = RULING_COURTS.find((c) => c === court);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="border-b-4 border-double border-ink pb-6">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Court rulings, plainly
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black sm:text-5xl">
          What the Courts Decided
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-lg leading-relaxed text-muted">
          {DEK}
        </p>
        {all.length > 0 && (
          <p className="mt-2 font-sans text-sm text-muted">
            {`${all.length} ${all.length === 1 ? "ruling" : "rulings"} explained so far, with more on the way. Each entry is built from the court's opinion, and the reporting note at the end of each entry says what was and was not read.`}
          </p>
        )}

        <form action="/rulings" method="get" role="search" aria-label="Search rulings" className="mt-5 flex max-w-xl gap-2">
          <label htmlFor="rulings-q" className="sr-only">
            Search rulings
          </label>
          <input
            id="rulings-q"
            name="q"
            type="search"
            defaultValue={q}
            autoComplete="off"
            placeholder="Search by case name, docket number, or a word: custody"
            className="min-w-0 flex-1 border border-ink bg-paper px-3 py-2 font-sans text-base focus:outline-hidden focus:ring-2 focus:ring-crimson"
          />
          {topic && <input type="hidden" name="topic" value={topic} />}
          {court && <input type="hidden" name="court" value={court} />}
          <button
            type="submit"
            className="border border-ink bg-ink px-4 py-2 font-sans text-sm font-bold uppercase tracking-wider text-paper hover:border-crimson hover:bg-crimson"
          >
            Search
          </button>
        </form>

        <nav aria-label="Browse by topic" className="mt-4 flex flex-wrap gap-2">
          <Link href={hubHref({ court, q })} className={topic ? chipOff : chipOn}>
            All topics
          </Link>
          {LAW_TOPICS.filter((t) => topicCounts.get(t)).map((t) => (
            <Link
              key={t}
              href={hubHref({ topic: t, court, q })}
              className={topic === t ? chipOn : chipOff}
            >
              {t} <span className="font-medium opacity-70">{topicCounts.get(t)}</span>
            </Link>
          ))}
        </nav>

        <nav aria-label="Browse by court" className="mt-2 flex flex-wrap gap-2">
          <Link href={hubHref({ topic, q })} className={court ? chipOff : chipOn}>
            All courts
          </Link>
          {RULING_COURTS.filter((c) => courtCounts.get(c)).map((c) => (
            <Link
              key={c}
              href={hubHref({ topic, court: c, q })}
              className={court === c ? chipOn : chipOff}
            >
              {courtShort(c)} <span className="font-medium opacity-70">{courtCounts.get(c)}</span>
            </Link>
          ))}
        </nav>
      </header>

      {all.length === 0 && (
        <p className="mt-10 font-sans text-muted">
          The first entries are being written. Check back soon.
        </p>
      )}

      {all.length > 0 && filtering && (
        <p className="mt-6 font-sans text-sm text-muted">
          {filtered.length === 0 ? "No ruling matches that yet" : `${filtered.length} ${filtered.length === 1 ? "ruling" : "rulings"}`}
          {topic && (
            <>
              {" "}in <strong className="text-ink">{topic}</strong>
            </>
          )}
          {court && (
            <>
              {" "}from the <strong className="text-ink">{knownCourt ? courtShort(knownCourt) : court}</strong>
            </>
          )}
          {q && (
            <>
              {" "}matching <strong className="text-ink">&ldquo;{q}&rdquo;</strong>
            </>
          )}
          .{" "}
          <Link href="/rulings" className="font-semibold text-crimson">
            Show everything
          </Link>
        </p>
      )}

      {filtered.length > 0 && (
        <section className="mt-8">
          <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            Newest decisions first
          </h2>
          <ol className="divide-y divide-rule">
            {filtered.map((ruling) => (
              <RulingCard key={ruling.slug} ruling={ruling} />
            ))}
          </ol>
        </section>
      )}

      <section className="mt-14 border-t border-rule pt-5">
        <p className="font-sans text-sm leading-relaxed text-muted">
          A plain-language summary of a court opinion, not legal advice. The
          opinion is the official record.
        </p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
          Looking for new laws instead?{" "}
          <Link href="/laws" className="font-semibold text-crimson">
            What Passed
          </Link>{" "}
          explains the bills that became law.
        </p>
      </section>
    </div>
  );
}
