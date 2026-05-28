import type { MetadataRoute } from "next";
import { practiceAreas } from "@/lib/site";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "/",
    "/practice-areas",
    "/results",
    "/reviews",
    "/about",
    "/contact",
  ];

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const areaPages: MetadataRoute.Sitemap = practiceAreas.map((p) => ({
    url: absoluteUrl(`/practice-areas/${p.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...areaPages];
}
