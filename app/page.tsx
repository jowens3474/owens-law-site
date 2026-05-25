import Link from "next/link";
import {
  getAllPosts,
  getFeaturedPost,
  formatDate,
  readingTime,
} from "@/lib/posts";
import ArticleCard from "./components/ArticleCard";
import Sidebar from "./components/Sidebar";
import CategoryTag from "./components/CategoryTag";
import Placeholder from "./components/Placeholder";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 border-b-2 border-ink pb-1 font-serif text-2xl font-black uppercase tracking-wide">
      {children}
    </h2>
  );
}

export default function Home() {
  const lead = getFeaturedPost();
  const rest = getAllPosts().filter((p) => p.slug !== lead.slug);
  const topTwo = rest.slice(0, 2);
  const featureGrid = rest.slice(2, 6);
  const moreNews = rest.slice(6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Lead block */}
      <section className="grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <Link href={`/article/${lead.slug}`}>
            <Placeholder
              seed={lead.slug}
              label={lead.category}
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

        <div className="flex flex-col border-t-2 border-ink pt-4 lg:border-l lg:border-t-0 lg:border-rule lg:pl-6 lg:pt-0">
          <h2 className="mb-2 font-serif text-sm font-bold uppercase tracking-widest text-crimson">
            Also Today
          </h2>
          {topTwo.map((post) => (
            <ArticleCard key={post.slug} post={post} variant="headline" />
          ))}
        </div>
      </section>

      <div className="my-10 border-t-2 border-ink" />

      {/* Body: features + sidebar */}
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section>
            <SectionHeading>Latest</SectionHeading>
            <div className="grid gap-8 sm:grid-cols-2">
              {featureGrid.map((post) => (
                <ArticleCard key={post.slug} post={post} variant="feature" />
              ))}
            </div>
          </section>

          {moreNews.length > 0 && (
            <section className="mt-12">
              <SectionHeading>More News</SectionHeading>
              <div>
                {moreNews.map((post) => (
                  <ArticleCard key={post.slug} post={post} variant="row" />
                ))}
              </div>
            </section>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
