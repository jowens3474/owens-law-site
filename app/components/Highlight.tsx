// Wraps every occurrence of the search terms in <mark>, ignoring case and
// treating a typed apostrophe and the typographic one as the same character.
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

export default function Highlight({
  text,
  terms,
}: {
  text: string;
  terms: string[];
}) {
  if (terms.length === 0) return <>{text}</>;
  const wanted = new Set(terms.map(fold));
  const pattern = [...terms]
    .sort((a, b) => b.length - a.length)
    .map((t) =>
      t
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/'/g, "['’]")
        .replace(/"/g, '["“”]'),
    )
    .join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) =>
        wanted.has(fold(part)) ? (
          <mark key={i} className="bg-crimson/15 text-ink">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
