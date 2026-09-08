"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "pending" | "success" | "error";

function useSubscribe() {
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
        setMessage("You're in. First brief lands tomorrow morning.");
        setEmail("");
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
}: {
  variant?: "card" | "strip" | "block";
} = {}) {
  const { status, message, email, setEmail, onSubmit } = useSubscribe();
  const pending = status === "pending";

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
          Read this story? You&apos;ll want the next one too.
        </p>
        <p className="mt-2 font-sans text-sm text-muted">
          The Jackson Wire, in your inbox each morning. No spam, no sacred
          cows. Unsubscribe in one click.
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
