"use client";

import { useState, useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};
const hasWebShare = () =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";
const noWebShare = () => false;

const chip =
  "inline-flex min-h-9 items-center border border-rule px-3 font-sans text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink hover:text-crimson";

// Share row for the end of a story. The system share sheet appears where the
// browser offers one (most phones); copy, email, Facebook, and X work
// everywhere.
export default function ShareBar({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const canShare = useSyncExternalStore(subscribeNoop, hasWebShare, noWebShare);
  const enc = encodeURIComponent;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    window.setTimeout(() => setCopied("idle"), 2500);
  }

  async function share() {
    try {
      await navigator.share({ title, url });
    } catch {
      // The reader closed the sheet; nothing to do.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-sans text-xs font-bold uppercase tracking-widest text-muted">
        Share
      </span>
      {canShare && (
        <button type="button" onClick={share} className={chip}>
          Share this story
        </button>
      )}
      <button type="button" onClick={copy} className={chip} aria-live="polite">
        {copied === "done"
          ? "Link copied"
          : copied === "failed"
            ? "Copy failed"
            : "Copy link"}
      </button>
      <a
        href={`mailto:?subject=${enc(title)}&body=${enc(`${title}\n\n${url}`)}`}
        className={chip}
      >
        Email
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={chip}
      >
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={chip}
      >
        X
      </a>
    </div>
  );
}
