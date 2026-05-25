import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.name} — ${site.tagline}`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="border-b-4 border-double border-ink pb-5">
        <h1 className="font-serif text-4xl font-black sm:text-5xl">
          About {site.name}
        </h1>
        <p className="mt-3 font-serif text-xl italic text-muted">
          {site.tagline}
        </p>
      </header>

      <div className="prose-article mt-8">
        <p>
          {site.name} is an independent newsroom covering government, courts,
          and money in and around {site.city}. We read the agendas nobody else
          reads, sit through the meetings that run past midnight, and file the
          public-records requests that make press officers sigh.
        </p>
        <p>
          We are reader-supported and beholden to no party, donor, or
          development authority. If a story makes a powerful person
          uncomfortable, that is usually a sign we are doing our job.
        </p>
        <p>
          Our promise is simple: show the documents, name the names, and let the
          record speak. When we get something wrong, we correct it
          prominently.
        </p>
      </div>

      <section className="mt-10 border-2 border-ink bg-paper p-6">
        <h2 className="font-serif text-2xl font-bold">Send us a tip</h2>
        <p className="mt-2 text-muted">
          Leaked documents, a meeting we should be at, or a number that does not
          add up? We protect our sources and read everything.
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-4 inline-block bg-crimson px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-crimson-dark"
        >
          {site.email}
        </a>
      </section>
    </div>
  );
}
