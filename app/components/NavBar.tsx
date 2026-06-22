"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/lib/site";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: "Home", href: "/" },
    ...categories.map((c) => ({ name: c.name, href: `/category/${c.slug}` })),
    { name: "The Trial", href: "/corruption-case", featured: true as const },
    { name: "Explainers", href: "/explainers" },
    { name: "About", href: "/about" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="border-b border-rule bg-paper" aria-label="Sections">
      <div className="mx-auto max-w-6xl px-4">
        {/* Desktop */}
        <ul className="hidden items-center justify-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`block px-3 py-2 text-sm transition-colors hover:text-crimson ${"featured" in l && l.featured ? "font-semibold uppercase tracking-wide" : "font-medium"} ${
                  isActive(l.href) ? "text-crimson" : "text-ink"
                }`}
              >
                {"featured" in l && l.featured && (
                  <span
                    aria-hidden
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-crimson align-middle"
                  />
                )}
                {l.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile */}
        <div className="flex items-center justify-between py-2 md:hidden">
          <span className="text-sm font-semibold uppercase tracking-wide">
            Sections
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="rounded border border-ink/30 px-3 py-1 text-sm font-semibold uppercase tracking-wide"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
        {open && (
          <ul id="mobile-menu" className="pb-3 md:hidden">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block border-t border-rule py-2.5 text-sm font-semibold uppercase tracking-wide ${
                    isActive(l.href) ? "text-crimson" : "text-ink"
                  }`}
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
