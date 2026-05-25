import { type TimelineEntry } from "@/lib/posts";

export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative mt-8 border-l-2 border-rule pl-7">
      {entries.map((entry, i) => (
        <li key={i} className="relative pb-7 last:pb-0">
          <span
            aria-hidden
            className="absolute -left-[2.05rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-crimson bg-paper"
          />
          <p className="font-serif text-sm font-black uppercase tracking-widest text-crimson">
            {entry.date}
          </p>
          <p className="mt-1.5 leading-relaxed">{entry.text}</p>
        </li>
      ))}
    </ol>
  );
}
