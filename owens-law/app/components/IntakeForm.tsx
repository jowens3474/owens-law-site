"use client";

import { useState } from "react";
import { site } from "@/lib/site";

// FRONT-END ONLY for now. To actually capture leads, wire `handleSubmit` to a
// Route Handler (app/api/intake/route.ts) that emails the firm and/or writes
// to a CRM. Until then this confirms locally so the page is fully clickable.
export default function IntakeForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-lg border border-rule bg-surface p-8 text-center">
        <p className="font-serif text-2xl font-black text-navy">Thank you.</p>
        <p className="mt-2 text-muted">
          Your message has been received. For an immediate response, call us now
          at{" "}
          <a href={site.phoneHref} className="font-bold text-gold-dark">
            {site.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-rule bg-surface p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required />
        <Field label="Phone" name="phone" type="tel" required />
      </div>
      <Field label="Email" name="email" type="email" />
      <Field label="When did it happen?" name="date" type="date" />
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-ink">
          What happened? <span className="text-gold-dark">*</span>
        </span>
        <textarea
          name="details"
          required
          rows={5}
          placeholder="Tell us briefly about the wreck and your injuries."
          className="rounded border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </label>
      <button
        type="submit"
        className="mt-1 rounded bg-gold px-6 py-3 font-bold uppercase tracking-wide text-navy-dark transition-colors hover:bg-gold-dark"
      >
        Get My Free Case Review
      </button>
      <p className="text-xs text-muted">
        Submitting this form does not create an attorney-client relationship.
        Your information is kept confidential.
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
