// Run with: node --test lib/street-match.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBoilWaterPage } from "./boil-water-parse.ts";
import { matchNotice, parseStreetQuery, streetWords } from "./street-match.ts";

const { active } = parseBoilWaterPage(
  readFileSync(new URL("./fixtures/jxn-water-notices-2026-11-23.html", import.meta.url), "utf8"),
);

// The places of the notices in effect that a typed query matches, with the kind.
const hits = (text) =>
  active
    .map((n) => [n.place, matchNotice(parseStreetQuery(text), n)])
    .filter(([, kind]) => kind)
    .map(([place, kind]) => `${place}: ${kind}`);

test("long and short street words compare equal", () => {
  assert.deepEqual(streetWords("Englewood Boulevard"), ["englewood", "blvd"]);
  assert.deepEqual(streetWords("Englewood Blvd."), ["englewood", "blvd"]);
  assert.deepEqual(streetWords("St. Andrews Drive"), ["st", "andrews", "dr"]);
  assert.deepEqual(streetWords("Saint Andrews Dr"), ["st", "andrews", "dr"]);
  assert.deepEqual(streetWords("O'Ferrell Ave"), ["oferrell", "ave"]);
});

test("a leading house number is split off only when a street follows", () => {
  assert.deepEqual(parseStreetQuery("600 Seneca Avenue"), { number: 600, words: ["seneca", "ave"] });
  assert.deepEqual(parseStreetQuery("Seneca"), { number: null, words: ["seneca"] });
  assert.deepEqual(parseStreetQuery("2850"), { number: null, words: ["2850"] });
});

test("spelled-out and abbreviated street names find the notice", () => {
  assert.deepEqual(hits("Englewood Boulevard"), ["Arbor Hills Drive: street"]);
  assert.deepEqual(hits("Kingswood Avenue"), ["Arbor Hills Drive: street"]);
  assert.deepEqual(hits("Arbor Hills Dr."), ["Arbor Hills Drive: street"]);
  assert.deepEqual(hits("Liberty Hill Rd."), ["Liberty Hill Road: street"]);
  assert.deepEqual(hits("kingswood"), ["Arbor Hills Drive: street"]);
  assert.deepEqual(hits("  SENECA  "), ["Seneca Avenue: street"]);
});

test("a house number inside the listed range is an address match", () => {
  assert.deepEqual(hits("2850 Arbor Hills Dr"), ["Arbor Hills Drive: address"]);
  assert.deepEqual(hits("600 Seneca Avenue"), ["Seneca Avenue: address"]);
  assert.deepEqual(hits("2806 Englewood Blvd"), ["Arbor Hills Drive: address"]);
  assert.deepEqual(hits("2852 englewood"), ["Arbor Hills Drive: address"]);
});

test("a house number outside the range still shows the street's notice", () => {
  assert.deepEqual(hits("100 Seneca Avenue"), ["Seneca Avenue: street"]);
  assert.deepEqual(hits("9999 Arbor Hills Drive"), ["Arbor Hills Drive: street"]);
});

test("a street that is not listed matches nothing", () => {
  assert.deepEqual(hits("zzzz street"), []);
  assert.deepEqual(hits("Capitol Street"), []);
  assert.deepEqual(hits(""), []);
});

test("a range written backward or a line with no range is handled", () => {
  const notice = {
    place: "Test Road",
    areas: [
      { text: "900 to 800 Test Rd", from: "900", to: "800", street: "Test Rd" },
      { text: "All of Sample Circle" },
    ],
  };
  assert.equal(matchNotice(parseStreetQuery("850 Test Road"), notice), "address");
  assert.equal(matchNotice(parseStreetQuery("12 Sample Cir"), notice), "street");
  assert.equal(matchNotice(parseStreetQuery("Sample Circle"), notice), "street");
});
