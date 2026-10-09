import type { Metadata } from "next";
import Link from "next/link";
import { searchPosts, searchLaws } from "@/lib/search";
import { formatDate, readingTime } from "@/lib/posts";
import { categories, site } from "@/lib/site";
import SearchForm from "@/app/components/SearchForm";
import CategoryTag from "@/app/components/CategoryTag";
import Highlight from "@/app/components/Highlight";

const DESCRIPTION = `Search every story ${site.name} has published.`;
const LIMIT = 40;

// Starting points for readers who arrive without a query.
const SUGGESTIONS = [
  "Farish Street",
  "JXN Water",
  "data center",
  "sales tax",
  "Pearl River",
  "budget",
  "Capitol Street",
  "UMMC",
];

const chip =
  "inline-block border border-rule px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider text-ink hover:border-ink hover:text-crimson";

function readQuery(sp: Record<string, string | string[] | undefined>): string {
  return (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/search">): Promise<Metadata> {
  const q = readQuery(await searchParams);
  return {
    title: q ? `Search: ${q}` : "Search",
    description: DESCRIPTION,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const q = readQuery(await searchParams);
  const { terms, hits } = q
    ? searchPosts(q, { limit: LIMIT })
    : { terms: [] as string[], hits: [] };
  const laws = q ? searchLaws(q, { limit: 5 }).hits : [];
  const quoted = terms.map((t) => `“${t}”`).join(" and ");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="border-b border-rule pb-6">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Search
        </p>
        <h1 className="mt-3 font-serif text-3xl font-black sm:text-4xl">
          Find a story
        </h1>
        <p className="mt-2 font-sans text-muted">
          {DESCRIPTION} Put a phrase in quotes to match it exactly.
        </p>
        <div className="mt-5">
          {/* Keyed on the query so a half-typed box is replaced when a chip
              or the nav icon navigates here without a full page load. */}
          <SearchForm key={q} id="search-q" q={q} autoFocus={!q} />
        </div>
      </header>

      {!q && (
        <section className="mt-8">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-ink">
            Start with one of these
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <Link href={`/search?q=${encodeURIComponent(s)}`} className={chip}>
                  {s}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-sans text-xs font-bold uppercase tracking-widest text-ink">
            Or browse a section
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className={chip}>
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/archive" className={chip}>
                Every article
              </Link>
            </li>
          </ul>
        </section>
      )}

      {q && terms.length === 0 && (
        <p className="mt-8 font-sans text-muted">
          Try a more specific word. Very short and very common words are
          ignored.
        </p>
      )}

      {laws.length > 0 && (
        <section className="mt-6 border border-rule p-5">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
            Laws, explained
          </h2>
          <ul className="mt-2 divide-y divide-rule">
            {laws.map((law) => (
              <li key={law.slug} className="py-3">
                <p className="font-sans text-[0.7rem] font-bold uppercase tracking-wider text-muted">
                  {law.bill}
                </p>
                <Link href={`/laws/${law.slug}`} className="font-serif text-lg font-bold leading-snug hover:text-crimson">
                  <Highlight text={law.title} terms={terms} />
                </Link>
                <p className="mt-1 font-sans text-sm text-muted">
                  <Highlight text={law.oneSentence} terms={terms} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q && terms.length > 0 && (
        <p className="mt-6 font-sans text-sm text-muted">
          {hits.length === 0
            ? `No stories mention ${quoted}.`
            : `${hits.length === LIMIT ? `Top ${LIMIT}` : hits.length} ${
                hits.length === 1 ? "story mentions" : "stories mention"
              } ${quoted}, best match first.`}
        </p>
      )}

      {q && terms.length > 0 && hits.length === 0 && (
        <p className="mt-3 font-sans text-sm text-muted">
          {terms.length > 1 || terms[0].includes(" ")
            ? "Try fewer words, or"
            : "Try another word, or"}{" "}
          <Link href="/archive" className="font-semibold text-crimson">
            browse every article
          </Link>
          .
        </p>
      )}

      {hits.length > 0 && (
        <ol className="mt-4 divide-y divide-rule">
          {hits.map(({ post, snippet }) => (
            <li key={post.slug} className="py-5">
              <CategoryTag category={post.category} />
              <h2 className="mt-1 font-serif text-xl font-bold leading-snug">
                <Link href={`/article/${post.slug}`} className="headline-link">
                  <Highlight text={post.title} terms={terms} />
                </Link>
              </h2>
              <p className="mt-1 font-sans text-[0.7rem] uppercase tracking-wider text-muted">
                {formatDate(post.date)} · {readingTime(post)} min read
              </p>
              <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
                <Highlight text={snippet} terms={terms} />
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
