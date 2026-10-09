"use client";

import { useSyncExternalStore } from "react";

// A thin crimson line across the top of the page that fills as the reader
// moves through the story. Decorative only: it is hidden from assistive
// technology and never takes a click.
function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

const none = () => 0;

export default function ReadingProgress({ targetId }: { targetId: string }) {
  const pct = useSyncExternalStore(
    subscribe,
    () => {
      const el = document.getElementById(targetId);
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return 100;
      return Math.round(Math.min(100, Math.max(0, (-rect.top / total) * 100)));
    },
    none,
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-crimson"
      style={{ width: `${pct}%` }}
    />
  );
}
