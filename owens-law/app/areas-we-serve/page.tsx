import type { Metadata } from "next";
import Link from "next/link";
import { citiesByRegion } from "@/lib/locations";
import { site } from "@/lib/site";
import CtaBand from "../components/CtaBand";

export const metadata: Metadata = {
  title: "Areas We Serve — Mississippi",
  description: `${site.name} represents injured people across Mississippi — from the Jackson metro to the Gulf Coast. Find your city.`,
  alternates: { canonical: "/areas-we-serve" },
};

export default function AreasWeServePage() {
  const groups = citiesByRegion();

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="font-serif text-4xl font-black sm:text-5xl">
            Areas We Serve
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            We represent injured Mississippians statewide. Choose your city to
            see how {site.shortName} can help — or call {site.phone} from
            anywhere in Mississippi.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 sm:grid-cols-2">
          {Object.entries(groups).map(([region, list]) => (
            <div key={region}>
              <h2 className="border-b-2 border-gold pb-2 font-serif text-xl font-bold text-navy">
                {region}
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {list.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/areas-we-serve/${c.slug}`}
                      className="text-sm font-semibold text-ink hover:text-gold-dark"
                    >
                      {c.name}, MS
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
