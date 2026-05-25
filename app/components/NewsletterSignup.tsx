"use client";

import { useState } from "react";

// Front-end only. Wire this to an email provider (or a Route Handler) to
// actually capture addresses — right now it just confirms locally.
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="border-2 border-ink bg-paper p-5">
      <h3 className="font-serif text-xl font-bold">The Morning Dispatch</h3>
      <p className="mt-1 text-sm text-muted">
        Our reporting in your inbox. No spam, no sacred cows.
      </p>
      {done ? (
        <p className="mt-4 text-sm font-semibold text-crimson">
          You&apos;re on the list. Welcome aboard.
        </p>
      ) : (
        <form
          className="mt-4 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) setDone(true);
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="border border-rule bg-newsprint px-3 py-2 text-sm outline-none focus:border-crimson"
          />
          <button
            type="submit"
            className="bg-crimson px-3 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-crimson-dark"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
