// Run with: node --test lib/jackson-schools.test.mjs
// Checks the date logic behind /jackson-public-schools and the shape of the
// calendar data. The dates themselves are checked against the district's
// pages by hand; see the reporting note on the page.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  JPS,
  SCHOOL_DATES,
  SCHOOL_TERMS,
  BOARD_MEETINGS,
  FIRST_DAY,
  LAST_DAY,
  isUnderWay,
  lastDayOf,
  upcomingBoardMeetings,
  upcomingSchoolDates,
} from "./jackson-schools.ts";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// True for a real calendar date written yyyy-mm-dd.
function isRealDate(iso) {
  if (!ISO.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function weekday(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

test("every calendar entry has real dates and ends on or after its start", () => {
  for (const d of SCHOOL_DATES) {
    assert.ok(isRealDate(d.start), `${d.name}: ${d.start}`);
    if (d.end) {
      assert.ok(isRealDate(d.end), `${d.name}: ${d.end}`);
      assert.ok(d.end > d.start, `${d.name} ends before it starts`);
    }
    assert.ok(d.name.trim().length > 0);
    assert.doesNotMatch(`${d.name} ${d.detail ?? ""}`, /[–—]/, "no en or em dashes");
  }
});

test("school days on the calendar are not weekends", () => {
  for (const d of SCHOOL_DATES) {
    assert.ok(![0, 6].includes(weekday(d.start)), `${d.name} starts on a weekend`);
    assert.ok(![0, 6].includes(weekday(lastDayOf(d))), `${d.name} ends on a weekend`);
  }
});

test("the first and last days for students are on the calendar", () => {
  assert.ok(SCHOOL_DATES.some((d) => d.start === FIRST_DAY && /first day for students/i.test(d.name)));
  assert.ok(SCHOOL_DATES.some((d) => d.start === LAST_DAY && /last day for students/i.test(d.name)));
  assert.equal(SCHOOL_TERMS[0].begins, FIRST_DAY);
  assert.equal(SCHOOL_TERMS.at(-1).ends, LAST_DAY);
});

test("terms run in order and do not overlap", () => {
  for (const [i, t] of SCHOOL_TERMS.entries()) {
    assert.equal(t.term, i + 1);
    for (const date of [t.begins, t.midterm, t.ends, t.reportCards]) assert.ok(isRealDate(date));
    assert.ok(t.begins < t.midterm && t.midterm < t.ends && t.ends < t.reportCards);
    if (i > 0) assert.ok(SCHOOL_TERMS[i - 1].ends < t.begins);
  }
});

test("a past date never shows as next", () => {
  for (const today of ["2026-07-01", "2026-11-25", "2026-12-19", "2027-01-02", "2027-05-22", "2027-06-29"]) {
    const list = upcomingSchoolDates(today, 50);
    for (const d of list) assert.ok(lastDayOf(d) >= today, `${d.name} is over by ${today}`);
    for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].start <= list[i].start);
  }
});

test("a break that has begun stays first until its last day", () => {
  const during = upcomingSchoolDates("2026-11-25");
  assert.equal(during[0].name, "Thanksgiving break");
  assert.ok(isUnderWay(during[0], "2026-11-25"));
  assert.equal(during[1].start, "2026-12-18");

  assert.equal(upcomingSchoolDates("2026-11-27")[0].name, "Thanksgiving break");
  const after = upcomingSchoolDates("2026-11-28");
  assert.equal(after[0].start, "2026-12-18");
  assert.ok(!isUnderWay(after[0], "2026-11-28"));
});

test("winter break, which crosses the year, is handled as one entry", () => {
  const list = upcomingSchoolDates("2027-01-01");
  assert.equal(list[0].name, "Winter holiday break");
  assert.equal(upcomingSchoolDates("2027-01-02")[0].start, "2027-01-04");
});

test("the list is empty once the calendar runs out", () => {
  assert.deepEqual(upcomingSchoolDates("2027-06-30"), []);
  assert.equal(upcomingSchoolDates("2026-07-01", 3).length, 3);
});

test("board meetings are real dates in order, two a month", () => {
  assert.equal(BOARD_MEETINGS.length, 24);
  assert.deepEqual([...BOARD_MEETINGS].sort(), BOARD_MEETINGS);
  assert.equal(new Set(BOARD_MEETINGS).size, BOARD_MEETINGS.length);
  const perMonth = new Map();
  for (const m of BOARD_MEETINGS) {
    assert.ok(isRealDate(m), m);
    perMonth.set(m.slice(0, 7), (perMonth.get(m.slice(0, 7)) ?? 0) + 1);
  }
  assert.equal(perMonth.size, 12);
  for (const [month, n] of perMonth) assert.equal(n, 2, month);
});

test("the next board meeting is the first one on or after today", () => {
  assert.equal(upcomingBoardMeetings("2026-11-25")[0], "2026-12-01");
  assert.equal(upcomingBoardMeetings("2026-12-01")[0], "2026-12-01");
  assert.equal(upcomingBoardMeetings("2026-12-02")[0], "2026-12-15");
  assert.equal(upcomingBoardMeetings("2026-11-25", 3).length, 3);
  assert.deepEqual(upcomingBoardMeetings("2027-06-16"), []);
});

test("the board has seven ward seats, one president and one vice president", () => {
  const seats = JPS.board.seats;
  assert.deepEqual(
    seats.map((s) => s.ward),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(seats.filter((s) => s.role === "President").length, 1);
  assert.equal(seats.filter((s) => s.role === "Vice president").length, 1);
});

test("starting pay rows add up", () => {
  const dollars = (s) => Number(s.replace(/[$,]/g, ""));
  for (const r of JPS.pay.start) {
    assert.equal(dollars(r.state) + dollars(r.local), dollars(r.annual), r.degree);
  }
});

test("every source is an https link and the checked date is real", () => {
  for (const [name, url] of Object.entries(JPS.sources)) {
    assert.match(url, /^https:\/\/\S+$/, name);
  }
  assert.ok(isRealDate(JPS.checked));
});
