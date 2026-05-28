"use client";

import Link from "next/link";
import { useState } from "react";
import { site, nav, primaryNav } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/95 backdrop-blur">
      {/* Top utility bar */}
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <span className="hidden sm:inline tracking-wide text-white/80">
            {site.stats.feePromise} · Free Consultation
          </span>
          <a
            href={site.phoneHref}
            className="ml-auto font-semibold tracking-wide hover:text-gold"
          >
            Call {site.phone}
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-serif text-2xl font-black tracking-tight text-navy sm:text-3xl">
            {site.name}
          </span>
          <span className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-muted">
            {site.tagline}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-ink transition-colors hover:text-gold-dark"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="rounded bg-gold px-4 py-2 text-sm font-bold uppercase tracking-wide text-navy-dark transition-colors hover:bg-gold-dark"
          >
            Free Case Review
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded border border-rule text-navy"
        >
          <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-rule bg-paper lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-rule py-3 text-sm font-semibold text-ink last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="my-3 rounded bg-gold px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-navy-dark"
            >
              Free Case Review
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
