import Link from "next/link";
import { site } from "@/lib/site";
import { editionDate } from "@/lib/edition";
import EditionDate from "./EditionDate";

export default function Header() {
  return (
    <header className="bg-newsprint">
      {/* Utility bar */}
      <div className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 font-sans text-[0.7rem] font-medium uppercase tracking-wider text-muted">
          <EditionDate initial={editionDate()} />
          <span className="hidden sm:inline">{site.city}</span>
          <Link href="/about" className="hover:text-crimson">
            Got a tip?
          </Link>
        </div>
      </div>

      {/* Masthead. Not a heading: each page has its own h1, and a second one
          here would outrank it for screen readers and search engines. */}
      <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:py-10">
        <Link href="/" className="inline-block" aria-label={`${site.name} home`}>
          <span className="block font-serif text-5xl font-black leading-none tracking-tight text-ink sm:text-6xl md:text-7xl">
            {site.name}
          </span>
        </Link>
        <p className="mt-3 font-sans text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          {site.tagline}
        </p>
      </div>

      {/* Thin double rule under the masthead */}
      <div className="mx-auto max-w-6xl border-b-4 border-double border-ink px-4" />
    </header>
  );
}
