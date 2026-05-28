import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

// Google News sitemap: per Google's spec, only articles published in the last
// 2 days. Kept dynamic (no force-static) so the 48-hour window is always
// computed at request time.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export async function GET() {
  const cutoff = Date.now() - TWO_DAYS_MS;
  const recent = getAllPosts().filter(
    (p) => new Date(p.date).getTime() >= cutoff,
  );

  const urls = recent
    .map((p) => {
      const url = absoluteUrl(`/article/${p.slug}`);
      return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${esc(site.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.date).toISOString()}</news:publication_date>
      <news:title>${esc(p.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
