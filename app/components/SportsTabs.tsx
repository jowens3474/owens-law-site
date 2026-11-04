import Link from "next/link";
import { SPORTS_SECTIONS } from "@/lib/sports";

const chip =
  "inline-block border px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-colors";
const chipOff = `${chip} border-rule text-ink hover:border-ink hover:text-crimson`;
const chipOn = `${chip} border-ink bg-ink text-newsprint`;

// The tab strip shared by the sports hub and section pages. `current` is the
// slug of the section being shown, or undefined on the hub.
export default function SportsTabs({ current }: { current?: string }) {
  return (
    <nav aria-label="Sports sections" className="mt-4 flex flex-wrap gap-2">
      {SPORTS_SECTIONS.map((s) => (
        <Link
          key={s.slug}
          href={`/sports/${s.slug}`}
          aria-current={current === s.slug ? "page" : undefined}
          className={current === s.slug ? chipOn : chipOff}
        >
          {s.name}
        </Link>
      ))}
    </nav>
  );
}
