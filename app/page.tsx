import Link from "next/link";
import {
  getAllPosts,
  getFeaturedPost,
  formatDate,
  readingTime,
} from "@/lib/posts";

// Refresh every 10 minutes so scheduled (future-dated) articles flip live
// automatically without a redeploy.
export const revalidate = 600;
import { site } from "@/lib/site";
import ArticleCard from "./components/ArticleCard";
import ArticleImage from "./components/ArticleImage";
import Sidebar from "./components/Sidebar";
import CategoryTag from "./components/CategoryTag";
import NewsletterSignup from "./components/NewsletterSignup";

const LATEST_LIMIT = 8;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
      {children}
    </h2>
  );
}

function EmptyFrontPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="font-serif text-sm font-bold uppercase tracking-widest text-crimson">
        Premiere Edition
      </p>
      <h2 className="mt-3 font-serif text-4xl font-black leading-tight sm:text-5xl">
        The presses are warming up.
      </h2>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        {site.name} is just getting started. Our first reporting on Mississippi
        politics, property, and power is on the way — check back soon.
      </p>
      <a
        href={`mailto:${site.email}`}
        className="mt-8 inline-block bg-crimson px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-crimson-dark"
      >
        Got a tip? Get in touch
      </a>
    </div>
  );
}

export default function Home() {
  const lead = getFeaturedPost();

  // Brand-new site with nothing published yet.
  if (!lead) return <EmptyFrontPage />;

  const allRest = getAllPosts().filter((p) => p.slug !== lead.slug);
  const rest = allRest.slice(0, LATEST_LIMIT);
  const hasMore = allRest.length > LATEST_LIMIT;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Corruption case hub promo */}
      <Link
        href="/corruption-case"
        className="mb-8 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper px-5 py-3 hover:border-crimson"
      >
        <div>
          <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
            Now tracking · The Trial
          </p>
          <p className="mt-0.5 font-serif text-base font-bold">
            U.S. v. Owens, Lumumba, and Banks
          </p>
        </div>
        <span className="font-serif text-sm font-bold uppercase tracking-wide text-crimson">
          Full coverage →
        </span>
      </Link>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Lead story */}
          <article>
            <Link href={`/article/${lead.slug}`}>
              <ArticleImage
                post={lead}
                label={lead.category}
                preload
                sizes="(max-width: 1024px) 100vw, 768px"
                className="aspect-[16/9] w-full rounded-sm"
              />
            </Link>
            <div className="mt-4">
              <CategoryTag category={lead.category} />
              <h2 className="mt-1 font-serif text-4xl font-black leading-[1.05] sm:text-5xl">
                <Link href={`/article/${lead.slug}`} className="headline-link">
                  {lead.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-2xl font-serif text-lg leading-relaxed text-muted">
                {lead.dek}
              </p>
              <p className="mt-3 text-xs uppercase tracking-wider text-muted">
                By {lead.author} · {formatDate(lead.date)} · {readingTime(lead)}{" "}
                min read
              </p>
            </div>
          </article>

          {rest.length > 0 && (
            <section className="mt-12 border-t-2 border-ink pt-8">
              <SectionHeading>Latest</SectionHeading>
              <div className="grid gap-8 sm:grid-cols-2">
                {rest.map((post) => (
                  <ArticleCard key={post.slug} post={post} variant="feature" />
                ))}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/archive"
                    className="border-2 border-ink bg-paper px-6 py-3 text-sm font-bold uppercase tracking-wide hover:border-crimson hover:text-crimson"
                  >
                    All articles ({allRest.length}) →
                  </Link>
                </div>
              )}
            </section>
          )}

          <div className="mt-12">
            <NewsletterSignup variant="block" />
          </div>
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
