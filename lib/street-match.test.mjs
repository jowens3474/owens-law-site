// Run with: node --test lib/street-match.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBoilWaterPage } from "./boil-water-parse.ts";
import { matchNotice, parseStreetQuery, streetWords } from "./street-match.ts";

const { active, resolved } = parseBoilWaterPage(
  readFileSync(new URL("./fixtures/jxn-water-notices-2026-11-23.html", import.meta.url), "utf8"),
);

// The places of the notices a typed query matches, with the kind of match.
const hitsIn = (notices, text) =>
  notices
    .map((n) => [n.place, matchNotice(parseStreetQuery(text), n)])
    .filter(([, kind]) => kind)
    .map(([place, kind]) => `${place}: ${kind}`);
const hits = (text) => hitsIn(active, text);
const match = (text, notice) => matchNotice(parseStreetQuery(text), notice);

test("long and short street words compare equal", () => {
  assert.deepEqual(streetWords("Englewood Boulevard"), ["englewood", "blvd"]);
  assert.deepEqual(streetWords("Englewood Blvd."), ["englewood", "blvd"]);
  assert.deepEqual(streetWords("St. Andrews Drive"), ["st", "andrews", "dr"]);
  assert.deepEqual(streetWords("Saint Andrews Dr"), ["st", "andrews", "dr"]);
  assert.deepEqual(streetWords("O'Ferrell Ave"), ["oferrell", "ave"]);
  assert.deepEqual(streetWords("West Capitol Street"), ["w", "capitol", "st"]);
});

test("a leading house number is split off only when a street name follows", () => {
  const q = (text) => {
    const { number, words } = parseStreetQuery(text);
    return { number, words };
  };
  assert.deepEqual(q("600 Seneca Avenue"), { number: 600, words: ["seneca", "ave"] });
  assert.deepEqual(q("Seneca"), { number: null, words: ["seneca"] });
  assert.deepEqual(q("2850"), { number: null, words: ["2850"] });
  // Highway 18, not house number 18 on a highway.
  assert.deepEqual(q("18 Hwy"), { number: null, words: ["18", "hwy"] });
  assert.deepEqual(q("Highway 18"), { number: null, words: ["hwy", "18"] });
});

test("the city, state, ZIP and unit are dropped from a full address", () => {
  const q = (text) => {
    const { number, words } = parseStreetQuery(text);
    return { number, words };
  };
  const want = { number: 2850, words: ["arbor", "hills", "dr"] };
  assert.deepEqual(q("2850 Arbor Hills Dr, Jackson, MS 39212"), want);
  assert.deepEqual(q("2850 arbor hills dr jackson ms 39212"), want);
  assert.deepEqual(q("2850 Arbor Hills Dr Apt 4B"), want);
  assert.deepEqual(q("2850 Arbor Hills Dr. #4, Jackson"), want);
});

test("spelled-out and abbreviated street names find the notice", () => {
  assert.deepEqual(hits("Englewood Boulevard"), ["Arbor Hills Drive: street"]);
  assert.deepEqual(hits("Kingswood Avenue"), ["Arbor Hills Drive: street"]);
  assert.deepEqual(hits("Arbor Hills Dr."), ["Arbor Hills Drive: street"]);
  assert.deepEqual(hits("Liberty Hill Rd."), ["Liberty Hill Road: street"]);
  assert.deepEqual(hits("kingswood"), ["Arbor Hills Drive: street"]);
  assert.deepEqual(hits("  SENECA  "), ["Seneca Avenue: street"]);
});

test("a street written as one word or two still matches", () => {
  assert.deepEqual(hits("Woodglen"), ["Wood Glen Drive: street"]);
  assert.deepEqual(hits("Woodglen Drive"), ["Wood Glen Drive: street"]);
  assert.deepEqual(hits("1600 Woodglen Dr"), ["Wood Glen Drive: address"]);
  const southhaven = {
    place: "Southhaven Drive",
    areas: [{ text: "100 to 200 Southhaven Dr", from: "100", to: "200", street: "Southhaven Dr" }],
  };
  assert.equal(match("South Haven Drive", southhaven), "street");
  assert.equal(match("150 South Haven Dr", southhaven), "address");
});

test("a house number inside the listed range is an address match", () => {
  assert.deepEqual(hits("2850 Arbor Hills Dr"), ["Arbor Hills Drive: address"]);
  assert.deepEqual(hits("600 Seneca Avenue"), ["Seneca Avenue: address"]);
  assert.deepEqual(hits("2806 Englewood Blvd"), ["Arbor Hills Drive: address"]);
  assert.deepEqual(hits("2852 englewood"), ["Arbor Hills Drive: address"]);
  assert.deepEqual(hits("2850 Arbor Hills Dr, Jackson, MS 39212"), ["Arbor Hills Drive: address"]);
});

test("a house number outside every listed range says so, and still shows the notice", () => {
  assert.deepEqual(hits("100 Seneca Avenue"), ["Seneca Avenue: out-of-range"]);
  assert.deepEqual(hits("9999 Arbor Hills Drive"), ["Arbor Hills Drive: out-of-range"]);
});

test("a single listed address and a line with a stray character are compared", () => {
  // Both lines are on JXN Water's page as served Nov. 23, 2026: "[834] Foley St"
  // and a Tanglewood Dr range with a stray character before the bracket.
  assert.deepEqual(hitsIn(resolved, "834 Foley St"), ["Foley Street: address"]);
  assert.deepEqual(hitsIn(resolved, "835 Foley St"), ["Foley Street: out-of-range"]);
  const tanglewood = hitsIn(resolved, "6210 Tanglewood Dr");
  assert.equal(tanglewood.length, 1);
  assert.match(tanglewood[0], /: address$/);
});

test("a listing with no range never says the address is outside it", () => {
  const notice = {
    place: "Sample Circle",
    areas: [
      { text: "900 to 800 Test Rd", from: "900", to: "800", street: "Test Rd" },
      { text: "All of Sample Circle" },
    ],
  };
  assert.equal(match("850 Test Road", notice), "address");
  assert.equal(match("12 Test Road", notice), "out-of-range");
  assert.equal(match("12 Sample Cir", notice), "street");
  assert.equal(match("Sample Circle", notice), "street");
  // One listing of the street has a range that misses and another has none:
  // not enough to say the address is outside the notice.
  const mixed = {
    place: "Test Road",
    areas: [
      { text: "100 to 200 Test Rd", from: "100", to: "200", street: "Test Rd" },
      { text: "Test Rd at the bridge" },
    ],
  };
  assert.equal(match("950 Test Rd", mixed), "street");
});

test("only the heading naming the street is a street match, not out of range", () => {
  const notice = {
    place: "Heading Lane",
    areas: [{ text: "10 to 20 Other St", from: "10", to: "20", street: "Other St" }],
  };
  assert.equal(match("500 Heading Ln", notice), "street");
});

test("direction words must agree but may be left off", () => {
  const west = {
    place: "West Capitol Street",
    areas: [{ text: "100 to 300 W Capitol St", from: "100", to: "300", street: "W Capitol St" }],
  };
  assert.equal(match("West Capitol Street", west), "street");
  assert.equal(match("Capitol St", west), "street");
  assert.equal(match("East Capitol Street", west), null);
  const plain = {
    place: "Capitol Street",
    areas: [{ text: "100 to 300 Capitol St", from: "100", to: "300", street: "Capitol St" }],
  };
  assert.equal(match("West Capitol Street", plain), "street");
  // A direction is not the start of a street name.
  assert.deepEqual(hits("West Glen Dr"), []);
});

test("a kind of street alone does not name a street with a number", () => {
  assert.deepEqual(hitsIn(resolved, "18 Hwy"), []);
  assert.deepEqual(hits("zzzz street"), []);
  assert.deepEqual(hits("Capitol Street"), []);
  assert.deepEqual(hits(""), []);
});

test("every address line on the saved page is found by its own low, middle and high number", () => {
  // Walks all the notices JXN Water listed on Nov. 23, 2026, typing each
  // line's street the way JXN Water wrote it.
  let checked = 0;
  for (const notice of [...active, ...resolved]) {
    for (const area of notice.areas) {
      assert.ok(area.from && area.to && area.street, `${notice.title}: ${area.text}`);
      const low = Math.min(parseInt(area.from, 10), parseInt(area.to, 10));
      const high = Math.max(parseInt(area.from, 10), parseInt(area.to, 10));
      for (const n of [low, Math.floor((low + high) / 2), high]) {
        for (const typed of [
          `${n} ${area.street}`,
          `${n} ${area.street.toLowerCase()}`,
          `${n} ${area.street}, Jackson, MS 39206`,
        ]) {
          assert.equal(match(typed, notice), "address", `${typed} in ${notice.title}`);
        }
      }
      assert.equal(match(area.street, notice), "street", `${area.street} in ${notice.title}`);
      checked += 1;
    }
  }
  assert.equal(checked, 87);
});

test("a street named only by a direction or a kind of street takes a house number", () => {
  // "[909-975] North Street" is on the saved page.
  assert.deepEqual(hitsIn(resolved, "909 North Street"), ["North Street: address"]);
  assert.deepEqual(hitsIn(resolved, "950 North St"), ["North Street: address"]);
  assert.deepEqual(hitsIn(resolved, "950 N St"), ["North Street: address"]);
  assert.deepEqual(hitsIn(resolved, "100 North Street"), ["North Street: out-of-range"]);
  assert.deepEqual(hitsIn(resolved, "North Street"), ["North Street: street"]);
  const listing = (street) => ({
    place: street,
    areas: [{ text: `100 to 200 ${street}`, from: "100", to: "200", street }],
  });
  for (const street of ["N West St", "South St", "Court St", "Parkway Dr", "Circle Dr"]) {
    assert.equal(match(`150 ${street}`, listing(street)), "address", street);
    assert.equal(match(street, listing(street)), "street", street);
  }
  // Such a street matches only a listing of exactly those words.
  assert.equal(match("150 North Street", listing("N West St")), null);
  assert.equal(match("North Street", listing("North State St")), null);
  assert.equal(match("St", listing("Seneca St")), null);
});

test("MLK finds Martin Luther King, and a street named Jackson or Mississippi keeps its name", () => {
  const mlk = {
    place: "Martin Luther King Jr Drive",
    areas: [
      {
        text: "1000 to 1400 Dr Martin Luther King Jr Dr",
        from: "1000",
        to: "1400",
        street: "Dr Martin Luther King Jr Dr",
      },
    ],
  };
  assert.equal(match("1200 MLK Dr", mlk), "address");
  assert.equal(match("MLK", mlk), "street");
  const jackson = {
    place: "Jackson Avenue",
    areas: [{ text: "100 to 300 Jackson Ave", from: "100", to: "300", street: "Jackson Ave" }],
  };
  assert.equal(match("200 Jackson", jackson), "address");
  assert.equal(match("200 Jackson Ave, Jackson, MS 39201", jackson), "address");
  const mississippi = {
    place: "East Mississippi Street",
    areas: [{ text: "100 to 300 E Mississippi St", from: "100", to: "300", street: "E Mississippi St" }],
  };
  assert.equal(match("200 E Mississippi", mississippi), "address");
});

test("a run-together name must be the whole name, not the start of one", () => {
  const lakewood = {
    place: "Lakewood Drive",
    areas: [{ text: "3000 to 3100 Lakewood Dr", from: "3000", to: "3100", street: "Lakewood Dr" }],
  };
  assert.equal(match("3050 Lake Wood Dr", lakewood), "address");
  assert.equal(match("Lake Woo", lakewood), null);
  // The start of a single word still finds the street, by design.
  assert.equal(match("Lakew", lakewood), "street");
});
