import type { MetadataRoute } from "next";
import { practiceAreas } from "@/lib/site";
import { cities } from "@/lib/locations";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "/",
    "/practice-areas",
    "/areas-we-serve",
    "/results",
    "/reviews",
    "/about",
    "/for-attorneys",
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

  const cityHubs: MetadataRoute.Sitemap = cities.map((c) => ({
    url: absoluteUrl(`/areas-we-serve/${c.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const practiceCityPages: MetadataRoute.Sitemap = practiceAreas.flatMap((p) =>
    cities.map((c) => ({
      url: absoluteUrl(`/practice-areas/${p.slug}/${c.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  return [...staticPages, ...areaPages, ...cityHubs, ...practiceCityPages];
}
