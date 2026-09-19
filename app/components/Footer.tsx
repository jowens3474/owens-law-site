import Link from "next/link";
import { categories, site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-double border-ink bg-newsprint">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="font-serif text-2xl font-bold">{site.name}</p>
            <p className="mt-2 font-sans text-sm text-muted">
              {site.description}
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-3 inline-block font-sans text-sm font-semibold text-crimson hover:text-crimson-bright"
            >
              {site.email}
            </a>
          </div>

          <nav aria-label="Footer sections">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
              Sections
            </p>
            <ul className="mt-3 space-y-1.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="font-sans text-sm hover:text-crimson"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/pipeline"
                  className="font-sans text-sm hover:text-crimson"
                >
                  The Pipeline
                </Link>
              </li>
              <li>
                <Link
                  href="/data-centers"
                  className="font-sans text-sm hover:text-crimson"
                >
                  Data Centers
                </Link>
              </li>
              <li>
                <Link
                  href="/explainers"
                  className="font-sans text-sm hover:text-crimson"
                >
                  Explainers
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="font-sans text-sm hover:text-crimson"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/corruption-case"
                  className="font-sans text-sm hover:text-crimson"
                >
                  Corruption Case Archive
                </Link>
              </li>
              <li>
                <Link
                  href="/corrections"
                  className="font-sans text-sm hover:text-crimson"
                >
                  Corrections
                </Link>
              </li>
              <li>
                <Link
                  href="/methodology"
                  className="font-sans text-sm hover:text-crimson"
                >
                  Methodology
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-rule pt-5 font-sans text-xs text-muted">
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
