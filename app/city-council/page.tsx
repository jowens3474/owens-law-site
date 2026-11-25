import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import { COUNCIL, upcomingMeetings } from "@/lib/jackson-council";
import { getCouncilPostings } from "@/lib/council-postings";
import { MEETINGS, formatMeetingDate } from "@/lib/meetings";
import { centralToday, formatDay, formatInstant } from "@/lib/central-time";
import MoreGuides from "@/app/components/MoreGuides";

// "Next meeting" depends on today's date and the city's postings change
// through the week, so refresh hourly; deploys rebuild it sooner.
export const revalidate = 3600;

const PATH = "/city-council";
const TITLE = "Jackson City Council: Members, Meetings and How to Speak";
const DEK =
  "Who represents each of Jackson’s seven wards, when the council meets next, where to find the agenda and the video, and how to sign up to speak.";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Jackson, Mississippi, City Council members by ward with phone and email, the meeting schedule, agendas, meeting video, the ward map and the rules for public comment.",
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    title: `${TITLE} | ${site.name}`,
    description: DEK,
    url: absoluteUrl(PATH),
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${site.name}`,
    description: DEK,
  },
};

const H2 =
  "mb-5 border-b border-ink pb-1 font-sans text-xs font-bold uppercase tracking-widest text-ink";
const LINK = "underline hover:text-crimson";

export default async function CityCouncilPage() {
  const today = centralToday();
  const upcoming = upcomingMeetings(today);
  const nextRegular = upcoming.find((m) => m.kind === "Regular meeting");
  const { postings, readAt } = await getCouncilPostings();
  const president = COUNCIL.members.find((m) => m.role);
  const archived = MEETINGS.filter((m) => m.body.startsWith("Jackson City Council")).slice(0, 5);
  const coverage = getAllPosts()
    .filter((p) => /\bcouncil/i.test(p.title) && !p.slug.startsWith("morning-brief"))
    .slice(0, 6);
  const where = `${COUNCIL.place.room}, ${COUNCIL.place.building}, ${COUNCIL.place.address}`;

  const facts = [
    {
      label: "Next regular meeting",
      value: nextRegular
        ? `${formatDay(nextRegular.date, { year: false })}, ${nextRegular.time}`
        : "See the city’s schedule",
    },
    { label: "Where", value: `${COUNCIL.place.room}, ${COUNCIL.place.building}` },
    { label: "President", value: president ? `${president.name}, Ward ${president.ward}` : "" },
    {
      label: "Sign up to speak",
      value: (
        <>
          Clerk of Council, <span className="whitespace-nowrap">{COUNCIL.clerk.phone}</span>
        </>
      ),
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DEK,
    url: absoluteUrl(PATH),
    dateModified: COUNCIL.checked,
    isPartOf: { "@id": absoluteUrl("/#org") },
    about: {
      "@type": "GovernmentOrganization",
      name: "Jackson City Council",
      url: COUNCIL.sources.members,
      address: COUNCIL.place.address,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-rule pb-8">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-crimson">
          Jackson Guide · City Hall
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black leading-[1.02] sm:text-6xl">
          Jackson City Council: Members, Meetings and How to Speak
        </h1>
        <p className="mt-4 max-w-3xl font-sans text-xl leading-relaxed text-muted">{DEK}</p>
      </header>

      {/* At a glance */}
      <section className="glow-card mt-8 border border-rule p-6">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
          At a glance
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                {f.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-bold">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Meetings */}
      <section className="mt-12 grid gap-10 md:grid-cols-2" id="meetings">
        <div>
          <h2 className={H2}>Upcoming Meetings</h2>
          {upcoming.length > 0 ? (
            <ol className="divide-y divide-rule border-y border-ink">
              {upcoming.map((m) => (
                <li key={`${m.date}-${m.kind}`} className="py-3">
                  <p className="font-serif text-lg font-bold leading-snug">
                    {formatDay(m.date)}, {m.time}
                  </p>
                  <p className="font-sans text-sm text-muted">{m.kind}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="font-sans text-base leading-relaxed">
              The dates on the city&rsquo;s 2026 schedule have passed, and the city had
              not posted a later schedule when the Wire last checked,{" "}
              {formatDay(COUNCIL.checked, { weekday: false })}. See the{" "}
              <a href={COUNCIL.sources.schedule} className={LINK}>
                city&rsquo;s meeting schedule
              </a>
              .
            </p>
          )}
          <div className="mt-4 space-y-3 font-sans text-base leading-relaxed">
            <p>
              Meetings are in the {where}. On the city&rsquo;s 2026 schedule, regular
              meetings generally fall on alternating Tuesdays, one at 10 a.m. and the next
              at 6 p.m.
              Council zoning hearings are generally the third Monday of the month at
              2:30 p.m.
            </p>
            <p>
              Meetings are sometimes canceled, recessed to another day or called specially.
              Check the city&rsquo;s{" "}
              <a href={COUNCIL.sources.agendas} className={LINK}>
                latest agendas and notices
              </a>{" "}
              before you go. The newest are listed on this page.
            </p>
          </div>
        </div>
        <div>
          <h2 className={H2}>Latest Agendas and Notices From the City</h2>
          {postings.length > 0 ? (
            <>
              <ol className="divide-y divide-rule border-y border-ink">
                {postings.map((p) => (
                  <li key={p.url} className="py-3">
                    <a
                      href={p.url}
                      className="font-serif text-base font-bold leading-snug hover:text-crimson"
                    >
                      {p.title}
                    </a>
                    <p className="font-sans text-xs uppercase tracking-wider text-muted">
                      Posted {formatInstant(p.posted)}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-3 font-sans text-sm text-muted">
                Titles are the city&rsquo;s
                {readAt ? `, read from its website at ${formatInstant(readAt)}` : ""}. This
                list is refreshed about hourly.{" "}
                <a href={COUNCIL.sources.agendas} className={LINK}>
                  All council agendas and minutes
                </a>
                .
              </p>
            </>
          ) : (
            <p className="font-sans text-base leading-relaxed">
              The Wire could not read the city&rsquo;s list just now. See{" "}
              <a href={COUNCIL.sources.agendas} className={LINK}>
                council agendas and minutes
              </a>{" "}
              on the city&rsquo;s website.
            </p>
          )}
        </div>
      </section>

      {/* Members */}
      <section className="mt-14" id="members">
        <h2 className={H2}>Council Members by Ward</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COUNCIL.members.map((m) => (
            <li key={m.ward} className="glow-card border border-rule p-5">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
                Ward {m.ward}
                {"role" in m && m.role ? ` · ${m.role}` : ""}
              </p>
              <h3 className="mt-1 font-serif text-xl font-black leading-tight">{m.name}</h3>
              <p className="mt-3 font-sans text-sm">
                <a
                  href={`tel:+1${m.phone.replace(/-/g, "")}`}
                  className={`whitespace-nowrap ${LINK}`}
                >
                  {m.phone}
                </a>
              </p>
              <p className="font-sans text-sm">
                <a href={`mailto:${m.email}`} className={`${LINK} break-all`}>
                  {m.email}
                </a>
              </p>
              <p className="mt-3 font-sans text-xs uppercase tracking-wider">
                <a href={m.cityPage} className="text-muted hover:text-crimson">
                  City page →
                </a>
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed">
          Not sure which ward you live in? The city posts an interactive{" "}
          <a href={COUNCIL.sources.wardMaps} className={LINK}>
            ward map
          </a>
          . The mayor is {COUNCIL.mayor}.
        </p>
      </section>

      {/* Speak / watch */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div id="speak">
          <h2 className={H2}>How to Speak at a Meeting</h2>
          <ol className="list-decimal space-y-2 pl-6 font-sans text-base leading-relaxed">
            <li>
              Call the Clerk of Council&rsquo;s office at{" "}
              <a
                href={`tel:${COUNCIL.clerk.tel}`}
                className={`whitespace-nowrap font-bold ${LINK}`}
              >
                {COUNCIL.clerk.phone}
              </a>{" "}
              by noon on the business day before the meeting.
            </li>
            <li>
              Give your name, phone number, email address, and the topic or agenda item you
              want to address.
            </li>
            <li>
              Speakers are taken first come, first served, and get up to three minutes
              unless a majority of the council votes to extend the time.
            </li>
            <li>
              Public comment comes before the council takes up ordinances, orders and
              resolutions.
            </li>
          </ol>
          <p className="mt-4 font-sans text-base leading-relaxed">
            The city&rsquo;s rules limit public comment to five instances at a regular or
            special meeting, in person or online. A federal lawsuit filed Aug. 11, 2026,
            challenges another part of the city&rsquo;s public-comment ordinance, its ban
            on &ldquo;personal, impertinent, or slanderous remarks.&rdquo; The Wire{" "}
            <Link href="/article/servis-sues-jackson-public-comment-rules" className={LINK}>
              covered the lawsuit
            </Link>
            .
          </p>
        </div>
        <div id="watch">
          <h2 className={H2}>Watch a Meeting or Search What Was Said</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              The city posts meeting video in its{" "}
              <a href={COUNCIL.sources.videos} className={LINK}>
                council video library
              </a>
              .
            </p>
            <p>
              The Wire keeps{" "}
              <Link href="/meetings" className={`font-bold ${LINK}`}>
                The Record
              </Link>
              , a searchable transcript archive of council meetings. Search it for a street,
              a contract or a dollar figure and jump to that moment in the video.
            </p>
          </div>
          {archived.length > 0 && (
            <ul className="mt-4 divide-y divide-rule border-y border-ink">
              {archived.map((m) => (
                <li key={m.id} className="py-3">
                  <Link
                    href={`/meetings/${m.id}`}
                    className="font-serif text-base font-bold leading-snug hover:text-crimson"
                  >
                    {m.body}, {formatMeetingDate(m.date)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-14">
        <h2 className={H2}>How the Council Works</h2>
        <div className="max-w-3xl space-y-4 font-sans text-base leading-relaxed">
          <p>
            Jackson has a mayor-council government. The mayor is full time and elected
            citywide. The seven council members are part time, and each is elected from
            one ward. The council is the city&rsquo;s legislative branch.
          </p>
          <p>
            The council chooses its own president and vice president at its first meeting
            in July, the city says. The president runs the meetings, and every member,
            the president included, can vote.
          </p>
        </div>
      </section>

      {/* Coverage */}
      {coverage.length > 0 && (
        <section className="mt-14">
          <h2 className={H2}>Latest Council Coverage From the Wire</h2>
          <ol className="divide-y divide-rule border-y border-ink">
            {coverage.map((p) => (
              <li key={p.slug} className="py-4">
                <Link
                  href={`/article/${p.slug}`}
                  className="grid grid-cols-[100px_1fr] gap-4 hover:text-crimson sm:grid-cols-[140px_1fr]"
                >
                  <span className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">
                    {formatDate(p.date)}
                  </span>
                  <span className="font-serif text-lg font-bold leading-snug">{p.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <MoreGuides current="/city-council" headingClassName={H2} />

      <p className="mt-12 max-w-3xl border-t border-rule pt-6 font-sans text-sm leading-relaxed text-muted">
        Reporting note: Members, phone numbers and email addresses are from the City of
        Jackson&rsquo;s{" "}
        <a href={COUNCIL.sources.members} className={LINK}>
          council pages
        </a>
        , last checked {formatDay(COUNCIL.checked, { weekday: false })}. The city&rsquo;s
        Ward 2 page lists two email addresses for Clay; this page uses the one at the top
        of that page, beside her phone number. Hartley is named as council president in
        the city&rsquo;s{" "}
        <a href={COUNCIL.sources.presidentNotice} className={LINK}>
          notice of a Nov. 10, 2026, special meeting
        </a>
        , which also names the mayor. The city&rsquo;s{" "}
        <a href={COUNCIL.sources.officers} className={LINK}>
          officers page
        </a>{" "}
        still listed Brian Grizzell as president when the Wire checked, so this page does
        not name a vice president. Regular meeting dates are from the city&rsquo;s{" "}
        <a href={COUNCIL.sources.schedule} className={LINK}>
          2026 meeting schedule
        </a>
        , and the zoning hearing from its{" "}
        <a href={COUNCIL.sources.zoningSchedule} className={LINK}>
          2026 zoning schedule
        </a>
        . The rules for speaking are from the city&rsquo;s{" "}
        <a href={COUNCIL.sources.publicComments} className={LINK}>
          public comments
        </a>{" "}
        page. The description of the council is from its{" "}
        <a href={COUNCIL.sources.members} className={LINK}>
          council members
        </a>{" "}
        and{" "}
        <a href={COUNCIL.sources.officers} className={LINK}>
          officers
        </a>{" "}
        pages. Canceled, recessed and special meetings are from the city&rsquo;s{" "}
        <a href={COUNCIL.sources.agendas} className={LINK}>
          posted agendas and notices
        </a>
        . The Wire did not ask the city to comment for this page. If the city&rsquo;s
        pages and this one differ, the city is right.
      </p>
    </div>
  );
}
