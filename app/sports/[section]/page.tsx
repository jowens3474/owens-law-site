import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSportsPosts,
  getSportsSection,
  SPORTS_SECTIONS,
  SPORTS_SHARE_IMAGE,
} from "@/lib/sports";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import ArticleCard from "@/app/components/ArticleCard";
import NilPanels from "@/app/components/NilPanels";
import Sidebar from "@/app/components/Sidebar";
import SportsHeadlines from "@/app/components/SportsHeadlines";
import SportsTabs from "@/app/components/SportsTabs";

// Refresh at most daily; deploys rebuild it sooner. Each refresh is a billed
// cache write on Vercel.
export const revalidate = 86400;
// The section set is fixed at build; new sections arrive by commit and deploy.
// Unknown slugs get the prerendered 404 and write nothing to the cache.
export const dynamicParams = false;

export function generateStaticParams() {
  return SPORTS_SECTIONS.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sports/[section]">): Promise<Metadata> {
  const { section } = await params;
  const sec = getSportsSection(section);
  if (!sec) return {};
  const url = absoluteUrl(`/sports/${sec.slug}`);
  const title = `${sec.name} | ${site.name}`;
  return {
    title: sec.name,
    description: `${sec.name}. ${sec.blurb} ${site.name}.`,
    alternates: { canonical: `/sports/${sec.slug}` },
    openGraph: {
      type: "website",
      title,
      description: sec.blurb,
      url,
      siteName: site.name,
      images: [SPORTS_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: sec.blurb,
      images: [SPORTS_SHARE_IMAGE],
    },
  };
}

export default async function SportsSectionPage({
  params,
}: PageProps<"/sports/[section]">) {
  const { section } = await params;
  const sec = getSportsSection(section);
  if (!sec) notFound();

  const posts = getSportsPosts(sec.tag, 20);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="border-b border-rule pb-5">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          Sports
        </p>
        <h1 className="mt-1 font-serif text-4xl font-black sm:text-5xl">
          {sec.name}
        </h1>
        <p className="mt-2 max-w-2xl font-sans text-lg text-muted">{sec.blurb}</p>
        <SportsTabs current={sec.slug} />
      </header>

      <div className="mt-8 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {posts.length > 0 && (
            <section className="mb-8">
              <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
                From the Wire
              </h2>
              {posts.map((post) => (
                <ArticleCard key={post.slug} post={post} variant="row" />
              ))}
            </section>
          )}
          <section className="mb-8">
            <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
              Latest headlines
            </h2>
            <SportsHeadlines section={sec.slug} limit={15} />
          </section>
          {sec.slug === "nil" && <NilPanels />}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
