import type { Metadata } from "next";
import { results, site } from "@/lib/site";
import CtaBand from "../components/CtaBand";

export const metadata: Metadata = {
  title: "Case Results",
  description: `Verdicts and settlements ${site.name} has recovered for injured Mississippians.`,
  alternates: { canonical: "/results" },
};

export default function ResultsPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="font-serif text-4xl font-black sm:text-5xl">
            Case Results
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            A sample of recoveries we’ve won for our clients. Every case is
            different — these results don’t guarantee a similar outcome in yours.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r, i) => (
            <div
              key={i}
              className="rounded-lg border border-rule bg-paper p-7 shadow-sm"
            >
              <p className="font-serif text-4xl font-black text-navy">
                {r.amount}
              </p>
              <p className="mt-1 text-sm font-bold uppercase tracking-wide text-gold-dark">
                {r.type}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{r.blurb}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">
          The results listed above are illustrative placeholders. Before launch,
          replace them with real, verifiable verdicts and settlements. Under
          Mississippi Bar advertising rules, results must be truthful, not
          misleading, and accompanied by a disclaimer that past results do not
          guarantee a similar outcome.
        </p>
      </section>

      <CtaBand heading="Find out what your case is worth" />
    </>
  );
}
