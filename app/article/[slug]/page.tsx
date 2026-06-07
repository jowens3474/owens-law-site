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

        <ArticleImage
          post={post}
          label={post.category}
          preload
          sizes="(max-width: 768px) 100vw, 768px"
          className="mt-6 aspect-[16/9] w-full rounded-sm"
        />

        <div className="prose-article mt-8">
          {post.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {post.timeline && <Timeline sections={post.timeline} />}

        {post.note && (
          <p className="mt-8 border-t border-rule pt-4 text-sm italic text-muted">
            {post.note}
          </p>
        )}

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
