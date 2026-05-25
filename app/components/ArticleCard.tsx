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
      <article className="border-t border-rule py-4">
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
      <article className="flex gap-4 border-t border-rule py-5">
        <Link href={href} className="shrink-0">
          <ArticleImage
            post={post}
            className="h-20 w-28 rounded-sm sm:h-24 sm:w-36"
            monogram={false}
            label={post.category}
            sizes="144px"
          />
        </Link>
        <div className="min-w-0">
          <CategoryTag category={post.category} />
          <h3 className="mt-1 font-serif text-lg font-bold leading-snug">
            <Link href={href} className="headline-link">
              {post.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{post.dek}</p>
        </div>
      </article>
    );
  }

  // feature
  return (
    <article className="group flex flex-col">
      <Link href={href} className="block">
        <ArticleImage
          post={post}
          label={post.category}
          sizes="(max-width: 1024px) 100vw, 640px"
          className="aspect-[16/10] w-full rounded-sm"
        />
      </Link>
      <div className="mt-3">
        <CategoryTag category={post.category} />
        <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">
          <Link href={href} className="headline-link">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 leading-relaxed text-muted">{post.dek}</p>
        <Byline post={post} />
      </div>
    </article>
  );
}
