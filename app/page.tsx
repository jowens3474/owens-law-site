import Link from "next/link";
import {
  getAllPosts,
  getFeaturedPost,
  formatDate,
  readingTime,
} from "@/lib/posts";
import { site } from "@/lib/site";
import ArticleCard from "./components/ArticleCard";
import ArticleImage from "./components/ArticleImage";
import Sidebar from "./components/Sidebar";
import CategoryTag from "./components/CategoryTag";

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

  const rest = getAllPosts().filter((p) => p.slug !== lead.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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
            </section>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
