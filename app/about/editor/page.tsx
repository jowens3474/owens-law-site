import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

// Editor-of-record page. Every article byline links here, and the
// NewsArticle schema names this Person as `editor`, so search engines can
// attach the publication's work to an identifiable human.

const editor = site.editor;
const description = `${editor.name} is the ${editor.title.toLowerCase()} of ${site.name}, an independent, AI-assisted local newsroom covering Jackson, Mississippi.`;

export const metadata: Metadata = {
  title: editor.name,
  description,
  alternates: { canonical: editor.path },
  openGraph: {
    type: "profile",
    title: `${editor.name} · ${site.name}`,
    description,
    url: absoluteUrl(editor.path),
    siteName: site.name,
  },
  twitter: {
    card: "summary",
    title: `${editor.name} · ${site.name}`,
    description,
  },
};

export default function EditorPage() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      "@id": absoluteUrl(`${editor.path}#person`),
      name: editor.name,
      jobTitle: editor.title,
      url: absoluteUrl(editor.path),
      email: site.email,
      worksFor: { "@id": absoluteUrl("/#org") },
      homeLocation: {
        "@type": "Place",
        name: site.city,
      },
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <header className="border-b border-rule pb-5">
        <div className="mb-4 h-px w-24 bg-gradient-to-r from-crimson/60 to-transparent" />
        <p className="font-serif text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">
          {editor.title}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
          {editor.name}
        </h1>
        <p className="mt-3 font-serif text-xl italic text-muted">
          Editor of record, {site.name}
        </p>
      </header>

      <div className="prose-article mt-8">
        <p>
          {editor.name} is the {editor.title.toLowerCase()} of {site.name},
          an independent local newsroom covering Jackson, Mississippi: city
          and county government, the federal courts, development and real
          estate, and the people who profit from them.
        </p>
        <p>
          The Wire is AI-assisted and document-driven. Reporting is drafted
          with the help of automated systems that read court filings, public
          records, and local coverage; every article is published under the
          editor&apos;s review and responsibility, and corrections run under
          the editor&apos;s name. How that process works, and where it can
          fail, is described in full on the{" "}
          <Link href="/methodology" className="font-semibold text-crimson">
            methodology page
          </Link>
          .
        </p>
        <p>
          Tips, corrections, and documents:{" "}
          <a href={`mailto:${site.email}`} className="font-semibold text-crimson">
            {site.email}
          </a>
          . See also the{" "}
          <Link href="/corrections" className="font-semibold text-crimson">
            corrections policy
          </Link>{" "}
          and{" "}
          <Link href="/about" className="font-semibold text-crimson">
            about the Wire
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
