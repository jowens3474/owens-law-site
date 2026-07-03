import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

export const revalidate = 600;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map((p) => {
      const url = absoluteUrl(`/article/${p.slug}`);
      // Photo if the article has one, otherwise the generated branded card,
      // so every item carries an image for feed readers and aggregators.
      const img = absoluteUrl(p.image ?? `/api/card/${p.slug}`);
      const imgType = img.endsWith(".webp")
        ? "image/webp"
        : img.endsWith(".png")
          ? "image/png"
          : "image/jpeg";
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <category>${esc(p.category)}</category>
      <description>${esc(p.dek)}</description>
      <media:content url="${img}" type="${imgType}" medium="image" />
    </item>`;
    })
    .join("\n");

  const lastBuild = new Date(posts[0]?.date ?? Date.now()).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${absoluteUrl("/")}</link>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
    <description>${esc(site.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
