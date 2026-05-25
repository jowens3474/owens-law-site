import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostsByCategorySlug } from "@/lib/posts";
import { categories, categoryBySlug, site } from "@/lib/site";
import ArticleCard from "@/app/components/ArticleCard";
import Sidebar from "@/app/components/Sidebar";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) return {};
  return {
    title: cat.name,
    description: `${cat.name} — ${cat.blurb} ${site.name}.`,
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/category/[category]">) {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) notFound();

  const posts = getPostsByCategorySlug(category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="border-b-4 border-double border-ink pb-5">
        <p className="font-serif text-sm font-bold uppercase tracking-widest text-crimson">
          Section
        </p>
        <h1 className="mt-1 font-serif text-4xl font-black sm:text-5xl">
          {cat.name}
        </h1>
        <p className="mt-2 max-w-2xl font-serif text-lg italic text-muted">
          {cat.blurb}
        </p>
      </header>

      <div className="mt-8 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {posts.length === 0 ? (
            <p className="py-12 text-muted">
              No stories in this section yet. Check back soon.
            </p>
          ) : (
            <div>
              {posts.map((post) => (
                <ArticleCard key={post.slug} post={post} variant="row" />
              ))}
            </div>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
