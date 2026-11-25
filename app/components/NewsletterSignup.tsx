"use client";

import { useState, type FormEvent } from "react";
import { sendGAEvent } from "@next/third-parties/google";

type Status = "idle" | "pending" | "success" | "error";

// Tells Google Analytics which sign-up box was used for a successful sign-up,
// so the Wire can see which placements work. The placement is part of the
// event name (for example newsletter_signup_article_middle) so the counts
// show in Analytics' Events report without any setup there. Analytics drops
// event names longer than 40 characters, so keep a placement name to 22
// characters or fewer. Only the
// placement is sent, never the email address. A repeat sign-up by an address
// already on the list is counted too. Does nothing when Analytics is not
// loaded on the page, and never throws: a counting failure must not turn a
// good sign-up into an error message.
function reportSignup(placement: string) {
  try {
    const w = window as unknown as { dataLayer?: unknown };
    if (!Array.isArray(w.dataLayer)) return;
    const suffix = placement.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    sendGAEvent("event", `newsletter_signup_${suffix}`, { placement });
  } catch {
    // Counting is best effort.
  }
}

function useSubscribe(successMessage: string, placement: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "pending") return;
    setStatus("pending");
    setMessage("Signing you up...");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setStatus("success");
        setMessage(successMessage);
        setEmail("");
        reportSignup(placement);
      } else {
        setStatus("error");
        setMessage(data?.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  return { status, message, email, setEmail, onSubmit };
}

export default function NewsletterSignup({
  variant = "card",
  heading,
  blurb,
  successMessage = "You're in. First brief lands tomorrow morning.",
  placement,
}: {
  variant?: "card" | "strip" | "block" | "inline";
  // Optional copy overrides for the "block" and "inline" variants.
  heading?: string;
  blurb?: string;
  successMessage?: string;
  // Where on the site this box sits; reported to Analytics on a sign-up.
  placement?: string;
} = {}) {
  const { status, message, email, setEmail, onSubmit } = useSubscribe(
    successMessage,
    placement ?? variant,
  );
  const pending = status === "pending";

  if (variant === "inline") {
    // Compact box for the middle of an article. It sits inside the
    // .prose-article container, whose CSS styles every <p> as body text and
    // gives a drop cap to a first <p>, so this variant uses no <p> elements.
    return (
      <aside
        aria-label="Newsletter sign-up"
        className="my-8 border-y border-rule py-5"
      >
        {/* Google honors data-nosnippet only on span, div and section, so the
            attribute sits on this wrapper, not on the aside. */}
        <div data-nosnippet>
        <div className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          The Morning Dispatch
        </div>
        <div className="mt-1 font-sans text-base font-semibold leading-snug text-ink">
          {heading ?? "Get Jackson news like this in your inbox each morning."}
        </div>
        <div className="mt-1 font-sans text-sm text-muted">
          {blurb ?? "Free. No spam. Unsubscribe in one click."}
        </div>
        <form
          onSubmit={onSubmit}
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            autoComplete="email"
            className="w-full min-w-0 border border-rule bg-newsprint px-3 py-2 font-sans text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none sm:max-w-xs sm:text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-block bg-ink px-5 py-2 font-sans text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson disabled:opacity-60"
          >
            {pending ? "Signing you up..." : "Subscribe by email"}
          </button>
        </form>
        <div aria-live="polite" className="mt-2 font-sans text-xs text-muted">
          {message}
        </div>
        </div>
      </aside>
    );
  }

  if (variant === "strip") {
    // Slim strip for the top of pages
    return (
      <div className="block border-y border-rule bg-paper px-4 py-3">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3"
        >
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              Daily dispatch
            </p>
            <p className="mt-0.5 font-sans text-sm font-semibold">
              Get The Jackson Wire in your inbox each morning. No spam, no
              sacred cows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              className="min-w-0 border border-rule bg-newsprint px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="font-sans text-sm font-bold uppercase tracking-wide text-ink hover:text-crimson disabled:opacity-60"
            >
              {pending ? "Signing you up..." : "Subscribe →"}
            </button>
          </div>
        </form>
        <p aria-live="polite" className="mt-2 font-sans text-xs text-muted">
          {message}
        </p>
      </div>
    );
  }

  if (variant === "block") {
    // Full block for the end of articles
    return (
      <aside className="glow-card border border-rule p-6 text-center">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          The Morning Dispatch
        </p>
        <p className="mt-3 font-serif text-xl font-bold leading-tight sm:text-2xl">
          {heading ?? <>Read this story? You&apos;ll want the next one too.</>}
        </p>
        <p className="mt-2 font-sans text-sm text-muted">
          {blurb ?? (
            <>
              The Jackson Wire, in your inbox each morning. No spam, no sacred
              cows. Unsubscribe in one click.
            </>
          )}
        </p>
        <form
          onSubmit={onSubmit}
          className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            className="w-full max-w-xs border border-rule bg-newsprint px-3 py-3 font-sans text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none sm:w-auto"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-block bg-ink px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson disabled:opacity-60"
          >
            {pending ? "Signing you up..." : "Subscribe by email"}
          </button>
        </form>
        <p aria-live="polite" className="mt-2 font-sans text-xs text-muted">
          {message}
        </p>
      </aside>
    );
  }

  // Sidebar card (default — used by Sidebar.tsx)
  return (
    <div className="glow-card border border-rule p-5">
      <h3 className="font-serif text-xl font-bold">The Morning Dispatch</h3>
      <p className="mt-1 font-sans text-sm text-muted">
        Our reporting in your inbox. No spam, no sacred cows.
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="w-full border border-rule bg-newsprint px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-block w-full bg-ink px-4 py-3 text-center font-sans text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson disabled:opacity-60 sm:w-auto sm:text-left"
        >
          {pending ? "Signing you up..." : "Subscribe by email"}
        </button>
      </form>
      <p aria-live="polite" className="mt-2 font-sans text-xs text-muted">
        {message}
      </p>
    </div>
  );
}
