// Facts for /trash-pickup. Everything here is from the City of Jackson's
// Solid Waste Division pages unless a note says otherwise. When the city
// changes a rule, change it here and move CHECKED forward.

export const TRASH = {
  // The day these facts were last compared with the city's pages.
  checked: "2026-11-25",
  hauler: {
    name: "Richard’s Disposal",
    phone: "769-333-4222",
    tel: "+17693334222",
    email: "CSRJM@richardsdisposal.com",
  },
  sources: {
    schedule:
      "https://jacksonms.gov/government/city-departments/public-works-department/solid-waste-division/garbage-collection-schedule/",
    division:
      "https://jacksonms.gov/government/city-departments/public-works-department/solid-waste-division/",
    residents: "https://jacksonms.gov/residents/trash-and-recycling/",
    hazardous:
      "https://jacksonms.gov/government/city-departments/public-works-department/solid-waste-division/household-hazardous-waste/",
    city311: "https://jacksonms.gov/residents/311-2/",
  },
  bulkItems: ["Furniture", "Mattresses and box springs", "Couches", "Televisions", "Radios", "Toilets"],
  notAllowed: [
    "Chemicals, paints, oils and other hazardous, toxic or flammable waste",
    "Construction debris such as concrete, sand, brick, rock, carpet and wood",
    "Recyclable items",
  ],
  hazardousDropOff: {
    name: "Environmental Service Center",
    address: "1570 University Blvd., Jackson, MS 39204",
    accepts: [
      "Paints and paint thinners",
      "Gasoline and motor oil",
      "Batteries",
      "Pesticides and insecticides",
      "Electronics such as computers and cellphones",
      "Fluorescent light bulbs, 4-foot only",
    ],
  },
  newService: {
    office: "Water Service Business Administration",
    address: "1000 Metrocenter Drive, Jackson, MS 39209",
  },
} as const;

export interface TrashHoliday {
  name: string;
  date: string; // yyyy-mm-dd
}

export interface HolidayNote {
  // What is known about collection around this holiday, in plain sentences.
  text: string[];
  // The day the Wire last looked for a city announcement.
  checked: string;
  sources: { label: string; url: string }[];
}

// What the city (or its hauler) has said about a specific holiday, keyed by
// the holiday's date. A holiday with no entry falls back to the standing rule.
// Add the city's announcement here when it is posted.
export const HOLIDAY_NOTES: Record<string, HolidayNote> = {
  "2026-11-26": {
    text: [
      "The city had not posted a Thanksgiving 2026 collection schedule on its website when the Wire checked on Nov. 25.",
      "In both 2023 and 2024, the city said Richard’s Disposal would not collect on Thanksgiving Day, WLBT reported. If the city does the same this year, there will be no pickup on Thursday.",
      "What happened to the missed routes differed. In 2023, Thursday routes were collected the following Monday and Friday pickup ran as usual. In 2024, collection resumed that Friday and the Friday and Saturday routes were finished by Saturday.",
      "In 2024, residents on Thursday and Friday routes were asked to put trash at the curb Thursday night, and Saturday customers on Friday night, WLBT reported.",
    ],
    checked: "2026-11-25",
    sources: [
      {
        label: "WLBT, Nov. 21, 2023",
        url: "https://www.wlbt.com/2023/11/21/richards-disposal-will-not-collect-trash-jackson-thanksgiving/",
      },
      {
        label: "WLBT, Nov. 27, 2024",
        url: "https://www.wlbt.com/2024/11/27/cities-release-trash-collection-schedules-ahead-thanksgiving-holiday/",
      },
    ],
  },
};

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// The nth given weekday (0 = Sunday) of a month, as a day of the month.
function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
}

// The five holidays the city's collection rule names, for one year.
function holidaysIn(year: number): TrashHoliday[] {
  return [
    { name: "New Year’s Day", date: iso(year, 1, 1) },
    { name: "Martin Luther King Jr. Day", date: iso(year, 1, nthWeekday(year, 1, 1, 3)) },
    { name: "Fourth of July", date: iso(year, 7, 4) },
    { name: "Thanksgiving Day", date: iso(year, 11, nthWeekday(year, 11, 4, 4)) },
    { name: "Christmas Day", date: iso(year, 12, 25) },
  ];
}

// The next five collection holidays on or after `today` (yyyy-mm-dd).
export function upcomingHolidays(today: string, count = 5): TrashHoliday[] {
  const year = Number(today.slice(0, 4));
  return [...holidaysIn(year), ...holidaysIn(year + 1)]
    .filter((h) => h.date >= today)
    .slice(0, count);
}
