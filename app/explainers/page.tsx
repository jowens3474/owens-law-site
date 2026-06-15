import type { Metadata } from "next";
import Link from "next/link";
import {
  getPostsByTag,
  formatDate,
  readingTime,
} from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import ArticleImage from "@/app/components/ArticleImage";
import CategoryTag from "@/app/components/CategoryTag";

export const revalidate = 600;

const DEK =
  "Background, analysis, and reference pieces from The Jackson Wire. Start here if you're new to a story.";

export const metadata: Metadata = {
  title: "Explainers",
  description: DEK,
  alternates: { canonical: "/explainers" },
  openGraph: {
    type: "website",
    title: `Explainers — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/explainers"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `Explainers — ${site.name}`,
    description: DEK,
  },
};

export default function ExplainersPage() {
  const explainers = getPostsByTag("explainer");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="border-b-4 border-double border-ink pb-5">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Background &amp; Analysis
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black sm:text-5xl">
          Explainers
        </h1>
        <p className="mt-3 font-serif text-lg italic text-muted">{DEK}</p>
      </header>

      {explainers.length === 0 ? (
        <p className="mt-10 text-muted">
          No explainers yet. Check back soon.
        </p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {explainers.map((p) => (
            <Link
              key={p.slug}
              href={`/article/${p.slug}`}
              className="group block border-2 border-ink bg-paper p-5 hover:border-crimson"
            >
              {p.image && (
                <ArticleImage
                  post={p}
                  label={p.category}
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="mb-4 aspect-[16/9] w-full"
                />
              )}
              <CategoryTag category={p.category} />
              <h2 className="mt-1 font-serif text-2xl font-black leading-[1.1] group-hover:text-crimson">
                {p.title}
              </h2>
              <p className="mt-2 font-serif text-base leading-relaxed text-muted">
                {p.dek}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wider text-muted">
                {formatDate(p.date)} · {readingTime(p)} min read
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
