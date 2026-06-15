import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatDate, readingTime } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import CategoryTag from "@/app/components/CategoryTag";

export const revalidate = 600;

const DEK =
  "Every article we've published, newest first. Skim by category or jump straight to a story.";

export const metadata: Metadata = {
  title: "Archive",
  description: DEK,
  alternates: { canonical: "/archive" },
  openGraph: {
    type: "website",
    title: `Archive — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/archive"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `Archive — ${site.name}`,
    description: DEK,
  },
};

export default function ArchivePage() {
  const all = getAllPosts();

  // Group by year-month for skimmability
  const groups = new Map<string, typeof all>();
  for (const p of all) {
    const ym = p.date.slice(0, 7); // YYYY-MM
    if (!groups.has(ym)) groups.set(ym, []);
    groups.get(ym)!.push(p);
  }

  const monthLabel = (ym: string) => {
    const d = new Date(`${ym}-01T00:00:00Z`);
    return d.toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="border-b-4 border-double border-ink pb-5">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          The Stacks
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black sm:text-5xl">
          Archive
        </h1>
        <p className="mt-3 font-serif text-lg italic text-muted">{DEK}</p>
        <p className="mt-2 text-sm text-muted">
          {all.length} article{all.length === 1 ? "" : "s"} since{" "}
          {formatDate(all[all.length - 1].date)}.
        </p>
      </header>

      {[...groups.entries()].map(([ym, posts]) => (
        <section key={ym} className="mt-10">
          <h2 className="mb-3 border-b-2 border-ink pb-1 font-serif text-xl font-black uppercase tracking-wide">
            {monthLabel(ym)}
          </h2>
          <ol className="divide-y divide-rule border-y border-rule">
            {posts.map((p) => (
              <li key={p.slug} className="py-3">
                <Link
                  href={`/article/${p.slug}`}
                  className="grid grid-cols-[80px_1fr] gap-3 sm:grid-cols-[80px_120px_1fr_auto] sm:gap-4 hover:text-crimson"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {formatDate(p.date).split(",")[0]}
                  </span>
                  <span className="hidden sm:block">
                    <CategoryTag category={p.category} />
                  </span>
                  <span className="font-serif text-base font-bold leading-snug sm:text-lg">
                    {p.title}
                  </span>
                  <span className="hidden text-xs uppercase tracking-wider text-muted sm:block">
                    {readingTime(p)} min
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
