import { type TimelineSection } from "@/lib/posts";

export default function Timeline({ sections }: { sections: TimelineSection[] }) {
  return (
    <div className="mt-8 space-y-9">
      {sections.map((section, si) => (
        <section key={si}>
          <h2 className="mb-4 border-b-2 border-ink pb-1 font-serif text-xl font-black uppercase tracking-wide">
            {section.heading}
          </h2>
          <ol className="relative border-l-2 border-rule pl-7">
            {section.entries.map((entry, i) => (
              <li key={i} className="relative pb-6 last:pb-0">
                <span
                  aria-hidden
                  className={`absolute -left-[2.05rem] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                    entry.highlight
                      ? "border-crimson bg-crimson"
                      : "border-rule bg-paper"
                  }`}
                />
                <p
                  className={`font-serif text-sm font-black uppercase tracking-widest ${
                    entry.highlight ? "text-crimson" : "text-ink"
                  }`}
                >
                  {entry.date}
                </p>
                <p className="mt-1 leading-relaxed">{entry.text}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
