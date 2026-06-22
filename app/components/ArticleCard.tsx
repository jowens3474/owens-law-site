import Link from "next/link";
import { type Post, formatDate, readingTime } from "@/lib/posts";
import ArticleImage from "./ArticleImage";
import CategoryTag from "./CategoryTag";

function Byline({ post }: { post: Post }) {
  return (
    <p className="mt-2 text-xs uppercase tracking-wider text-muted">
      By {post.author} · {formatDate(post.date)} · {readingTime(post)} min read
    </p>
  );
}

export default function ArticleCard({
  post,
  variant = "feature",
}: {
  post: Post;
  variant?: "feature" | "row" | "headline";
}) {
  const href = `/article/${post.slug}`;

  if (variant === "headline") {
    return (
      <article className="border-t border-rule py-3">
        <CategoryTag category={post.category} />
        <h3 className="mt-1 font-serif text-xl font-bold leading-snug">
          <Link href={href} className="headline-link">
            {post.title}
          </Link>
        </h3>
        <Byline post={post} />
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article className="border-t border-rule py-3">
        <CategoryTag category={post.category} />
        <h3 className="mt-1 font-serif text-lg font-bold leading-snug">
          <Link href={href} className="headline-link">
            {post.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm italic text-muted">
          {post.dek}
        </p>
      </article>
    );
  }

  // feature — image is optional, typography carries the design when absent
  return (
    <article className="group flex flex-col border-t-2 border-ink pt-4 first:border-t-0">
      {post.image && (
        <Link href={href} className="mb-4 block">
          <ArticleImage
            post={post}
            sizes="(max-width: 1024px) 100vw, 640px"
            className="aspect-[16/10] w-full"
          />
        </Link>
      )}
      <CategoryTag category={post.category} />
      <h3 className="mt-1 font-serif text-2xl font-bold leading-tight sm:text-3xl">
        <Link href={href} className="headline-link">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 font-serif italic leading-loose text-muted">
        {post.dek}
      </p>
      <Byline post={post} />
    </article>
  );
}
