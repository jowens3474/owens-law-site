import type { Metadata } from "next";
import { site } from "@/lib/site";
import IntakeForm from "../components/IntakeForm";

export const metadata: Metadata = {
  title: "Free Case Review",
  description: `Contact ${site.name} for a free, confidential consultation. No fee unless we win.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="font-serif text-4xl font-black sm:text-5xl">
            Get a Free Case Review
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Tell us what happened. We’ll review your situation at no cost and
            with no obligation — and there’s no fee unless we win.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-navy">
            Talk to us now
          </h2>
          <p className="mt-3 text-muted">
            Prefer to call? We’re ready to listen.
          </p>

          <a
            href={site.phoneHref}
            className="mt-6 inline-block rounded bg-gold px-6 py-4 text-lg font-bold uppercase tracking-wide text-navy-dark transition-colors hover:bg-gold-dark"
          >
            Call {site.phone}
          </a>

          <dl className="mt-8 space-y-5 text-sm">
            <div>
              <dt className="font-bold uppercase tracking-wide text-gold-dark">
                Email
              </dt>
              <dd className="mt-1">
                <a href={`mailto:${site.email}`} className="text-ink hover:text-gold-dark">
                  {site.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-gold-dark">
                Office
              </dt>
              <dd className="mt-1 not-italic text-ink">
                {site.address.street}
                <br />
                {site.address.city}, {site.address.state} {site.address.zip}
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-gold-dark">
                Our promise
              </dt>
              <dd className="mt-1 text-ink">{site.stats.feePromise}.</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold text-navy">
            Or send a message
          </h2>
          <p className="mt-3 text-muted">
            Fill this out and we’ll get right back to you.
          </p>
          <div className="mt-6">
            <IntakeForm />
          </div>
        </div>
      </section>
    </>
  );
}
