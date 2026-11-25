// Reads the boil-water notices out of JXN Water's public notices page
// (https://jxnwater.com/boil-water-notices/). Pure: no network, no Next.js,
// so `node --test lib/boil-water-parse.test.mjs` can run it against a saved
// copy of the page.
//
// The page lists each notice as a collapsible block inside a page column:
//   <div class="et_pb_module et_pb_toggle ...">
//     <h5 class="et_pb_toggle_title">Monday, November 23, 2026 - Arbor Hills Drive</h5>
//     <div class="et_pb_toggle_content clearfix"> ...address ranges, customers affected... </div>
//   </div>
// Notices in effect fill one column. Lifted ones sit in a second column under
// a "Recently Resolved Notices" heading.
//
// This is public-safety information, so the parser fails closed. It returns
// null, and the site says it could not read the list, unless all of this
// holds:
//   - the page has exactly one "Recently Resolved Notices" heading;
//   - it found at least one notice, and as many notice headings as there are
//     notice blocks, so a renamed heading cannot empty the list quietly;
//   - where a notice sits in the page and which column it is in agree on
//     whether it is in effect, so a reshuffled layout cannot file a notice in
//     effect under "resolved".
// Text in the notices area that is not a notice and not the page's usual
// introduction is handed back in `other`, so a notice JXN Water posts in some
// new form is shown to readers rather than dropped.

export interface NoticeArea {
  // The line as JXN Water wrote it, brackets removed.
  text: string;
  // Set when the line reads "[2810-2897] Arbor Hills Dr".
  from?: string;
  to?: string;
  street?: string;
}

export interface BoilNotice {
  // The heading as posted, e.g. "Monday, November 23, 2026 - Arbor Hills Drive".
  title: string;
  // ISO yyyy-mm-dd, or null when the heading's date could not be read.
  issued: string | null;
  // The street or neighborhood named in the heading.
  place: string;
  areas: NoticeArea[];
  // "approximately 44 connection(s)", or null when the notice gives no count.
  connections: number | null;
}

export interface BoilNoticeList {
  active: BoilNotice[];
  resolved: BoilNotice[];
  // Lines in the notices area the parser did not recognize, as written.
  other: string[];
}

// The heading that opens the notices area.
const PAGE_RE = /<h[1-6]\b[^>]*>\s*Precautionary Boil Water Notices\s*<\/h[1-6]>/i;

// A class attribute that carries `name` as one of its space-separated classes.
const hasClass = (name: string) => `\\bclass="(?:[^"]*\\s)?${name}(?:\\s[^"]*)?"`;

// The heading of one notice, whatever its heading level or extra attributes.
const TITLE_RE = new RegExp(`<(h[1-6])\\b[^>]*${hasClass("et_pb_toggle_title")}[^>]*>`, "gi");
// One notice block.
const TOGGLE_RE = new RegExp(`<[a-z][a-z0-9]*\\b[^>]*${hasClass("et_pb_toggle")}`, "gi");
// Any page module, and any page column.
const MODULE_RE = new RegExp(`<div\\b[^>]*${hasClass("et_pb_module")}`, "gi");
const COLUMN_RE = new RegExp(`<div\\b[^>]*${hasClass("et_pb_column")}`, "gi");
const RESOLVED_RE = /<h[1-6]\b[^>]*>\s*Recently Resolved Notices\s*<\/h[1-6]>/gi;

// The usual lines around the notices: how each begins (lowercased) and how
// long it was when this was written. Anything else in the notices area is
// reported in `other`. So is one of these lines if it has grown or shrunk by
// more than LENGTH_SLACK characters, which is what a sentence added to it
// (say, about a wider notice) would do. The page's bare "JXN Water" heading
// is shorter than MIN_OTHER_CHARS and is skipped on that ground.
const KNOWN_LINES: { start: string; length: number; exact?: boolean }[] = [
  // The two headings must be exactly themselves.
  { start: "precautionary boil water notices", length: 32, exact: true },
  { start: "a boil water notice is a precautionary notice", length: 233 },
  { start: "all customers under a notice are advised", length: 372 },
  { start: "residents will be notified immediately", length: 137 },
  { start: "recently resolved notices", length: 25, exact: true },
];
const LENGTH_SLACK = 20;
const MIN_OTHER_CHARS = 12;
const MAX_OTHER_LINES = 6;
const MAX_OTHER_CHARS = 400;

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return whole;
      // Dashes and non-breaking spaces become plain ones so headings split
      // and trim the same way however JXN Water typed them.
      if (code === 0x2013 || code === 0x2014) return "-";
      if (code === 0xa0) return " ";
      return String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named === undefined ? whole : named;
  });
}

// Turns a block of HTML into trimmed, non-empty lines of text.
function htmlToLines(html: string): string[] {
  const text = decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d)>/gi, "\n")
      .replace(/<[^>]*>/g, ""),
  );
  return text
    .split("\n")
    .map((line) =>
      line
        // A typed en or em dash becomes a hyphen, as the encoded ones do.
        .replace(/[–—]/g, "-")
        .replace(/[ \s]+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function parseIssued(label: string): string | null {
  const m = label.match(/([A-Za-z]+)\.?\s+(\d{1,2}),?\s*(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (!month) return null;
  const day = Number(m[2]);
  if (day < 1 || day > 31) return null;
  return `${m[3]}-${month}-${String(day).padStart(2, "0")}`;
}

// "[2810-2897] Arbor Hills Dr" is a range and "[834] Foley St" a single
// address. Stray characters before the bracket are ignored. Any other line is
// kept as text with no range.
function parseArea(line: string): NoticeArea {
  const m = line.match(
    /^[^A-Za-z0-9[]*\[\s*(\d+[A-Za-z]?)\s*(?:-\s*(\d+[A-Za-z]?)\s*)?\]\s*(.*[A-Za-z].*)$/,
  );
  // A second bracket or number range in the street part ("[100-200] and
  // [300-400] Main St") means one range does not describe the line.
  if (m && !/[[\]]|\d\s*-\s*\d/.test(m[3])) {
    const street = m[3].trim();
    const to = m[2] ?? m[1];
    const range = m[2] ? `${m[1]} to ${m[2]}` : m[1];
    return { text: `${range} ${street}`, from: m[1], to, street };
  }
  return { text: line.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim() };
}

function parseNotice(titleHtml: string, bodyHtml: string): BoilNotice | null {
  const title = htmlToLines(titleHtml).join(" ");
  if (!title) return null;

  // "Monday, November 23, 2026 - Arbor Hills Drive": the date, then the place.
  // A heading that does not open with a date is kept whole as the place.
  const split = title.match(
    /^((?:[A-Za-z]+,?\s+)?[A-Za-z]+\.?\s+\d{1,2},?\s*\d{4})\s*[-:,]?\s*(.+)$/,
  );
  const issued = split ? parseIssued(split[1]) : null;
  const place = split && issued ? split[2].trim() : title;

  const lines = htmlToLines(bodyHtml);
  const areas: NoticeArea[] = [];
  for (const raw of lines) {
    if (/customers?\s+affected/i.test(raw)) break;
    const line = raw.replace(/^areas?\s*:\s*/i, "").trim();
    if (!line) continue;
    areas.push(parseArea(line));
  }

  const count = lines.join(" ").match(/approximately\s+([\d,]+)\s+connection/i);
  const connections = count ? Number(count[1].replace(/,/g, "")) : null;

  return {
    title,
    issued,
    place,
    areas,
    connections: connections !== null && Number.isFinite(connections) ? connections : null,
  };
}

// The first index in a sorted list that is greater than `after`, or -1.
function firstAfter(sorted: number[], after: number): number {
  for (const i of sorted) if (i > after) return i;
  return -1;
}

function indexesOf(re: RegExp, text: string): number[] {
  return [...text.matchAll(re)].map((m) => m.index);
}

export function parseBoilWaterPage(html: string): BoilNoticeList | null {
  if (typeof html !== "string") return null;
  const heading = html.match(PAGE_RE);
  if (!heading || heading.index === undefined) return null;

  // The notices area is the article that holds the heading (or, failing
  // that, everything from the heading on), up to the end of the article.
  const article = html.lastIndexOf("<article", heading.index);
  const start = article === -1 ? heading.index : article;
  const ends = [
    html.indexOf("</article>", heading.index),
    html.indexOf("<footer", heading.index),
  ].filter((i) => i !== -1);
  const region = html
    .slice(start, ends.length > 0 ? Math.min(...ends) : html.length)
    // Script and style text is never a notice.
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");

  // Exactly one "Recently Resolved Notices" heading, or there is no telling a
  // notice in effect from one that was lifted.
  const resolvedHeads = indexesOf(RESOLVED_RE, region);
  if (resolvedHeads.length !== 1) return null;
  const resolvedAt = resolvedHeads[0];

  const columns = indexesOf(COLUMN_RE, region);
  const columnOf = (i: number) => {
    let column = -1;
    for (const c of columns) {
      if (c > i) break;
      column = c;
    }
    return column;
  };
  const resolvedColumn = columnOf(resolvedAt);
  if (resolvedColumn === -1) return null;

  // Every notice block must have a heading this parser can read, and there
  // must be at least one, or the page is not the one this was written for.
  const titles = [...region.matchAll(TITLE_RE)];
  if (titles.length === 0 || titles.length !== indexesOf(TOGGLE_RE, region).length) return null;

  const modules = indexesOf(MODULE_RE, region);
  const list: BoilNoticeList = { active: [], resolved: [], other: [] };
  const covered: [number, number][] = [];

  for (let t = 0; t < titles.length; t++) {
    const at = titles[t].index;
    const tag = titles[t][1];
    const titleStart = at + titles[t][0].length;
    const close = region.slice(titleStart).search(new RegExp(`</${tag}>`, "i"));
    if (close === -1) return null;
    const titleEnd = titleStart + close;
    const next = t + 1 < titles.length ? titles[t + 1].index : -1;
    // A heading that runs into the next one never closed.
    if (next !== -1 && titleEnd > next) return null;

    // The notice's text runs to whatever comes next on the page: another
    // module, another column, or the "Recently Resolved" heading.
    const stops = [
      firstAfter(modules, titleEnd),
      firstAfter(columns, titleEnd),
      resolvedAt > titleEnd ? resolvedAt : -1,
      next,
    ].filter((i) => i !== -1);
    const bodyEnd = stops.length > 0 ? Math.min(...stops) : region.length;

    const notice = parseNotice(
      region.slice(titleStart, titleEnd),
      region.slice(titleEnd + `</${tag}>`.length, bodyEnd),
    );
    // A block with a heading but no readable notice means the page changed.
    if (!notice) return null;

    // In effect or lifted? Position on the page and the column must agree.
    const afterHeading = at > resolvedAt;
    if (afterHeading !== (columnOf(at) === resolvedColumn)) return null;
    (afterHeading ? list.resolved : list.active).push(notice);
    covered.push([at, bodyEnd]);
  }

  // Whatever is left in the notices area once the notices are taken out.
  let rest = "";
  let cursor = 0;
  for (const [from, to] of covered) {
    rest += `${region.slice(cursor, from)}\n`;
    cursor = to;
  }
  rest += region.slice(cursor);
  for (const line of htmlToLines(rest)) {
    const lower = line.toLowerCase();
    const usual = KNOWN_LINES.some(
      (known) =>
        lower.startsWith(known.start) &&
        Math.abs(line.length - known.length) <= (known.exact ? 0 : LENGTH_SLACK),
    );
    if (usual || line.length < MIN_OTHER_CHARS) continue;
    if (list.other.length < MAX_OTHER_LINES) list.other.push(line.slice(0, MAX_OTHER_CHARS));
  }

  return list;
}
