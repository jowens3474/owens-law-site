import Link from "next/link";
import { slugifyCategory } from "@/lib/posts";

const classes =
  "inline-block font-sans text-[0.72rem] font-bold uppercase tracking-wider text-crimson";

// `plain` renders the same label as a span instead of a link, for cards and
// rows that are themselves one big link: a link inside a link is invalid
// HTML and breaks hydration.
export default function CategoryTag({
  category,
  className = "",
  plain = false,
}: {
  category: string;
  className?: string;
  plain?: boolean;
}) {
  if (plain) {
    return <span className={`${classes} ${className}`}>{category}</span>;
  }
  return (
    <Link
      href={`/category/${slugifyCategory(category)}`}
      className={`${classes} hover:text-crimson-bright ${className}`}
    >
      {category}
    </Link>
  );
}
