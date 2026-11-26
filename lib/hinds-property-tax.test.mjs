// Run with: node --test lib/hinds-property-tax.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TAX,
  homesteadWindow,
  lastMondayOfAugust,
  upcomingTaxDates,
} from "./hinds-property-tax.ts";

test("finds the last Monday in August", () => {
  // The county's flyer for the 2024 sale gives Monday, Aug. 26.
  assert.equal(lastMondayOfAugust(2024), "2024-08-26");
  // Aug. 31 is itself a Monday in 2026.
  assert.equal(lastMondayOfAugust(2026), "2026-08-31");
  assert.equal(lastMondayOfAugust(2027), "2027-08-30");
  for (let year = 2024; year <= 2040; year++) {
    const date = lastMondayOfAugust(year);
    const d = new Date(`${date}T00:00:00Z`);
    assert.equal(d.getUTCDay(), 1, `${date} is a Monday`);
    assert.equal(d.getUTCMonth(), 7, `${date} is in August`);
    assert.ok(d.getUTCDate() >= 25, `${date} is in the last week`);
  }
});

test("lists the next dates in order from the day the page was checked", () => {
  const dates = upcomingTaxDates(TAX.checked);
  assert.deepEqual(
    dates.map((d) => [d.kind, d.date]),
    [
      ["taxes-due", "2027-02-01"],
      ["homestead", "2027-04-01"],
      ["installment-2", "2027-05-01"],
      ["installment-3", "2027-07-01"],
      ["tax-sale", "2027-08-30"],
    ],
  );
  assert.equal(dates[0].label, "Taxes on property assessed in 2026 are due");
});

test("a deadline is still next on its own day and gone the day after", () => {
  assert.equal(upcomingTaxDates("2027-02-01")[0].date, "2027-02-01");
  const after = upcomingTaxDates("2027-02-02");
  assert.equal(after[0].date, "2027-04-01");
  // The list rolls into the following year and stays five long.
  assert.equal(after.length, 5);
  assert.deepEqual(after.at(-1), {
    kind: "taxes-due",
    label: "Taxes on property assessed in 2027 are due",
    date: "2028-02-01",
    weekend: false,
  });
});

test("never returns a past date and always returns five", () => {
  for (let day = 0; day < 800; day++) {
    const today = new Date(Date.UTC(2026, 10, 25 + day)).toISOString().slice(0, 10);
    const dates = upcomingTaxDates(today);
    assert.equal(dates.length, 5);
    for (const d of dates) assert.ok(d.date >= today, `${d.date} is not before ${today}`);
    const sorted = [...dates].sort((a, b) => a.date.localeCompare(b.date));
    assert.deepEqual(dates, sorted);
  }
});

test("flags dates that fall on a weekend instead of moving them", () => {
  const byDate = Object.fromEntries(upcomingTaxDates("2026-11-25", 10).map((d) => [d.date, d]));
  // May 1, 2027 is a Saturday; the date stays May 1 and carries the flag.
  assert.equal(byDate["2027-05-01"].weekend, true);
  assert.equal(byDate["2027-02-01"].weekend, false);
  assert.equal(byDate["2027-08-30"].weekend, false);
  // Feb. 1, 2031 is a Saturday.
  assert.equal(upcomingTaxDates("2031-01-15")[0].weekend, true);
});

test("gives the homestead filing period that is open or comes next", () => {
  assert.deepEqual(homesteadWindow("2026-11-25"), {
    opens: "2027-01-01",
    closes: "2027-04-01",
    open: false,
  });
  assert.deepEqual(homesteadWindow("2027-01-01"), {
    opens: "2027-01-01",
    closes: "2027-04-01",
    open: true,
  });
  assert.equal(homesteadWindow("2027-04-01").open, true);
  assert.deepEqual(homesteadWindow("2027-04-02"), {
    opens: "2028-01-01",
    closes: "2028-04-01",
    open: false,
  });
});

test("no source link points at the county's older site, which the page only names", () => {
  const host = TAX.oldSite.host.replace(/^www\./, "");
  for (const [name, url] of Object.entries(TAX.sources)) {
    assert.ok(!url.includes(host), `${name} links to ${host}`);
    assert.ok(!url.includes("archive.org"), `${name} links to an archive copy`);
    assert.ok(url.startsWith("https://"), `${name} is not https`);
  }
});
