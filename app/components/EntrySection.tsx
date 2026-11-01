// One headed run of paragraphs on an explainer page, shared by the law pages
// (/laws/<slug>) and the ruling pages (/rulings/<slug>). It renders nothing
// when there are no paragraphs, so an optional section such as "What it means
// for Jackson" simply disappears.
export default function EntrySection({
  id,
  heading,
  paragraphs,
}: {
  id: string;
  heading: string;
  paragraphs?: string[];
}) {
  if (!paragraphs || paragraphs.length === 0) return null;
  return (
    <section id={id} className="mt-9 scroll-mt-16">
      <h2 className="border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
        {heading}
      </h2>
      <div className="prose-plain mt-4">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
