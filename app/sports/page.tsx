import type { Metadata } from "next";
import Link from "next/link";
import { getSportsPosts, SPORTS_SECTIONS, SPORTS_SHARE_IMAGE } from "@/lib/sports";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import ArticleCard from "@/app/components/ArticleCard";
import Sidebar from "@/app/components/Sidebar";
import SportsTabs from "@/app/components/SportsTabs";

// The front page refreshes hourly; sports follows it.
export const revalidate = 3600;

const DEK =
  "Mississippi college and high school sports, the SEC, national college sports, and NIL: the deals, laws and court cases about paying athletes.";

// The root layout's share image is replaced by any page that sets its own
// openGraph or twitter, so this page names the image outright.
export const metadata: Metadata = {
  title: "Sports",
  description: DEK,
  alternates: { canonical: "/sports" },
  openGraph: {
    type: "website",
    title: `Sports | ${site.name}`,
    description: DEK,
    url: absoluteUrl("/sports"),
    siteName: site.name,
    images: [SPORTS_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `Sports | ${site.name}`,
    description: DEK,
    images: [SPORTS_SHARE_IMAGE],
  },
};

export default function SportsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="border-b border-rule pb-5">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          Sports
        </p>
        <h1 className="mt-1 font-serif text-4xl font-black sm:text-5xl">Sports</h1>
        <p className="mt-2 max-w-2xl font-sans text-lg text-muted">{DEK}</p>
        <SportsTabs />
      </header>

      <div className="mt-8 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {SPORTS_SECTIONS.map((s) => {
            const posts = getSportsPosts(s.tag, 3);
            return (
              <section key={s.slug} className="mb-10">
                <h2 className="border-b border-ink pb-1 font-serif text-2xl font-bold">
                  <Link href={`/sports/${s.slug}`} className="headline-link">
                    {s.name}
                  </Link>
                </h2>
                {posts.length === 0 ? (
                  <p className="py-6 text-muted">
                    No Wire stories in this section yet. Check back soon.
                  </p>
                ) : (
                  <div>
                    {posts.map((post) => (
                      <ArticleCard key={post.slug} post={post} variant="row" />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
