import Link from "next/link";
import { site } from "@/lib/site";

export default function CtaBand({
  heading = "Hurt in a wreck? Let's talk — free.",
  sub = "No fee unless we win. Tell us what happened and we'll tell you where you stand.",
}: {
  heading?: string;
  sub?: string;
}) {
  return (
    <section className="bg-navy">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <h2 className="font-serif text-3xl font-black text-white">{heading}</h2>
          <p className="mt-2 max-w-xl text-white/75">{sub}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={site.phoneHref}
            className="rounded bg-gold px-6 py-3 text-center font-bold uppercase tracking-wide text-navy-dark transition-colors hover:bg-gold-dark"
          >
            Call {site.phone}
          </a>
          <Link
            href="/contact"
            className="rounded border border-white/40 px-6 py-3 text-center font-bold uppercase tracking-wide text-white transition-colors hover:border-gold hover:text-gold"
          >
            Free Case Review
          </Link>
        </div>
      </div>
    </section>
  );
}
