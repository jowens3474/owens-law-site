import type { Metadata } from "next";
import Link from "next/link";
import {
  getPostsByTag,
  getPostBySlug,
  formatDate,
  readingTime,
} from "@/lib/posts";
import {
  getProjectsByStage,
  getUpcomingMilestones,
  getRecentMilestones,
  formatMilestoneDate,
  STAGE_LABEL,
  PROJECTS,
} from "@/lib/pipeline";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import CategoryTag from "@/app/components/CategoryTag";

export const revalidate = 600;

const DEK =
  "Every development project, bond, rate case, and ballot question the Wire is tracking in metro Jackson, with the dates that will decide them. Read this to see what is coming before it is announced.";

export const metadata: Metadata = {
  title: "The Pipeline",
  description: DEK,
  alternates: { canonical: "/pipeline" },
  openGraph: {
    type: "website",
    title: `The Pipeline — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/pipeline"),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `The Pipeline — ${site.name}`,
    description: DEK,
  },
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink">
      {children}
    </h2>
  );
}

const KIND_LABEL: Record<string, string> = {
  vote: "Vote",
  deadline: "Deadline",
  election: "Election",
  opening: "Opening",
  rate: "Rates",
  fiscal: "Fiscal year",
};

export default function PipelinePage() {
  const upcoming = getUpcomingMilestones();
  const recent = getRecentMilestones(5);
  const groups = getProjectsByStage();
  const coverage = getPostsByTag("pipeline");
  const next = upcoming[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `The Pipeline — ${site.name}`,
    description: DEK,
    url: absoluteUrl("/pipeline"),
    isPartOf: { "@id": absoluteUrl("/#org") },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: PROJECTS.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        description: p.status,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b-4 border-double border-ink pb-6">
        <p className="font-sans text-xs font-bold uppercase tracking-wide text-crimson sm:tracking-[0.3em]">
          Development tracker
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black leading-tight sm:text-5xl">
          The Pipeline
        </h1>
        <p className="mt-3 max-w-3xl font-sans text-lg leading-relaxed text-muted">
          {DEK}
        </p>
      </header>

      <div className="mt-8 grid gap-6 border-b border-rule pb-8 sm:grid-cols-3">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
            Projects tracked
          </p>
          <p className="mt-1 font-serif text-3xl font-bold">{PROJECTS.length}</p>
        </div>
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
            Dates on the calendar
          </p>
          <p className="mt-1 font-serif text-3xl font-bold">{upcoming.length}</p>
        </div>
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
            Next decision
          </p>
          <p className="mt-1 font-serif text-xl font-bold leading-tight">
            {next ? formatMilestoneDate(next) : "Nothing scheduled"}
          </p>
          {next && (
            <p className="mt-1 font-sans text-sm text-muted">{next.text}</p>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <section>
            <SectionHeading>Projects, by stage</SectionHeading>
            <div className="space-y-10">
              {groups.map((g) => (
                <div key={g.stage}>
                  <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-crimson">
                    {STAGE_LABEL[g.stage]}
                  </h3>
                  <div className="mt-3 divide-y divide-rule border-y border-rule">
                    {g.projects.map((p) => (
                      <article key={p.name} className="py-5">
                        <h4 className="font-serif text-xl font-bold leading-tight">
                          {p.name}
                        </h4>
                        <dl className="mt-2 grid gap-x-6 gap-y-1 font-sans text-sm sm:grid-cols-[110px_1fr]">
                          <dt className="text-muted">Developer</dt>
                          <dd>{p.developer}</dd>
                          <dt className="text-muted">Where</dt>
                          <dd>{p.location}</dd>
                          {p.investment && (
                            <>
                              <dt className="text-muted">Money</dt>
                              <dd>{p.investment}</dd>
                            </>
                          )}
                          <dt className="text-muted">Status</dt>
                          <dd>{p.status}</dd>
                          {p.next && (
                            <>
                              <dt className="text-muted">What&apos;s next</dt>
                              <dd className="font-semibold">{p.next}</dd>
                            </>
                          )}
                        </dl>
                        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs">
                          {p.slugs.map((slug) => {
                            const post = getPostBySlug(slug);
                            if (!post) return null;
                            return (
                              <li key={slug}>
                                <Link
                                  href={`/article/${slug}`}
                                  className="font-semibold text-crimson hover:text-crimson-bright"
                                >
                                  {post.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {coverage.length > 0 && (
            <section className="mt-14">
              <SectionHeading>Pipeline coverage</SectionHeading>
              <div className="divide-y divide-rule">
                {coverage.map((post) => (
                  <article key={post.slug} className="py-4">
                    <CategoryTag category={post.category} />
                    <h3 className="mt-1 font-serif text-xl font-bold leading-tight">
                      <Link
                        href={`/article/${post.slug}`}
                        className="headline-link"
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-1.5 font-sans text-sm leading-relaxed text-muted">
                      {post.dek}
                    </p>
                    <p className="mt-1.5 font-sans text-[0.7rem] uppercase tracking-wider text-muted">
                      {formatDate(post.date)} · {readingTime(post)} min read
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-6">
          <section>
            <SectionHeading>Coming up</SectionHeading>
            {upcoming.length === 0 ? (
              <p className="font-sans text-sm text-muted">
                Nothing scheduled. Check back after the next council meeting.
              </p>
            ) : (
              <ol className="divide-y divide-rule">
                {upcoming.map((m) => (
                  <li key={`${m.date}-${m.text}`} className="py-3">
                    <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-crimson">
                      <time dateTime={m.date}>{formatMilestoneDate(m)}</time>
                      <span className="text-muted"> · {KIND_LABEL[m.kind]}</span>
                    </p>
                    <p className="mt-1 font-sans text-sm leading-snug">
                      {m.slug ? (
                        <Link
                          href={`/article/${m.slug}`}
                          className="headline-link"
                        >
                          {m.text}
                        </Link>
                      ) : (
                        m.text
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {recent.length > 0 && (
            <section className="mt-10">
              <SectionHeading>Recently decided</SectionHeading>
              <ol className="divide-y divide-rule">
                {recent.map((m) => (
                  <li key={`${m.date}-${m.text}`} className="py-3">
                    <p className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-muted">
                      <time dateTime={m.date}>{formatMilestoneDate(m)}</time>
                    </p>
                    <p className="mt-1 font-sans text-sm leading-snug text-muted">
                      {m.slug ? (
                        <Link
                          href={`/article/${m.slug}`}
                          className="headline-link"
                        >
                          {m.text}
                        </Link>
                      ) : (
                        m.text
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="mt-10 border border-rule bg-paper p-5">
            <h2 className="font-serif text-lg font-bold">Know what&apos;s coming?</h2>
            <p className="mt-2 font-sans text-sm text-muted">
              A permit, a bond resolution, a site plan, a lease. Documents
              beat rumors. We protect sources.
            </p>
            <a
              href={`mailto:${site.email}?subject=Pipeline%20tip`}
              className="mt-3 inline-block bg-ink px-4 py-2 font-sans text-xs font-bold uppercase tracking-wide text-newsprint transition-colors hover:bg-crimson"
            >
              Send a document
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
