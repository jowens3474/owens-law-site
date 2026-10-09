// Plain GET form so search works without JavaScript and every query has a
// shareable URL (/meetings/search?q=...).
export default function MeetingSearchForm({ q = "", body = "" }: { q?: string; body?: string }) {
  return (
    <form action="/meetings/search" method="get" role="search" className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="meeting-q" className="sr-only">
        Search meeting transcripts
      </label>
      <input
        id="meeting-q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Search everything said: a street, a company, a dollar figure"
        className="min-w-0 flex-1 border border-ink bg-paper px-3 py-2 font-sans text-base focus:outline-hidden focus:ring-2 focus:ring-crimson"
      />
      {body && <input type="hidden" name="body" value={body} />}
      <button
        type="submit"
        className="border border-ink bg-ink px-5 py-2 font-sans text-sm font-bold uppercase tracking-wider text-paper hover:bg-crimson hover:border-crimson"
      >
        Search
      </button>
    </form>
  );
}
