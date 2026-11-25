// Run with: node --test lib/boil-water-parse.test.mjs
// The fixture is the notices area of https://jxnwater.com/boil-water-notices/
// as it was served on Nov. 23, 2026: 7 notices in effect, 59 resolved.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBoilWaterPage } from "./boil-water-parse.ts";

const html = readFileSync(
  new URL("./fixtures/jxn-water-notices-2026-11-23.html", import.meta.url),
  "utf8",
);

// The two page columns in the fixture: notices in effect, then resolved ones.
const ACTIVE_COLUMN = html.indexOf('<div class="et_pb_column et_pb_column_3_5');
const RESOLVED_COLUMN = html.indexOf('<div class="et_pb_column et_pb_column_2_5');

test("the fixture has the two columns the tests rearrange", () => {
  assert.ok(ACTIVE_COLUMN > 0 && RESOLVED_COLUMN > ACTIVE_COLUMN);
});

test("reads the notices in effect and the lifted ones separately", () => {
  const list = parseBoilWaterPage(html);
  assert.ok(list);
  assert.equal(list.active.length, 7);
  assert.equal(list.resolved.length, 59);
  assert.equal(list.active.at(-1).place, "Seneca Avenue");
  assert.equal(list.resolved[0].place, "Roxbury Road");
  assert.deepEqual(list.other, []);
});

test("reads the date, place, address ranges and connections of a notice", () => {
  const [first] = parseBoilWaterPage(html).active;
  assert.equal(first.title, "Monday, November 23, 2026 - Arbor Hills Drive");
  assert.equal(first.issued, "2026-11-23");
  assert.equal(first.place, "Arbor Hills Drive");
  assert.equal(first.connections, 44);
  assert.deepEqual(
    first.areas.map((a) => a.text),
    [
      "2810 to 2897 Arbor Hills Dr",
      "2806 to 2852 Englewood Blvd",
      "2811 to 2907 Kingswood Ave",
    ],
  );
  assert.deepEqual(first.areas[0], {
    text: "2810 to 2897 Arbor Hills Dr",
    from: "2810",
    to: "2897",
    street: "Arbor Hills Dr",
  });
});

test("every notice on the page has a date, a place and at least one area", () => {
  const list = parseBoilWaterPage(html);
  for (const n of [...list.active, ...list.resolved]) {
    assert.match(n.issued ?? "", /^2026-\d{2}-\d{2}$/, n.title);
    assert.ok(n.place.length > 2, n.title);
    assert.ok(n.areas.length >= 1, n.title);
    for (const a of n.areas) {
      assert.doesNotMatch(a.text, /customers affected|[<>[\]–—]/i, n.title);
    }
  }
});

test("reads a notice whose text sits inside nested blocks", () => {
  const last = parseBoilWaterPage(html).resolved.at(-1);
  assert.equal(last.place, "Latimer Avenue");
  assert.equal(last.issued, "2026-10-26");
  assert.equal(last.connections, 15);
  assert.deepEqual(last.areas.map((a) => a.text), ["2602 to 2635 Latimer Ave"]);
});

test("still reads the page when the notice headings gain attributes or change level", () => {
  const extra = html.replaceAll(
    '<h5 class="et_pb_toggle_title">',
    '<h5 role="button" class="et_pb_toggle_title open" tabindex="0">',
  );
  const a = parseBoilWaterPage(extra);
  assert.equal(a.active.length, 7);
  assert.equal(a.resolved.length, 59);
  assert.equal(a.active[0].place, "Arbor Hills Drive");

  const h4 = html
    .replaceAll('<h5 class="et_pb_toggle_title">', '<h4 class="et_pb_toggle_title">')
    .replaceAll("</h5>", "</h4>");
  const b = parseBoilWaterPage(h4);
  assert.equal(b.active.length, 7);
  assert.equal(b.resolved.length, 59);
});

test("no notices in effect is valid when lifted ones are still listed", () => {
  const none = html.slice(0, ACTIVE_COLUMN) +
    '<div class="et_pb_column et_pb_column_3_5 et_pb_column_3"></div>' +
    html.slice(RESOLVED_COLUMN);
  const list = parseBoilWaterPage(none);
  assert.equal(list.active.length, 0);
  assert.equal(list.resolved.length, 59);
});

test("fails closed on a page it does not recognize", () => {
  assert.equal(parseBoilWaterPage(""), null);
  assert.equal(parseBoilWaterPage("<h1>Sorry, you have been blocked</h1>"), null);
  assert.equal(parseBoilWaterPage(undefined), null);
});

test("fails closed when the page has no notices at all", () => {
  const bare =
    '<h2>Precautionary Boil Water Notices</h2><div class="et_pb_column"><p>None.</p>' +
    "<h3>Recently Resolved Notices</h3></div>";
  assert.equal(parseBoilWaterPage(bare), null);
});

test("fails closed when the notice headings are renamed", () => {
  const renamed = html.replaceAll("et_pb_toggle_title", "et_pb_accordion_heading");
  assert.equal(parseBoilWaterPage(renamed), null);
});

test("fails closed without exactly one Recently Resolved heading", () => {
  assert.equal(
    parseBoilWaterPage(html.replace("Recently Resolved Notices", "Older Notices")),
    null,
  );
  const twice = html.replace(
    "<h3>Recently Resolved Notices</h3>",
    "<h3>Recently Resolved Notices</h3><h3>Recently Resolved Notices</h3>",
  );
  assert.equal(parseBoilWaterPage(twice), null);
});

test("the words Recently Resolved Notices in a paragraph do not move the line", () => {
  const mention = html.replace(
    "<h2>Precautionary Boil Water Notices</h2>",
    "<h2>Precautionary Boil Water Notices</h2><p>Lifted notices move to Recently Resolved Notices.</p>",
  );
  const list = parseBoilWaterPage(mention);
  assert.equal(list.active.length, 7);
  assert.equal(list.resolved.length, 59);
});

test("fails closed when the two columns swap places", () => {
  // Keep both columns inside the article, resolved column first.
  const end = html.indexOf("</article>");
  assert.ok(end > RESOLVED_COLUMN);
  const swapped =
    html.slice(0, ACTIVE_COLUMN) +
    html.slice(RESOLVED_COLUMN, end) +
    html.slice(ACTIVE_COLUMN, RESOLVED_COLUMN) +
    html.slice(end);
  assert.ok(swapped.indexOf("Roxbury Road") < swapped.indexOf("Arbor Hills Drive"));
  assert.equal(parseBoilWaterPage(swapped), null);
});

test("fails closed when a heading never closes", () => {
  const broken = html.replace("Arbor Hills Drive</h5>", "Arbor Hills Drive");
  assert.equal(parseBoilWaterPage(broken), null);
});

test("hands back text in the notices area that is not a notice", () => {
  const banner = html.replace(
    "<h2>Precautionary Boil Water Notices</h2>",
    "<h2>Precautionary Boil Water Notices</h2><p>A citywide boil water notice is in effect for all JXN Water customers.</p>",
  );
  const list = parseBoilWaterPage(banner);
  assert.equal(list.active.length, 7);
  assert.deepEqual(list.other, [
    "A citywide boil water notice is in effect for all JXN Water customers.",
  ]);
});

test("a notice with no date in its heading keeps the whole heading as its place", () => {
  const citywide = html.replace(
    "Monday, November 23, 2026 - Arbor Hills Drive",
    "CITYWIDE: all JXN Water customers",
  );
  const [first] = parseBoilWaterPage(citywide).active;
  assert.equal(first.issued, null);
  assert.equal(first.place, "CITYWIDE: all JXN Water customers");
  assert.equal(first.title, "CITYWIDE: all JXN Water customers");
});

test("treats en dashes like hyphens, encoded or typed", () => {
  const dashed = html
    .replace(
      "Monday, November 23, 2026 - Arbor Hills Drive",
      "Monday, November 23, 2026 &#8211; Arbor Hills Drive",
    )
    .replace("[2810-2897] Arbor Hills Dr", "[2810–2897] Arbor Hills Dr")
    .replace("approximately <strong>44", "approximately <strong>1,044");
  const [first] = parseBoilWaterPage(dashed).active;
  assert.equal(first.place, "Arbor Hills Drive");
  assert.equal(first.issued, "2026-11-23");
  assert.equal(first.areas[0].text, "2810 to 2897 Arbor Hills Dr");
  assert.equal(first.connections, 1044);
});

test("a heading with a colon and a number range splits at the date", () => {
  const odd = html.replace(
    "Monday, November 23, 2026 - Arbor Hills Drive",
    "Monday, November 23, 2026: 4400-4500 block of Arbor Hills Drive",
  );
  const [first] = parseBoilWaterPage(odd).active;
  assert.equal(first.issued, "2026-11-23");
  assert.equal(first.place, "4400-4500 block of Arbor Hills Drive");
});

test("reads a single listed address and ignores a stray character before a range", () => {
  // Both lines are on the page as served: "[834] Foley St" and a Tanglewood
  // Dr range with a stray character before the bracket.
  const all = parseBoilWaterPage(html).resolved.flatMap((n) => n.areas);
  const foley = all.find((a) => /Foley/.test(a.text));
  assert.deepEqual(foley, { text: "834 Foley St", from: "834", to: "834", street: "Foley St" });
  const tanglewood = all.find((a) => /Tanglewood/.test(a.text));
  assert.deepEqual(tanglewood, {
    text: "6205 to 6250 Tanglewood Dr",
    from: "6205",
    to: "6250",
    street: "Tanglewood Dr",
  });
});

test("finds the notices area by its heading tag, not by the words alone", () => {
  const withTitle =
    "<title>Precautionary Boil Water Notices - JXN Water</title>" +
    '<script>var t = "Precautionary Boil Water Notices";</script>' +
    html;
  const list = parseBoilWaterPage(withTitle);
  assert.equal(list.active.length, 7);
  assert.equal(list.resolved.length, 59);
  assert.deepEqual(list.other, []);
  // The words with no heading tag around them are not the page.
  assert.equal(parseBoilWaterPage("<p>Precautionary Boil Water Notices</p>"), null);
});

test("script and style text in the notices area is not reported as other text", () => {
  const noisy = html.replace(
    "<h2>Precautionary Boil Water Notices</h2>",
    "<h2>Precautionary Boil Water Notices</h2><style>.et_pb_toggle_title { color: red; margin: 0 auto }</style>" +
      '<script>window.dataLayer = window.dataLayer || []; console.log("boil water notice in effect");</script>',
  );
  const list = parseBoilWaterPage(noisy);
  assert.equal(list.active.length, 7);
  assert.equal(list.resolved.length, 59);
  assert.deepEqual(list.other, []);
});

test("a sentence added to the usual introduction is reported", () => {
  const added = html.replace(
    "Contact JXN Water at 601-500-5200 for any questions about your water.",
    "Contact JXN Water at 601-500-5200 for any questions about your water. A citywide notice is in effect until further notice for every customer.",
  );
  const list = parseBoilWaterPage(added);
  assert.equal(list.active.length, 7);
  assert.equal(list.other.length, 1);
  assert.match(list.other[0], /^Residents will be notified immediately.*citywide notice is in effect/);
});

test("a small rewording of the usual introduction is not reported", () => {
  const reworded = html.replace("for any questions about your water.", "with questions.");
  assert.notEqual(reworded, html);
  assert.deepEqual(parseBoilWaterPage(reworded).other, []);
});

test("text above the heading inside the article is reported", () => {
  const body = html.slice(html.indexOf('<div class="et_pb_module et_pb_text et_pb_text_0'));
  const list = parseBoilWaterPage(
    `<main><article><div class="alert">SYSTEM-WIDE BOIL WATER NOTICE issued for all of Jackson.</div>${body}`,
  );
  assert.equal(list.active.length, 7);
  assert.deepEqual(list.other, ["SYSTEM-WIDE BOIL WATER NOTICE issued for all of Jackson."]);
});

test("a line with two ranges is kept as text, with no single range", () => {
  const two = html.replace(
    "[2810-2897] Arbor Hills Dr",
    "[2810-2897] and [2900-2950] Arbor Hills Dr",
  );
  const [first] = parseBoilWaterPage(two).active;
  assert.deepEqual(first.areas[0], { text: "2810-2897 and 2900-2950 Arbor Hills Dr" });
});

test("a short line that starts with the utility's name is reported, not skipped", () => {
  const banner = html.replace(
    "<h2>Precautionary Boil Water Notices</h2>",
    "<h2>Precautionary Boil Water Notices</h2><p>JXN Water issues citywide boil water notice</p>",
  );
  assert.deepEqual(parseBoilWaterPage(banner).other, [
    "JXN Water issues citywide boil water notice",
  ]);
});

test("a short sentence added to the usual introduction is reported", () => {
  const added = html.replace(
    "for any questions about your water.",
    "for any questions about your water. Citywide notice now.",
  );
  const { other } = parseBoilWaterPage(added);
  assert.equal(other.length, 1);
  assert.match(other[0], /Citywide notice now\.$/);
});

test("words added to one of the page's headings are reported", () => {
  const added = html.replace(
    "<h2>Precautionary Boil Water Notices</h2>",
    "<h2>Precautionary Boil Water Notices</h2><h3>Recently Resolved Notices and Citywide</h3>",
  );
  // A second heading that only starts like the resolved heading is not it,
  // so the page still has exactly one, and the odd line is handed back.
  const list = parseBoilWaterPage(added);
  assert.equal(list.active.length, 7);
  assert.deepEqual(list.other, ["Recently Resolved Notices and Citywide"]);
});
