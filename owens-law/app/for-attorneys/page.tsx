import type { Metadata } from "next";
import { site, practiceAreas } from "@/lib/site";
import ReferralForm from "../components/ReferralForm";

export const metadata: Metadata = {
  title: "Refer a Case — For Attorneys",
  description: `Mississippi attorneys: refer your personal injury and wrongful-death cases to ${site.name}. We handle the litigation; you protect your client and share the fee under Rule 1.5(e).`,
  alternates: { canonical: "/for-attorneys" },
};

const steps = [
  {
    title: "Send us the case",
    body: "Use the form below or call. Give us the basics — what happened, the injuries, and any looming deadlines.",
  },
  {
    title: "Fast, honest evaluation",
    body: "We review promptly and tell you straight whether it's a fit. No runaround, no sitting on your client's matter.",
  },
  {
    title: "Written referral agreement",
    body: "We paper the arrangement consistent with Mississippi Rule 1.5(e) — your client consents in writing and the fee division is proper.",
  },
  {
    title: "You get paid when we win",
    body: "We front the costs and do the work. When we recover, your referral fee is paid out of the total fee. No recovery, no fee to anyone.",
  },
];

export default function ForAttorneysPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light" />
        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-gold">
            For Attorneys
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-black leading-[1.05] sm:text-5xl">
            Refer your injury cases. Keep your client. Share the fee.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            Don&apos;t handle personal injury, or don&apos;t have the bandwidth
            for a serious wreck or wrongful-death case? Refer it to{" "}
            {site.name}. We take on the litigation and expenses, keep you in the
            loop, and pay a referral fee in full compliance with the Mississippi
            Rules of Professional Conduct.
          </p>
          <a
            href="#refer"
            className="mt-8 inline-block rounded bg-gold px-7 py-4 font-bold uppercase tracking-wide text-navy-dark transition-colors hover:bg-gold-dark"
          >
            Refer a Case
          </a>
        </div>
      </section>

      {/* Why refer */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-serif text-3xl font-black text-navy sm:text-4xl">
          Why attorneys refer to {site.shortName}
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <Card
            title="We do the heavy lifting"
            body="Investigation, experts, negotiation, and trial if needed. We advance all case costs so you and your client carry no financial risk."
          />
          <Card
            title="You protect the relationship"
            body="Your client stays your client. You stay informed on the case and look good for having sent it to a firm that delivers."
          />
          <Card
            title="A fair, compliant fee"
            body="Referral fees are documented and divided consistent with Rule 1.5(e), with the client's written consent. Clean and straightforward."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-serif text-3xl font-black text-navy sm:text-4xl">
            How the referral works
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="rounded-lg border border-rule bg-paper p-6"
              >
                <span className="font-serif text-3xl font-black text-gold">
                  {i + 1}
                </span>
                <h3 className="mt-2 font-serif text-lg font-bold text-navy">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Cases we accept */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-serif text-3xl font-black text-navy sm:text-4xl">
          Cases we accept on referral
        </h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {practiceAreas.map((p) => (
            <span
              key={p.slug}
              className="rounded-full border border-rule bg-surface px-4 py-1.5 text-sm text-ink"
            >
              {p.name}
            </span>
          ))}
        </div>
        <p className="mt-4 text-muted">
          Not sure if it fits? Send it anyway — we&apos;ll give you a straight
          answer fast.
        </p>
      </section>

      {/* Referral form */}
      <section id="refer" className="bg-surface scroll-mt-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-black text-navy sm:text-4xl">
              Refer a case
            </h2>
            <p className="mt-3 text-muted">
              Send us the details and we&apos;ll be in touch quickly. Prefer to
              talk it through first?
            </p>
            <a
              href={site.phoneHref}
              className="mt-6 inline-block rounded bg-gold px-6 py-4 text-lg font-bold uppercase tracking-wide text-navy-dark transition-colors hover:bg-gold-dark"
            >
              Call {site.phone}
            </a>
            <p className="mt-6 max-w-md text-xs leading-relaxed text-muted">
              This page is intended for licensed attorneys. Any fee division is
              subject to a written agreement and the client&apos;s informed
              written consent under Mississippi Rule of Professional Conduct
              1.5(e). Nothing here is a guarantee of acceptance of any referral.
            </p>
          </div>
          <ReferralForm />
        </div>
      </section>
    </>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border-l-4 border-gold bg-paper p-6 shadow-sm">
      <h3 className="font-serif text-xl font-bold text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
