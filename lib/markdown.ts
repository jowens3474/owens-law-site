import { type Post, formatDate } from "@/lib/posts";
import { site } from "@/lib/site";

// Resolve a site-relative path to an absolute URL.
export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

// Render a post as standalone Markdown, suitable for LLMs/agents.
export function postToMarkdown(post: Post): string {
  const lines: string[] = [];

  lines.push(`# ${post.title}`, "");
  lines.push(`> ${post.dek}`, "");
  lines.push(
    `*${[post.category, `By ${post.author}`, formatDate(post.date)].join(" · ")}*`,
    "",
  );

  if (post.image) {
    lines.push(`![${post.imageAlt ?? post.title}](${absoluteUrl(post.image)})`, "");
  }

  const isBrief = post.tags?.includes("morning-brief");
  if (isBrief) {
    post.body.forEach((para, i) => {
      const sep = para.indexOf(": ");
      const headline =
        sep > 0 && sep < 100 ? para.slice(0, sep) : `Item ${i + 1}`;
      const body = sep > 0 && sep < 100 ? para.slice(sep + 2) : para;
      lines.push(`## ${i + 1}. ${headline}`, "", body, "");
    });
  } else {
    for (const para of post.body) {
      lines.push(para, "");
    }
  }

  if (post.timeline?.length) {
    lines.push("## Timeline", "");
    for (const section of post.timeline) {
      lines.push(`### ${section.heading}`, "");
      for (const entry of section.entries) {
        lines.push(`- **${entry.date}** — ${entry.text}`);
      }
      lines.push("");
    }
  }

  if (post.note) {
    lines.push("---", "", `_${post.note}_`, "");
  }

  lines.push(
    "---",
    `[${site.name}](${absoluteUrl("/")}) · [Read on the web](${absoluteUrl(`/article/${post.slug}`)})`,
  );

  return lines.join("\n");
}
