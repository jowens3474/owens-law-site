"use client";

import { useState, type FormEvent } from "react";

export default function ProLogin({ notice }: { notice?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [message, setMessage] = useState(notice ?? "");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "pending") return;
    setStatus("pending");
    setMessage("Sending your link...");
    try {
      const res = await fetch("/api/pro/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setStatus("sent");
        setMessage("If that address has an active membership, a sign-in link is on its way. It expires in 30 minutes.");
      } else {
        setStatus("error");
        setMessage(data?.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-md border border-ink bg-paper p-6">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">Members</p>
      <h2 className="mt-1 font-serif text-2xl font-bold">Sign in to the desk</h2>
      <p className="mt-2 font-sans text-sm text-muted">
        Enter the email on your membership. We send a one-time link; no password.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email"
          className="min-w-0 flex-1 border border-rule bg-newsprint px-3 py-2.5 font-sans text-sm focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "pending"}
          className="bg-ink px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-newsprint hover:bg-crimson disabled:opacity-60"
        >
          Send link
        </button>
      </form>
      {message && (
        <p role="status" className={`mt-3 font-sans text-sm ${status === "error" ? "text-crimson" : "text-muted"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
