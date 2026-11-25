import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getPostBySlug, isBrief, formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import {
  JPS,
  SCHOOL_DATES,
  SCHOOL_TERMS,
  FIRST_DAY,
  LAST_DAY,
  isUnderWay,
  lastDayOf,
  upcomingBoardMeetings,
  upcomingSchoolDates,
  type SchoolDate,
} from "@/lib/jackson-schools";
import { centralToday, formatDay } from "@/lib/central-time";

// "Next on the calendar" and "next board meeting" depend on today's date, so
// refresh hourly; deploys rebuild it sooner.
export const revalidate = 3600;

const PATH = "/jackson-public-schools";
const TITLE = "Jackson Public Schools: Calendar, Board, Pay and Enrollment";
const DEK =
  "Key dates on the 2026-27 school calendar, who sits on the school board and when it meets, what the district has said about its next superintendent, the salary scales and how to enroll a child. Taken from the district’s own pages and state and federal data.";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Jackson Public Schools (JPS) 2026-27 calendar, school board members and meetings, the superintendent, teacher salary scale, enrollment steps and who to call.",
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

// The Wire's stories this page points to by name. Looked up by slug so a
// title is never copied here.
const DEPARTURE_STORY =
  "errick-greene-leaving-jackson-public-schools-probation-testing-scandal-closures";
const STAFFING_STORY = "jps-central-office-staffing-largest-in-mississippi-not-1861";

// "Monday, Nov. 23, to Friday, Nov. 27, 2026" for a break, or one day for a
// single date. `year: false` drops the year.
function formatSpan(d: SchoolDate, { year = true } = {}): string {
  const end = lastDayOf(d);
  if (end === d.start) return formatDay(d.start, { year });
  const crossesYear = d.start.slice(0, 4) !== end.slice(0, 4);
  return `${formatDay(d.start, { year: year && crossesYear })}, to ${formatDay(end, { year })}`;
}

export default function JacksonPublicSchoolsPage() {
  const today = centralToday();
  const upcoming = upcomingSchoolDates(today);
  const next = upcoming[0];
  const nextUnderWay = next ? isUnderWay(next, today) && lastDayOf(next) !== next.start : false;
  const meetings = upcomingBoardMeetings(today);
  const nextMeeting = meetings[0];
  const years = [...new Set(SCHOOL_DATES.map((d) => d.start.slice(0, 4)))];
  const programs = JPS.enrollment.specialPrograms;
  const departureStory = getPostBySlug(DEPARTURE_STORY);
  const staffingStory = getPostBySlug(STAFFING_STORY);
  const coverage = getAllPosts()
    .filter((p) => /\bJPS\b|Jackson Public Schools/i.test(`${p.title} ${p.dek}`))
    .filter((p) => !isBrief(p))
    // This page does not mention lawsuits involving the district.
    .filter((p) => !/lawsuit|\bsu(?:e|es|ed|it|ing)\b/i.test(p.title))
    .slice(0, 6);
  const boardWhere = `${JPS.board.room} at ${JPS.board.address}`;

  const facts = [
    {
      label: "Next on the calendar",
      value: next
        ? nextUnderWay
          ? `${next.name}, through ${formatDay(lastDayOf(next), { year: false })}`
          : `${next.name}, ${formatSpan(next, { year: false })}`
        : "See the district’s calendar",
    },
    {
      label: "Last day for students",
      value: LAST_DAY >= today ? formatDay(LAST_DAY) : "See the district’s calendar",
    },
    {
      label: "Next board meeting",
      value: nextMeeting
        ? `${formatDay(nextMeeting, { year: false })}, ${JPS.board.time}`
        : "See the district’s schedule",
    },
    {
      label: "District office",
      value: <span className="whitespace-nowrap">{JPS.office.phone}</span>,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DEK,
    url: absoluteUrl(PATH),
    dateModified: JPS.checked,
    isPartOf: { "@id": absoluteUrl("/#org") },
    about: {
      "@type": "EducationalOrganization",
      name: JPS.name,
      url: JPS.sources.home,
      address: JPS.office.address,
      telephone: JPS.office.tel,
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
          Jackson Guide · Schools
        </p>
        <h1 className="mt-3 font-serif text-5xl font-black leading-[1.02] sm:text-6xl">
          Jackson Public Schools: Calendar, Board, Pay and Enrollment
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

      {/* Calendar */}
      <section className="mt-12" id="calendar">
        <h2 className={H2}>The 2026-27 School Calendar</h2>
        <div className="grid gap-10 md:grid-cols-[3fr_2fr]">
          <div className="space-y-4 font-sans text-base leading-relaxed">
            {next ? (
              <h3 className="font-serif text-2xl font-black leading-tight">
                {nextUnderWay
                  ? `${next.name} runs through ${formatDay(lastDayOf(next))}`
                  : `Next: ${next.name}, ${formatSpan(next)}`}
              </h3>
            ) : (
              <p>
                The dates on the district’s 2026-27 calendar have passed, and this page
                does not yet have a later calendar. See the{" "}
                <a href={JPS.sources.calendar} className={LINK}>
                  district’s calendar page
                </a>
                .
              </p>
            )}
            <p>
              On the district’s calendar, the first day for students was{" "}
              {formatDay(FIRST_DAY)}, and the last is {formatDay(LAST_DAY)}. The calendar
              counts 180 student days and 190 teacher days. The district calls its students
              scholars, so its calendar lists the “Last Day for Scholars.”
            </p>
            <p>
              Term 2 ends {formatDay(SCHOOL_TERMS[1].ends)}, which the district’s printable
              calendar also marks as the end of the first semester. Winter break follows,
              and the calendar has students returning {formatDay(SCHOOL_TERMS[2].begins)}.
            </p>
            <p>
              <strong>Short days.</strong>{" "}
              The calendar marks some days as 80% or 60% days for students. The district’s{" "}
              <a href={JPS.sources.bellSchedules} className={LINK}>
                bell schedules
              </a>{" "}
              list these dismissal times:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="text-left text-[0.68rem] uppercase tracking-widest text-muted">
                    <th className="py-2 pr-3 font-bold">Dismissal</th>
                    <th className="py-2 pr-3 font-bold">Elementary</th>
                    <th className="py-2 pr-3 font-bold">Middle</th>
                    <th className="py-2 font-bold">High</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule border-y border-rule">
                  {JPS.dismissal.map((row) => (
                    <tr key={row.day}>
                      <td className="py-2 pr-3 font-semibold">{row.day}</td>
                      <td className="py-2 pr-3">{row.elementary}</td>
                      <td className="py-2 pr-3">{row.middle}</td>
                      <td className="py-2">{row.high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <strong>Dates can change.</strong>{" "}
              The district says it will delay the start of school when possible in bad
              weather, and that if more inclement weather days are needed, “adjustments to
              the calendar will be made.” Check the{" "}
              <a href={JPS.sources.calendar} className={LINK}>
                district’s calendar page
              </a>{" "}
              or its{" "}
              <a href={JPS.sources.calendarPdf} className={`font-bold ${LINK}`}>
                official 2026-27 calendar (PDF)
              </a>{" "}
              before you plan around a date.
            </p>
          </div>
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
              Coming up
            </p>
            {upcoming.length > 0 ? (
              <ol className="mt-3 divide-y divide-rule border-y border-ink">
                {upcoming.map((d) => (
                  <li key={`${d.start}-${d.name}`} className="py-3">
                    <p className="font-serif text-base font-bold leading-snug">{d.name}</p>
                    <p className="font-sans text-sm text-muted">
                      {formatSpan(d)}
                      {d.detail ? `. ${d.detail}.` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 font-sans text-base leading-relaxed">
                No later dates are on the 2026-27 calendar.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* All key dates */}
      <section className="mt-14" id="key-dates">
        <h2 className={H2}>All Key Dates for 2026-27</h2>
        <div className="grid gap-10 md:grid-cols-2">
          {years.map((y) => (
            <div key={y}>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
                {y}
              </p>
              <ol className="mt-3 divide-y divide-rule border-y border-ink">
                {SCHOOL_DATES.filter((d) => d.start.startsWith(y)).map((d) => (
                  <li
                    key={`${d.start}-${d.name}`}
                    className={`py-3 ${lastDayOf(d) < today ? "text-muted" : ""}`}
                  >
                    <p className="font-serif text-base font-bold leading-snug">{d.name}</p>
                    <p className="font-sans text-sm text-muted">
                      {formatSpan(d, { year: lastDayOf(d).slice(0, 4) !== y })}
                      {d.detail ? `. ${d.detail}.` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <h3 className="mt-10 font-sans text-xs font-bold uppercase tracking-widest text-muted">
          Terms and report cards
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="text-left text-[0.68rem] uppercase tracking-widest text-muted">
                <th className="py-2 pr-3 font-bold">Term</th>
                <th className="py-2 pr-3 font-bold">Begins</th>
                <th className="py-2 pr-3 font-bold">Midterm progress reports</th>
                <th className="py-2 pr-3 font-bold">Ends</th>
                <th className="py-2 font-bold">Report cards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule border-y border-rule">
              {SCHOOL_TERMS.map((t) => (
                <tr key={t.term}>
                  <td className="py-2 pr-3 font-semibold">{t.term}</td>
                  <td className="py-2 pr-3">{formatDay(t.begins, { weekday: false })}</td>
                  <td className="py-2 pr-3">{formatDay(t.midterm, { weekday: false })}</td>
                  <td className="py-2 pr-3">{formatDay(t.ends, { weekday: false })}</td>
                  <td className="py-2">{formatDay(t.reportCards, { weekday: false })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Board */}
      <section className="mt-14" id="board">
        <h2 className={H2}>The School Board</h2>
        <p className="mb-5 max-w-3xl font-sans text-base leading-relaxed">
          The district is governed by its Board of Trustees. Each member is appointed by the
          mayor and confirmed by the City Council to represent the schools in one of the
          city’s seven wards, the district says.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JPS.board.seats.map((s) => (
            <li key={s.ward} className="glow-card border border-rule p-5">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
                Ward {s.ward}
                {s.role ? ` · ${s.role}` : ""}
              </p>
              <h3 className="mt-1 font-serif text-xl font-black leading-tight">
                {s.name ?? "Vacant"}
              </h3>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed">
          The district’s{" "}
          <a href={JPS.sources.boardWards} className={LINK}>
            Board Members by City Wards
          </a>{" "}
          page listed the Ward 2 seat as vacant when the Wire checked. The board’s Nov. 17,
          2026, letter to the community lists Frank Figgers as secretary; the district’s{" "}
          <a href={JPS.sources.board} className={LINK}>
            School Board
          </a>{" "}
          page lists him as a member. To write to the board, use the{" "}
          <a href={JPS.sources.boardContact} className={LINK}>
            district’s contact form
          </a>
          .
        </p>
      </section>

      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div id="board-meetings">
          <h2 className={H2}>Board Meetings</h2>
          {meetings.length > 0 ? (
            <ol className="divide-y divide-rule border-y border-ink">
              {meetings.map((m) => (
                <li key={m} className="py-3">
                  <p className="font-serif text-lg font-bold leading-snug">
                    {formatDay(m)}, {JPS.board.time}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="font-sans text-base leading-relaxed">
              The dates on the board’s 2026-27 schedule have passed, and this page does not
              yet have a later schedule. See the{" "}
              <a href={JPS.sources.boardMeetings} className={LINK}>
                district’s board meetings page
              </a>
              .
            </p>
          )}
          <div className="mt-4 space-y-3 font-sans text-base leading-relaxed">
            <p>
              Regular meetings are twice a month, mostly on the first and third Tuesdays, at{" "}
              {JPS.board.time} in the {boardWhere}, the district says. The public may attend
              all regular and special meetings.
            </p>
            <p>
              The district says the schedule holds “unless otherwise noticed,” so check its{" "}
              <a href={JPS.sources.boardMeetings} className={LINK}>
                board meetings page
              </a>{" "}
              or the{" "}
              <a href={JPS.sources.boardSchedulePdf} className={LINK}>
                2026-27 meeting schedule (PDF)
              </a>{" "}
              before you go. For questions about a meeting, the district says to call the
              board’s secretary at{" "}
              <a
                href={`tel:${JPS.board.secretaryTel}`}
                className={`whitespace-nowrap font-bold ${LINK}`}
              >
                {JPS.board.secretaryPhone}
              </a>
              .
            </p>
          </div>
        </div>
        <div id="speak">
          <h2 className={H2}>Watch, Read the Agenda or Speak</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              <strong>Watch.</strong>{" "}
              The district links recordings of meetings from its{" "}
              <a href={JPS.sources.boardMeetings} className={LINK}>
                board meetings page
              </a>{" "}
              and keeps a{" "}
              <a href={JPS.sources.boardVideo} className={LINK}>
                playlist of board meetings
              </a>{" "}
              on its JPS ITV YouTube channel.
            </p>
            <p>
              <strong>Agendas.</strong>{" "}
              The district posts meeting agendas as PDFs on its{" "}
              <a href={JPS.sources.boardAgendas} className={LINK}>
                Board Agendas &amp; Minutes page
              </a>
              .
            </p>
            <p>
              <strong>Speak.</strong>{" "}
              The board’s{" "}
              <a href={JPS.sources.boardPolicy} className={LINK}>
                public participation procedures (PDF)
              </a>{" "}
              set these rules:
            </p>
          </div>
          <ol className="mt-3 list-decimal space-y-2 pl-6 font-sans text-base leading-relaxed">
            <li>Register with the board secretary, on the required form, before the meeting.</li>
            <li>
              Public participation time comes at the beginning of regular meetings. Speakers
              are recognized in the order they registered.
            </li>
            <li>Each speaker is limited to three minutes.</li>
            <li>
              Speakers may comment on school operations and programs. The board will not hear
              complaints about school personnel in public session.
            </li>
          </ol>
          <p className="mt-4 font-sans text-base leading-relaxed">
            To make a presentation as an agenda item, the procedures say to call the
            secretary to the board and give the superintendent a written statement six
            working days before the next regular meeting. The presentation is limited to five
            minutes, and the board president and the superintendent decide whether the item
            goes on the agenda.
          </p>
        </div>
      </section>

      {/* Superintendent and pay */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div id="superintendent">
          <h2 className={H2}>The Superintendent</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              {JPS.superintendent.name} was appointed superintendent in{" "}
              {JPS.superintendent.appointed}, the district says.
            </p>
            <p>
              At the school board’s {formatDay(JPS.superintendent.announced, { weekday: false })},
              meeting, Greene announced that he will not renew his contract beyond{" "}
              {formatDay(JPS.superintendent.contractEnds, { weekday: false })}, the district
              said in a{" "}
              <a href={JPS.sources.departure} className={LINK}>
                news post
              </a>{" "}
              that day.
            </p>
            <p>
              <strong>What comes next.</strong>{" "}
              The district’s post said the board “will begin thoughtfully considering the
              process for selecting the district’s next superintendent.” In a{" "}
              <a href={JPS.sources.boardLetter} className={LINK}>
                letter to the community
              </a>{" "}
              dated the same day, board members wrote that they “will work together over the
              next few months to consider thoughtfully the process and ultimate decision
              regarding future district leadership.”
            </p>
            <p>
              Neither document names an interim superintendent or gives a schedule for a
              search. The district’s{" "}
              <a href={JPS.sources.news} className={LINK}>
                news page
              </a>{" "}
              showed no later announcement about either when the Wire checked on{" "}
              {formatDay(JPS.checked, { weekday: false })}.
            </p>
            {departureStory && (
              <p>
                <Link href={`/article/${departureStory.slug}`} className={LINK}>
                  The Wire’s report on the announcement
                </Link>
                .
              </p>
            )}
            <p>
              To reach the superintendent’s office, use the{" "}
              <a href={JPS.sources.superintendentContact} className={LINK}>
                district’s contact form
              </a>{" "}
              or call the district office at{" "}
              <span className="whitespace-nowrap">{JPS.office.phone}</span>.
            </p>
          </div>
        </div>
        <div id="pay">
          <h2 className={H2}>Pay and Salary Scales</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              The Board of Trustees approves salary scales for all district employees, the
              district says. It posts them on its{" "}
              <a href={JPS.sources.salaryScales} className={`font-bold ${LINK}`}>
                Salary Scales page
              </a>
              . When the Wire checked, that page listed:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              {JPS.pay.posted.map((p) => (
                <li key={p.year}>
                  <strong>{p.year}:</strong> {p.scales}
                </li>
              ))}
            </ul>
            <p>
              <strong>Starting teacher pay.</strong>{" "}
              The district’s{" "}
              <a href={JPS.sources.teacherScalePdf} className={LINK}>
                teacher salary scale for fiscal year 2027 (PDF)
              </a>{" "}
              lists these amounts in its first row, marked 0 in the column labeled “YOE”:
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="text-left text-[0.68rem] uppercase tracking-widest text-muted">
                  <th className="py-2 pr-3 font-bold">Degree</th>
                  <th className="py-2 pr-3 text-right font-bold">State salary</th>
                  <th className="py-2 pr-3 text-right font-bold">Local supplement</th>
                  <th className="py-2 text-right font-bold">Annual salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule border-y border-rule">
                {JPS.pay.start.map((r) => (
                  <tr key={r.degree}>
                    <td className="py-2 pr-3">{r.degree}</td>
                    <td className="py-2 pr-3 text-right">{r.state}</td>
                    <td className="py-2 pr-3 text-right">{r.local}</td>
                    <td className="py-2 text-right font-semibold">{r.annual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-4 font-sans text-base leading-relaxed">
            <p>
              The scale is marked as approved by the board on{" "}
              {formatDay(JPS.pay.approved, { weekday: false })}.
            </p>
            <p>
              <strong>Recruitment incentives.</strong>{" "}
              The district says it offers qualified new hires an incentive paid over three
              years: $5,000 for teachers in critical need areas, $7,500 in hard-to-staff
              areas and $10,000 for career and technical educator positions. Its{" "}
              <a href={JPS.sources.incentives} className={LINK}>
                Salary, Benefits &amp; Incentives page
              </a>{" "}
              lists the subjects. For questions, the district says to call Talent Management
              &amp; Development, its human resources office, at{" "}
              <a
                href={`tel:${JPS.pay.hrTel}`}
                className={`whitespace-nowrap font-bold ${LINK}`}
              >
                {JPS.pay.hrPhone}
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="mt-14" id="numbers">
        <h2 className={H2}>The District in Numbers</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          <li className="glow-card border border-rule p-5">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              Enrollment
            </p>
            <p className="mt-1 font-serif text-4xl font-black leading-tight">
              {JPS.numbers.mdeEnrollment}
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed">
              Students enrolled in 2025-26, according to the{" "}
              <a href={JPS.sources.mdeEnrollment} className={LINK}>
                Mississippi Department of Education
              </a>
              . The{" "}
              <a href={JPS.sources.nces} className={LINK}>
                National Center for Education Statistics
              </a>{" "}
              lists {JPS.numbers.ncesEnrollment} students for 2024-25. The district’s{" "}
              <a href={JPS.sources.atAGlance} className={LINK}>
                At-A-Glance page
              </a>{" "}
              lists pre-K through 12th grade enrollment of {JPS.numbers.districtEnrollment}{" "}
              and gives no date.
            </p>
          </li>
          <li className="glow-card border border-rule p-5">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              Schools
            </p>
            <p className="mt-1 font-serif text-4xl font-black leading-tight">
              {JPS.numbers.districtSchools}
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed">
              Schools, according to the district’s{" "}
              <a href={JPS.sources.about} className={LINK}>
                About Us page
              </a>
              : 22 elementary schools, seven middle schools and six high schools, “along
              with 10 special program schools.” The{" "}
              <a href={JPS.sources.nces} className={LINK}>
                National Center for Education Statistics
              </a>{" "}
              lists {JPS.numbers.ncesSchools} schools in its directory for 2025-26.
            </p>
          </li>
          <li className="glow-card border border-rule p-5">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-crimson">
              State accountability grade
            </p>
            <p className="mt-1 font-serif text-4xl font-black leading-tight">
              {JPS.numbers.grade}
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed">
              The district’s grade for 2025-26 on the{" "}
              <a href={JPS.sources.mdeReportCard} className={LINK}>
                Mississippi Department of Education’s district report card
              </a>
              , last updated {formatDay(JPS.numbers.gradeUpdated, { weekday: false })}.
              Mississippi assigns schools and districts letter grades of A through F.
            </p>
          </li>
        </ul>
        {staffingStory && (
          <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed">
            From the Wire, on the district’s staffing figures:{" "}
            <Link href={`/article/${staffingStory.slug}`} className={LINK}>
              {staffingStory.title}
            </Link>
          </p>
        )}
      </section>

      {/* Enrolling and contacts */}
      <section className="mt-14 grid gap-10 md:grid-cols-2">
        <div id="enroll">
          <h2 className={H2}>Enrolling a Child</h2>
          <div className="space-y-4 font-sans text-base leading-relaxed">
            <p>
              The district says it is open for enrollment and registration for the 2026-27
              school year. Registration is online, in English or Spanish, from the
              district’s{" "}
              <a href={JPS.sources.enroll} className={`font-bold ${LINK}`}>
                Enrollment &amp; Registration page
              </a>
              , which has separate links for new and transfer students, returning students,
              pre-K and kindergarten.
            </p>
            <p>
              For a{" "}
              <a href={JPS.sources.newStudents} className={LINK}>
                new or transfer student
              </a>
              , the district lists these required documents:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              {JPS.enrollment.newStudentDocuments.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
            <p>
              The district’s page lists which documents count as proof of residency. Parents
              who live with someone else and do not have those documents complete a Shared
              Residency Affidavit and enroll at {JPS.enrollment.office}, in the{" "}
              {JPS.enrollment.building} at 1017 Robinson St., the district says.
            </p>
            <p>
              A{" "}
              <a href={JPS.sources.kindergarten} className={LINK}>
                kindergarten student
              </a>{" "}
              may be enrolled at the zoned school or at {JPS.enrollment.office}, and no
              appointment is required, the district says. For help with a{" "}
              <a href={JPS.sources.returningStudents} className={LINK}>
                returning student’s registration
              </a>
              , it says to contact the child’s school or email{" "}
              <a href={`mailto:${JPS.enrollment.helpEmail}`} className={`${LINK} break-all`}>
                {JPS.enrollment.helpEmail}
              </a>
              .
            </p>
            {today <= programs.closes && (
              <p>
                <strong>Special programs.</strong>{" "}
                Applications for the district’s special programs for the {programs.forYear}{" "}
                school year opened {formatDay(programs.opened, { weekday: false })}, and
                close {formatDay(programs.closes)}, the district says. The{" "}
                <a href={JPS.sources.specialPrograms} className={LINK}>
                  program application page
                </a>{" "}
                lists the programs and the admission criteria.
              </p>
            )}
          </div>
        </div>
        <div id="contact">
          <h2 className={H2}>Who to Call</h2>
          <ul className="space-y-4 font-sans text-base leading-relaxed">
            <li>
              <strong>District office:</strong>{" "}
              <a
                href={`tel:${JPS.office.tel}`}
                className={`whitespace-nowrap font-bold ${LINK}`}
              >
                {JPS.office.phone}
              </a>
              . The office is at {JPS.office.address}. Mail goes to {JPS.office.mailing}.
            </li>
            <li>
              <strong>{JPS.enrollment.office}:</strong>{" "}
              <a
                href={`tel:${JPS.enrollment.tel}`}
                className={`whitespace-nowrap font-bold ${LINK}`}
              >
                {JPS.enrollment.phone}
              </a>
              , {JPS.enrollment.address}.
            </li>
            <li>
              <strong>Records and transcripts:</strong>{" "}
              <a
                href={`tel:${JPS.enrollment.recordsTel}`}
                className={`whitespace-nowrap font-bold ${LINK}`}
              >
                {JPS.enrollment.recordsPhone}
              </a>{" "}
              or{" "}
              <a href={`mailto:${JPS.enrollment.recordsEmail}`} className={`${LINK} break-all`}>
                {JPS.enrollment.recordsEmail}
              </a>
              . The district’s{" "}
              <a href={JPS.sources.records} className={LINK}>
                records page
              </a>{" "}
              explains how to request a transcript or diploma.
            </li>
            <li>
              <strong>Human resources:</strong>{" "}
              <a
                href={`tel:${JPS.pay.hrTel}`}
                className={`whitespace-nowrap font-bold ${LINK}`}
              >
                {JPS.pay.hrPhone}
              </a>
              .
            </li>
            <li>
              <strong>School board secretary:</strong>{" "}
              <a
                href={`tel:${JPS.board.secretaryTel}`}
                className={`whitespace-nowrap font-bold ${LINK}`}
              >
                {JPS.board.secretaryPhone}
              </a>
              .
            </li>
            <li>
              <strong>A school:</strong>{" "}
              The district’s{" "}
              <a href={JPS.sources.directoryPdf} className={LINK}>
                2026-2027 directory (PDF)
              </a>{" "}
              lists phone numbers and addresses for schools and offices. Its{" "}
              <a href={JPS.sources.schoolDirectory} className={LINK}>
                school directory page
              </a>{" "}
              lists the schools by level.
            </li>
          </ul>
        </div>
      </section>

      {/* Coverage */}
      {coverage.length > 0 && (
        <section className="mt-14">
          <h2 className={H2}>From the Wire: Jackson Public Schools</h2>
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

      {/* More guides */}
      <section className="mt-14">
        <h2 className={H2}>More Jackson Guides</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li className="border border-rule bg-paper p-4">
            <Link href="/city-council" className="font-serif text-base font-bold hover:text-crimson">
              Jackson City Council: members, meetings and how to speak
            </Link>
          </li>
          <li className="border border-rule bg-paper p-4">
            <Link href="/trash-pickup" className="font-serif text-base font-bold hover:text-crimson">
              Jackson trash pickup: schedule, holidays and rules
            </Link>
          </li>
          <li className="border border-rule bg-paper p-4">
            <Link
              href="/boil-water-notices"
              className="font-serif text-base font-bold hover:text-crimson"
            >
              Jackson boil-water notices in effect today
            </Link>
          </li>
        </ul>
      </section>

      <p className="mt-12 max-w-3xl border-t border-rule pt-6 font-sans text-sm leading-relaxed text-muted">
        Reporting note: Calendar dates, terms and the weather note are from the{" "}
        <a href={JPS.sources.calendar} className={LINK}>
          District Calendar
        </a>{" "}
        page of the {JPS.name} and its{" "}
        <a href={JPS.sources.calendarPdf} className={LINK}>
          2026-2027 calendar (PDF)
        </a>
        , and dismissal times from its{" "}
        <a href={JPS.sources.bellSchedules} className={LINK}>
          bell schedules
        </a>{" "}
        page. Days of the week, and which date comes next, are the Wire’s calculation from
        those dates. Board members, wards and officers are from the district’s{" "}
        <a href={JPS.sources.board} className={LINK}>
          School Board
        </a>{" "}
        and{" "}
        <a href={JPS.sources.boardWards} className={LINK}>
          Board Members by City Wards
        </a>{" "}
        pages. The board’s Nov. 17, 2026, letter spells one member’s name Akilah Irving;
        both board pages spell it Irvin, the spelling used here. The district writes “Dr.”
        before the names of Greene and Hairston. Meeting dates and rules are from the{" "}
        <a href={JPS.sources.boardMeetings} className={LINK}>
          Board Meetings
        </a>{" "}
        page, the 2026-2027 meeting schedule and the board’s public participation
        procedures. The superintendent’s appointment is from the district’s{" "}
        <a href={JPS.sources.superintendent} className={LINK}>
          Superintendent
        </a>{" "}
        page. Salary figures are from the district’s FY 2027 teacher salary scale. Enrollment
        steps and phone numbers are from the district’s enrollment pages, its 2026-2027
        registration flyer and its 2026-2027 directory. The board’s letter and the flyer are
        posted as images, and the Wire read them by eye. The state grade and state
        enrollment count are from the Mississippi Department of Education, and the federal
        counts from the National Center for Education Statistics. All were last checked{" "}
        {formatDay(JPS.checked, { weekday: false })}. This page is general information. The
        Wire did not ask the district to comment for it. If the district’s pages and this one
        differ, the district is right.
      </p>
    </div>
  );
}
