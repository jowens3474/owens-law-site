import type { Metadata } from "next";
import Link from "next/link";
import { getAllLaws, isInEffect, LAW_TOPICS, type Law } from "@/lib/laws";
import { formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import { norm } from "@/lib/search-terms";

const DEK =
  "Every bill that became law, explained so a seventh grader could follow it: what it does, why it happened, what it costs, and what changes for you.";

export const metadata: Metadata = {
  title: "What Passed: new laws, explained",
  description: DEK,
  alternates: { canonical: "/laws" },
  openGraph: {
    type: "website",
    title: `What Passed — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/laws"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `What Passed — ${site.name}`,
    description: DEK,
  },
};

const chip =
  "inline-block border px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors";
const chipOff = `${chip} border-rule text-ink hover:border-ink hover:text-crimson`;
const chipOn = `${chip} border-ink bg-ink text-newsprint`;

function matches(law: Law, q: string): boolean {
  const hay = norm(
    [
      law.bill,
      law.title,
      law.officialTitle ?? "",
      law.oneSentence,
      ...law.topics,
      ...law.whatItDoes,
      ...law.whatChangesForYou,
    ].join(" "),
  );
  return norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

function LawCard({ law }: { law: Law }) {
  const live = isInEffect(law);
  return (
    <li className="py-5">
      <p className="font-sans text-[0.72rem] font-bold uppercase tracking-wider text-crimson">
        {law.bill}
        <span className="font-medium text-muted">
          {" "}
          · {live ? "In effect since" : "Takes effect"}{" "}
          {formatDate(law.effective)}
        </span>
      </p>
      <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">
        <Link href={`/laws/${law.slug}`} className="headline-link">
          {law.title}
        </Link>
      </h3>
      <p className="mt-2 font-sans text-base leading-relaxed text-muted">
        {law.oneSentence}
      </p>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-sans text-[0.7rem] uppercase tracking-wider text-muted">
        {law.topics.map((t) => (
          <Link key={t} href={`/laws?topic=${encodeURIComponent(t)}`} className="hover:text-crimson">
            {t}
          </Link>
        ))}
      </p>
    </li>
  );
}

export default async function LawsPage({ searchParams }: PageProps<"/laws">) {
  const sp = await searchParams;
  const topic = typeof sp.topic === "string" ? sp.topic : "";
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const all = getAllLaws();
  const counts = new Map<string, number>();
  for (const l of all) for (const t of l.topics) counts.set(t, (counts.get(t) ?? 0) + 1);

  const filtered = all.filter(
    (l) => (!topic || (l.topics as string[]).includes(topic)) && (!q || matches(l, q)),
  );
  const inEffect = filtered.filter(isInEffect);
  const upcoming = filtered
    .filter((l) => !isInEffect(l))
    .sort((a, b) => a.effective.localeCompare(b.effective));
  const filtering = Boolean(topic || q);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="border-b-4 border-double border-ink pb-6">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          New laws, plainly
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black sm:text-5xl">
          What Passed
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-lg leading-relaxed text-muted">
          {DEK}
        </p>
        <p className="mt-2 font-sans text-sm text-muted">
          {all.length} {all.length === 1 ? "law" : "laws"} explained so far.
          Each one is checked against the bill text and the Legislature&apos;s
          own cost estimates; the sources sit at the end of every entry.
        </p>

        <form action="/laws" method="get" role="search" aria-label="Search laws" className="mt-5 flex max-w-xl gap-2">
          <label htmlFor="laws-q" className="sr-only">
            Search laws
          </label>
          <input
            id="laws-q"
            name="q"
            type="search"
            defaultValue={q}
            autoComplete="off"
            placeholder="Search by topic, bill number, or a word: taxes, SB 2588, custody"
            className="min-w-0 flex-1 border border-ink bg-paper px-3 py-2 font-sans text-base focus:outline-hidden focus:ring-2 focus:ring-crimson"
          />
          {topic && <input type="hidden" name="topic" value={topic} />}
          <button
            type="submit"
            className="border border-ink bg-ink px-4 py-2 font-sans text-sm font-bold uppercase tracking-wider text-paper hover:border-crimson hover:bg-crimson"
          >
            Search
          </button>
        </form>

        <nav aria-label="Browse by topic" className="mt-4 flex flex-wrap gap-2">
          <Link href={q ? `/laws?q=${encodeURIComponent(q)}` : "/laws"} className={topic ? chipOff : chipOn}>
            All topics
          </Link>
          {LAW_TOPICS.filter((t) => counts.get(t)).map((t) => (
            <Link
              key={t}
              href={`/laws?topic=${encodeURIComponent(t)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={topic === t ? chipOn : chipOff}
            >
              {t} <span className="font-medium opacity-70">{counts.get(t)}</span>
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
          {filtered.length === 0 ? "No law matches that yet" : `${filtered.length} ${filtered.length === 1 ? "law" : "laws"}`}
          {topic && (
            <>
              {" "}in <strong className="text-ink">{topic}</strong>
            </>
          )}
          {q && (
            <>
              {" "}matching <strong className="text-ink">&ldquo;{q}&rdquo;</strong>
            </>
          )}
          .{" "}
          <Link href="/laws" className="font-semibold text-crimson">
            Show everything
          </Link>
        </p>
      )}

      {inEffect.length > 0 && (
        <section className="mt-8">
          <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            In effect now
          </h2>
          <ol className="divide-y divide-rule">
            {inEffect.map((law) => (
              <LawCard key={law.slug} law={law} />
            ))}
          </ol>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mt-10">
          <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            Taking effect later
          </h2>
          <ol className="divide-y divide-rule">
            {upcoming.map((law) => (
              <LawCard key={law.slug} law={law} />
            ))}
          </ol>
        </section>
      )}

      <section className="mt-14 border-t border-rule pt-5">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-ink">
          How this section is made
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
          The Wire reads the bill as enacted, the Legislature&apos;s own cost
          estimate when one exists, the votes, and the reporting around it,
          then writes the result in plain words. We say what the law does,
          who wanted it and who fought it, what it costs and who pays, and
          what changes for an ordinary household. Where the Wire adds its own
          reading, it says so. Spot an error? Write to{" "}
          <a href={`mailto:${site.email}`} className="font-semibold text-crimson">
            {site.email}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
