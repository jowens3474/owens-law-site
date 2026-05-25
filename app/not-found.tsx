import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <p className="font-serif text-7xl font-black text-crimson">404</p>
      <h1 className="mt-4 font-serif text-3xl font-bold">
        This page didn&apos;t make the print run.
      </h1>
      <p className="mt-3 text-muted">
        The story you&apos;re looking for may have been moved, killed, or never
        existed.
      </p>
      <Link
        href="/"
        className="mt-8 bg-crimson px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-crimson-dark"
      >
        Back to the front page
      </Link>
    </div>
  );
}
