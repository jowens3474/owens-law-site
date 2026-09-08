import Link from "next/link";
import {
  getAllPosts,
  getFeaturedPost,
  getTodaysBrief,
  formatDate,
  readingTime,
} from "@/lib/posts";

// Refresh every 10 minutes so scheduled (future-dated) articles flip live
// automatically without a redeploy.
export const revalidate = 600;
import { site } from "@/lib/site";
import ArticleImage from "./components/ArticleImage";
import Sidebar from "./components/Sidebar";
import CategoryTag from "./components/CategoryTag";
import NewsletterSignup from "./components/NewsletterSignup";

const LATEST_LIMIT = 8;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
      {children}
    </h2>
  );
}

function EmptyFrontPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="font-sans text-sm font-bold uppercase tracking-widest text-crimson">
        Premiere Edition
      </p>
      <h2 className="mt-3 font-serif text-4xl font-black leading-tight sm:text-5xl">
        The presses are warming up.
      </h2>
      <p className="mt-5 font-sans text-lg leading-relaxed text-muted">
        {site.name} is just getting started. Our first reporting on Mississippi
        politics, property, and power is on the way — check back soon.
      </p>
      <a
        href={`mailto:${site.email}`}
        className="mt-8 inline-block bg-ink px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson"
      >
        Got a tip? Get in touch
      </a>
    </div>
  );
}

export default function Home() {
  const lead = getFeaturedPost();
  const todaysBrief = getTodaysBrief();

  // Brand-new site with nothing published yet.
  if (!lead) return <EmptyFrontPage />;

  const allRest = getAllPosts().filter(
    (p) => p.slug !== lead.slug && p.slug !== todaysBrief?.slug,
  );
  const rest = allRest.slice(0, LATEST_LIMIT);
  const hasMore = allRest.length > LATEST_LIMIT;

  // The right rail carries the next six stories; anything left in `rest`
  // (still capped at LATEST_LIMIT) runs in the "More coverage" grid below.
  const railItems = rest.slice(0, 6);
  const moreItems = rest.slice(6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Today's brief, if published */}
      {todaysBrief && (
        <>
          <Link
            href={`/article/${todaysBrief.slug}`}
            className="mb-6 block border-l-4 border-ink py-2 pl-4"
          >
            <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-crimson">
              The Brief · {formatDate(todaysBrief.date)}
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold leading-tight text-ink">
              {todaysBrief.title.replace(/^Morning Brief:\s*/, "")}
            </h2>
            <p className="mt-1 font-sans text-sm leading-relaxed text-muted">
              {todaysBrief.dek}
            </p>
          </Link>
          <div className="hairline mb-8" />
        </>
      )}

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Lead package */}
        <div className="lg:col-span-8">
          <article>
            <CategoryTag category={lead.category} />
            <h1 className="mt-1 font-serif text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-[3.25rem]">
              <Link href={`/article/${lead.slug}`} className="headline-link">
                {lead.title}
              </Link>
            </h1>
            <p className="mt-4 max-w-3xl font-sans text-[17px] leading-relaxed text-muted">
              {lead.dek}
            </p>
            <p className="mt-4 font-sans text-xs uppercase tracking-wider text-muted">
              By {lead.author} · {formatDate(lead.date)} · {readingTime(lead)}{" "}
              min read
            </p>

            {lead.image && (
              <Link href={`/article/${lead.slug}`} className="mt-6 block">
                <ArticleImage
                  post={lead}
                  preload
                  sizes="(max-width: 1024px) 100vw, 768px"
                  className="aspect-[16/9] w-full"
                />
                {lead.imageAlt && (
                  <span className="mt-1.5 block border-t border-rule pt-1.5 font-sans text-xs text-muted">
                    {lead.imageAlt}
                  </span>
                )}
              </Link>
            )}
          </article>

          {/* Full-width double rule before "More coverage" */}
          {moreItems.length > 0 && (
            <div className="mt-12 border-b-4 border-double border-ink" />
          )}

          {moreItems.length > 0 && (
            <section className="mt-8">
              <SectionHeading>More coverage</SectionHeading>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:[&>*:not(:nth-child(4n+1))]:border-l lg:[&>*:not(:nth-child(4n+1))]:border-rule lg:[&>*:not(:nth-child(4n+1))]:pl-5">
                {moreItems.map((post) => (
                  <article key={post.slug}>
                    <CategoryTag category={post.category} />
                    <h3 className="mt-1 font-serif text-xl font-bold leading-tight">
                      <Link href={`/article/${post.slug}`} className="headline-link">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
                      {post.dek}
                    </p>
                    <p className="mt-2 font-sans text-[0.7rem] uppercase tracking-wider text-muted">
                      {formatDate(post.date)} · {readingTime(post)} min read
                    </p>
                  </article>
                ))}
              </div>
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <Link
                    href="/archive"
                    className="glow-card border border-rule px-6 py-3.5 font-sans text-sm font-bold uppercase tracking-wide hover:text-crimson"
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

        {/* Right rail */}
        <div className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-6">
          {railItems.length > 0 && (
            <section>
              <SectionHeading>Latest</SectionHeading>
              <div className="divide-y divide-rule">
                {railItems.map((post) => (
                  <article key={post.slug} className="py-4 first:pt-0">
                    <h3 className="font-serif text-lg font-bold leading-tight">
                      <Link href={`/article/${post.slug}`} className="headline-link">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-1.5 font-sans text-[0.7rem] uppercase tracking-wider text-muted">
                      {formatDate(post.date)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="mt-10">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
