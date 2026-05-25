import Link from "next/link";
import { getMostRead } from "@/lib/posts";
import { categories, site } from "@/lib/site";
import NewsletterSignup from "./NewsletterSignup";

export default function Sidebar() {
  const mostRead = getMostRead(5);

  return (
    <aside className="space-y-8">
      <NewsletterSignup />

      <section>
        <h2 className="border-b-2 border-ink pb-1 font-serif text-lg font-bold uppercase tracking-wide">
          Most Read
        </h2>
        <ol className="mt-3 space-y-4">
          {mostRead.map((post, i) => (
            <li key={post.slug} className="flex gap-3">
              <span className="font-serif text-2xl font-black leading-none text-crimson/70">
                {i + 1}
              </span>
              <Link
                href={`/article/${post.slug}`}
                className="font-serif font-semibold leading-snug hover:text-crimson"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="border-b-2 border-ink pb-1 font-serif text-lg font-bold uppercase tracking-wide">
          Sections
        </h2>
        <ul className="mt-3 space-y-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/category/${c.slug}`}
                className="flex items-baseline justify-between text-sm font-semibold uppercase tracking-wide hover:text-crimson"
              >
                {c.name}
                <span aria-hidden className="text-muted">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-2 border-dashed border-crimson/40 bg-paper p-5">
        <h2 className="font-serif text-lg font-bold">Got a tip?</h2>
        <p className="mt-1 text-sm text-muted">
          Documents, leaks, or a story we&apos;re missing? We protect our
          sources.
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-3 inline-block text-sm font-bold uppercase tracking-wide text-crimson hover:text-crimson-dark"
        >
          {site.email}
        </a>
      </section>
    </aside>
  );
}
