import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

export const revalidate = 600;

const DEK =
  "Every correction the Wire has issued, listed publicly and dated. We fix errors at the top of the affected article and append a dated correction note. This page collects them.";

export const metadata: Metadata = {
  title: "Corrections",
  description: DEK,
  alternates: { canonical: "/corrections" },
  openGraph: {
    type: "website",
    title: `Corrections — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/corrections"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `Corrections — ${site.name}`,
    description: DEK,
  },
};

export default function CorrectionsPage() {
  const all = getAllPosts();
  const corrected = all
    .filter((p) => p.note && /^Correction\b/i.test(p.note.trim()))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="border-b-4 border-double border-ink pb-5">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Accountability
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
          Corrections
        </h1>
        <p className="mt-3 font-serif text-lg italic text-muted">{DEK}</p>
      </header>

      {corrected.length === 0 ? (
        <p className="mt-10 text-muted">
          No corrections to date. When the Wire issues one, it will appear here.
        </p>
      ) : (
        <ol className="mt-10 space-y-8">
          {corrected.map((p) => (
            <li
              key={p.slug}
              className="border-l-4 border-crimson bg-paper p-5"
            >
              <p className="font-serif text-xs font-bold uppercase tracking-widest text-muted">
                {formatDate(p.date)}
              </p>
              <h2 className="mt-1 font-serif text-xl font-black leading-tight">
                <Link
                  href={`/article/${p.slug}`}
                  className="hover:text-crimson"
                >
                  {p.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {p.note}
              </p>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-12 border-2 border-ink bg-paper p-6">
        <h2 className="font-serif text-xl font-bold">Spot something wrong?</h2>
        <p className="mt-2 text-muted">
          The Wire takes corrections seriously. Email the link to the article
          and the specific factual error, and we&apos;ll fix it.
        </p>
        <a
          href={`mailto:${site.email}?subject=Correction%20request`}
          className="mt-4 inline-block bg-crimson px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-crimson-dark"
        >
          {site.email}
        </a>
      </section>
    </div>
  );
}
