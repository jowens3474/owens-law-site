import Link from "next/link";
import { getUpcomingMilestones, formatMilestoneDate } from "@/lib/pipeline";

// Homepage rail module: the next few dated decisions from the Pipeline.
export default function ComingUp({ limit = 5 }: { limit?: number }) {
  const items = getUpcomingMilestones(limit);
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
        Coming up
      </h2>
      <ol className="divide-y divide-rule">
        {items.map((m) => (
          <li key={`${m.date}-${m.text}`} className="py-3">
            <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-crimson">
              <time dateTime={m.date}>{formatMilestoneDate(m)}</time>
            </p>
            <p className="mt-1 font-sans text-sm leading-snug">
              {m.slug ? (
                <Link href={`/article/${m.slug}`} className="headline-link">
                  {m.text}
                </Link>
              ) : (
                m.text
              )}
            </p>
          </li>
        ))}
      </ol>
      <Link
        href="/pipeline"
        className="mt-3 inline-block font-sans text-xs font-bold uppercase tracking-wide text-crimson hover:text-crimson-bright"
      >
        The full Pipeline →
      </Link>
    </section>
  );
}
