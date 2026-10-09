import { norm, termPattern } from "@/lib/search-terms";

// Wraps every occurrence of the search terms in <mark>, matching the way
// lib/search.ts matched them: ignoring case, and treating a typed quote and
// the typographic one as the same character.
export default function Highlight({
  text,
  terms,
}: {
  text: string;
  terms: string[];
}) {
  if (terms.length === 0) return <>{text}</>;
  const wanted = new Set(terms.map(norm));
  const pattern = [...terms]
    .sort((a, b) => b.length - a.length)
    .map((t) =>
      termPattern(t)
        .replace(/'/g, "['‘’]")
        .replace(/"/g, '["“”]'),
    )
    .join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) =>
        wanted.has(norm(part)) ? (
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
