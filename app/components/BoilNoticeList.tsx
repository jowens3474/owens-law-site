import type { BoilNotice } from "@/lib/boil-water-parse";

// The notices in effect, one card each, rendered on the server.
export default function BoilNoticeList({
  notices,
  dateLabels,
}: {
  notices: BoilNotice[];
  // "Monday, Nov. 23, 2026" for each notice, or "" when its date is unknown.
  dateLabels: string[];
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {notices.map((n, i) => (
        <li key={`${i}-${n.title}`} className="glow-card border border-rule p-5">
          <h3 className="font-serif text-xl font-black leading-tight">{n.place}</h3>
          {dateLabels[i] && (
            <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wider text-crimson">
              Dated {dateLabels[i]}
            </p>
          )}
          <ul className="mt-3 space-y-1 font-sans text-base">
            {n.areas.map((a, j) => (
              <li key={`${j}-${a.text}`}>{a.text}</li>
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
  );
}
