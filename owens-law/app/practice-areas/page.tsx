import type { Metadata } from "next";
import Link from "next/link";
import { practiceAreas, site } from "@/lib/site";
import CtaBand from "../components/CtaBand";

export const metadata: Metadata = {
  title: "Practice Areas — Mississippi Personal Injury",
  description:
    "Car and truck accidents, motorcycle wrecks, wrongful death, catastrophic injury, and premises liability cases across Mississippi.",
  alternates: { canonical: "/practice-areas" },
};

export default function PracticeAreasPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="font-serif text-4xl font-black sm:text-5xl">
            Practice Areas
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            {site.shortName} represents people seriously hurt by someone else’s
            negligence. If your situation isn’t listed, call us anyway — the
            consultation is always free.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {practiceAreas.map((p) => (
            <Link
              key={p.slug}
              href={`/practice-areas/${p.slug}`}
              className="group rounded-lg border border-rule bg-paper p-7 transition-all hover:-translate-y-1 hover:border-gold hover:shadow-lg"
            >
              <h2 className="font-serif text-2xl font-bold text-navy group-hover:text-gold-dark">
                {p.name}
              </h2>
              <p className="mt-2 text-muted">{p.short}</p>
              <span className="mt-4 inline-block text-sm font-bold text-gold-dark">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
