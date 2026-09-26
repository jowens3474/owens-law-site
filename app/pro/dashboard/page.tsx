import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { pro } from "@/lib/pro";
import { verifyToken, PRO_COOKIE } from "@/lib/pro-session";
import {
  getUpcomingMilestones,
  getRecentMilestones,
  getProjectsByStage,
  formatMilestoneDate,
  STAGE_LABEL,
} from "@/lib/pipeline";
import { getPostBySlug } from "@/lib/posts";
import { getRecentAwards, getRecentDockets, getJacksonAgendas, getJacksonNotices, getFuelPrices } from "@/lib/pro-live";
import ProLogin from "@/app/components/ProLogin";

export const metadata: Metadata = {
  title: `${pro.name} desk`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
      {children}
    </h2>
  );
}

function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default async function ProDashboardPage({
  searchParams,
}: PageProps<"/pro/dashboard">) {
  const jar = await cookies();
  const session = verifyToken(jar.get(PRO_COOKIE)?.value, "session");
  const params = await searchParams;
  const login = typeof params.login === "string" ? params.login : undefined;
  const billing = typeof params.billing === "string" ? params.billing : undefined;

  if (!session) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <ProLogin
          notice={login === "expired" ? "That link expired or was already used. Request a new one." : undefined}
        />
        <p className="mt-6 text-center font-sans text-sm text-muted">
          Not a member?{" "}
          <Link href="/pro" className="font-semibold text-crimson hover:text-crimson-bright">
            About {pro.name}
          </Link>
        </p>
      </div>
    );
  }

  const [awards, dockets, agendas, notices, fuel] = await Promise.all([
    getRecentAwards(),
    getRecentDockets(),
    getJacksonAgendas(),
    getJacksonNotices(),
    getFuelPrices(),
  ]);
  const upcoming = getUpcomingMilestones();
  const recent = getRecentMilestones(8);
  const groups = getProjectsByStage();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-double border-ink pb-5">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">{pro.name}</p>
          <h1 className="mt-1 font-serif text-3xl font-black sm:text-4xl">The desk</h1>
          <p className="mt-1 font-sans text-sm text-muted">
            Signed in as {session.email}. Feeds refresh every 30 minutes.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <form action="/api/pro/portal" method="post">
            <button type="submit" className="font-sans text-xs font-bold uppercase tracking-wide text-muted hover:text-crimson">
              Manage billing
            </button>
          </form>
          <form action="/api/pro/logout" method="post">
            <button type="submit" className="font-sans text-xs font-bold uppercase tracking-wide text-muted hover:text-crimson">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {billing && (
        <p className="mt-4 border border-rule bg-paper px-4 py-3 font-sans text-sm text-muted">
          {billing === "manual"
            ? "Your seat is billed outside Stripe. To change or cancel it, email pro@thejacksonwire.com and we will handle it the same day."
            : "We could not open the billing portal just now. Email pro@thejacksonwire.com and we will handle it the same day."}
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          <section>
            <H2>Council agendas and notices (jacksonms.gov)</H2>
            {agendas.length === 0 ? (
              <p className="font-sans text-sm text-muted">Feed unavailable right now.</p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule">
                {agendas.map((a) => (
                  <li key={a.link} className="py-2.5 font-sans text-sm">
                    <span className="mr-3 text-muted">{a.date}</span>
                    <a href={a.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-crimson">
                      {a.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <H2>Bids, RFPs, and zoning publication ads (jacksonms.gov)</H2>
            {notices.length === 0 ? (
              <p className="font-sans text-sm text-muted">Feed unavailable right now.</p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule">
                {notices.map((n) => (
                  <li key={n.link} className="py-2.5 font-sans text-sm">
                    <span className="mr-3 text-muted">{n.date}</span>
                    <span className="mr-2 inline-block bg-ink px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-newsprint">{n.kind}</span>
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-crimson">
                      {n.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <H2>Federal money landing in Hinds, Madison, and Rankin (last 14 days, USASpending)</H2>
            {awards.length === 0 ? (
              <p className="font-sans text-sm text-muted">Feed unavailable right now.</p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule">
                {awards.map((a) => (
                  <li key={`${a.id}-${a.county}`} className="py-3 font-sans text-sm">
                    <p>
                      <span className="font-bold">{money(a.amount)}</span> ·{" "}
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-crimson">
                          {a.recipient}
                        </a>
                      ) : (
                        a.recipient
                      )}{" "}
                      · {a.agency} ·{" "}
                      <span className="text-muted">{a.county} County, start {a.start}</span>
                    </p>
                    <p className="mt-0.5 text-muted">{a.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <H2>New federal cases naming local governments and companies (S.D. Miss., last 7 days)</H2>
            {dockets.length === 0 ? (
              <p className="font-sans text-sm text-muted">Nothing new on the watchlist, or the feed is unavailable.</p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule">
                {dockets.map((d) => (
                  <li key={d.url || d.number} className="py-2.5 font-sans text-sm">
                    <span className="mr-3 text-muted">{d.filed}</span>
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-crimson">
                        {d.caseName}
                      </a>
                    ) : (
                      <span className="font-semibold">{d.caseName}</span>
                    )}
                    <span className="ml-2 text-muted">{d.number}{d.nature ? ` · ${d.nature}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <H2>Projects, by stage</H2>
            <div className="space-y-8">
              {groups.map((g) => (
                <div key={g.stage}>
                  <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-crimson">{STAGE_LABEL[g.stage]}</h3>
                  <ul className="mt-2 divide-y divide-rule border-y border-rule">
                    {g.projects.map((p) => (
                      <li key={p.name} className="py-3">
                        <p className="font-serif text-lg font-bold leading-tight">{p.name}</p>
                        <p className="mt-1 font-sans text-sm text-muted">{p.status}</p>
                        {p.next && <p className="mt-1 font-sans text-sm font-semibold">Next: {p.next}</p>}
                        <p className="mt-1 font-sans text-xs">
                          {p.slugs.map((s) => {
                            const post = getPostBySlug(s);
                            return post ? (
                              <Link key={s} href={`/article/${s}`} className="mr-3 font-semibold text-crimson hover:text-crimson-bright">
                                {post.title}
                              </Link>
                            ) : null;
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-10 lg:col-span-4 lg:border-l lg:border-rule lg:pl-6">
          <section>
            <H2>Every date on the calendar</H2>
            <ol className="divide-y divide-rule">
              {upcoming.map((m) => (
                <li key={`${m.date}-${m.text}`} className="py-3">
                  <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-crimson">
                    <time dateTime={m.date}>{formatMilestoneDate(m)}</time>
                  </p>
                  <p className="mt-1 font-sans text-sm leading-snug">
                    {m.slug ? (
                      <Link href={`/article/${m.slug}`} className="headline-link">{m.text}</Link>
                    ) : (
                      m.text
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <H2>Recently decided</H2>
            <ol className="divide-y divide-rule">
              {recent.map((m) => (
                <li key={`${m.date}-${m.text}`} className="py-2.5">
                  <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-muted">
                    <time dateTime={m.date}>{formatMilestoneDate(m)}</time>
                  </p>
                  <p className="mt-1 font-sans text-sm leading-snug text-muted">{m.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <H2>Fuel (AAA, $/gal)</H2>
            {fuel.mississippi.length === 0 ? (
              <p className="font-sans text-sm text-muted">Feed unavailable right now.</p>
            ) : (
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="text-left text-[0.68rem] uppercase tracking-widest text-muted">
                    <th className="py-1 font-bold">Mississippi</th>
                    <th className="py-1 font-bold">Today</th>
                    <th className="py-1 font-bold">Week ago</th>
                    <th className="py-1 font-bold">Year ago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {fuel.mississippi.map((r) => (
                    <tr key={r.grade}>
                      <td className="py-1.5 font-semibold">{r.grade}</td>
                      <td className="py-1.5">{r.today}</td>
                      <td className="py-1.5 text-muted">{r.weekAgo}</td>
                      <td className="py-1.5 text-muted">{r.yearAgo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {fuel.us.length > 0 && (
              <p className="mt-2 font-sans text-xs text-muted">
                U.S. diesel today {fuel.us.find((r) => r.grade === "Diesel")?.today ?? "n/a"}.
              </p>
            )}
          </section>

          <section>
            <H2>Trackers</H2>
            <ul className="space-y-2 font-sans text-sm">
              <li>
                <Link href="/economy/sales-tax" className="font-semibold text-crimson hover:text-crimson-bright">Sales Tax Tracker</Link>
                <span className="text-muted"> · monthly diversions, Jackson vs the suburbs</span>
              </li>
              <li>
                <Link href="/pipeline" className="font-semibold text-crimson hover:text-crimson-bright">The Pipeline</Link>
                <span className="text-muted"> · projects and decision dates</span>
              </li>
            </ul>
          </section>

          <section className="border border-rule bg-paper p-5">
            <h2 className="font-serif text-lg font-bold">Ask the desk</h2>
            <p className="mt-2 font-sans text-sm text-muted">
              A question about a project, a filing, or a number? Reply to any briefing, or write to pro@thejacksonwire.com.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
