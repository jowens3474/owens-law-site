"use client";

import { useState } from "react";
import type { BoilNotice } from "@/lib/boil-water-parse";
import { matchNotice, parseStreetQuery } from "@/lib/street-match";

// The notices in effect, with a box to find one street. Every notice is
// rendered on the server. Typing narrows the list only when something
// matches; a search that finds nothing leaves the whole list showing, so a
// reader is never left looking at an empty page that reads like an all-clear.
export default function BoilNoticeList({
  notices,
  dateLabels,
  phone,
}: {
  notices: BoilNotice[];
  // "Monday, Nov. 23, 2026" for each notice, formatted on the server.
  dateLabels: string[];
  phone: string;
}) {
  const [text, setText] = useState("");
  const typed = text.trim();
  const query = parseStreetQuery(typed);
  const searching = query.words.length > 0;

  const rows = notices.map((n, i) => ({
    n,
    key: `${i}-${n.title}`,
    label: dateLabels[i],
    match: searching ? matchNotice(query, n) : null,
  }));
  const matched = rows.filter((r) => r.match);
  const onAddress = matched.filter((r) => r.match === "address");
  // The street is listed, but at least one listing had no range to compare.
  const unsure = matched.some((r) => r.match === "street");
  const shown = searching && matched.length > 0 ? matched : rows;

  let status = "";
  if (searching) {
    if (matched.length === 0) {
      status = `No match for \u201c${typed}\u201d on JXN Water\u2019s list. That is not an all-clear: streets are abbreviated in different ways, and the list covers only the notices JXN Water has posted. Read the full list below, or call JXN Water at ${phone}.`;
    } else if (query.number === null) {
      status = `${matched.length === 1 ? "1 notice names" : `${matched.length} notices name`} a street matching \u201c${typed}\u201d.`;
    } else if (onAddress.length > 0) {
      status = `${onAddress.length === 1 ? "A notice lists" : `${onAddress.length} notices list`} a matching street with an address or range that includes ${query.number}. Check the street and the range below.`;
    } else if (unsure) {
      status = `A notice names that street. Check the addresses listed below, or call JXN Water at ${phone} to be sure.`;
    } else {
      status = `That street is on JXN Water\u2019s list, but the listed address range does not include ${query.number}. Check the range below, or call JXN Water at ${phone} to be sure.`;
    }
  }

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
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a street name or an address"
        autoComplete="off"
        className="mt-2 w-full max-w-md border border-rule bg-paper px-3 py-2 font-sans text-base focus:border-crimson focus:outline-none"
      />

      {status && (
        <p className="mt-3 max-w-3xl font-sans text-sm text-muted" role="status">
          {status}
        </p>
      )}

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {shown.map(({ n, key, label }) => (
          <li key={key} className="glow-card border border-rule p-5">
            <h3 className="font-serif text-xl font-black leading-tight">{n.place}</h3>
            {label && (
              <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wider text-crimson">
                Dated {label}
              </p>
            )}
            <ul className="mt-3 space-y-1 font-sans text-base">
              {n.areas.map((a, i) => (
                <li key={`${i}-${a.text}`}>{a.text}</li>
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
