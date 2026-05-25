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
      {/* Utility bar */}
      <div className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-[0.7rem] uppercase tracking-widest text-muted">
          <span>{edition}</span>
          <span className="hidden sm:inline">{site.city}</span>
          <Link href="/about" className="hover:text-crimson">
            Got a tip?
          </Link>
        </div>
      </div>

      {/* Masthead */}
      <div className="mx-auto max-w-6xl px-4 py-6 text-center">
        <Link href="/" className="inline-block">
          <h1 className="font-serif text-5xl font-black leading-none tracking-tight text-ink sm:text-6xl md:text-7xl">
            {site.name}
          </h1>
        </Link>
        <p className="mt-3 font-serif text-base italic text-muted sm:text-lg">
          {site.tagline}
        </p>
      </div>

      <NavBar />
    </header>
  );
}
