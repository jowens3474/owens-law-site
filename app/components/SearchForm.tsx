// Plain GET form so search works without JavaScript and every query has a
// shareable URL (/search?q=...). It appears in the section menu, the archive,
// the 404 page, and the search page itself, so each placement passes its own
// `id` to keep labels unique.
export default function SearchForm({
  q = "",
  id = "site-q",
  compact = false,
  autoFocus = false,
}: {
  q?: string;
  id?: string;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={compact ? "flex gap-2" : "flex flex-col gap-2 sm:flex-row"}
    >
      <label htmlFor={id} className="sr-only">
        Search articles
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={q}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={
          compact
            ? "Search the Wire"
            : "Search every story: a street, a company, a dollar figure"
        }
        className="min-w-0 flex-1 border border-ink bg-paper px-3 py-2 font-sans text-base focus:outline-none focus:ring-2 focus:ring-crimson"
      />
      <button
        type="submit"
        className="border border-ink bg-ink px-4 py-2 font-sans text-sm font-bold uppercase tracking-wider text-paper hover:border-crimson hover:bg-crimson"
      >
        Search
      </button>
    </form>
  );
}
