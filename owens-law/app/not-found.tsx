import Link from "next/link";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-28 text-center">
      <p className="font-serif text-sm font-bold uppercase tracking-widest text-gold-dark">
        404
      </p>
      <h1 className="mt-3 font-serif text-4xl font-black text-navy">
        Page not found
      </h1>
      <p className="mt-4 text-muted">
        The page you’re looking for isn’t here. If you were hurt and need help,
        we’re one call away.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={site.phoneHref}
          className="rounded bg-gold px-6 py-3 font-bold uppercase tracking-wide text-navy-dark hover:bg-gold-dark"
        >
          Call {site.phone}
        </a>
        <Link
          href="/"
          className="rounded border border-rule px-6 py-3 font-bold uppercase tracking-wide text-navy hover:border-gold"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
