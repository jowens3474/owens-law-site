import Link from "next/link";
import { site } from "@/lib/site";
import NavBar from "./NavBar";

export default function Header() {
  const edition = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-newsprint">
      {/* Top gradient bar */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-crimson to-transparent" />

      {/* Utility bar */}
      <div className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-[0.7rem] uppercase tracking-widest text-muted [font-family:var(--font-mono)]">
          <span>{edition}</span>
          <span className="hidden sm:inline">{site.city}</span>
          <Link href="/about" className="hover:text-crimson">
            Got a tip?
          </Link>
        </div>
      </div>

      {/* Masthead */}
      <div className="mx-auto max-w-6xl border-b border-rule px-4 py-8 text-center sm:py-10">
        <Link href="/" className="inline-block">
          <h1 className="font-serif text-6xl font-black leading-none tracking-tight text-ink [text-shadow:0_0_40px_rgba(34,211,238,0.25)] sm:text-7xl md:text-8xl">
            {site.name}
          </h1>
        </Link>
        <p className="mt-3 font-serif text-sm tracking-wide text-muted uppercase sm:text-base">
          {site.tagline}
        </p>
      </div>

      <NavBar />
    </header>
  );
}
