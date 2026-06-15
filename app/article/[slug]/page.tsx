import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  formatDate,
  readingTime,
} from "@/lib/posts";
import { site, categoryByName } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import ArticleImage from "@/app/components/ArticleImage";
import Timeline from "@/app/components/Timeline";
import CategoryTag from "@/app/components/CategoryTag";
import ArticleCard from "@/app/components/ArticleCard";
import NewsletterSignup from "@/app/components/NewsletterSignup";
import { extractCitations } from "@/lib/citations";

// Refresh every 10 minutes so scheduled articles render on schedule.
export const revalidate = 600;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/article/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = absoluteUrl(`/article/${slug}`);
  const images = post.image ? [absoluteUrl(post.image)] : undefined;
  return {
    title: post.title,
    description: post.dek,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `/article/${slug}`,
      types: { "text/markdown": `/article/${slug}.md` },
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.dek,
      url,
      siteName: site.name,
      publishedTime: post.date,
      modifiedTime: post.date,
      section: post.category,
      authors: [post.author],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.dek,
      images,
    },
  };
}

export default async function ArticlePage({
  params,
}: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post, 3);

  const categorySlug = categoryByName(post.category)?.slug;
  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      ...(categorySlug
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: post.category,
              item: absoluteUrl(`/category/${categorySlug}`),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: categorySlug ? 3 : 2,
        name: post.title,
        item: absoluteUrl(`/article/${post.slug}`),
      },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.dek,
    datePublished: post.date,
    dateModified: post.date,
    articleSection: post.category,
    author: [{ "@type": "Organization", name: post.author }],
    publisher: { "@id": absoluteUrl("/#org") },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/article/${post.slug}`),
    },
    ...(post.image ? { image: [absoluteUrl(post.image)] } : {}),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <nav className="mb-6 text-xs uppercase tracking-widest text-muted">
        <Link href="/" className="hover:text-crimson">
          Home
        </Link>
        <span className="px-2">/</span>
        <CategoryTag category={post.category} className="align-baseline" />
      </nav>

      <article>
        <header>
          <h1 className="font-serif text-4xl font-black leading-[1.08] sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 font-serif text-xl italic leading-relaxed text-muted">
            {post.dek}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-rule py-3 text-sm">
            <span className="font-semibold">By {post.author}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{formatDate(post.date)}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{readingTime(post)} min read</span>
          </div>
        </header>

        {post.image && (
          <ArticleImage
            post={post}
            preload
            sizes="(max-width: 768px) 100vw, 768px"
            className="mt-6 aspect-[16/9] w-full"
          />
        )}

        {post.tags?.includes("morning-brief") ? (
          <ol className="mt-10 space-y-10">
            {post.body.map((para, i) => {
              const sep = para.indexOf(": ");
              const headline =
                sep > 0 && sep < 100 ? para.slice(0, sep) : `Item ${i + 1}`;
              const body = sep > 0 && sep < 100 ? para.slice(sep + 2) : para;
              return (
                <li key={i} className="grid gap-4 sm:grid-cols-[60px_1fr]">
                  <span
                    aria-hidden
                    className="font-serif text-5xl font-black leading-none text-crimson/70 sm:text-6xl"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl font-black leading-[1.1] sm:text-3xl">
                      {headline}
                    </h3>
                    <p className="mt-3 font-serif text-lg leading-relaxed">
                      {body}
                    </p>
                  </div>
                  {i < post.body.length - 1 && (
                    <span
                      aria-hidden
                      className="col-span-full mt-6 border-b border-rule"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="prose-article mt-8">
            {post.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {post.timeline && <Timeline sections={post.timeline} />}

        {(() => {
          const citations = extractCitations(post);
          if (citations.length === 0) return null;
          return (
            <aside className="mt-8 border-t border-rule pt-4">
              <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
                Sources cited in this article
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                {citations.map((c, i) => (
                  <li key={c.name}>
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="hover:text-crimson"
                      >
                        {c.name}
                      </a>
                    ) : (
                      <span>{c.name}</span>
                    )}
                    {i < citations.length - 1 && (
                      <span aria-hidden className="ml-3">
                        ·
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </aside>
          );
        })()}

        {post.note && (
          <p className="mt-8 border-t border-rule pt-4 text-sm italic text-muted">
            {post.note}
          </p>
        )}

        {(() => {
          const hubMap: Record<string, { label: string; href: string }> = {
            "corruption-case": {
              label: "The Trial — full coverage of U.S. v. Owens",
              href: "/corruption-case",
            },
            "data-centers": {
              label: "Data Centers — every Jackson project we track",
              href: "/data-centers",
            },
          };
          const hubTag = post.tags?.find((t) => hubMap[t]);
          if (!hubTag) return null;
          const hub = hubMap[hubTag];
          return (
            <aside className="mt-10 border-2 border-ink bg-paper p-5">
              <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
                From this beat
              </p>
              <Link
                href={hub.href}
                className="mt-2 inline-block font-serif text-lg font-bold hover:text-crimson"
              >
                {hub.label} →
              </Link>
            </aside>
          );
        })()}

        <footer className="mt-10 border-t-2 border-ink pt-5">
          <p className="text-sm text-muted">
            Have something to add to this story? Documents, corrections, or a
            tip?{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-semibold text-crimson hover:text-crimson-dark"
            >
              Reach the newsroom.
            </a>
          </p>
        </footer>
      </article>

      <div className="mt-12">
        <NewsletterSignup variant="block" />
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-2 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
            Keep Reading
          </h2>
          <div>
            {related.map((p) => (
              <ArticleCard key={p.slug} post={p} variant="row" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
