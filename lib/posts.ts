import { cache } from "react";

export interface Post {
  slug: string;
  title: string;
  dek: string;
  category: string; // primary section; shown as the article's tag
  categories?: string[]; // optional extra sections to cross-file the story under
  author: string;
  date: string; // ISO yyyy-mm-dd
  views: number;
  featured?: boolean;
  body: string[];
}

// All articles live here. To publish a new story, add an object to this array.
// The newest date appears first automatically. Mark one with `featured: true`
// to make it the big lead story on the homepage.
//
// Template:
// {
//   slug: "url-friendly-headline",            // becomes /article/url-friendly-headline
//   title: "Headline As It Appears",
//   dek: "One-sentence summary shown under the headline.",
//   category: "General News",                 // must match a section name exactly:
//                                             // "General News" | "Commercial Real Estate"
//                                             // | "Residential Real Estate" | "Politics"
//   author: "Byline Name",
//   date: "2026-05-25",                       // format: YYYY-MM-DD
//   views: 0,                                 // used only for "Most Read" ranking
//   featured: true,                           // optional; set on the lead story only
//   body: [
//     "First paragraph.",
//     "Second paragraph.",
//   ],
// },
const POSTS: Post[] = [
  {
    slug: "plea-deadline-may-29-will-banks-plead",
    title: "Plea Deadline May 29th: Will Banks Plead?",
    dek: "An analysis: of the three men headed to trial in Jackson's biggest corruption case, Aaron Banks has always been the quiet one — and the quiet may be calculated.",
    category: "Politics",
    categories: ["General News"],
    author: "Jackson Wire Staff",
    date: "2026-05-25",
    views: 0,
    featured: true,
    body: [
      "Of the three men headed to trial in Jackson's biggest corruption case, Aaron Banks has always been the quiet one. The former city councilman has said almost nothing in public — \"I have nothing to say,\" he told one reporter — while District Attorney Jody Owens calls the case an \"assassination\" of his character and the former mayor argues constitutional theory in the press.",
      "But quiet may be the smartest move in the room. And it makes Banks the man to watch as the May 29 plea deadline closes in.",
      "Here's why. Banks faces the fewest counts of the three. He's accused of accepting the smallest amount — roughly $10,000, plus a protective detail and a job offer for his daughter. Two of his co-conspirators, Angelique Lee and Marve' Smith, already pleaded guilty and are sitting unsentenced, the classic sign of cooperators waiting to testify. The math for Banks is simple and brutal: a single-count plea caps his exposure at five years, while a trial loss alongside the man prosecutors call the scheme's \"lynchpin\" could be far worse.",
      "There's also a wrinkle in his favor. Banks asked the judge to sever his trial from Owens's — to not be tried beside a man caught on tape talking about \"cleaning\" money and keeping a \"bag of information\" on the council. The judge said no. So unless Banks pleads, he sits at the same table as the loudest defendant in Mississippi, while a jury hears weeks of recordings that mostly aren't his. The defense does have a real argument that could tempt Banks to roll the dice: the city never actually held the vote he supposedly sold. The council doesn't vote on the kind of application the developers submitted. No vote, the defense says, means no bribe — just a promise about something that was never going to happen.",
      "So the calculation comes down to nerve. Plead now, take the cap, and try for the lightest sentence of anyone charged. Or bet that a jury sees a quiet councilman who got swept up in someone else's scheme.",
      "May 29 is the tell. If Banks is going to fold, he'll do it before he ever sees that courtroom.",
    ],
  },
];

const sortByDateDesc = (a: Post, b: Post) => b.date.localeCompare(a.date);

export const getAllPosts = cache((): Post[] =>
  [...POSTS].sort(sortByDateDesc),
);

export const getPostBySlug = cache((slug: string): Post | undefined =>
  POSTS.find((p) => p.slug === slug),
);

export const getFeaturedPost = cache((): Post | undefined =>
  getAllPosts().find((p) => p.featured) ?? getAllPosts()[0],
);

export function getPostsByCategorySlug(categorySlug: string): Post[] {
  return getAllPosts().filter((p) =>
    [p.category, ...(p.categories ?? [])].some(
      (c) => slugifyCategory(c) === categorySlug,
    ),
  );
}

export function getMostRead(limit = 5): Post[] {
  return [...POSTS].sort((a, b) => b.views - a.views).slice(0, limit);
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .concat(getAllPosts().filter((p) => p.slug !== post.slug && p.category !== post.category))
    .slice(0, limit);
}

export function slugifyCategory(name: string): string {
  return name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function readingTime(post: Post): number {
  const words = post.body.join(" ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
