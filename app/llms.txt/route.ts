import { getAllPosts } from "@/lib/posts";
import { getAllLaws } from "@/lib/laws";
import { site, categories } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

export const revalidate = 600;

export async function GET() {
  const posts = getAllPosts();
  const lines: string[] = [];

  lines.push(`# ${site.name}`, "");
  lines.push(`> ${site.description}`, "");
  lines.push(`${site.tagline} Based in ${site.city}.`, "");

  lines.push("## Mission", "");
  lines.push(site.mission, "");

  lines.push("## Articles", "");
  for (const p of posts) {
    lines.push(`- [${p.title}](${absoluteUrl(`/article/${p.slug}.md`)}): ${p.dek}`);
  }
  lines.push("");

  const laws = getAllLaws();
  if (laws.length > 0) {
    lines.push("## New laws, explained in plain words", "");
    for (const l of laws) {
      lines.push(`- [${l.title} (${l.bill})](${absoluteUrl(`/laws/${l.slug}`)}): ${l.oneSentence}`);
    }
    lines.push("");
  }

  lines.push("## Sections", "");
  for (const c of categories) {
    lines.push(`- [${c.name}](${absoluteUrl(`/category/${c.slug}`)}): ${c.blurb}`);
  }
  lines.push("");

  lines.push("## Optional", "");
  lines.push(`- [Full text of all articles](${absoluteUrl("/llms-full.txt")})`);
  lines.push(`- [RSS feed](${absoluteUrl("/feed.xml")})`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
