import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";

const DEK =
  "What the Wire collects when you read the site, subscribe, or write to us, and what we do with it.";

export const metadata: Metadata = {
  title: "Privacy",
  description: DEK,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    title: `Privacy | ${site.name}`,
    description: DEK,
    url: absoluteUrl("/privacy"),
    siteName: site.name,
  },
  twitter: {
    card: "summary",
    title: `Privacy | ${site.name}`,
    description: DEK,
  },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
        {title}
      </h2>
      <div className="space-y-4 font-sans text-base leading-relaxed text-ink">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="border-b border-rule pb-5">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Policies
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black sm:text-5xl">
          Privacy
        </h1>
        <p className="mt-3 font-sans text-lg text-muted">{DEK}</p>
      </header>

      <Section title="Reading the site">
        <p>
          We use Google Analytics, which sets cookies, to count visits and to
          see which stories people read and how they found them. Links we post
          on social media and in our emails carry tags that tell Analytics
          where a visit came from. Our host, Vercel, keeps standard server
          logs, such as IP addresses, to run and protect the site.
        </p>
      </Section>

      <Section title="The daily email">
        <p>
          If you sign up, we keep your email address with Resend, the service
          that sends our newsletter, and use it only to send you the
          Wire&apos;s emails. Every newsletter and briefing has an
          unsubscribe link.
        </p>
      </Section>

      <Section title="Pipeline Pro">
        <p>
          If you ask about or join Pipeline Pro, we keep the name, email,
          company, and role you give us, in Resend and in the Wire&apos;s
          email inbox. When Pro is paid by card, Stripe handles the payment,
          and we never see your card number. Signing in to the Pro desk sets a
          cookie that keeps you signed in.
        </p>
      </Section>

      <Section title="Tips and sources">
        <p>
          What happens to tips and documents you send is on our{" "}
          <Link
            href="/about"
            className="text-crimson underline hover:text-crimson-bright"
          >
            About page
          </Link>
          .
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          We don&apos;t sell your data. You can block or delete cookies in your
          browser settings. Pro sign-in needs its cookie to work.
        </p>
        <p>
          To come off our email lists, use the unsubscribe link in any
          newsletter or briefing, or write to{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-crimson underline hover:text-crimson-bright"
          >
            {site.email}
          </a>{" "}
          and we will remove your address. Unsubscribing does not cancel a paid
          Pipeline Pro plan; use Manage billing on the Pro desk, or write to us.
          Questions about this page go to the same address.
        </p>
      </Section>

      <p className="mt-12 font-sans text-xs text-muted">
        Last updated October 11, 2026.
      </p>
    </div>
  );
}
