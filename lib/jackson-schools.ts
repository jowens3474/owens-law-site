// Facts for /jackson-public-schools. Everything here is from the Jackson
// Public School District's own website and files, the Mississippi Department
// of Education or the National Center for Education Statistics. When a source
// changes, change it here and move `checked` forward. This file has no
// imports so its test can load it directly.

const JPS_SITE = "https://www.jackson.k12.ms.us";

export const JPS = {
  // The day these facts were last compared with the sources.
  checked: "2026-11-25",
  name: "Jackson Public School District",
  office: {
    phone: "601-960-8700",
    tel: "+16019608700",
    address: "662 S. President St., Jackson, MS 39201",
    mailing: "P.O. Box 2338, Jackson, MS 39225",
  },
  superintendent: {
    // The district writes "Dr. Errick L. Greene".
    name: "Errick L. Greene",
    appointed: "October 2018",
    // The board meeting where he said he would not renew his contract.
    announced: "2026-11-17",
    contractEnds: "2027-06-30",
  },
  board: {
    room: "School Board Meeting Room",
    address: "621 S. State St.",
    time: "5:30 p.m.",
    secretaryPhone: "601-960-8734",
    secretaryTel: "+16019608734",
    // Seats by City Council ward, as the district's board page and its ward
    // chart (revised July 1, 2026) list them. The district writes "Dr. Jeanne
    // Middleton Hairston".
    seats: [
      { ward: 1, name: "Akilah Irvin" },
      { ward: 2, name: null },
      { ward: 3, name: "Frank Figgers" },
      { ward: 4, name: "Barbara T. Hilliard", role: "President" },
      { ward: 5, name: "Jeanne Middleton Hairston" },
      { ward: 6, name: "Lee Scott" },
      { ward: 7, name: "Mitch McGuffey", role: "Vice president" },
    ] as { ward: number; name: string | null; role?: string }[],
  },
  // Dismissal times from the district's bell schedules page.
  dismissal: [
    { day: "Regular day", elementary: "2:30 p.m.", middle: "3:30 p.m.", high: "4:05 p.m." },
    { day: "80% day", elementary: "1:15 p.m.", middle: "1:50 p.m.", high: "2:35 p.m." },
    { day: "60% day", elementary: "noon", middle: "12:30 p.m.", high: "1:20 p.m." },
  ],
  pay: {
    // Row 0 of the "YOE" column on the FY 2027 teacher salary scale.
    approved: "2026-07-21",
    start: [
      { degree: "Bachelor’s", state: "$43,500", local: "$5,000", annual: "$48,500" },
      { degree: "Master’s", state: "$45,000", local: "$5,000", annual: "$50,000" },
      { degree: "Specialist’s", state: "$46,000", local: "$5,000", annual: "$51,000" },
      { degree: "Doctorate", state: "$47,500", local: "$5,000", annual: "$52,500" },
    ],
    // What the district's Salary Scales page lists, under its own year labels.
    posted: [
      { year: "2026-2027", scales: "Teachers" },
      {
        year: "2025-2026",
        scales:
          "Principals and assistant principals at elementary, middle and high schools, and deans of students at middle and high schools",
      },
      { year: "2024-2025", scales: "Classified employees, exempt and non-exempt" },
    ],
    hrPhone: "601-960-8745",
    hrTel: "+16019608745",
  },
  numbers: {
    // Mississippi Department of Education, enrollment data for 2025-26.
    mdeEnrollment: "16,968",
    // NCES district detail, 2024-25 school year.
    ncesEnrollment: "17,429",
    // The district's strategic plan At-A-Glance page, which gives no date.
    districtEnrollment: "16,857",
    // The district's About Us page: 22 elementary, seven middle and six high
    // schools, "along with 10 special program schools".
    districtSchools: "35",
    // NCES district directory information, 2025-26 school year.
    ncesSchools: "40",
    // Mississippi Department of Education district report card, 2025-26.
    grade: "C",
    gradeUpdated: "2026-10-15",
  },
  enrollment: {
    office: "Enrollment Services",
    building: "Poindexter Administrative Complex",
    address: "1017 Robinson St., Jackson, MS 39203",
    phone: "601-960-8852",
    tel: "+16019608852",
    helpEmail: "psparentportal@jackson.k12.ms.us",
    recordsPhone: "601-960-8850",
    recordsTel: "+16019608850",
    recordsEmail: "transcripts@jackson.k12.ms.us",
    newStudentDocuments: [
      "A parent’s government-issued photo ID or driver’s license",
      "The student’s original, long-form, certified birth certificate",
      "The student’s Mississippi Immunization Form 121/122",
      "Two proofs of residency",
      "For transfer students, a withdrawal form or report card from the previous school",
    ],
    // Applications for the district's special programs for 2027-28.
    specialPrograms: { opened: "2026-10-26", closes: "2026-12-31", forYear: "2027-28" },
  },
  sources: {
    home: `${JPS_SITE}/`,
    calendar: `${JPS_SITE}/district-calendar`,
    calendarPdf: `${JPS_SITE}/fs/resource-manager/view/cd95bec9-0712-420e-9e79-7110e36d8681`,
    bellSchedules: `${JPS_SITE}/academic-programs/school-directory/school-bell-schedules`,
    board: `${JPS_SITE}/about-us/school-board/school-board`,
    boardWards: `${JPS_SITE}/about-us/school-board/jps-board-members-by-city-council-wards`,
    boardMeetings: `${JPS_SITE}/about-us/school-board/board-meetings`,
    boardSchedulePdf: `${JPS_SITE}/fs/resource-manager/view/0d546935-d403-41c3-80e0-a644bcc26fc4`,
    boardAgendas: `${JPS_SITE}/about-us/school-board/board-agendas-minutes`,
    boardPolicy: `${JPS_SITE}/fs/resource-manager/view/07f0bda0-1bef-44e0-83da-9808047347a8`,
    boardContact: `${JPS_SITE}/about-us/school-board/contact-jps-school-board`,
    boardVideo: "https://www.youtube.com/playlist?list=PL3CPWmrsJWnQ4qP1gFAMs26zK1uq3vhkI",
    superintendent: `${JPS_SITE}/about-us/superintendent/superintendent`,
    superintendentContact: `${JPS_SITE}/about-us/superintendent/contact-superintendent`,
    departure: `${JPS_SITE}/p/~board/jps-news-features-news/post/jps-superintendent-dr-errick-l-greene-announces-decision-to-conclude-tenure-in-june-2027`,
    boardLetter: `${JPS_SITE}/fs/resource-manager/view/77ccf266-029a-4958-bf99-a2f3b5c2b91f`,
    news: `${JPS_SITE}/news`,
    salaryScales: `${JPS_SITE}/departments/talent-management-and-development/salary-scales`,
    teacherScalePdf: `${JPS_SITE}/fs/resource-manager/view/9e730f86-bdbf-49e6-ae50-7b2c9478cfa7`,
    incentives: `${JPS_SITE}/employment/employment/salary-benefits-incentives`,
    about: `${JPS_SITE}/about-us/about-us/about-us-jps`,
    atAGlance: `${JPS_SITE}/jps-strategic-plan/at-a-glance`,
    enroll: `${JPS_SITE}/enroll`,
    newStudents: `${JPS_SITE}/departments/enrollment-strategy-and-data-systems/student-enrollment-registration/new-transfer-student-registration`,
    returningStudents: `${JPS_SITE}/departments/enrollment-strategy-and-data-systems/student-enrollment-registration/returning-student-registration`,
    kindergarten: `${JPS_SITE}/academic-programs/kindergarten/overview`,
    specialPrograms: `${JPS_SITE}/academic-programs/advanced-academics/program-application`,
    records: `${JPS_SITE}/departments/enrollment-strategy-and-data-systems/overview`,
    schoolDirectory: `${JPS_SITE}/academic-programs/school-directory/school-directory`,
    directoryPdf: `${JPS_SITE}/fs/resource-manager/view/05621dfc-bf86-4591-ac6e-9ec33a921df8`,
    mdeReportCard: "https://msrc.mdek12.org/entity?EntityID=2520-000&SchoolYear=2025",
    mdeEnrollment: "https://newreports.mdek12.org/DataExplorer",
    nces: "https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=2802190",
  },
} as const;

export interface SchoolDate {
  start: string; // yyyy-mm-dd
  end?: string; // yyyy-mm-dd, for a break of more than one day
  name: string;
  detail?: string;
}

// Key dates for 2026-27 from the "District Calendar At-A-Glance 2026-2027"
// table on the district's calendar page, in the Wire's wording; the district
// calls students "scholars". Dec. 18 is from the terms table on the same page
// and the printable calendar. Add 2027-28 when the district posts it.
export const SCHOOL_DATES: SchoolDate[] = [
  { start: "2026-07-03", name: "Independence holiday", detail: "Districtwide closure" },
  { start: "2026-07-23", name: "First day for teachers" },
  { start: "2026-07-24", name: "JPS District Convocation" },
  { start: "2026-07-29", name: "First day for students" },
  { start: "2026-09-03", name: "Teacher professional development day", detail: "80% day for students" },
  { start: "2026-09-04", name: "Teacher professional development day", detail: "No school for students" },
  { start: "2026-09-07", name: "Labor Day holiday", detail: "Districtwide closure" },
  {
    start: "2026-10-12",
    end: "2026-10-16",
    name: "Fall break",
    detail: "Schools closed Monday through Friday; offices closed Wednesday through Friday",
  },
  { start: "2026-10-23", name: "Parent-teacher conference day", detail: "60% day for students" },
  { start: "2026-11-12", name: "Teacher professional development day", detail: "80% day for students" },
  { start: "2026-11-13", name: "Teacher professional development day", detail: "No school for students" },
  { start: "2026-11-23", end: "2026-11-27", name: "Thanksgiving break", detail: "Districtwide closure" },
  { start: "2026-12-18", name: "Term 2 ends", detail: "End of the first semester" },
  { start: "2026-12-21", end: "2027-01-01", name: "Winter holiday break", detail: "Districtwide closure" },
  { start: "2027-01-04", name: "Teacher professional development day", detail: "No school for students" },
  { start: "2027-01-05", name: "Students return", detail: "Term 3 begins" },
  { start: "2027-01-18", name: "Martin Luther King Jr. Day", detail: "Districtwide closure" },
  { start: "2027-02-11", name: "Parent-teacher conference day", detail: "60% day for students" },
  { start: "2027-02-12", name: "Teacher professional development day", detail: "No school for students" },
  { start: "2027-03-08", end: "2027-03-12", name: "Spring break", detail: "Districtwide closure" },
  { start: "2027-03-26", end: "2027-03-29", name: "Easter break", detail: "Districtwide closure" },
  { start: "2027-05-21", name: "Last day for students" },
  { start: "2027-05-24", end: "2027-05-25", name: "High school graduations" },
  { start: "2027-05-25", name: "Last day for teachers" },
  { start: "2027-05-31", name: "Memorial Day", detail: "Districtwide closure" },
  { start: "2027-06-01", end: "2027-06-29", name: "Summer school" },
  { start: "2027-06-18", name: "Juneteenth", detail: "Districtwide closure" },
  { start: "2027-06-29", name: "Summer school graduation" },
];

export const FIRST_DAY = "2026-07-29";
export const LAST_DAY = "2027-05-21";

export interface SchoolTerm {
  term: number;
  begins: string;
  midterm: string; // midterm progress reports
  ends: string;
  reportCards: string;
}

// "District Terms, Midterm Progress & Report Cards 2026-2027" on the
// district's calendar page.
export const SCHOOL_TERMS: SchoolTerm[] = [
  { term: 1, begins: "2026-07-29", midterm: "2026-09-02", ends: "2026-10-01", reportCards: "2026-10-23" },
  { term: 2, begins: "2026-10-02", midterm: "2026-11-11", ends: "2026-12-18", reportCards: "2027-01-13" },
  { term: 3, begins: "2027-01-05", midterm: "2027-02-11", ends: "2027-03-17", reportCards: "2027-03-31" },
  { term: 4, begins: "2027-03-18", midterm: "2027-04-21", ends: "2027-05-21", reportCards: "2027-05-26" },
];

// The district's "School Board Meeting Schedule for 2026-2027 School Year".
export const BOARD_MEETINGS: string[] = [
  "2026-07-07",
  "2026-07-21",
  "2026-08-04",
  "2026-08-18",
  "2026-09-01",
  "2026-09-15",
  "2026-10-06",
  "2026-10-20",
  "2026-11-05",
  "2026-11-17",
  "2026-12-01",
  "2026-12-15",
  "2027-01-07",
  "2027-01-19",
  "2027-02-02",
  "2027-02-16",
  "2027-03-02",
  "2027-03-16",
  "2027-04-06",
  "2027-04-20",
  "2027-05-04",
  "2027-05-18",
  "2027-06-01",
  "2027-06-15",
];

// The last day a calendar entry covers.
export function lastDayOf(d: SchoolDate): string {
  return d.end ?? d.start;
}

// True when `today` (yyyy-mm-dd) falls inside an entry that has begun.
export function isUnderWay(d: SchoolDate, today: string): boolean {
  return d.start <= today && today <= lastDayOf(d);
}

// Calendar entries that have not ended as of `today` (yyyy-mm-dd), soonest
// first. A break that has begun stays on the list through its last day.
export function upcomingSchoolDates(today: string, count = 6): SchoolDate[] {
  return SCHOOL_DATES.filter((d) => lastDayOf(d) >= today)
    .sort((a, b) => a.start.localeCompare(b.start) || lastDayOf(a).localeCompare(lastDayOf(b)))
    .slice(0, count);
}

// Scheduled board meetings on or after `today` (yyyy-mm-dd), soonest first.
export function upcomingBoardMeetings(today: string, count = 6): string[] {
  return BOARD_MEETINGS.filter((d) => d >= today)
    .sort()
    .slice(0, count);
}
