"use client";

import { useState } from "react";
import { site, practiceAreas } from "@/lib/site";

type Status = "idle" | "submitting" | "done" | "error";

// Attorney-to-attorney referral submission. Posts to /api/leads with
// type "referral" so the firm can triage co-counsel/referral opportunities.
export default function ReferralForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "referral", ...data }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Submission failed.");
      setStatus("done");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-lg border border-rule bg-surface p-8 text-center">
        <p className="font-serif text-2xl font-black text-navy">
          Referral received.
        </p>
        <p className="mt-2 text-muted">
          Thank you. We&apos;ll review the matter and follow up with you
          promptly to discuss the referral arrangement. For anything urgent,
          call{" "}
          <a href={site.phoneHref} className="font-bold text-gold-dark">
            {site.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form
      className="grid gap-4 rounded-lg border border-rule bg-surface p-6 sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required />
        <Field label="Firm / practice" name="firm" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="MS Bar number" name="barNumber" />
        <Field label="Your phone" name="phone" type="tel" required />
      </div>
      <Field label="Your email" name="email" type="email" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Injured client (name)" name="clientName" />
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-ink">Case type</span>
          <select
            name="caseType"
            defaultValue=""
            className="rounded border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
          >
            <option value="" disabled>
              Select…
            </option>
            {practiceAreas.map((p) => (
              <option key={p.slug} value={p.name}>
                {p.name}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-ink">
          Tell us about the case <span className="text-gold-dark">*</span>
        </span>
        <textarea
          name="details"
          required
          rows={5}
          placeholder="What happened, the injuries involved, status of any insurance claim, and any deadlines (e.g. statute of limitations) we should know about."
          className="rounded border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </label>

      {status === "error" && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{" "}
          <a href={site.phoneHref} className="font-bold underline">
            Call {site.phone}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded bg-gold px-6 py-3 font-bold uppercase tracking-wide text-navy-dark transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Refer This Case"}
      </button>
      <p className="text-xs text-muted">
        Referral fees are shared in accordance with Mississippi Rule of
        Professional Conduct 1.5(e). Submitting this form does not by itself
        create a referral agreement or an attorney-client relationship.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-ink">
        {label} {required && <span className="text-gold-dark">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className="rounded border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </label>
  );
}
