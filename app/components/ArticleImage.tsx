import Image from "next/image";
import { type Post } from "@/lib/posts";
import Placeholder from "./Placeholder";

// Renders a post's real photo when one is set, otherwise the generated plate.
// Uses `fill`, so the wrapper sizing/aspect comes from `className`.
export default function ArticleImage({
  post,
  className = "",
  label,
  monogram = true,
  preload = false,
  sizes = "100vw",
}: {
  post: Post;
  className?: string;
  label?: string;
  monogram?: boolean;
  preload?: boolean;
  sizes?: string;
}) {
  if (!post.image) {
    return (
      <Placeholder
        seed={post.slug}
        label={label}
        className={className}
        monogram={monogram}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={post.image}
        alt={post.imageAlt ?? post.title}
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover"
      />
      {label && (
        <span className="absolute bottom-2 left-2 bg-black/45 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-widest text-white">
          {label}
        </span>
      )}
    </div>
  );
}
