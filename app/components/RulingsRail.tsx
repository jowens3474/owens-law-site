import Link from "next/link";
import { courtShort, getLatestRulings } from "@/lib/rulings";
import { formatDate } from "@/lib/posts";

// Front-page rail module: the newest plain-language court ruling explainers.
// Renders nothing until a ruling is published. It carries its own top margin
// (the other rail modules sit in a margin wrapper on the page) so that, with
// no rulings, the page has no empty wrapper left behind.
export default function RulingsRail({ limit = 2 }: { limit?: number }) {
  const rulings = getLatestRulings(limit);
  if (rulings.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
        What the Courts Decided
      </h2>
      <p className="mt-2 font-sans text-xs text-muted">
        Court rulings, explained in plain words.
      </p>
      <ul className="divide-y divide-rule">
        {rulings.map((ruling) => (
          <li key={ruling.slug} className="py-3">
            <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-crimson">
              {courtShort(ruling.court)} · decided {formatDate(ruling.decided)}
            </p>
            <Link href={`/rulings/${ruling.slug}`} className="mt-1 block font-serif font-semibold leading-snug hover:text-crimson">
              {ruling.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/rulings"
        className="mt-3 inline-block font-sans text-xs font-bold uppercase tracking-wide text-crimson hover:text-crimson-bright"
      >
        More court rulings, explained →
      </Link>
    </section>
  );
}
