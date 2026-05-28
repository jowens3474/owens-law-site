import Link from "next/link";
import { site, practiceAreas, serviceAreas, nav } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-20 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-xl font-black">{site.name}</p>
          <p className="mt-3 text-sm text-white/70">{site.description}</p>
          <a
            href={site.phoneHref}
            className="mt-4 inline-block text-lg font-bold text-gold hover:text-white"
          >
            {site.phone}
          </a>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-gold">
            Practice Areas
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {practiceAreas.map((p) => (
              <li key={p.slug}>
                <Link href={`/practice-areas/${p.slug}`} className="hover:text-gold">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-gold">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-gold">
            Serving Mississippi
          </p>
          <p className="mt-3 text-sm text-white/70">
            {serviceAreas.join(" · ")}
          </p>
          <address className="mt-4 not-italic text-sm text-white/70">
            {site.address.street}
            <br />
            {site.address.city}, {site.address.state} {site.address.zip}
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs leading-relaxed text-white/50">
          <p>
            © {site.founded} {site.name}. All rights reserved.
          </p>
          <p>
            This website is attorney advertising and does not constitute legal
            advice or create an attorney-client relationship. Past results do
            not guarantee a similar outcome. Free consultation; you pay no
            attorney fee unless we recover for you. Responsible attorney:{" "}
            {site.attorney}, {site.address.city}, {site.address.state}.
          </p>
        </div>
      </div>
    </footer>
  );
}
