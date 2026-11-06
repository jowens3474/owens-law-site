// The Mississippi U.S. Senate count tracker (Nov. 3, 2026): Scott Colom (D),
// Sen. Cindy Hyde-Smith (R) and independent Ty Pinkins.
//
// This file is the single place editors update. The /mississippi-senate-race
// hub, the homepage banner, the sitemap, llms.txt and the article "From this
// beat" link all read it. Content changes by deploy, so no page here fetches
// anything or goes dynamic (every cache write is billed on Vercel Hobby).
//
// Rules for every entry:
// - Every number needs a source and a time. Vote totals carry `countAsOf` and
//   `countSource`; outstanding items, deadlines, FAQ answers and updates carry
//   their own sources.
// - The Wire never calls a race. It reports the Associated Press and the
//   Mississippi Secretary of State. Set `status` to "called" only after AP
//   calls it, and "certified" only after the state certifies the result.
// - Set `lastUpdated` (ISO with time and offset) every time you edit the data.
//   It drives the "Updated" line, the banner, the sitemap and the JSON-LD.
// - Set `showBanner` to false to take the homepage banner down.
import { absoluteUrl } from "./markdown";
import { getPostsByTag, todayLocalIso, type Post } from "./posts";
import { site } from "./site";

export const SENATE_TAG = "senate-race-2026";

export type SenateStatus = "uncalled" | "called" | "certified";

export interface SenateSource {
  name: string;
  url: string;
}

export interface SenateCandidate {
  name: string;
  party: string;
  votes?: number;
  share?: number; // percent, e.g. 48.7
}

export interface SenateRace {
  slug: "mississippi-senate-race";
  status: SenateStatus;
  showBanner: boolean;
  lastUpdated: string; // ISO with time and offset
  candidates: SenateCandidate[];
  countAsOf: string; // ISO
  countSource: SenateSource;
  outstanding: { label: string; value: string; note?: string; source?: SenateSource }[];
  deadlines: { date: string; label: string; detail: string; source?: SenateSource }[]; // date: YYYY-MM-DD
  faq: { q: string; a: string[]; sources: SenateSource[] }[];
  updates: {
    at: string; // ISO
    headline: string;
    body: string[];
    sources: SenateSource[];
  }[]; // newest first
  circuitClerks: {
    county: string;
    clerk?: string;
    phone?: string;
    address?: string;
    city?: string;
    sourceUrl?: string;
  }[];
}

export const SENATE_RACE: SenateRace = {
  slug: "mississippi-senate-race",
  status: "uncalled",
  showBanner: true,
  lastUpdated: "2026-11-06T17:50:00-06:00",
  candidates: [
    {
      "name": "Scott Colom",
      "party": "Democrat",
      "votes": 467846,
      "share": 49.1
    },
    {
      "name": "Cindy Hyde-Smith",
      "party": "Republican",
      "votes": 465348,
      "share": 48.8
    },
    {
      "name": "Ty Pinkins",
      "party": "Independent",
      "votes": 20028,
      "share": 2.1
    }
  ],
  countAsOf: "2026-11-06T16:29:00-06:00",
  countSource: {
    "name": "WLBT election results page (unofficial)",
    "url": "https://www.wlbt.com/politics/election-results/"
  },
  outstanding: [
    {
      "label": "Affidavit ballots still being reviewed",
      "value": "12,000 to 20,000 (estimate)",
      "note": "Secretary of State Michael Watson's estimate on Nov. 5. He said 76% of those reviewed so far had been accepted. County election commissions review them in open meetings and report as they finish.",
      "source": {
        "name": "WLBT, Nov. 5",
        "url": "https://www.wlbt.com/2026/11/06/secretary-state-explains-affidavit-ballot-process-mississippi-senate-race/"
      }
    },
    {
      "label": "Mail ballots that could still arrive",
      "value": "About 3,300",
      "note": "Ballots postmarked by Election Day count if they reach the circuit clerk by Tuesday, Nov. 10. Watson gave this figure this week, down from about 3,600 on Nov. 4, and not all are expected to arrive.",
      "source": {
        "name": "Mississippi Free Press liveblog",
        "url": "https://www.mississippifreepress.org/liveblog-mississippis-2026-u-s-senate-election-results/"
      }
    }
  ],
  deadlines: [
    {
      "date": "2026-11-03",
      "label": "Election Day",
      "detail": "Polls closed at 7 p.m."
    },
    {
      "date": "2026-11-10",
      "label": "Affidavit ID deadline and last day for mail ballots to arrive",
      "detail": "Voters who cast an affidavit ballot because they had no acceptable photo ID must show one, get a free voter ID card or sign a religious-objection affidavit at their circuit clerk's office. Mail ballots postmarked by Nov. 3 must arrive.",
      "source": {
        "name": "Mississippi Secretary of State, Oct. 26",
        "url": "https://www.sos.ms.gov/news/election-day-reminders-2026-general-election"
      }
    },
    {
      "date": "2026-11-13",
      "label": "Counties certify their results",
      "detail": "Each county election commission must certify its results and send them to the Secretary of State within 10 days of the election.",
      "source": {
        "name": "Mississippi Secretary of State, Nov. 4",
        "url": "https://www.sos.ms.gov/news/official-statement-election-update"
      }
    }
  ],
  faq: [
    {
      "q": "When will the race be called?",
      "a": [
        "The Associated Press, which counts and calls Mississippi races, declares a winner only when there is no scenario that would let the trailing candidate close the gap. As of Friday afternoon it had not called the race, with about 97% of the vote in.",
        "Counties must certify their results by Nov. 13."
      ],
      "sources": [
        {
          "name": "Mississippi Today, citing the Associated Press, Nov. 5",
          "url": "https://mississippitoday.org/2026/11/05/thursday-what-races-the-ap-has-not-yet-called-in-contests-for-senate-and-governor/"
        },
        {
          "name": "Yahoo News, citing the Associated Press, Nov. 6",
          "url": "https://www.yahoo.com/news/politics/article/how-the-mississippi-senate-race-between-scott-colom-and-cindy-hyde-smith-got-so-close--and-what-happens-next-212946040.html"
        },
        {
          "name": "Mississippi Secretary of State, Nov. 4",
          "url": "https://www.sos.ms.gov/news/official-statement-election-update"
        }
      ]
    },
    {
      "q": "Will there be a recount?",
      "a": [
        "Mississippi has no automatic recount, and a candidate cannot simply ask for one, the Secretary of State's office told ABC News. A recount would happen only if a court ordered it.",
        "The office said a candidate can examine ballot boxes after the election is certified and then go to court. In letters to the counties, the two campaigns disagree over whether that process applies to a U.S. Senate race."
      ],
      "sources": [
        {
          "name": "ABC News, Nov. 5",
          "url": "https://abcnews.com/Politics/recounts-mississippi-razor-thin-margin-senate-race/story?id=137844445"
        },
        {
          "name": "Mississippi Today, Nov. 5",
          "url": "https://mississippitoday.org/2026/11/05/thousands-of-affidavit-ballots-outstanding-in-mississippi-senate-election-campaigns-prepare-for-legal-fight/"
        },
        {
          "name": "Letter from Hyde-Smith's lawyers to the counties, Nov. 5",
          "url": "https://www.mississippifreepress.org/wp-content/uploads/2026/11/261105-Demand-re-Preservation-of-Affidavit-Ballots-.pdf"
        },
        {
          "name": "Letter from Colom's lawyers to the counties, Nov. 5",
          "url": "https://www.mississippifreepress.org/wp-content/uploads/2026/11/Letter-to-Counties-Re-Segregation-of-Ballots-1.pdf"
        }
      ]
    },
    {
      "q": "Will there be a runoff?",
      "a": [
        "No. The Secretary of State lists U.S. Senate as a plurality office: the candidate with the most votes wins, even without a majority. The 2020 amendment that created runoffs covers statewide state offices such as governor, not Congress."
      ],
      "sources": [
        {
          "name": "Mississippi Secretary of State, vote requirements chart, via the Wire's Nov. 2 preview",
          "url": "/article/scott-colom-cindy-hyde-smith-senate-race-money-polls-rules"
        }
      ]
    },
    {
      "q": "I voted by affidavit. Do I need to do anything?",
      "a": [
        "Only if you voted by affidavit because you did not show an acceptable photo ID, or because you have a religious objection to being photographed. Then you must go to your circuit clerk's office by Tuesday, Nov. 10, to show an ID, get a free Mississippi Voter ID card or sign an Affidavit of Religious Objection. Other affidavit voters do not need to go back, WLBT reported, citing Secretary of State Michael Watson.",
        "You can check your ballot's status on the Secretary of State's tracking site once your county has entered it."
      ],
      "sources": [
        {
          "name": "Mississippi Secretary of State, Oct. 26",
          "url": "https://www.sos.ms.gov/news/election-day-reminders-2026-general-election"
        },
        {
          "name": "Mississippi Secretary of State, 2026 County Election Handbook",
          "url": "https://www.sos.ms.gov/content/documents/elections/2026%20County%20Election%20Handbook.revised%2012-30-2025.pdf"
        },
        {
          "name": "WLBT, Nov. 5",
          "url": "https://www.wlbt.com/2026/11/06/secretary-state-explains-affidavit-ballot-process-mississippi-senate-race/"
        },
        {
          "name": "Mississippi Secretary of State, Track my Absentee or Affidavit ballot",
          "url": "https://myelectionday.sos.state.ms.us/VoterOutreach/Pages/VoterRegistrationCheck.aspx"
        },
        {
          "name": "The Wire's guide to affidavit ballots",
          "url": "/article/mississippi-affidavit-ballot-deadline-how-to-make-it-count"
        }
      ]
    },
    {
      "q": "Do mail ballots that arrive after Election Day count?",
      "a": [
        "Yes, if they were postmarked by Election Day and reach the circuit clerk by Tuesday, Nov. 10. The U.S. Supreme Court upheld that rule 5-4 in June in Watson v. Republican National Committee, a Mississippi case."
      ],
      "sources": [
        {
          "name": "Mississippi Secretary of State, Oct. 26",
          "url": "https://www.sos.ms.gov/news/election-day-reminders-2026-general-election"
        },
        {
          "name": "U.S. Supreme Court, Watson v. Republican National Committee (June 29, 2026)",
          "url": "https://www.law.cornell.edu/supremecourt/text/24-1260"
        }
      ]
    },
    {
      "q": "Has anyone gone to court?",
      "a": [
        "So far the campaigns have traded letters. On Thursday, lawyers for Hyde-Smith wrote to all 82 counties demanding that affidavit ballots be kept separate and preserved. Colom's lawyers answered that the demands have no basis in Mississippi law, and his campaign manager called the move a \"desperate stunt.\"",
        "State Republican Party Chairman Mike Hurst said Thursday he was considering a lawsuit and named Hinds County as a likely place, Mississippi Today reported."
      ],
      "sources": [
        {
          "name": "Letter from Hyde-Smith's lawyers to the counties, Nov. 5",
          "url": "https://www.mississippifreepress.org/wp-content/uploads/2026/11/261105-Demand-re-Preservation-of-Affidavit-Ballots-.pdf"
        },
        {
          "name": "Letter from Colom's lawyers to the counties, Nov. 5",
          "url": "https://www.mississippifreepress.org/wp-content/uploads/2026/11/Letter-to-Counties-Re-Segregation-of-Ballots-1.pdf"
        },
        {
          "name": "Mississippi Free Press liveblog",
          "url": "https://www.mississippifreepress.org/liveblog-mississippis-2026-u-s-senate-election-results/"
        },
        {
          "name": "Mississippi Today, Nov. 5",
          "url": "https://mississippitoday.org/2026/11/05/thousands-of-affidavit-ballots-outstanding-in-mississippi-senate-election-campaigns-prepare-for-legal-fight/"
        }
      ]
    },
    {
      "q": "Would a Colom win change control of the Senate?",
      "a": [
        "No. NBC News, Reuters and the Associated Press have reported that Democrats will control the Senate next year without this seat. A Colom win would add to that majority."
      ],
      "sources": [
        {
          "name": "NBC News, Nov. 4",
          "url": "https://www.nbcnews.com/politics/2026-election/mississippi-senate-race-heads-extended-vote-count-possible-ballot-batt-rcna607463"
        },
        {
          "name": "Reuters via U.S. News, Nov. 6",
          "url": "https://www.usnews.com/news/politics/articles/2026-11-06/mississippi-us-senate-candidates-battle-over-ballots-as-winner-remains-unclear"
        },
        {
          "name": "Mississippi Today, citing the Associated Press, Nov. 5",
          "url": "https://mississippitoday.org/2026/11/05/thursday-what-races-the-ap-has-not-yet-called-in-contests-for-senate-and-governor/"
        }
      ]
    }
  ],
  updates: [
    {
      "at": "2026-11-06T17:50:00-06:00",
      "headline": "Colom's lead grows to about 2,500 as counties review affidavit ballots",
      "body": [
        "Colom led Hyde-Smith 467,846 to 465,348 on WLBT's results page at 4:29 p.m. Friday, a margin of 2,498 votes, with independent Ty Pinkins at 20,028. The Associated Press, which counts and calls Mississippi races, had Colom ahead by 2,493 earlier in the afternoon with about 97% of the vote in, and it had not called the race.",
        "The margin has grown from 43 votes early Wednesday as counties count affidavit ballots. Early county results show those ballots helping Colom even where Hyde-Smith is strong: in Alcorn, Chickasaw and Itawamba counties combined she netted just 71 votes from them despite big overall leads in two of those counties, and in Lafayette County they went 142 to 60 for Colom, the Mississippi Free Press reported.",
        "Secretary of State Michael Watson has estimated 12,000 to 20,000 affidavit ballots statewide, with 76% accepted so far, and about 3,300 mail ballots that could still arrive by Tuesday."
      ],
      "sources": [
        {
          "name": "WLBT election results page (unofficial)",
          "url": "https://www.wlbt.com/politics/election-results/"
        },
        {
          "name": "Yahoo News, citing the Associated Press, Nov. 6",
          "url": "https://www.yahoo.com/news/politics/article/how-the-mississippi-senate-race-between-scott-colom-and-cindy-hyde-smith-got-so-close--and-what-happens-next-212946040.html"
        },
        {
          "name": "WLBT, Nov. 4",
          "url": "https://www.wlbt.com/2026/11/04/scott-colom-projects-victory-razor-thin-mississippi-senate-race-uncounted-ballots-linger/"
        },
        {
          "name": "Mississippi Free Press, Nov. 6",
          "url": "https://www.mississippifreepress.org/scott-colom-is-overperforming-affidavit-ballots-in-north-mississippi-even-in-hyde-smith-friendly-counties/"
        },
        {
          "name": "Mississippi Free Press, Nov. 5",
          "url": "https://www.mississippifreepress.org/lafayette-countys-affidavit-ballots-break-for-scott-colom-69-29-far-exceeding-his-overall-margin/"
        },
        {
          "name": "WLBT, Nov. 5",
          "url": "https://www.wlbt.com/2026/11/06/secretary-state-explains-affidavit-ballot-process-mississippi-senate-race/"
        },
        {
          "name": "Mississippi Free Press liveblog",
          "url": "https://www.mississippifreepress.org/liveblog-mississippis-2026-u-s-senate-election-results/"
        }
      ]
    }
  ],
  circuitClerks: [
    {
      "county": "Adams",
      "clerk": "Eva Givens",
      "phone": "601-446-6326",
      "address": "115 South Wall St.",
      "city": "Natchez",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Alcorn",
      "clerk": "Crystal Starling",
      "phone": "662-286-7740",
      "city": "Corinth",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Amite",
      "clerk": "Celeste McIntyre",
      "phone": "601-657-8932",
      "city": "Liberty",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Attala",
      "clerk": "Tim Pinkard",
      "phone": "662-289-1471",
      "address": "100 Courthouse, Ste 1",
      "city": "Kosciusko",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Benton",
      "clerk": "Kathy M. Graves",
      "phone": "662-224-6310",
      "city": "Ashland",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Bolivar",
      "clerk": "Judith Thompson",
      "phone": "662-843-2061",
      "city": "Cleveland",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Calhoun",
      "clerk": "Carlton Baker",
      "phone": "662-412-3101",
      "city": "Pittsboro",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Carroll",
      "clerk": "Durward Stanton",
      "phone": "662-237-9274",
      "city": "Carrollton",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Chickasaw",
      "clerk": "Cassandra Pulliam",
      "phone": "662-456-2331",
      "address": "1 Pinson Square, Room 2",
      "city": "Houston",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Choctaw",
      "clerk": "Amy Burdine",
      "phone": "662-285-6245",
      "city": "Ackerman",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Claiborne",
      "clerk": "Gale Compton",
      "phone": "601-437-5841",
      "city": "Port Gibson",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Clarke",
      "clerk": "Sally Wedgeworth",
      "phone": "601-776-3111",
      "city": "Quitman",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Clay",
      "clerk": "Kim Brown Hood",
      "phone": "662-494-3384",
      "city": "West Point",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Coahoma",
      "clerk": "Demetria A. Jackson",
      "phone": "662-624-3014",
      "city": "Clarksdale",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Copiah",
      "clerk": "Derrick Cubit",
      "phone": "601-894-1241",
      "city": "Hazlehurst",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Covington",
      "clerk": "Melissa Duckworth",
      "phone": "601-765-6506",
      "city": "Collins",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "DeSoto",
      "clerk": "Dale K. Thompson",
      "address": "2535 Hwy 51 S, Rm 201",
      "city": "Hernando",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Forrest",
      "clerk": "Gwen Wilks",
      "phone": "601-582-3213",
      "city": "Hattiesburg",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Franklin",
      "clerk": "Warren Walker",
      "phone": "601-384-2320",
      "city": "Meadville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "George",
      "clerk": "Chad Welford",
      "phone": "601-947-4881",
      "address": "355 Cox St., Ste C",
      "city": "Lucedale",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Greene",
      "clerk": "Cecelia Bounds",
      "phone": "601-394-2379",
      "city": "Leakesville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Grenada",
      "clerk": "Michele Garcia",
      "phone": "662-226-1941",
      "city": "Grenada",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Hancock",
      "clerk": "Kendra Necaise",
      "phone": "228-467-5265",
      "address": "152 Main Street, Suite B",
      "city": "Bay St. Louis",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Harrison",
      "clerk": "Justin Wetzel",
      "phone": "228-865-4051",
      "city": "Gulfport",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Hinds",
      "clerk": "Zack Wallace",
      "phone": "601-968-6628",
      "city": "Jackson",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Hinds (2nd District, Raymond)",
      "phone": "601-857-8038",
      "city": "Raymond",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Holmes",
      "clerk": "Brenda Travis",
      "phone": "662-834-2476",
      "city": "Lexington",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Humphreys",
      "clerk": "Marvin Jones",
      "phone": "662-247-3065",
      "city": "Belzoni",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Issaquena",
      "clerk": "Ronda Delaney",
      "phone": "662-873-2761",
      "city": "Mayersville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Itawamba",
      "phone": "662-862-3511",
      "address": "201 West Main Street",
      "city": "Fulton",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Jackson",
      "clerk": "Randy Carney",
      "phone": "228-769-3040",
      "city": "Pascagoula",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Jasper",
      "clerk": "Billy G. Rayner",
      "phone": "601-727-4941",
      "city": "Paulding",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Jefferson",
      "clerk": "Arnell Harried",
      "phone": "601-786-3422",
      "city": "Fayette",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Jefferson Davis",
      "clerk": "Clint W. Langley",
      "phone": "601-792-4231",
      "city": "Prentiss",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Jones",
      "clerk": "Greg \"Red\" Dickerson",
      "phone": "601-425-2556",
      "city": "Laurel",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Kemper",
      "clerk": "Shirley Steele Jackson",
      "phone": "601-743-2224",
      "city": "DeKalb",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Lafayette",
      "clerk": "Jeff Busby",
      "phone": "662-234-4951",
      "address": "1 Courthouse Square, Ste 101",
      "city": "Oxford",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Lamar",
      "clerk": "Martin Hankins",
      "phone": "601-794-3478",
      "address": "203 Main Street",
      "city": "Purvis",
      "sourceUrl": "https://lamarcountyms.gov/ms/departments/"
    },
    {
      "county": "Lauderdale",
      "phone": "601-482-9731",
      "address": "2600 Courthouse Blvd.",
      "city": "Meridian",
      "sourceUrl": "https://www.lauderdalecounty.org/?p=1108"
    },
    {
      "county": "Lawrence",
      "clerk": "Tracey Carney",
      "phone": "601-587-4791",
      "city": "Monticello",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Leake",
      "clerk": "Viktorea Pace",
      "phone": "601-267-8357",
      "city": "Carthage",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Lee",
      "clerk": "Camille Roberts Dulaney",
      "phone": "662-432-2300",
      "address": "200 West Jefferson Street (Lee County Justice Center)",
      "city": "Tupelo",
      "sourceUrl": "https://www.firstcircuitcourt.ms.gov/node/35"
    },
    {
      "county": "Leflore",
      "phone": "662-453-1435",
      "city": "Greenwood",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Lincoln",
      "clerk": "Dustin Bairfield",
      "phone": "601-835-3435",
      "address": "301 S. First St., Room 205",
      "city": "Brookhaven",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Lowndes",
      "clerk": "Teresa Barksdale",
      "phone": "662-329-5900",
      "city": "Columbus",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Madison",
      "clerk": "Anita Wray",
      "phone": "601-859-4365",
      "city": "Canton",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Marion",
      "clerk": "Janette Nolan",
      "phone": "601-736-8246",
      "address": "250 Broad Street, Suite 1",
      "city": "Columbia",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Marshall",
      "clerk": "Monet Bell Autry",
      "phone": "662-252-3434",
      "city": "Holly Springs",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Monroe",
      "clerk": "Dana L. Sloan",
      "phone": "662-369-8695",
      "city": "Aberdeen",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Montgomery",
      "clerk": "Robert Perry",
      "phone": "662-283-4161",
      "city": "Winona",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Neshoba",
      "clerk": "Delana Waddell",
      "phone": "601-656-4781",
      "address": "401 E. Beacon St., Ste 110",
      "city": "Philadelphia",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Newton",
      "clerk": "Mike Butler",
      "phone": "601-635-2368",
      "city": "Decatur",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Noxubee",
      "clerk": "Freda Phillips",
      "phone": "662-726-5737",
      "address": "505 South Jefferson",
      "city": "Macon",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Oktibbeha",
      "clerk": "Tony Rook",
      "phone": "662-323-1356",
      "address": "108 W. Main Street",
      "city": "Starkville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Panola",
      "clerk": "Heather Turner",
      "phone": "662-563-6210",
      "city": "Batesville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Pearl River",
      "clerk": "Nance Fitzpatrick Stokes",
      "address": "200 South Main Street",
      "city": "Poplarville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Perry",
      "clerk": "Christy Pittman Mayo",
      "phone": "601-964-8663",
      "city": "New Augusta",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Pike",
      "clerk": "Brenda Denise Robinson",
      "phone": "601-783-2581",
      "city": "Magnolia",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Pontotoc",
      "clerk": "Melinda Nowicki",
      "phone": "662-489-3908",
      "city": "Pontotoc",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Prentiss",
      "clerk": "Mike Kelley",
      "phone": "662-728-4611",
      "city": "Booneville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Quitman",
      "clerk": "Tia Windless Keeler",
      "phone": "662-326-8003",
      "address": "220 Chestnut St., Ste 4",
      "city": "Marks",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Rankin",
      "clerk": "Michelle Adcock",
      "phone": "601-825-1466",
      "city": "Brandon",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Scott",
      "clerk": "Becky Gray",
      "phone": "601-469-3601",
      "city": "Forest",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Sharkey",
      "clerk": "Murindia Williams",
      "phone": "662-873-2755",
      "city": "Rolling Fork",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Simpson",
      "clerk": "Witt Fortenberry",
      "phone": "601-847-2474",
      "city": "Mendenhall",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Smith",
      "clerk": "Anthony Grayson",
      "phone": "601-782-4751",
      "city": "Raleigh",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Stone",
      "clerk": "Treba Davis",
      "phone": "601-928-5246",
      "address": "323 Cavers Avenue",
      "city": "Wiggins",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Sunflower",
      "clerk": "Carolyn Hamilton",
      "phone": "662-887-1252",
      "city": "Indianola",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Tallahatchie",
      "clerk": "Daphane Neal",
      "phone": "662-647-8758",
      "city": "Charleston",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Tate",
      "clerk": "Kenda Blount",
      "phone": "662-562-5211",
      "address": "201 Ward Street",
      "city": "Senatobia",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Tippah",
      "clerk": "Phil Koon",
      "phone": "662-837-7370",
      "address": "102-A North Main",
      "city": "Ripley",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Tishomingo",
      "phone": "662-423-7026",
      "address": "1008 Battleground",
      "city": "Iuka",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Tunica",
      "clerk": "Sharon Granberry Reynolds",
      "phone": "662-363-2842",
      "city": "Tunica",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Union",
      "clerk": "Donna Treadaway",
      "phone": "662-534-1910",
      "city": "New Albany",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Walthall",
      "clerk": "Dan Hawn",
      "phone": "601-876-5677",
      "address": "200 Ball Avenue",
      "city": "Tylertown",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Warren",
      "clerk": "Jan Hyland Daigre",
      "phone": "601-636-3961",
      "city": "Vicksburg",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Washington",
      "clerk": "Barbara Esters-Parker",
      "phone": "662-378-2747",
      "city": "Greenville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Wayne",
      "clerk": "Kathryn Revette",
      "phone": "601-735-1171",
      "address": "609 Azalea",
      "city": "Waynesboro",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Webster",
      "clerk": "Wanda Berryhill Robinson",
      "phone": "662-258-6287",
      "address": "6333 Hwy 9, Suite 109",
      "city": "Walthall",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Wilkinson",
      "clerk": "Lynn Tolliver-Delaney",
      "phone": "601-888-6697",
      "city": "Woodville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Winston",
      "clerk": "Gwenita G. Mays",
      "phone": "662-773-3581",
      "city": "Louisville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Yalobusha",
      "clerk": "Daryl Burney",
      "phone": "662-675-8187",
      "city": "Coffeeville",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    },
    {
      "county": "Yazoo",
      "clerk": "Robert Coleman",
      "phone": "662-746-1872",
      "address": "209 E. Broadway St.",
      "city": "Yazoo City",
      "sourceUrl": "https://www.courts.ms.gov/trialcourts/circuitcourt/circuitclerks.pdf"
    }
  ],
};

// Stories tagged for the tracker, newest first.
export function getSenatePosts(): Post[] {
  return getPostsByTag(SENATE_TAG);
}

export interface SenateMargin {
  leader: SenateCandidate;
  trailer: SenateCandidate; // the runner-up
  margin: number; // votes; 0 is a tie
}

// Null until at least two candidates have vote totals.
export function getSenateMargin(
  candidates: SenateCandidate[] = SENATE_RACE.candidates,
): SenateMargin | null {
  const counted = candidates.filter(
    (c): c is SenateCandidate & { votes: number } => typeof c.votes === "number",
  );
  if (counted.length < 2) return null;
  const sorted = [...counted].sort((a, b) => b.votes - a.votes);
  return {
    leader: sorted[0],
    trailer: sorted[1],
    margin: sorted[0].votes - sorted[1].votes,
  };
}

function surname(name: string): string {
  return name.trim().split(/\s+/).pop() ?? name;
}

function votesWord(n: number): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "vote" : "votes"}`;
}

// "Colom leads by 2,010 votes", "Colom and Hyde-Smith are tied", or null.
export function senateMarginLine(m: SenateMargin | null = getSenateMargin()): string | null {
  if (!m) return null;
  if (m.margin === 0) return `${surname(m.leader.name)} and ${surname(m.trailer.name)} are tied`;
  return `${surname(m.leader.name)} leads by ${votesWord(m.margin)}`;
}

// Homepage banner headline, built from the data.
export function senateBannerHeadline(m: SenateMargin | null = getSenateMargin()): string {
  if (!m) return "Colom and Hyde-Smith race is too close to call";
  if (m.margin === 0) {
    return `${surname(m.leader.name)} and ${surname(m.trailer.name)} are tied as ballots are counted`;
  }
  return `${surname(m.leader.name)} leads ${surname(m.trailer.name)} by ${votesWord(m.margin)} as ballots are counted`;
}

const AP_MONTHS = [
  "Jan.", "Feb.", "March", "April", "May", "June",
  "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.",
];

// "Nov. 6" from a YYYY-MM-DD date (no time zone math).
export function apDate(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${AP_MONTHS[m - 1]} ${d}`;
}

// "Nov. 6, 9:00 a.m. CT" for an ISO instant, shown in America/Chicago.
export function apDateTimeCT(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  const meridiem = parts.dayPeriod?.toLowerCase().startsWith("p") ? "p.m." : "a.m.";
  return `${AP_MONTHS[Number(parts.month) - 1]} ${parts.day}, ${parts.hour}:${parts.minute} ${meridiem} CT`;
}

export function senateStatusLabel(status: SenateStatus = SENATE_RACE.status): string {
  return status === "called" ? "Called by AP" : status === "certified" ? "Certified" : "Uncalled";
}

// Deadlines sorted by date, each marked passed, next (the first upcoming) or
// upcoming, judged by today's date in Chicago at build or revalidate time.
export function getSenateDeadlines(today: string = todayLocalIso()) {
  const sorted = [...SENATE_RACE.deadlines].sort((a, b) => a.date.localeCompare(b.date));
  const nextIdx = sorted.findIndex((d) => d.date >= today);
  return sorted.map((d, i) => ({
    ...d,
    state: d.date < today ? ("passed" as const) : i === nextIdx ? ("next" as const) : ("upcoming" as const),
  }));
}

// The site's share image for the tracker to name outright (see
// SPORTS_SHARE_IMAGE in lib/sports.ts for why).
export const SENATE_SHARE_IMAGE = {
  url: absoluteUrl("/opengraph-image.png"),
  width: 1200,
  height: 630,
  alt: `${site.name}, with the tagline: ${site.tagline}`,
};

export const SENATE_FIRST_PUBLISHED = "2026-11-03T19:00:00-06:00";
