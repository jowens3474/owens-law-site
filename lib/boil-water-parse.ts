// Reads the boil-water notices out of JXN Water's public notices page
// (https://jxnwater.com/boil-water-notices/). Pure: no network, no Next.js,
// so `node --test lib/boil-water-parse.test.ts` can run it against a saved
// copy of the page.
//
// The page lists each notice as a collapsible block:
//   <h5 class="et_pb_toggle_title">Monday, November 23, 2026 - Arbor Hills Drive</h5>
//   <div class="et_pb_toggle_content clearfix"> ...address ranges, customers affected... </div>
// Notices in effect come first. Lifted ones follow a "Recently Resolved
// Notices" heading.
//
// This is public-safety information, so the parser fails closed. If the page
// does not look the way it did when this was written, it returns null and the
// site says it could not read the list. It never guesses, and it never
// reports "no notices" for a page it did not recognize.

export interface NoticeArea {
  // The line exactly as JXN Water wrote it, brackets removed.
  text: string;
  // Set when the line reads "[2810-2897] Arbor Hills Dr".
  from?: string;
  to?: string;
  street?: string;
}

export interface BoilNotice {
  // The heading exactly as posted, e.g. "Monday, November 23, 2026 - Arbor Hills Drive".
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
}

const TITLE_OPEN = '<h5 class="et_pb_toggle_title">';
const PAGE_MARK = "Precautionary Boil Water Notices";
const RESOLVED_MARK = "Recently Resolved Notices";

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
    .map((line) => line.replace(/[ \s]+/g, " ").trim())
    .filter(Boolean);
}

function parseIssued(label: string): string | null {
  const m = label.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (!month) return null;
  const day = Number(m[2]);
  if (day < 1 || day > 31) return null;
  return `${m[3]}-${month}-${String(day).padStart(2, "0")}`;
}

function parseArea(line: string): NoticeArea {
  const m = line.match(/^\[\s*(\d+[A-Za-z]?)\s*-\s*(\d+[A-Za-z]?)\s*\]\s*(.+)$/);
  if (m) {
    const street = m[3].trim();
    return { text: `${m[1]} to ${m[2]} ${street}`, from: m[1], to: m[2], street };
  }
  return { text: line.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim() };
}

function parseNotice(titleHtml: string, bodyHtml: string): BoilNotice | null {
  const title = htmlToLines(titleHtml).join(" ").replace(/[–—]/g, "-");
  if (!title) return null;

  // "Monday, November 23, 2026 - Arbor Hills Drive": date, then the place.
  const split = title.match(/^(.*?\d{4})\s*-\s*(.+)$/);
  const dateLabel = split ? split[1] : title;
  const place = split ? split[2].trim() : title;

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
    issued: parseIssued(dateLabel),
    place,
    areas,
    connections: connections !== null && Number.isFinite(connections) ? connections : null,
  };
}

export function parseBoilWaterPage(html: string): BoilNoticeList | null {
  if (typeof html !== "string" || !html.includes(PAGE_MARK)) return null;

  // Without the "Recently Resolved Notices" heading there is no telling a
  // notice in effect from one that was lifted, so read nothing.
  const resolvedAt = html.indexOf(RESOLVED_MARK);
  if (resolvedAt === -1) return null;

  const list: BoilNoticeList = { active: [], resolved: [] };
  let cursor = html.indexOf(TITLE_OPEN);
  while (cursor !== -1) {
    const titleStart = cursor + TITLE_OPEN.length;
    const titleEnd = html.indexOf("</h5>", titleStart);
    if (titleEnd === -1) return null;
    const next = html.indexOf(TITLE_OPEN, titleEnd);

    // The notice's text runs to the next page module: the next notice, the
    // "Recently Resolved" heading, or the end of the article.
    const stops = [
      html.indexOf('<div class="et_pb_module', titleEnd),
      html.indexOf("</article>", titleEnd),
      html.indexOf("<footer", titleEnd),
      next,
    ].filter((i) => i !== -1);
    const bodyEnd = stops.length > 0 ? Math.min(...stops) : html.length;

    const notice = parseNotice(html.slice(titleStart, titleEnd), html.slice(titleEnd + 5, bodyEnd));
    // A block with a heading but no readable notice means the page changed.
    if (!notice) return null;
    (cursor < resolvedAt ? list.active : list.resolved).push(notice);
    cursor = next;
  }
  return list;
}
