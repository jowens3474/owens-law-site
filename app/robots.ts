import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

// Open to all crawlers, including AI agents (ClaudeBot, GPTBot, PerplexityBot,
// Google-Extended, etc.), so the Wire's reporting can surface in their answers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/news-sitemap.xml")],
    host: site.url,
  };
}
