// Facts for /jackson-homicides. The Wire counts no cases itself: the `cites`
// on each figure say whose count it is and when they published it. The one
// exception is the FBI column, where each value is the Wire's sum of the
// monthly figures the FBI's Crime Data Explorer shows for the Jackson Police
// Department. Sources do not agree, so a year can hold several figures.
// When a new count is published, add it here and move `checked` forward.

export interface Cite {
  // Who published the number, as the reader sees it.
  outlet: string;
  // The day it was published, in Jackson time (yyyy-mm-dd). A database that
  // is read on the `checked` date has none.
  date?: string;
  url: string;
}

export interface Figure {
  // The count as the source gives it ("84", "At least 130"), or the reason
  // there is none ("No data").
  value: string;
  // True when `value` says there is no count, so the page can mute it.
  missing?: boolean;
  note?: string;
  cites: Cite[];
}

export interface YearRow {
  year: number;
  wlbt: Figure[];
  clarionLedger: Figure[];
  jpd: Figure[];
  fbi: Figure[];
  other: Figure[];
}

const URLS = {
  tracker: "https://www.wlbt.com/news/crime/jackson-homicides/",
  wlbt2021:
    "https://www.wlbt.com/2022/01/01/analysis-jacksons-rate-killings-per-capita-ranks-highest-us/",
  wlbt2022:
    "https://www.wlbt.com/2023/01/07/analysis-second-straight-year-jacksons-homicide-rate-ranks-highest-us-among-major-cities/",
  wlbt2023:
    "https://www.wlbt.com/2024/01/09/homicides-drop-by-double-digits-second-year-straight-jackson-rate-killings-still-ranks-highest-nation/",
  wlbt2024:
    "https://www.wlbt.com/2025/01/04/jacksons-homicides-drop-third-straight-year-rate-killings-remains-highest-us/",
  wlbt2025:
    "https://www.wlbt.com/2026/01/02/jackson-homicides-drop-32-2025-marking-fourth-consecutive-year-decline/",
  wlbtCapitolPolice2024:
    "https://www.wlbt.com/2024/11/16/dps-releases-new-info-three-previously-unreported-jackson-homicides-investigated-by-capitol-police/",
  wlbtNov18Count:
    "https://www.wlbt.com/2026/11/18/live-jackson-police-chief-provide-updates-citys-homicides/",
  wlbtNov18Chief:
    "https://www.wlbt.com/2026/11/18/jpd-chief-brackney-addresses-recent-jackson-homicides-reactivates-quick-response-team/",
  // The Clarion Ledger's own site refuses automated readers, so these are the
  // copies of its stories carried by Yahoo News and AOL.
  clFiveYears: "https://www.yahoo.com/news/jackson-seen-decline-homicides-over-100131619.html",
  cl2022: "https://www.yahoo.com/news/jackson-homicide-rate-remains-high-110055030.html",
  clNov2021: "https://www.yahoo.com/news/jackson-hits-2020-record-130-145504821.html",
  clFeb2024: "https://www.yahoo.com/news/jpd-jackson-sees-12-homicides-101030811.html",
  clNov2023:
    "https://www.yahoo.com/news/crime-albatross-jackson-mississippi-addressing-110437035.html",
  clAug2026: "https://www.aol.com/articles/deadly-july-jackson-end-2026-154920000.html",
  clNov12: "https://www.yahoo.com/news/us/articles/jackson-ms-saw-75-homicides-100132907.html",
  clNov18: "https://www.yahoo.com/news/us/articles/jpd-chief-vows-strengthen-tasia-233508383.html",
  jfp2018:
    "https://www.mississippifreepress.org/with-84-homicides-in-2018-city-hopes-to-stem-violence-with-new-cops-strategy/",
  jfp2019:
    "https://www.mississippifreepress.org/mayor-lumumba-violence-prevention-must-take-into-account-poverty-and-gun-laws/",
  mississippiToday:
    "https://mississippitoday.org/2026/02/04/when-its-affecting-you-crime-is-bad-competing-realities-behind-jacksons-falling-homicide-figures/",
  superTalk2024:
    "https://www.supertalk.fm/weve-still-got-a-lot-of-work-to-do-jackson-murder-total-decreases-for-third-straight-year/",
  superTalk2025:
    "https://www.supertalk.fm/jackson-homicides-plunge-to-double-digits-for-first-time-since-2019-interim-chief-says-more-work-to-do/",
  fbi: "https://cde.ucr.cjis.gov/",
  stateStats2025:
    "https://mscrimestats.dps.ms.gov/tops/report/violent-crimes/jackson-police-department/2025",
  jpdRelease:
    "https://www.mississippifreepress.org/wp-content/uploads/2026/11/Press-Release-for-Homicide-s-67-68-and-Aggravated-Assault-x6-in-the-5100-Block-of-I-55-North-Frontage-Road.pdf",
  cityJpd: "https://jacksonms.gov/government/city-departments/jackson-police-department/",
  cityEmergency: "https://jacksonms.gov/residents/police-fire-emergency/",
  stateCapitolPolice: "https://www.mississippi.gov/agencies/mississippi-capitol-police",
  dpsCapitolPolice: "https://www.dps.ms.gov/capitol-police",
  dpsCapitolPoliceInvestigations: "https://www.dps.ms.gov/capitol-police/investigations-division",
  crimeStoppers: "https://www.centralmscrimestoppers.com/",
  crimeStoppersHotline: "https://www.centralmscrimestoppers.com/hotline/",
  crimeStoppersTipForm: "https://www.p3tips.com/116",
  census2010s:
    "https://www2.census.gov/programs-surveys/popest/datasets/2010-2020/intercensal/cities/sub-est2020int.csv",
  census2020s:
    "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_28.csv",
} as const;

const TRACKER: Cite = { outlet: "WLBT Homicide Tracker", url: URLS.tracker };
const FBI: Cite = { outlet: "FBI Crime Data Explorer", url: URLS.fbi };
const CL_FIVE_YEARS: Cite = { outlet: "Clarion Ledger", date: "2025-02-16", url: URLS.clFiveYears };
const CL_2022: Cite = { outlet: "Clarion Ledger", date: "2023-01-09", url: URLS.cl2022 };
const CL_NOV_2021: Cite = { outlet: "Clarion Ledger", date: "2021-11-30", url: URLS.clNov2021 };
const CL_FEB_2024: Cite = { outlet: "Clarion Ledger", date: "2024-02-09", url: URLS.clFeb2024 };
const CL_NOV_2023: Cite = { outlet: "Clarion Ledger", date: "2023-11-19", url: URLS.clNov2023 };
const CL_AUG_2026: Cite = { outlet: "Clarion Ledger", date: "2026-08-05", url: URLS.clAug2026 };
const JFP_2018: Cite = { outlet: "Jackson Free Press", date: "2019-01-04", url: URLS.jfp2018 };
const JFP_2019: Cite = { outlet: "Jackson Free Press", date: "2020-01-13", url: URLS.jfp2019 };
const MT: Cite = { outlet: "Mississippi Today", date: "2026-02-04", url: URLS.mississippiToday };
const WLBT_2021: Cite = { outlet: "WLBT", date: "2021-12-31", url: URLS.wlbt2021 };
const WLBT_2022: Cite = { outlet: "WLBT", date: "2023-01-06", url: URLS.wlbt2022 };
const WLBT_2023: Cite = { outlet: "WLBT", date: "2024-01-08", url: URLS.wlbt2023 };
const WLBT_2024: Cite = { outlet: "WLBT", date: "2025-01-03", url: URLS.wlbt2024 };
const WLBT_2025: Cite = { outlet: "WLBT", date: "2026-01-01", url: URLS.wlbt2025 };
const ST_2024: Cite = { outlet: "SuperTalk Mississippi", date: "2025-01-07", url: URLS.superTalk2024 };
const ST_2025: Cite = { outlet: "SuperTalk Mississippi", date: "2026-01-05", url: URLS.superTalk2025 };

// Homicides per year as WLBT's Homicide Tracker displayed them on the
// `checked` date (its "By Year" list with every year ticked). The tracker
// files each case under the year of its date. Do not recount these from the
// "Year" column of the tracker's data file: two entries there carry a
// different year than their date, so that column gives other totals. WLBT
// says the data can change as new cases surface. The same numbers feed the
// table and the rate.
export const TRACKER_COUNTS: Record<number, number> = {
  2016: 69,
  2017: 64,
  2018: 85,
  2019: 82,
  2020: 133,
  2021: 160,
  2022: 138,
  2023: 118,
  2024: 111,
  2025: 75,
};

// U.S. Census Bureau July 1 population estimates for Jackson city,
// Mississippi. 2016 to 2019 are the 2010-2020 intercensal estimates; 2020 to
// 2025 are from the 2020-2025 city estimates file.
export const CENSUS_POPULATION: Record<number, number> = {
  2016: 165965,
  2017: 163259,
  2018: 159682,
  2019: 156058,
  2020: 153025,
  2021: 149528,
  2022: 145870,
  2023: 143623,
  2024: 142042,
  2025: 141196,
};

// Homicides per 100,000 residents, rounded to one decimal place.
export function ratePer100k(count: number, population: number): number {
  return Math.round((count / population) * 1_000_000) / 10;
}

export interface RateRow {
  year: number;
  count: number;
  population: number;
  rate: number;
}

// One row per year that has both a WLBT count and a Census estimate.
export function rateRows(): RateRow[] {
  return Object.keys(TRACKER_COUNTS)
    .map(Number)
    .filter((year) => CENSUS_POPULATION[year] !== undefined)
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      count: TRACKER_COUNTS[year],
      population: CENSUS_POPULATION[year],
      rate: ratePer100k(TRACKER_COUNTS[year], CENSUS_POPULATION[year]),
    }));
}

// A WLBT tracker figure. `more` adds the WLBT story a note is taken from.
const tracked = (year: number, note?: string, more: Cite[] = []): Figure => ({
  value: String(TRACKER_COUNTS[year]),
  note,
  cites: [TRACKER, ...more],
});

const NONE_FOUND: Figure = { value: "None found", missing: true, cites: [] };
const FBI_NO_DATA: Figure = { value: "No data", missing: true, cites: [FBI] };

export const HOMICIDES = {
  // The day these facts were last compared with the sources.
  checked: "2026-11-25",
  sources: URLS,

  // The newest year-to-date counts the Wire found. This is a dated snapshot,
  // not a live figure.
  ytd: {
    year: 2026,
    asOf: "2026-11-18",
    total: 87,
    jpd: 77,
    capitolPolice: 10,
    chiefOpen: 20,
    chiefCleared: 57,
    // What WLBT's tracker displayed on the `checked` date. `latest` is the
    // date of the newest case in its data file.
    tracker: { total: 88, latest: "2026-11-22", jpd: 77, capitolPolice: 11 },
    throughOctober: { year: 75, priorYear: 63 },
    throughJuly: { total: 54, jpd: 50, capitolPolice: 4 },
    projection: 99,
    jpdReleaseDate: "2026-11-01",
  },

  contacts: {
    jpdNonEmergency: { phone: "601-960-1800", tel: "+16019601800" },
    capitolPolice: { phone: "601-359-3125", tel: "+16013593125" },
    crimeStoppers: {
      name: "Central Mississippi Crime Stoppers",
      phone: "601-355-TIPS (8477)",
      tel: "+16013558477",
      tollFree: "1-866-481-8477",
      tollFreeTel: "+18664818477",
    },
  },

  // Wire stories linked at the bottom of the page, looked up by slug. None of
  // these headlines names a victim or a suspect.
  coverageSlugs: [
    "morning-brief-2026-11-10",
    "morning-brief-2026-08-15",
    "morning-brief-2026-08-06",
    "jackson-seeks-300-million-doj-model-cities-grant",
  ],
} as const;

export const YEARS: YearRow[] = [
  {
    year: 2025,
    wlbt: [
      tracked(2025, "JPD 63, Capitol Police 11, Hinds County Sheriff’s Office 1.", [WLBT_2025]),
    ],
    clarionLedger: [{ value: "75", cites: [CL_AUG_2026] }],
    jpd: [
      {
        value: "63",
        note: "JPD’s cases only. The interim chief confirmed WLBT’s numbers, SuperTalk reported.",
        cites: [MT, ST_2025],
      },
    ],
    fbi: [
      {
        value: "26",
        note: "Reported by JPD. Mississippi Today wrote that the figure appears incomplete.",
        cites: [FBI, MT],
      },
    ],
    other: [
      {
        value: "74",
        note: "JPD recorded 63 of them, Mississippi Today reported.",
        cites: [MT],
      },
    ],
  },
  {
    year: 2024,
    wlbt: [tracked(2024, "JPD 104, Capitol Police 7, WLBT reported at year’s end.", [WLBT_2024])],
    clarionLedger: [{ value: "111", note: "JPD 104, Capitol Police 7.", cites: [CL_FIVE_YEARS] }],
    jpd: [{ value: "104", note: "JPD’s cases only.", cites: [ST_2024] }],
    fbi: [FBI_NO_DATA],
    other: [],
  },
  {
    year: 2023,
    wlbt: [tracked(2023, "JPD 109, Capitol Police 8, Jackson State police 1.", [WLBT_2023])],
    clarionLedger: [{ value: "119", cites: [CL_FIVE_YEARS] }],
    jpd: [
      {
        value: "109",
        note: "JPD’s cases only, from then-Chief Joseph Wade and the city’s website.",
        cites: [WLBT_2023, CL_FEB_2024],
      },
    ],
    fbi: [FBI_NO_DATA],
    other: [],
  },
  {
    year: 2022,
    wlbt: [tracked(2022, undefined, [WLBT_2022])],
    clarionLedger: [
      { value: "At least 130", note: "Before an official count was out.", cites: [CL_2022] },
      {
        value: "135",
        note: "JPD’s number: the newspaper listed about 135 for JPD and, separately, three for Capitol Police.",
        cites: [CL_FEB_2024, CL_NOV_2023],
      },
    ],
    jpd: [
      {
        value: "135",
        note: "Then-Chief Joseph Wade, quoted by WLBT in January 2024, called it the previous year’s number. The Clarion Ledger reported around 135 as JPD’s number.",
        cites: [WLBT_2023, CL_NOV_2023, CL_FEB_2024],
      },
    ],
    fbi: [FBI_NO_DATA],
    other: [],
  },
  {
    year: 2021,
    wlbt: [tracked(2021)],
    clarionLedger: [
      { value: "155", cites: [CL_2022, CL_FEB_2024] },
      { value: "157", note: "From public records, the newspaper said.", cites: [CL_FIVE_YEARS] },
    ],
    jpd: [{ value: "155", note: "JPD’s number, the Clarion Ledger reported.", cites: [CL_NOV_2023] }],
    fbi: [FBI_NO_DATA],
    other: [],
  },
  {
    year: 2020,
    wlbt: [
      tracked(2020),
      { value: "128", note: "In a story published at the end of 2021.", cites: [WLBT_2021] },
    ],
    clarionLedger: [
      { value: "130", cites: [CL_NOV_2021, CL_FEB_2024] },
      { value: "128", cites: [CL_2022] },
    ],
    jpd: [
      {
        value: "128",
        note: "JPD’s number, according to records obtained by the Clarion Ledger.",
        cites: [CL_NOV_2023],
      },
    ],
    fbi: [
      {
        value: "110",
        note: "Partial: January to November. No December figure.",
        cites: [FBI],
      },
    ],
    other: [],
  },
  {
    year: 2019,
    wlbt: [tracked(2019)],
    clarionLedger: [NONE_FOUND],
    jpd: [NONE_FOUND],
    fbi: [{ value: "76", note: "Reported by JPD.", cites: [FBI] }],
    other: [{ value: "82", cites: [JFP_2019] }],
  },
  {
    year: 2018,
    wlbt: [tracked(2018)],
    clarionLedger: [{ value: "84", cites: [CL_FIVE_YEARS] }],
    jpd: [NONE_FOUND],
    fbi: [{ value: "78", note: "Reported by JPD.", cites: [FBI] }],
    other: [
      {
        value: "84",
        note: "Includes three ruled justifiable and three deaths in shootings by officers.",
        cites: [JFP_2018],
      },
    ],
  },
  {
    year: 2017,
    wlbt: [tracked(2017)],
    clarionLedger: [{ value: "64", cites: [CL_FIVE_YEARS] }],
    jpd: [NONE_FOUND],
    fbi: [{ value: "60", note: "Reported by JPD.", cites: [FBI] }],
    other: [{ value: "64", cites: [JFP_2018] }],
  },
  {
    year: 2016,
    wlbt: [tracked(2016)],
    clarionLedger: [{ value: "68", cites: [CL_FIVE_YEARS] }],
    jpd: [NONE_FOUND],
    fbi: [{ value: "58", note: "Reported by JPD.", cites: [FBI] }],
    other: [],
  },
  {
    year: 2015,
    wlbt: [
      {
        value: "Not tracked",
        missing: true,
        note: "WLBT’s count starts in 2016.",
        cites: [WLBT_2025],
      },
    ],
    clarionLedger: [{ value: "58", cites: [CL_FIVE_YEARS] }],
    jpd: [NONE_FOUND],
    fbi: [{ value: "53", note: "Reported by JPD.", cites: [FBI] }],
    other: [],
  },
];
