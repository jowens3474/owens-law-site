import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { categories } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

// Refresh every 10 minutes so newly-scheduled articles appear in the sitemap.
export const revalidate = 600;

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const latest = posts[0] ? new Date(posts[0].date) : new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "daily", priority: 1 },
    {
      url: absoluteUrl("/about"),
      lastModified: latest,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/corruption-case"),
      lastModified: latest,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/explainers"),
      lastModified: latest,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/archive"),
      lastModified: latest,
      changeFrequency: "daily",
      priority: 0.4,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/category/${c.slug}`),
    lastModified: latest,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const articlePages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absoluteUrl(`/article/${p.slug}`),
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.8,
    images: p.image ? [absoluteUrl(p.image)] : undefined,
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}
