// The Wire's standing guide pages. This is the one list of them. The footer,
// the sidebar box, the sitemap, llms.txt, the /guides index and the "More
// Jackson Guides" box on each guide page (app/components/MoreGuides.tsx) all
// read it, so a new guide is added here once.

import { TRASH } from "./jackson-trash";
import { COUNCIL } from "./jackson-council";
import { JPS } from "./jackson-schools";
import { HOMICIDES } from "./jackson-homicides";

export interface Guide {
  href: string;
  // Short name for the footer column.
  footerLabel: string;
  // Headline for the sidebar box and the /guides index.
  label: string;
  // Headline used when another guide page links to this one.
  crossLabel: string;
  // One sentence on what the page holds, for the /guides index.
  summary: string;
  // Title and description as listed in llms.txt.
  llmsTitle: string;
  llmsSummary: string;
  // ISO date the page's facts were last compared with their sources, or null
  // for a page that reads its source itself. Such a page sets `liveNote`, one
  // sentence saying how fresh its reading is, in place of a checked date.
  checked: string | null;
  liveNote?: string;
  changeFrequency: "hourly" | "daily" | "weekly" | "monthly";
  priority: number;
}

export const GUIDES: Guide[] = [
  {
    href: "/boil-water-notices",
    footerLabel: "Boil-Water Notices",
    label: "Boil-water notices in effect today",
    crossLabel: "Jackson boil-water notices in effect today",
    summary:
      "The notices JXN Water lists as in effect, with streets and address ranges, and what to do while under one.",
    llmsTitle: "Jackson boil-water notices today",
    llmsSummary:
      "The notices JXN Water lists as in effect, with streets and address ranges, read from JXN Water no more than five minutes before each visit.",
    checked: null,
    liveNote:
      "Read from JXN Water’s notices page no more than five minutes before you open the guide.",
    changeFrequency: "hourly",
    priority: 0.9,
  },
  {
    href: "/trash-pickup",
    footerLabel: "Trash Pickup",
    label: "Trash pickup: schedule, holidays and rules",
    crossLabel: "Jackson trash pickup: schedule, holidays and rules",
    summary:
      "Twice-a-week collection rules, the holiday schedule, bulk items, and who to call about a missed pickup.",
    llmsTitle: "Jackson trash pickup",
    llmsSummary:
      "Twice-a-week collection rules, the holiday schedule, bulk items, and who to call about a missed pickup.",
    checked: TRASH.checked,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    href: "/city-council",
    footerLabel: "City Council Guide",
    label: "City Council: members, meetings, how to speak",
    crossLabel: "Jackson City Council: members, meetings and how to speak",
    summary:
      "Members by ward with contacts, the meeting schedule, agendas, video, and how to sign up to speak.",
    llmsTitle: "Jackson City Council",
    llmsSummary:
      "Members by ward with contacts, the meeting schedule, agendas, video, and how to sign up to speak.",
    checked: COUNCIL.checked,
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    href: "/jackson-public-schools",
    footerLabel: "Jackson Public Schools",
    label: "Jackson Public Schools: calendar, board, pay",
    crossLabel: "Jackson Public Schools: calendar, board, pay and enrollment",
    summary:
      "The 2026-27 school calendar, the school board and its meetings, how to speak at one, pay scales, how to enroll and who to call.",
    llmsTitle: "Jackson Public Schools guide",
    llmsSummary:
      "The district's 2026-27 calendar, school board members and meetings, how to sign up to speak, the superintendent, salary scales, enrollment steps and contacts.",
    checked: JPS.checked,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    href: "/jackson-homicides",
    footerLabel: "Homicides by Year",
    label: "Jackson homicides by year, with sources",
    crossLabel: "Jackson homicides by year: counts and their sources",
    summary:
      "The number of homicides in Jackson for each year since 2015, with the source of every count shown beside it, and the 2026 count as of a stated date.",
    llmsTitle: "Jackson homicides by year",
    llmsSummary:
      "Homicides in Jackson, Mississippi, for each year since 2015, with each count attributed to its source (WLBT, the Clarion Ledger, the FBI, and police figures as reported by news outlets), the 2026 count as of a stated date, and rates per 100,000 residents computed by the Wire from WLBT's counts and Census estimates.",
    checked: HOMICIDES.checked,
    changeFrequency: "monthly",
    priority: 0.8,
  },
];

// How many guides the sidebar box and the footer column list before they
// point to the full index at /guides.
export const SIDEBAR_GUIDE_COUNT = 5;
export const FOOTER_GUIDE_COUNT = 4;
