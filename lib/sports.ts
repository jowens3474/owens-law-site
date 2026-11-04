// Sports on The Jackson Wire: Mississippi college and high school sports, the
// SEC, national college sports and NIL (name, image and likeness) deals, laws
// and cases.
//
// Sports stories are regular posts in lib/posts.ts with the category
// "General News" and exactly one `sports-*` tag (the tag of a section below).
// There is deliberately no Sports category: categories feed the nav, the
// footer, the sitemap, the feeds and many other lists, and a Sports category
// would spread through all of them. The /sports pages find stories by tag
// instead, and the homepage lead skips them (see getFeaturedPost).
//
// Each section also shows live headlines from other outlets. The registry and
// routing are in lib/sports-feeds.mjs; /api/sports/headlines serves them as one
// small JSON (ISR, hourly) and the pages load it in the browser. Feeds are read
// with node:https, not fetch, so raw feed bodies never enter Next's Data Cache
// (every cache write is billed on Vercel Hobby).
//
// To add a section, add it to SPORTS_SECTIONS. The route, the tab strip, the
// sitemap, llms.txt and the article "From this beat" link all derive from it.
import { absoluteUrl } from "./markdown";
import { getPostsByTag, type Post } from "./posts";
import { site } from "./site";

export interface SportsSection {
  slug: string; // becomes /sports/<slug>
  name: string;
  tag: string; // "sports-<slug>"
  blurb: string;
}

export const SPORTS_SECTIONS: SportsSection[] = [
  {
    slug: "ms-college",
    name: "Mississippi College Sports",
    tag: "sports-ms-college",
    blurb:
      "Men's and women's basketball, baseball and football at Ole Miss, Mississippi State, Southern Miss, Jackson State, Alcorn State, Mississippi Valley State, Delta State and the state's other colleges.",
  },
  {
    slug: "ms-high-school",
    name: "Mississippi High School and Recruiting",
    tag: "sports-ms-high-school",
    blurb:
      "Mississippi high school teams, players and championships, and the recruiting that sends them to college programs.",
  },
  {
    slug: "national",
    name: "National College Sports",
    tag: "sports-national",
    blurb:
      "The college sports stories beyond Mississippi: conferences, championships, the transfer portal and the business of the games.",
  },
  {
    slug: "sec",
    name: "SEC",
    tag: "sports-sec",
    blurb:
      "The Southeastern Conference, home to Ole Miss and Mississippi State: schedules, standings, rules and the money behind the league.",
  },
  {
    slug: "nil",
    name: "NIL: Deals, Laws and Cases",
    tag: "sports-nil",
    blurb:
      "Name, image and likeness: what athletes can be paid, the state and federal laws that govern it, and the court cases that are changing it.",
  },
];

export function getSportsSection(slug: string): SportsSection | undefined {
  return SPORTS_SECTIONS.find((s) => s.slug === slug);
}

// Newest first, because getPostsByTag reads the date-sorted published list.
export function getSportsPosts(tag: string, limit?: number): Post[] {
  const posts = getPostsByTag(tag);
  return limit === undefined ? posts : posts.slice(0, limit);
}

export function isSportsPost(post: Post): boolean {
  return (post.tags ?? []).some((t) => SPORTS_SECTIONS.some((s) => s.tag === t));
}

// The site's share image (app/opengraph-image.png) for the sports pages to
// name outright. A page that sets its own openGraph or twitter replaces the
// root layout's, and with it the file-based image, so without this a page
// shared on social media would carry no picture.
export const SPORTS_SHARE_IMAGE = {
  url: absoluteUrl("/opengraph-image.png"),
  width: 1200,
  height: 630,
  alt: `${site.name}, with the tagline: ${site.tagline}`,
};
