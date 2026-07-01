import { site } from "@/lib/site";

const subscribeSubject = "Subscribe to The Jackson Wire";
const subscribeBody = `Hi —

Please add me to The Jackson Wire's daily dispatch.

Name (optional):
Best email to receive the newsletter at:

Thanks!`;
const subscribeHref = `mailto:${site.email}?subject=${encodeURIComponent(
  subscribeSubject,
)}&body=${encodeURIComponent(subscribeBody)}`;

export default function NewsletterSignup({
  variant = "card",
}: {
  variant?: "card" | "strip" | "block";
} = {}) {
  if (variant === "strip") {
    // Slim strip for the top of pages
    return (
      <a
        href={subscribeHref}
        className="block border-y-2 border-ink bg-paper px-4 py-3 transition-colors hover:bg-newsprint"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
              Daily dispatch
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              Get The Jackson Wire in your inbox each morning. No spam, no
              sacred cows.
            </p>
          </div>
          <span className="font-serif text-sm font-bold uppercase tracking-wide text-crimson">
            Subscribe →
          </span>
        </div>
      </a>
    );
  }

  if (variant === "block") {
    // Full block for the end of articles
    return (
      <aside className="border-2 border-ink bg-paper p-6 text-center">
        <p className="font-serif text-xs font-bold uppercase tracking-widest text-crimson">
          The Morning Dispatch
        </p>
        <p className="mt-3 font-serif text-xl font-black leading-tight sm:text-2xl">
          Read this story? You&apos;ll want the next one too.
        </p>
        <p className="mt-2 text-sm text-muted">
          The Jackson Wire, in your inbox each morning. No spam, no sacred
          cows. Unsubscribe in one click.
        </p>
        <a
          href={subscribeHref}
          className="mt-4 inline-block bg-crimson px-6 py-3 text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson-dark"
        >
          Subscribe by email
        </a>
      </aside>
    );
  }

  // Sidebar card (default — used by Sidebar.tsx)
  return (
    <div className="border-2 border-ink bg-paper p-5">
      <h3 className="font-serif text-xl font-bold">The Morning Dispatch</h3>
      <p className="mt-1 text-sm text-muted">
        Our reporting in your inbox. No spam, no sacred cows.
      </p>
      <a
        href={subscribeHref}
        className="mt-3 inline-block w-full bg-crimson px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson-dark sm:w-auto sm:text-left"
      >
        Subscribe by email
      </a>
      <p className="mt-2 text-xs text-muted">
        Opens your email client.
      </p>
    </div>
  );
}
