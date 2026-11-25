import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { formatDay } from "@/lib/central-time";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

// Refresh at most daily; deploys rebuild it sooner. Each refresh is a billed
// cache write on Vercel.
export const revalidate = 86400;

const TITLE = "Jackson, MS Guides: City Services and Local Government";
const DEK =
  "Standing reference pages from The Jackson Wire. Each one answers a question Jackson residents ask again and again, and names its sources.";

export const metadata: Metadata = {
  title: TITLE,
  description: DEK,
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    title: `${TITLE} | ${site.name}`,
    description: DEK,
    url: absoluteUrl("/guides"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${site.name}`,
    description: DEK,
  },
};

export default function GuidesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Jackson Guides | ${site.name}`,
    description: DEK,
    url: absoluteUrl("/guides"),
    hasPart: GUIDES.map((g) => ({
      "@type": "WebPage",
      name: g.label,
      url: absoluteUrl(g.href),
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="border-b border-rule pb-5">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Reference
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black sm:text-5xl">
          Jackson Guides
        </h1>
        <p className="mt-3 font-sans text-lg text-muted">{DEK}</p>
      </header>

      <ul className="divide-y divide-rule">
        {GUIDES.map((g) => (
          <li key={g.href} className="py-6">
            <Link
              href={g.href}
              className="font-serif text-2xl font-bold leading-snug hover:text-crimson"
            >
              {g.label}
            </Link>
            <p className="mt-2 font-sans text-base leading-relaxed">{g.summary}</p>
            <p className="mt-1 font-sans text-sm text-muted">
              {g.checked
                ? `Facts last checked ${formatDay(g.checked, { weekday: false })}.`
                : g.liveNote}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-6 border-t border-rule pt-5 font-sans text-sm text-muted">
        See something out of date on a guide?{" "}
        <a
          href={`mailto:${site.email}`}
          className="font-semibold text-crimson hover:text-crimson-bright"
        >
          Tell the newsroom.
        </a>
      </p>
    </div>
  );
}
