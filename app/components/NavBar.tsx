"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories, site } from "@/lib/site";
import SearchForm from "./SearchForm";

// Once the page has scrolled past roughly the masthead, the bar shows a small
// wordmark so readers always know where they are and have a way home.
const SCROLLED_AT = 160;

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const isScrolled = () => window.scrollY > SCROLLED_AT;
const notScrolled = () => false;

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Any navigation (a tapped link, a submitted search, the back button)
  // closes the menu: when the path changes, the open flag is reset during
  // render, which is React's pattern for state derived from a prop.
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }
  const toggleRef = useRef<HTMLButtonElement>(null);
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, notScrolled);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { name: "Home", href: "/" },
    ...categories.map((c) => ({ name: c.name, href: `/category/${c.slug}` })),
    { name: "Pipeline", href: "/pipeline" },
    { name: "Laws", href: "/laws" },
    { name: "Pro", href: "/pro" },
    { name: "About", href: "/about" },
  ];
  // The masthead and the scrolled wordmark already lead home, so the
  // desktop row skips "Home" to keep ten links fitting at xl.
  const desktopLinks = links.filter((l) => l.href !== "/");

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const wordmark =
    "whitespace-nowrap font-serif font-black leading-none tracking-tight text-ink";

  return (
    <nav
      className="sticky top-0 z-50 border-b border-rule bg-newsprint"
      aria-label="Sections"
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* Laptops and up: equal side slots keep the links centered. The
            left slot holds the wordmark once there is room for it (xl).
            The fit is tight: at xl the ten links need about 800px of the
            830px between the slots, so a new link or a longer label means
            revisiting the slot widths or the link padding. */}
        <div className="hidden items-center lg:flex">
          <div className="w-10 shrink-0 xl:w-36">
            <Link
              href="/"
              className={`hidden text-base transition-[opacity,visibility] xl:inline-block ${wordmark} ${
                scrolled ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              {site.name}
            </Link>
          </div>
          <ul className="flex min-w-0 flex-1 items-center justify-center">
            {desktopLinks.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`-mb-px block whitespace-nowrap border-b-2 px-2 py-2.5 font-sans text-[0.75rem] font-semibold uppercase tracking-wide text-ink transition-colors hover:text-crimson ${
                      active ? "border-ink" : "border-transparent"
                    }`}
                  >
                    {l.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex w-10 shrink-0 justify-end xl:w-36">
            <Link
              href="/search"
              className="flex items-center gap-1.5 p-2 text-ink hover:text-crimson"
              aria-label="Search the Wire"
            >
              <SearchIcon />
              <span className="hidden font-sans text-[0.75rem] font-semibold uppercase tracking-wide xl:inline">
                Search
              </span>
            </Link>
          </div>
        </div>

        {/* Phones and tablets */}
        <div className="flex items-center justify-between py-1 lg:hidden">
          {scrolled ? (
            <Link href="/" className={`inline-block py-2 text-lg ${wordmark}`}>
              {site.name}
            </Link>
          ) : (
            <span className="font-sans text-sm font-semibold uppercase tracking-wide">
              Sections
            </span>
          )}
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              className="flex h-10 w-10 items-center justify-center text-ink hover:text-crimson"
              aria-label="Search the Wire"
            >
              <SearchIcon />
            </Link>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="min-h-10 border border-ink px-3 font-sans text-sm font-semibold uppercase tracking-wide"
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
        {open && (
          <div
            id="mobile-menu"
            className="max-h-[80vh] overflow-y-auto pb-3 lg:hidden"
          >
            <div className="pb-3">
              <SearchForm id="menu-q" compact />
            </div>
            <ul>
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`block border-t border-rule py-3 font-sans text-sm font-semibold uppercase tracking-wide ${
                        active ? "text-crimson" : "text-ink"
                      }`}
                    >
                      {l.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
