import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

// Open to all crawlers, including AI agents (ClaudeBot, GPTBot, PerplexityBot,
// Google-Extended, etc.), so the Wire's reporting can surface in their answers.
// Search results and filtered lists are rendered fresh on every request, so
// crawlers are kept off them: they hold nothing the article pages do not.
// /api/card stays open because link previews fetch share images from it.
// /api/pro/ is closed because /pro links to its checkout with a plain GET,
// which starts a Stripe Checkout Session on every hit.
const DISALLOW = [
  "/search",
  "/laws?",
  "/meetings/search",
  "/api/meetings/",
  "/api/pro/",
  "/pro/dashboard",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Explicit welcome for Google News' dedicated crawler.
      { userAgent: "Googlebot-News", allow: "/", disallow: DISALLOW },
      { userAgent: "*", allow: "/", disallow: DISALLOW },
    ],
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/news-sitemap.xml")],
    host: site.url,
  };
}
