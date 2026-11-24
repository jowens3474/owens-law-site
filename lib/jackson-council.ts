// Facts for /city-council. Members, contacts, the meeting schedule and the
// public-comment rules are from the City of Jackson's website and meeting
// notices. When the city changes something, change it here and move
// `checked` forward.

export interface CouncilMember {
  ward: number;
  name: string;
  role?: string;
  phone: string;
  email: string;
  cityPage: string;
}

const MEMBER_PAGE = (ward: number) =>
  `https://jacksonms.gov/government/city-council/council-member-ward-${ward}/`;

export const COUNCIL = {
  // The day these facts were last compared with the city's pages.
  checked: "2026-11-23",
  mayor: "John Horhn",
  clerk: { name: "Shanekia Jordan", title: "Clerk of the Council", phone: "601-960-1031", tel: "+16019601031" },
  place: {
    room: "Council Chamber",
    building: "City Hall",
    address: "219 S. President St., Jackson, MS 39201",
  },
  members: [
    { ward: 1, name: "Ashby Foote", phone: "601-960-2051", email: "afoote@jacksonms.gov", cityPage: MEMBER_PAGE(1) },
    { ward: 2, name: "Tina Clay", phone: "601-960-1091", email: "mkclay@jacksonms.gov", cityPage: MEMBER_PAGE(2) },
    { ward: 3, name: "Kenneth Stokes", phone: "601-960-1090", email: "kstokes@jacksonms.gov", cityPage: MEMBER_PAGE(3) },
    { ward: 4, name: "Brian Grizzell", phone: "601-960-2052", email: "bgrizzell@jacksonms.gov", cityPage: MEMBER_PAGE(4) },
    {
      ward: 5,
      name: "Vernon Hartley",
      role: "Council president",
      phone: "601-960-1092",
      email: "vhartley@jacksonms.gov",
      cityPage: MEMBER_PAGE(5),
    },
    { ward: 6, name: "Lashia Brown-Thomas", phone: "601-960-1089", email: "lashiat@jacksonms.gov", cityPage: MEMBER_PAGE(6) },
    { ward: 7, name: "Kevin Parkinson", phone: "601-960-1063", email: "kparkinson@jacksonms.gov", cityPage: MEMBER_PAGE(7) },
  ] satisfies CouncilMember[],
  sources: {
    members: "https://jacksonms.gov/government/city-council/",
    schedule: "https://jacksonms.gov/government/city-council/meeting-schedule/",
    agendas: "https://jacksonms.gov/government/city-council/council-agendas-and-minutes/",
    videos: "https://jacksonms.gov/government/city-council/city-council-videos/",
    wardMaps: "https://jacksonms.gov/government/city-council/ward-maps/",
    publicComments: "https://jacksonms.gov/government/city-council/public-comments/",
    officers:
      "https://jacksonms.gov/government/city-council/committee-agendas-and-minutes/committee-assignments/",
    // The Nov. 9, 2026 notice of a special meeting "called by Vernon Hartley,
    // Council President"; it also lists the members, the mayor and the clerk.
    presidentNotice: "https://jacksonms.gov/wp-content/uploads/2026/11/combinepdf-94.pdf",
    zoningSchedule: "https://jacksonms.gov/wp-content/uploads/2026/04/2026-Zoning-Schedules.pdf",
  },
} as const;

export interface CouncilMeeting {
  date: string; // yyyy-mm-dd
  time: string; // as the city lists it, in the Wire's style
  kind: "Regular meeting" | "Zoning hearing";
}

// The city's posted schedules. Regular meetings are from the "2026 Regular
// City Council Meeting Schedule" the city posts as an image; the zoning
// hearing is from its 2026 zoning schedule. Add 2027 when the city posts it.
export const COUNCIL_MEETINGS: CouncilMeeting[] = [
  { date: "2026-11-17", time: "6 p.m.", kind: "Regular meeting" },
  { date: "2026-12-01", time: "10 a.m.", kind: "Regular meeting" },
  { date: "2026-12-15", time: "6 p.m.", kind: "Regular meeting" },
  { date: "2026-12-21", time: "2:30 p.m.", kind: "Zoning hearing" },
  { date: "2026-12-29", time: "10 a.m.", kind: "Regular meeting" },
];

// Scheduled meetings on or after `today` (yyyy-mm-dd), soonest first.
export function upcomingMeetings(today: string): CouncilMeeting[] {
  return COUNCIL_MEETINGS.filter((m) => m.date >= today).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
