// NIL (name, image and likeness) on The Jackson Wire: the laws, court rulings
// and cases that shape what college athletes can be paid for, plus a guide.
//
// Laws and rulings are regular entries in lib/laws.ts and lib/rulings.ts filed
// under the topic "Sports and NIL"; this file only filters them. Cases that
// have no ruling entry yet go in NIL_CASES, and the long-form guide at
// /sports/nil/guide is NIL_GUIDE. The guide page stays unlisted (noindex, and
// out of the sitemap) until it has at least one section.
//
// Writing rules:
// - Plain words, for a bright 12-year-old, and never legal advice.
// - Every claim traces to a source listed with its section.
// - No em or en dashes. Write ranges as "5 to 15".
import { getAllLaws, type Law } from "./laws";
import { getAllRulings, type Ruling } from "./rulings";

const NIL_TOPIC = "Sports and NIL";

export const NIL_DISCLAIMER =
  "General information, not legal advice. NIL rules differ by state and school and change often.";

export function getNilLaws(): Law[] {
  return getAllLaws().filter((l) => (l.topics as string[]).includes(NIL_TOPIC));
}

export function getNilRulings(): Ruling[] {
  return getAllRulings().filter((r) => (r.topics as string[]).includes(NIL_TOPIC));
}

export interface NilCase {
  name: string;
  court: string;
  date: string;
  oneSentence: string;
  status: string;
  sourceUrl: string;
}

// New cases go at the top.
export const NIL_CASES: NilCase[] = [];

export const NIL_GUIDE: {
  updated: string | null;
  intro: string;
  sections: {
    id: string;
    heading: string;
    paragraphs: string[];
    sources: { name: string; url: string }[];
  }[];
  glossary: { term: string; meaning: string }[];
} = {
  updated: null,
  intro: "",
  sections: [],
  glossary: [],
};
