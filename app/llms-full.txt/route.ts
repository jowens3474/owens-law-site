import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { postToMarkdown } from "@/lib/markdown";

export const dynamic = "force-static";

export async function GET() {
  const posts = getAllPosts();
  const body = posts.map(postToMarkdown).join("\n\n---\n\n");
  const out = `# ${site.name} — Full Text\n\n> ${site.description}\n\n${body}\n`;

  return new Response(out, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
