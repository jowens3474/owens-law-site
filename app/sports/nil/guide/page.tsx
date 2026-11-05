import type { Metadata } from "next";
import Link from "next/link";
import { NIL_DISCLAIMER, NIL_GUIDE } from "@/lib/nil";
import { SPORTS_SHARE_IMAGE } from "@/lib/sports";
import { formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

export const revalidate = 86400;

const TITLE = "NIL Guide: name, image and likeness, explained";
const DEK =
  "A plain-words guide to name, image and likeness (NIL) for college athletes: what it is, who sets the rules, and where to check.";

const published = NIL_GUIDE.sections.length > 0;

// Until the guide has sections the page is a placeholder, kept out of search.
export const metadata: Metadata = {
  title: TITLE,
  description: DEK,
  alternates: { canonical: "/sports/nil/guide" },
  ...(published ? {} : { robots: { index: false } }),
  openGraph: {
    type: "website",
    title: `${TITLE} | ${site.name}`,
    description: DEK,
    url: absoluteUrl("/sports/nil/guide"),
    siteName: site.name,
    images: [SPORTS_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${site.name}`,
    description: DEK,
    images: [SPORTS_SHARE_IMAGE],
  },
};

export default function NilGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="border-b border-rule pb-5">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          <Link href="/sports/nil" className="hover:underline">
            Sports: NIL
          </Link>
        </p>
        <h1 className="mt-1 font-serif text-4xl font-black sm:text-5xl">
          NIL Guide
        </h1>
        {NIL_GUIDE.updated && (
          <p className="mt-2 font-sans text-sm text-muted">
            Updated {formatDate(NIL_GUIDE.updated)}
          </p>
        )}
        <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
          {NIL_DISCLAIMER}
        </p>
      </header>

      {!published ? (
        <p className="py-12 font-sans text-muted">
          The guide is being written. Check back soon.
        </p>
      ) : (
        <>
          {NIL_GUIDE.intro && (
            <p className="mt-6 font-sans text-lg leading-relaxed">{NIL_GUIDE.intro}</p>
          )}

          <nav aria-label="In this guide" className="mt-6 border border-rule p-4">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-ink">
              In this guide
            </p>
            <ul className="mt-2 space-y-1 font-sans text-base">
              {NIL_GUIDE.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-crimson hover:underline">
                    {s.heading}
                  </a>
                </li>
              ))}
              {NIL_GUIDE.glossary.length > 0 && (
                <li>
                  <a href="#glossary" className="text-crimson hover:underline">
                    Glossary
                  </a>
                </li>
              )}
            </ul>
          </nav>

          {NIL_GUIDE.sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-10 scroll-mt-20">
              <h2 className="font-serif text-3xl font-bold">{s.heading}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} className="mt-3 font-sans text-base leading-relaxed">
                  {p}
                </p>
              ))}
              {s.sources.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
                    Sources
                  </h3>
                  <ul className="mt-1 list-disc pl-5 font-sans text-sm">
                    {s.sources.map((src) => (
                      <li key={src.url}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-crimson hover:underline"
                        >
                          {src.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}

          {NIL_GUIDE.glossary.length > 0 && (
            <section id="glossary" className="mt-10 scroll-mt-20">
              <h2 className="font-serif text-3xl font-bold">Glossary</h2>
              <dl className="mt-3 space-y-3 font-sans text-base leading-relaxed">
                {NIL_GUIDE.glossary.map((g) => (
                  <div key={g.term}>
                    <dt className="font-bold">{g.term}</dt>
                    <dd className="text-muted">{g.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </>
      )}

      <p className="mt-10 border-t border-rule pt-4 font-sans text-sm leading-relaxed text-muted">
        {NIL_DISCLAIMER}
      </p>
    </div>
  );
}
