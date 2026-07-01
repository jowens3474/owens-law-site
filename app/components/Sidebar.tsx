import Image from "next/image";
import Link from "next/link";
import { getMostRead } from "@/lib/posts";
import { categories, site } from "@/lib/site";
import NewsletterSignup from "./NewsletterSignup";

const orderSubject = "STOKES Hat order";
const orderBody = `Hi —

I'd like to order [quantity] STOKES hat(s).

Name:
Shipping address:

Thanks!`;
const orderHref = `mailto:${site.email}?subject=${encodeURIComponent(
  orderSubject,
)}&body=${encodeURIComponent(orderBody)}`;

export default function Sidebar() {
  const mostRead = getMostRead(5);

  return (
    <aside className="space-y-8">
      <NewsletterSignup />

      {mostRead.length > 0 && (
        <section>
          <h2 className="border-b-2 border-ink pb-1 font-serif text-lg font-bold uppercase tracking-wide">
            Most Read
          </h2>
          <ol className="mt-3 space-y-4">
            {mostRead.map((post, i) => (
              <li key={post.slug} className="flex gap-3">
                <span className="font-serif text-2xl font-black leading-none text-crimson/70">
                  {i + 1}
                </span>
                <Link
                  href={`/article/${post.slug}`}
                  className="font-serif font-semibold leading-snug hover:text-crimson"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="border-b-2 border-ink pb-1 font-serif text-lg font-bold uppercase tracking-wide">
          Sections
        </h2>
        <ul className="mt-3 space-y-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/category/${c.slug}`}
                className="flex items-baseline justify-between text-sm font-semibold uppercase tracking-wide hover:text-crimson"
              >
                {c.name}
                <span aria-hidden className="text-muted">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-2 border-dashed border-crimson/40 bg-paper p-5">
        <h2 className="font-serif text-lg font-bold">Got a tip?</h2>
        <p className="mt-1 text-sm text-muted">
          Documents, leaks, or a story we&apos;re missing? We protect our
          sources.
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-3 inline-block text-sm font-bold uppercase tracking-wide text-crimson hover:text-crimson-dark"
        >
          {site.email}
        </a>
      </section>

      <section className="border-2 border-ink bg-paper p-5">
        <h2 className="border-b-2 border-ink pb-1 font-serif text-lg font-bold uppercase tracking-wide">
          Shop
        </h2>
        <Image
          src="/stokes-hat.png"
          alt="Black structured baseball cap with white embroidered STOKES lettering."
          width={800}
          height={600}
          className="mt-4 h-auto w-full"
        />
        <p className="mt-4 font-serif text-xl font-black">STOKES Hat</p>
        <p className="mt-1 text-sm text-muted">
          $25 · Black structured cap, white embroidery. One size, adjustable
          strap.
        </p>
        <p className="mt-2 text-xs text-muted">
          Flat $5 shipping (US only). All sales final.
        </p>
        <a
          href={orderHref}
          className="mt-4 inline-block bg-crimson px-4 py-3 text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson-dark"
        >
          Order by email →
        </a>
      </section>
    </aside>
  );
}
