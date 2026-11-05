"use client";

import { useEffect, useState } from "react";
import { HEADLINES_NOTE, NO_JS_NOTE } from "@/lib/sports-note";

// Headlines from other outlets, loaded in the browser from the small hourly
// JSON at /api/sports/headlines so the pages themselves stay static. One
// shared promise means several instances on the hub make a single request.
interface Headline {
  title: string;
  link: string;
  outlet: string;
  sport?: string;
  date: string;
}
type Data = Record<string, Headline[]>;
type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: Headline[] };

// Resolves to null when the request fails. A failed request is forgotten so
// a later mount (another page view) tries again.
let shared: Promise<Data | null> | null = null;
function load(): Promise<Data | null> {
  if (!shared) {
    shared = fetch("/api/sports/headlines")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => (j && typeof j.sections === "object" && j.sections ? (j.sections as Data) : {}))
      .catch(() => {
        shared = null;
        return null;
      });
  }
  return shared;
}

const AP_MONTHS: Record<string, string> = {
  Jan: "Jan.",
  Feb: "Feb.",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "Aug.",
  Sep: "Sept.",
  Oct: "Oct.",
  Nov: "Nov.",
  Dec: "Dec.",
};
const dateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  month: "short",
  day: "numeric",
});
function apDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = dateParts.formatToParts(d);
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${AP_MONTHS[m] ?? m} ${day}`;
}

function safeLink(link: unknown): boolean {
  return typeof link === "string" && /^https?:/i.test(link);
}

// `pageNotes={false}` leaves the attribution line and the no-JavaScript line
// to the page, so the hub, which shows five lists, prints each once.
export default function SportsHeadlines({
  section,
  limit,
  pageNotes = true,
}: {
  section: string;
  limit: number;
  pageNotes?: boolean;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let live = true;
    load().then((data) => {
      if (!live) return;
      if (data === null) {
        setState({ status: "error" });
        return;
      }
      const list = Array.isArray(data[section]) ? data[section] : [];
      setState({
        status: "ready",
        items: list.filter((h) => h && h.title && safeLink(h.link)).slice(0, limit),
      });
    });
    return () => {
      live = false;
    };
  }, [section, limit]);

  if (state.status === "loading") {
    return (
      <div aria-busy="true" className="mt-1">
        <span className="sr-only">Loading headlines</span>
        {/* Each placeholder is about the height of a real row: a two-line
            title plus the outlet line on phones, a one-line title on wider
            screens. That keeps the list from jumping when headlines arrive. */}
        <ul aria-hidden="true" className="divide-y divide-rule">
          {Array.from({ length: limit }, (_, i) => (
            <li key={i} className="h-[5.9rem] py-3 sm:h-[4.35rem]">
              <div className="h-4 w-4/5 rounded bg-rule/60" />
              <div className="mt-2 h-3 w-1/3 rounded bg-rule/40" />
            </li>
          ))}
        </ul>
        {pageNotes && (
          <noscript>
            <p className="py-2 text-muted">{NO_JS_NOTE}</p>
          </noscript>
        )}
      </div>
    );
  }

  if (state.status === "error") {
    return <p className="py-4 text-muted">Headlines could not load. Try again later.</p>;
  }

  if (state.items.length === 0) {
    return <p className="py-4 text-muted">No headlines right now. Check back later.</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-rule">
        {state.items.map((h) => {
          const date = apDate(h.date);
          return (
            <li key={h.link} className="py-3">
              <a
                href={h.link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="headline-link font-serif text-lg font-bold leading-snug"
              >
                {h.title}
              </a>
              <p className="mt-1 font-sans text-[0.7rem] uppercase tracking-wider text-muted">
                {h.outlet}
                {h.sport ? ` · ${h.sport}` : ""}
                {date ? ` · ${date}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
      {pageNotes && <p className="mt-3 font-sans text-xs text-muted">{HEADLINES_NOTE}</p>}
    </div>
  );
}
