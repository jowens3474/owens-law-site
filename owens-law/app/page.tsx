import Link from "next/link";
import {
  site,
  practiceAreas,
  results,
  reviews,
  serviceAreas,
} from "@/lib/site";
import CtaBand from "./components/CtaBand";
import Stars from "./components/Stars";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="max-w-2xl animate-rise">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-gold">
              {site.tagline}
            </p>
            <h1 className="mt-4 font-serif text-4xl font-black leading-[1.05] sm:text-6xl">
              {site.heroline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              {site.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={site.phoneHref}
                className="rounded bg-gold px-7 py-4 text-center font-bold uppercase tracking-wide text-navy-dark transition-colors hover:bg-gold-dark"
              >
                Call {site.phone}
              </a>
              <Link
                href="/contact"
                className="rounded border border-white/40 px-7 py-4 text-center font-bold uppercase tracking-wide text-white transition-colors hover:border-gold hover:text-gold"
              >
                Start a Free Case Review
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3">
          <Stat value={site.stats.yearsExperience} label="Years fighting for the injured" />
          <Stat value={site.stats.casesHandled} label="Mississippi cases handled" />
          <Stat value="$0" label="Up-front cost — no fee unless we win" />
        </div>
      </section>

      {/* Practice areas */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-black text-navy sm:text-4xl">
            How we help injured Mississippians
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            We focus on serious injury and wrongful-death cases — the situations
            where having the right lawyer changes the outcome.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {practiceAreas.map((p) => (
            <Link
              key={p.slug}
              href={`/practice-areas/${p.slug}`}
              className="group rounded-lg border border-rule bg-paper p-6 transition-all hover:-translate-y-1 hover:border-gold hover:shadow-lg"
            >
              <h3 className="font-serif text-xl font-bold text-navy group-hover:text-gold-dark">
                {p.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.short}</p>
              <span className="mt-4 inline-block text-sm font-bold text-gold-dark">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-serif text-3xl font-black text-navy sm:text-4xl">
            Why injured people choose {site.shortName}
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Why
              title="No fee unless we win"
              body="You owe us nothing up front and no attorney fee at all unless we recover money for you. The risk is ours, not yours."
            />
            <Why
              title="We take on the insurance companies"
              body="Adjusters are trained to pay you less. We handle every call, letter, and tactic so you can focus on getting better."
            />
            <Why
              title="Local, responsive, and trial-ready"
              body="We know Mississippi courts and juries — and insurers know we'll try the case if they won't pay fairly."
            />
          </div>
        </div>
      </section>

      {/* Results preview */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-3xl font-black text-navy sm:text-4xl">
            Results that matter
          </h2>
          <Link href="/results" className="text-sm font-bold text-gold-dark">
            See more →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {results.map((r, i) => (
            <div key={i} className="rounded-lg border border-rule bg-paper p-6">
              <p className="font-serif text-3xl font-black text-navy">{r.amount}</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-wide text-gold-dark">
                {r.type}
              </p>
              <p className="mt-3 text-sm text-muted">{r.blurb}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Past results do not guarantee a similar outcome. Each case is
          different and must be evaluated on its own facts.
        </p>
      </section>

      {/* Reviews preview */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-serif text-3xl font-black text-navy sm:text-4xl">
            What our clients say
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {reviews.map((r, i) => (
              <figure key={i} className="rounded-lg border border-rule bg-paper p-6">
                <Stars rating={r.rating} />
                <blockquote className="mt-3 text-sm italic leading-relaxed text-ink">
                  “{r.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm font-bold text-navy">
                  {r.name}
                  <span className="font-normal text-muted"> — {r.location}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Service areas */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-serif text-3xl font-black text-navy sm:text-4xl">
          Serving injury victims across Mississippi
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted">
          From the Gulf Coast to the Delta, we represent clients statewide.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {serviceAreas.map((a) => (
            <span
              key={a}
              className="rounded-full border border-rule bg-surface px-4 py-1.5 text-sm text-ink"
            >
              {a}
            </span>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-4xl font-black text-gold-dark">{value}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{label}</p>
    </div>
  );
}

function Why({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border-l-4 border-gold bg-paper p-6 shadow-sm">
      <h3 className="font-serif text-xl font-bold text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
