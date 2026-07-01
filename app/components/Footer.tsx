import Link from "next/link";
import { categories, site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-rule bg-paper">
      <div className="h-px bg-gradient-to-r from-crimson/60 via-transparent to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="font-serif text-2xl font-black">{site.name}</p>
            <p className="mt-2 text-sm text-muted">{site.description}</p>
            <a
              href={`mailto:${site.email}`}
              className="mt-3 inline-block text-sm font-semibold text-crimson hover:text-crimson-bright"
            >
              {site.email}
            </a>
          </div>

          <nav aria-label="Footer sections">
            <p className="font-serif text-sm font-bold uppercase tracking-widest text-muted">
              Sections
            </p>
            <ul className="mt-3 space-y-1.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="text-sm hover:text-crimson"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about" className="text-sm hover:text-crimson">
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-rule pt-5 text-xs text-muted">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.city}. Independent
            and reader-supported.
          </p>
          <p className="mt-2">
            This site uses cookies and Google Analytics to measure traffic and
            understand how readers use {site.name}. We don&apos;t sell your
            data.
          </p>
        </div>
      </div>
    </footer>
  );
}
