// The Wire's standing guide pages. This is the one list of them: the footer,
// the sidebar, the sitemap, llms.txt and the /guides index all read it, so a
// new guide is added here once and shows up everywhere.

import { TRASH } from "./jackson-trash";
import { COUNCIL } from "./jackson-council";

export interface Guide {
  href: string;
  // Short name for the footer column.
  footerLabel: string;
  // Headline for the sidebar box and the /guides index.
  label: string;
  // One sentence on what the page holds, for the /guides index.
  summary: string;
  // Title and description as listed in llms.txt.
  llmsTitle: string;
  llmsSummary: string;
  // ISO date the page's facts were last compared with their sources, or null
  // for a page that reads its source when a reader opens it.
  checked: string | null;
  changeFrequency: "hourly" | "daily" | "weekly" | "monthly";
  priority: number;
}

export const GUIDES: Guide[] = [
  {
    href: "/boil-water-notices",
    footerLabel: "Boil-Water Notices",
    label: "Boil-water notices in effect today",
    summary:
      "The notices JXN Water lists as in effect, with streets and address ranges, and what to do while under one.",
    llmsTitle: "Jackson boil-water notices today",
    llmsSummary:
      "The notices JXN Water lists as in effect, with streets and address ranges, read from JXN Water no more than five minutes before each visit.",
    checked: null,
    changeFrequency: "hourly",
    priority: 0.9,
  },
  {
    href: "/trash-pickup",
    footerLabel: "Trash Pickup",
    label: "Trash pickup: schedule, holidays and rules",
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
    summary:
      "Members by ward with contacts, the meeting schedule, agendas, video, and how to sign up to speak.",
    llmsTitle: "Jackson City Council",
    llmsSummary:
      "Members by ward with contacts, the meeting schedule, agendas, video, and how to sign up to speak.",
    checked: COUNCIL.checked,
    changeFrequency: "daily",
    priority: 0.8,
  },
];

// How many guides the sidebar box lists before it points to the full index.
export const SIDEBAR_GUIDE_COUNT = 5;
