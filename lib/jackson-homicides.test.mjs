// Run with: node --test lib/jackson-homicides.test.mjs
// Checks the arithmetic and the shape of the data behind /jackson-homicides.
// It cannot check that a number matches its source; the research ledger does.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HOMICIDES,
  YEARS,
  TRACKER_COUNTS,
  CENSUS_POPULATION,
  ratePer100k,
  rateRows,
} from "./jackson-homicides.ts";

const COLUMNS = ["wlbt", "clarionLedger", "jpd", "fbi", "other"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function allFigures() {
  return YEARS.flatMap((row) =>
    COLUMNS.flatMap((key) => row[key].map((figure) => ({ year: row.year, key, figure }))),
  );
}

test("rate is homicides per 100,000 residents, to one decimal place", () => {
  assert.equal(ratePer100k(75, 141196), 53.1);
  assert.equal(ratePer100k(160, 149528), 107);
  assert.equal(ratePer100k(68, 165965), 41);
  assert.equal(ratePer100k(0, 150000), 0);
});

test("rate rows cover 2016 to 2025 in order, one per tracker year", () => {
  const rows = rateRows();
  assert.deepEqual(
    rows.map((r) => r.year),
    [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
  );
  for (const r of rows) {
    assert.equal(r.count, TRACKER_COUNTS[r.year]);
    assert.equal(r.population, CENSUS_POPULATION[r.year]);
    assert.equal(r.rate, ratePer100k(r.count, r.population));
  }
});

test("the table runs 2025 back to 2015 with no year repeated", () => {
  assert.deepEqual(
    YEARS.map((r) => r.year),
    [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015],
  );
});

test("each year's first WLBT figure is the tracker count", () => {
  for (const row of YEARS) {
    const first = row.wlbt[0];
    if (TRACKER_COUNTS[row.year] === undefined) {
      assert.equal(first.missing, true, `${row.year} should be marked as not tracked`);
    } else {
      assert.equal(first.value, String(TRACKER_COUNTS[row.year]));
    }
  }
});

test("no source column is left silently empty", () => {
  for (const row of YEARS) {
    for (const key of ["wlbt", "clarionLedger", "jpd", "fbi"]) {
      assert.ok(row[key].length > 0, `${row.year} ${key} has no figure and no reason`);
    }
  }
});

test("every count names a source, and every source has an https link", () => {
  for (const { year, key, figure } of allFigures()) {
    if (!figure.missing) {
      assert.ok(figure.cites.length > 0, `${year} ${key} "${figure.value}" has no source`);
    }
    for (const cite of figure.cites) {
      assert.ok(cite.outlet.trim().length > 0);
      assert.match(cite.url, /^https:\/\/\S+$/);
      if (cite.date !== undefined) {
        assert.match(cite.date, ISO);
        assert.ok(cite.date <= HOMICIDES.checked, `${cite.url} is dated after the check`);
      }
    }
  }
});

test("the year-to-date snapshot adds up", () => {
  const y = HOMICIDES.ytd;
  assert.equal(y.jpd + y.capitolPolice, y.total);
  assert.equal(y.chiefOpen + y.chiefCleared, y.jpd);
  assert.equal(y.tracker.jpd + y.tracker.capitolPolice, y.tracker.total);
  assert.equal(y.throughJuly.jpd + y.throughJuly.capitolPolice, y.throughJuly.total);
  assert.ok(y.asOf <= HOMICIDES.checked);
  assert.ok(y.tracker.latest <= HOMICIDES.checked);
});

test("reader-facing text in the data has no em or en dashes", () => {
  for (const { year, key, figure } of allFigures()) {
    for (const text of [figure.value, figure.note ?? "", ...figure.cites.map((c) => c.outlet)]) {
      assert.doesNotMatch(text, /[–—]/, `${year} ${key}: ${text}`);
    }
  }
});

test("source links are all https", () => {
  for (const [name, url] of Object.entries(HOMICIDES.sources)) {
    assert.match(url, /^https:\/\/\S+$/, name);
  }
});
