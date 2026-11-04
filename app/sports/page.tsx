import type { Metadata } from "next";
import Link from "next/link";
import { getSportsPosts, SPORTS_SECTIONS, SPORTS_SHARE_IMAGE } from "@/lib/sports";
import { HEADLINES_NOTE } from "@/lib/sports-note";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import ArticleCard from "@/app/components/ArticleCard";
import Sidebar from "@/app/components/Sidebar";
import SportsHeadlines from "@/app/components/SportsHeadlines";
import SportsTabs from "@/app/components/SportsTabs";

// Headlines now load client-side, so the hub no longer needs hourly refreshes;
// each refresh is a billed cache write on Vercel.
export const revalidate = 86400;

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
                {posts.length > 0 && (
                  <div>
                    {posts.map((post) => (
                      <ArticleCard key={post.slug} post={post} variant="row" />
                    ))}
                  </div>
                )}
                <h3 className="mt-4 border-b border-rule pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
                  Latest headlines
                </h3>
                <SportsHeadlines section={s.slug} limit={5} note={false} />
                <Link
                  href={`/sports/${s.slug}`}
                  className="mt-3 inline-block font-sans text-xs font-bold uppercase tracking-wide text-crimson hover:text-crimson-bright"
                >
                  More {s.name} →
                </Link>
              </section>
            );
          })}
          <p className="font-sans text-xs text-muted">{HEADLINES_NOTE}</p>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
