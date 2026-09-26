import type { Metadata } from "next";
import Link from "next/link";
import { pro } from "@/lib/pro";

export const metadata: Metadata = {
  title: `Welcome to ${pro.name}`,
  robots: { index: false, follow: false },
};

export default function ProWelcomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">{pro.name}</p>
      <h1 className="mt-2 font-serif text-4xl font-black">You&apos;re in.</h1>
      <div className="prose-article mt-6">
        <p>
          The first briefing lands {pro.briefingDay} at 6 a.m. Central, and alerts start now. A
          welcome note with your sign-in details is on its way to the address you used at checkout.
        </p>
        <p>
          Your desk is at{" "}
          <Link href="/pro/dashboard" className="font-bold text-crimson hover:text-crimson-bright">
            /pro/dashboard
          </Link>
          . Sign in with your email and we send a one-time link.
        </p>
      </div>
    </div>
  );
}
