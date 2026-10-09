import Link from "next/link";
import { categories } from "@/lib/site";
import SearchForm from "./components/SearchForm";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
      <p className="font-serif text-7xl font-black text-ink">404</p>
      <h1 className="mt-4 font-serif text-3xl font-bold">
        This page didn&apos;t make the print run.
      </h1>
      <p className="mt-3 font-sans text-muted">
        The story you&apos;re looking for may have been moved, killed, or never
        existed. Try a search, or pick a section.
      </p>
      <div className="mt-8 w-full max-w-md text-left">
        <SearchForm id="nf-q" />
      </div>
      <nav
        aria-label="Browse by section"
        className="mt-6 flex flex-wrap justify-center gap-2"
      >
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="border border-rule px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider text-ink hover:border-ink hover:text-crimson"
          >
            {c.name}
          </Link>
        ))}
      </nav>
      <Link
        href="/"
        className="mt-8 bg-ink px-5 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson"
      >
        Back to the front page
      </Link>
    </div>
  );
}
