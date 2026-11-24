// Run with: node --test lib/boil-water-parse.test.mjs
// The fixture is the notices section of https://jxnwater.com/boil-water-notices/
// as it was served on Nov. 23, 2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBoilWaterPage } from "./boil-water-parse.ts";

const html = readFileSync(
  new URL("./fixtures/jxn-water-notices-2026-11-23.html", import.meta.url),
  "utf8",
);

test("reads the notices in effect and the lifted ones separately", () => {
  const list = parseBoilWaterPage(html);
  assert.ok(list);
  assert.equal(list.active.length, 7);
  assert.equal(list.resolved.length, 59);
  assert.equal(list.active.at(-1).place, "Seneca Avenue");
  assert.equal(list.resolved[0].place, "Roxbury Road");
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
      assert.doesNotMatch(a.text, /customers affected|[<>[\]]/i, n.title);
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

test("an empty list is valid when the page is recognized", () => {
  const empty =
    "<h2>Precautionary Boil Water Notices</h2><p>None.</p><h3>Recently Resolved Notices</h3>";
  assert.deepEqual(parseBoilWaterPage(empty), { active: [], resolved: [] });
});

test("fails closed on a page it does not recognize", () => {
  assert.equal(parseBoilWaterPage(""), null);
  assert.equal(parseBoilWaterPage("<h1>Sorry, you have been blocked</h1>"), null);
  assert.equal(parseBoilWaterPage(undefined), null);
  // Notices but no "Recently Resolved" heading: cannot tell which are in effect.
  const noMark = html.replace("Recently Resolved Notices", "Older Notices");
  assert.equal(parseBoilWaterPage(noMark), null);
  // A heading that never closes.
  const broken =
    '<h2>Precautionary Boil Water Notices</h2><h5 class="et_pb_toggle_title">Monday<h3>Recently Resolved Notices</h3>';
  assert.equal(parseBoilWaterPage(broken), null);
});

test("treats an en dash in the heading like a hyphen", () => {
  const page =
    '<h2>Precautionary Boil Water Notices</h2>' +
    '<div class="et_pb_module et_pb_toggle"><h5 class="et_pb_toggle_title">Friday, November 13, 2026 &#8211; Seneca Avenue</h5>' +
    '<div class="et_pb_toggle_content clearfix"><p>Area:<br /><span>[524-732] Seneca Ave </span></p>' +
    "<p>Customers affected: This notice affects approximately <strong>1,022 </strong>connection(s)</p></div></div>" +
    "<h3>Recently Resolved Notices</h3>";
  const list = parseBoilWaterPage(page);
  assert.equal(list.active.length, 1);
  assert.equal(list.active[0].place, "Seneca Avenue");
  assert.equal(list.active[0].issued, "2026-11-13");
  assert.equal(list.active[0].connections, 1022);
});
