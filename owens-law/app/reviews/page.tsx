import type { Metadata } from "next";
import { reviews, site } from "@/lib/site";
import Stars from "../components/Stars";
import CtaBand from "../components/CtaBand";

export const metadata: Metadata = {
  title: "Client Reviews",
  description: `What clients say about working with ${site.name}.`,
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="font-serif text-4xl font-black sm:text-5xl">
            Client Reviews
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            We measure success by the people we help. Here’s what some of them
            have to say.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {reviews.map((r, i) => (
            <figure
              key={i}
              className="rounded-lg border border-rule bg-paper p-7 shadow-sm"
            >
              <Stars rating={r.rating} />
              <blockquote className="mt-3 text-lg italic leading-relaxed text-ink">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-4 font-bold text-navy">
                {r.name}
                <span className="font-normal text-muted"> — {r.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted">
          Testimonials are placeholders. Replace with real client reviews used
          with permission. Do not edit or fabricate client statements.
        </p>
      </section>

      <CtaBand />
    </>
  );
}
