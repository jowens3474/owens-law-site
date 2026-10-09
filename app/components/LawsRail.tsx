import Link from "next/link";
import { getLatestLaws, isInEffect } from "@/lib/laws";
import { formatDate } from "@/lib/posts";

// Front-page rail module: the newest plain-language law explainers.
export default function LawsRail({ limit = 3 }: { limit?: number }) {
  const laws = getLatestLaws(limit);
  if (laws.length === 0) return null;
  return (
    <section>
      <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
        What Passed
      </h2>
      <p className="mt-2 font-sans text-xs text-muted">
        New laws, explained in plain words.
      </p>
      <ul className="divide-y divide-rule">
        {laws.map((law) => (
          <li key={law.slug} className="py-3">
            <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-crimson">
              {law.bill} · {isInEffect(law) ? "in effect" : `starts ${formatDate(law.effective)}`}
            </p>
            <Link href={`/laws/${law.slug}`} className="mt-1 block font-serif font-semibold leading-snug hover:text-crimson">
              {law.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/laws"
        className="mt-3 inline-block font-sans text-xs font-bold uppercase tracking-wide text-crimson hover:text-crimson-bright"
      >
        More new laws, explained →
      </Link>
    </section>
  );
}
