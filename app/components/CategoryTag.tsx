import Link from "next/link";
import { slugifyCategory } from "@/lib/posts";

export default function CategoryTag({
  category,
  className = "",
}: {
  category: string;
  className?: string;
}) {
  return (
    <Link
      href={`/category/${slugifyCategory(category)}`}
      className={`inline-block font-sans text-[0.72rem] font-bold uppercase tracking-wider text-crimson hover:text-crimson-bright ${className}`}
    >
      {category}
    </Link>
  );
}
