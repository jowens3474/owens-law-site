import type { Faq } from "@/lib/site";

// Renders an accessible FAQ accordion (native <details>, no JS needed) and
// emits FAQPage structured data so the questions are eligible for Google's
// rich results / "People also ask".
export default function FaqSection({
  faqs,
  heading = "Frequently asked questions",
}: {
  faqs: Faq[];
  heading?: string;
}) {
  if (!faqs.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="mt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="font-serif text-2xl font-bold text-navy">{heading}</h2>
      <div className="mt-5 divide-y divide-rule rounded-lg border border-rule bg-surface">
        {faqs.map((f) => (
          <details key={f.q} className="group px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink">
              {f.q}
              <span className="text-gold-dark transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        This information is general and not legal advice. For advice about your
        specific situation, contact us for a free consultation.
      </p>
    </section>
  );
}
