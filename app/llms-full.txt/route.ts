import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { postToMarkdown } from "@/lib/markdown";

// Refresh at most daily; deploys rebuild it sooner. Each refresh is a billed
// cache write on Vercel.
export const revalidate = 86400;

export async function GET() {
  const posts = getAllPosts();
  const body = posts.map(postToMarkdown).join("\n\n---\n\n");
  const out = `# ${site.name}: Full Text\n\n> ${site.description}\n\nMission: ${site.mission}\n\n${body}\n`;

  return new Response(out, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
