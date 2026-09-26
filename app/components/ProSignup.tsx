"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "pending" | "success" | "error";

export default function ProSignup({
  stripeReady,
  mailto,
  foundingPrice,
  monthly,
  annual,
}: {
  stripeReady: boolean;
  mailto: string;
  foundingPrice: number;
  monthly: number;
  annual: number;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ email: "", name: "", company: "", role: "" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "pending") return;
    setStatus("pending");
    setMessage("Sending...");
    try {
      const res = await fetch("/api/pro/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setStatus("success");
        setMessage("Got it. We'll be in touch within one business day to set up your seat.");
        setForm({ email: "", name: "", company: "", role: "" });
      } else if (res.status === 503) {
        setStatus("error");
        setMessage(`Sign-up isn't wired yet. Email ${mailto} and we'll set you up by hand.`);
      } else {
        setStatus("error");
        setMessage(data?.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  const field =
    "w-full border border-rule bg-newsprint px-3 py-2.5 font-sans text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none";

  return (
    <div id="join" className="border border-ink bg-paper p-6 sm:p-8">
      {stripeReady && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <a
            href="/api/pro/checkout?plan=monthly"
            className="block border border-ink bg-newsprint p-5 hover:border-crimson"
          >
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Monthly</p>
            <p className="mt-1 font-serif text-3xl font-black">${monthly}<span className="font-sans text-sm font-normal text-muted"> / month</span></p>
            <p className="mt-3 font-sans text-sm font-bold uppercase tracking-wide text-crimson">Subscribe →</p>
          </a>
          <a
            href="/api/pro/checkout?plan=annual"
            className="block border border-ink bg-newsprint p-5 hover:border-crimson"
          >
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Annual, two months free</p>
            <p className="mt-1 font-serif text-3xl font-black">${annual}<span className="font-sans text-sm font-normal text-muted"> / year</span></p>
            <p className="mt-3 font-sans text-sm font-bold uppercase tracking-wide text-crimson">Subscribe →</p>
          </a>
        </div>
      )}

      <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
        Founding members
      </p>
      <h3 className="mt-1 font-serif text-2xl font-bold">
        ${foundingPrice} a month, locked for life
      </h3>
      <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
        The first 25 seats are founding memberships: ${foundingPrice} a month for as long as you
        stay, in exchange for telling us what the briefing should cover. Request a seat and we
        will set it up by hand.
      </p>
      <form onSubmit={onSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          required
          placeholder="Work email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={field}
          aria-label="Work email"
        />
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={field}
          aria-label="Name"
        />
        <input
          type="text"
          placeholder="Company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className={field}
          aria-label="Company"
        />
        <input
          type="text"
          placeholder="Role (developer, broker, lawyer...)"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className={field}
          aria-label="Role"
        />
        <button
          type="submit"
          disabled={status === "pending"}
          className="sm:col-span-2 bg-ink px-5 py-3 font-sans text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson disabled:opacity-60"
        >
          {status === "pending" ? "Sending..." : "Request a founding seat"}
        </button>
      </form>
      {message && (
        <p
          role="status"
          className={`mt-3 font-sans text-sm ${status === "error" ? "text-crimson" : "text-muted"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
