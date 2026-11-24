"use client";

import { useState } from "react";
import type { BoilNotice } from "@/lib/boil-water-parse";

// The notices in effect, with a box to narrow them to one street. The list
// is rendered on the server with every notice showing; typing only hides the
// ones that do not match.
export default function BoilNoticeList({
  notices,
  issuedLabels,
  phone,
}: {
  notices: BoilNotice[];
  // "Monday, Nov. 23, 2026" for each notice, formatted on the server.
  issuedLabels: string[];
  phone: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = notices
    .map((n, i) => ({ n, label: issuedLabels[i] }))
    .filter(
      ({ n }) =>
        !q ||
        n.place.toLowerCase().includes(q) ||
        n.areas.some((a) => a.text.toLowerCase().includes(q)),
    );

  return (
    <div>
      <label
        htmlFor="street-filter"
        className="block font-sans text-xs font-bold uppercase tracking-widest text-muted"
      >
        Check a street
      </label>
      <input
        id="street-filter"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a street name, like Arbor Hills"
        autoComplete="off"
        className="mt-2 w-full max-w-md border border-rule bg-paper px-3 py-2 font-sans text-base focus:border-crimson focus:outline-none"
      />

      {q && (
        <p className="mt-3 font-sans text-sm text-muted" role="status">
          {shown.length === 0
            ? `No notice on JXN Water’s list names “${query.trim()}”. That is not an all-clear: the list covers only the notices JXN Water has posted. To be sure about your address, call JXN Water at ${phone}.`
            : `${shown.length} of ${notices.length} notice${notices.length === 1 ? "" : "s"} match “${query.trim()}”.`}
        </p>
      )}

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {shown.map(({ n, label }) => (
          <li key={n.title} className="glow-card border border-rule p-5">
            <h3 className="font-serif text-xl font-black leading-tight">{n.place}</h3>
            <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wider text-crimson">
              Dated {label}
            </p>
            <ul className="mt-3 space-y-1 font-sans text-base">
              {n.areas.map((a) => (
                <li key={a.text}>{a.text}</li>
              ))}
            </ul>
            {n.connections !== null && (
              <p className="mt-3 font-sans text-sm text-muted">
                About {n.connections.toLocaleString("en-US")} connection
                {n.connections === 1 ? "" : "s"} affected, JXN Water says.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
