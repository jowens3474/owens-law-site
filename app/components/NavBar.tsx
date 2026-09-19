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
    { name: "Pipeline", href: "/pipeline" },
    { name: "About", href: "/about" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-rule bg-newsprint"
      aria-label="Sections"
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* Desktop */}
        <ul className="hidden items-center justify-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`block border-b-2 px-3 py-2 -mb-px font-sans text-[0.8rem] font-semibold tracking-wide uppercase transition-colors hover:text-crimson ${
                  isActive(l.href)
                    ? "border-ink text-ink"
                    : "border-transparent text-ink"
                }`}
              >
                {l.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile */}
        <div className="flex items-center justify-between py-2 md:hidden">
          <span className="font-sans text-sm font-semibold uppercase tracking-wide">
            Sections
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="border border-ink px-3 py-1 font-sans text-sm font-semibold uppercase tracking-wide"
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
                  className={`block border-t border-rule py-2.5 font-sans text-sm font-semibold uppercase tracking-wide ${
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
