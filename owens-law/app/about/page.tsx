import type { Metadata } from "next";
import { site } from "@/lib/site";
import CtaBand from "../components/CtaBand";

export const metadata: Metadata = {
  title: `About ${site.attorney}`,
  description: `Meet ${site.attorney} of ${site.name} — Mississippi personal injury attorney fighting for the seriously injured.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h1 className="font-serif text-4xl font-black sm:text-5xl">
            About {site.name}
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            A Mississippi injury firm built on one idea: people who get hurt
            shouldn’t have to fight the insurance company alone.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-14">
        {/* PLACEHOLDER bio — replace with the attorney's real background, bar
            admissions, education, and a professional photo. */}
        <h2 className="font-serif text-2xl font-bold text-navy">
          {site.attorney}
        </h2>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gold-dark">
          Founding Attorney
        </p>
        <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink">
          <p>
            {site.attorney} founded {site.name} to give injured Mississippians
            the kind of representation insurance companies respect. After a wreck,
            most people are up against a billion-dollar insurer and an adjuster
            whose job is to pay them as little as possible. Our job is to even the
            fight.
          </p>
          <p>
            We handle car, truck, and motorcycle wrecks, wrongful-death claims,
            and catastrophic injuries throughout the state. We keep our caseload
            focused so every client gets real attention — you’ll know your
            lawyer, and you’ll get straight answers.
          </p>
          <p>
            <strong>The promise is simple:</strong> a free, no-pressure
            consultation, and no attorney fee unless we recover money for you.
          </p>
        </div>

        <div className="mt-10 rounded-lg border border-rule bg-surface p-6 text-sm text-muted">
          <p className="font-semibold text-ink">Placeholder content</p>
          <p className="mt-1">
            Replace this section with {site.attorney}’s real biography: law
            school, year admitted to the Mississippi Bar, notable cases or
            recognitions, community involvement, and a professional headshot
            (add the image to <code>/public</code> and reference it here).
          </p>
        </div>
      </article>

      <CtaBand heading={`Talk to ${site.attorney} today`} />
    </>
  );
}
