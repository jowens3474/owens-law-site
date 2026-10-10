import { getAllPosts, getPostBySlug, isScheduledSlug } from "@/lib/posts";
import { postToMarkdown } from "@/lib/markdown";
import { capNotFoundLife } from "@/lib/not-found-cap";

// Rebuilt on every deploy; see app/article/[slug]/page.tsx.
export const revalidate = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    if (isScheduledSlug(slug)) await capNotFoundLife();
    return new Response("Not found", { status: 404 });
  }
  return new Response(postToMarkdown(post), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
