// Tests for the sports desk's checks and ESPN schedule parsing.
// Run: node --test scripts/lib/sports-desk-checks.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { apDate, apTime, weekdayOf, parseSchedule, formatSchedule, scheduleUrl } from "./espn-schedule.mjs";
import {
  normalizeUrl,
  isTrusted,
  extractQuotes,
  unmatchedQuotes,
  weekdayMismatches,
  similarRecentTitle,
  nextGameProblems,
  sourceProblems,
  structureProblems,
  draftProblems,
} from "./sports-desk-checks.mjs";

const TODAY = "2026-11-14";

// An ESPN team schedule response, trimmed to the fields the parser reads.
const SCHEDULE_JSON = {
  team: { id: "145", displayName: "Ole Miss Rebels" },
  events: [
    {
      id: "1",
      date: "2026-11-08T00:30Z",
      timeValid: true,
      competitions: [
        {
          status: { type: { name: "STATUS_FINAL", completed: true, detail: "Final" } },
          venue: { fullName: "Sanford Stadium" },
          broadcasts: [{ media: { shortName: "ABC" } }],
          competitors: [
            { homeAway: "home", team: { id: "61", displayName: "Georgia Bulldogs" }, score: { displayValue: "42" }, winner: true },
            { homeAway: "away", team: { id: "145", displayName: "Ole Miss Rebels" }, score: { displayValue: "7" }, winner: false },
          ],
        },
      ],
    },
    {
      id: "2",
      date: "2026-11-15T18:00Z",
      timeValid: true,
      competitions: [
        {
          status: { type: { name: "STATUS_SCHEDULED", completed: false, detail: "Sun, November 15th at 1:00 PM EST" } },
          venue: { fullName: "Vaught-Hemingway Stadium" },
          broadcasts: [],
          competitors: [
            { homeAway: "home", team: { id: "145", displayName: "Ole Miss Rebels" } },
            { homeAway: "away", team: { id: "201", displayName: "Oklahoma Sooners" } },
          ],
        },
      ],
    },
    {
      id: "3",
      date: "2026-11-21T17:00Z",
      timeValid: false,
      competitions: [
        {
          status: { type: { name: "STATUS_SCHEDULED", completed: false } },
          broadcasts: [{ media: { shortName: "SECN+" } }],
          competitors: [
            { homeAway: "home", team: { id: "145", displayName: "Ole Miss Rebels" } },
            { homeAway: "away", team: { id: "2747", displayName: "Wofford Terriers" } },
          ],
        },
      ],
    },
  ],
};

const games = parseSchedule(SCHEDULE_JSON);
const schedule = {
  school: "Ole Miss",
  sport: "football",
  url: scheduleUrl("Ole Miss", "football"),
  games,
};

const whatsNext = "What's next: Ole Miss hosts Oklahoma on Sunday, Nov. 15, at noon at Vaught-Hemingway Stadium; TV has not been announced.";
const filler =
  "The Rebels fell to Georgia last week and now host Oklahoma in a game the SEC moved after the national ground stop disrupted travel across the country. The change gives both teams an extra day to prepare, and it leaves fans who planned a Saturday trip to Oxford rearranging hotel rooms and work schedules. The school said tickets for the original date will be honored, and parking lots on campus will open Sunday morning for fans driving in from around the state.";
const goodArticle = {
  title: "Ole Miss-Oklahoma Moves to Sunday After FAA Ground Stop".replace("-", " vs. "),
  dek: "The SEC moved Ole Miss's home game with Oklahoma to Sunday at noon after Friday's nationwide ground stop.",
  seoTitle: "Ole Miss: Oklahoma game moved to Sunday",
  school: "Ole Miss",
  sport: "football",
  body: [filler, filler, filler, filler, filler, whatsNext],
  nextGame: { school: "Ole Miss", sport: "football", opponent: "Oklahoma", date: "2026-11-15", time: "noon" },
  sources: ["https://olemisssports.com/news/2026/11/13/football-oklahoma-game-moved", scheduleUrl("Ole Miss", "football")],
};

test("AP style helpers", () => {
  assert.equal(apDate("2026-11-15"), "Nov. 15");
  assert.equal(apDate("2026-09-05"), "Sept. 5");
  assert.equal(apDate("2026-03-01"), "March 1");
  assert.equal(apTime(12, 0), "noon");
  assert.equal(apTime(0, 0), "midnight");
  assert.equal(apTime(19, 30), "7:30 p.m.");
  assert.equal(apTime(11, 0), "11 a.m.");
  assert.equal(weekdayOf("2026-11-15"), "Sunday");
});

test("ESPN schedule ids: baseball uses its own numbering", () => {
  assert.match(scheduleUrl("Ole Miss", "baseball"), /college-baseball\/teams\/92\/schedule$/);
  assert.match(scheduleUrl("Mississippi State", "women's basketball"), /womens-college-basketball\/teams\/344\/schedule$/);
  assert.equal(scheduleUrl("Millsaps", "football"), "");
});

test("parseSchedule reads results, Central times, TBA times and TV", () => {
  assert.equal(games.length, 3);
  assert.deepEqual(
    { date: games[0].date, result: games[0].result, us: games[0].us, them: games[0].them, side: games[0].homeAway },
    { date: "2026-11-07", result: "L", us: "7", them: "42", side: "away" },
  );
  assert.equal(games[1].date, "2026-11-15");
  assert.equal(games[1].weekday, "Sunday");
  assert.equal(games[1].time, "noon");
  assert.equal(games[1].opponent, "Oklahoma Sooners");
  assert.equal(games[2].time, "TBA");
  assert.deepEqual(games[2].tv, ["SECN+"]);
  const text = formatSchedule("Ole Miss", "football", games, schedule.url, new Date("2026-11-14T15:00:00Z"));
  assert.match(text, /Saturday, Nov\. 7: L 7-42 at Georgia Bulldogs/);
  assert.match(text, /Sunday, Nov\. 15, noon: vs\. Oklahoma Sooners \(Vaught-Hemingway Stadium\), TV: not listed/);
  assert.match(text, /Saturday, Nov\. 21, time TBA: vs\. Wofford Terriers, TV: SECN\+/);
});

test("normalizeUrl and trusted domains", () => {
  assert.equal(normalizeUrl("https://www.ClarionLedger.com/story/x/?utm_source=fb#top"), "clarionledger.com/story/x");
  assert.equal(normalizeUrl("ftp://example.com/x"), "");
  assert.ok(isTrusted("https://olemisssports.com/news/1"));
  assert.ok(isTrusted("https://site.api.espn.com/apis/site/v2/x"));
  assert.ok(!isTrusted("https://randomblog.example/x"));
});

test("quotes must appear word for word in what the desk read", () => {
  const read = ["Coach said: “We are ready to play on Sunday and we will be prepared.”"];
  assert.deepEqual(extractQuotes('He said "we will be ready" and "go Rebels"'), ["we will be ready"]);
  assert.deepEqual(unmatchedQuotes(["“We are ready to play on Sunday,” he said."], read), []);
  assert.deepEqual(unmatchedQuotes(['"We are ready to play Sunday," he said.'], read), ["We are ready to play Sunday"]);
  assert.deepEqual(unmatchedQuotes(['"We are ready to play ... we will be prepared," he said.'], read), []);
  assert.deepEqual(unmatchedQuotes(['They call it "the Egg Bowl"'], read), ["the Egg Bowl"]);
});

test("weekday and date must agree", () => {
  assert.deepEqual(weekdayMismatches("Ole Miss hosts Oklahoma on Sunday, Nov. 15.", TODAY), []);
  assert.equal(weekdayMismatches("Ole Miss hosts Oklahoma on Saturday, Nov. 15.", TODAY).length, 1);
  assert.deepEqual(weekdayMismatches("The bowl is Friday, Jan. 1.", TODAY), []); // 2027
  assert.equal(weekdayMismatches("Kickoff is Monday, Feb. 30.", TODAY).length, 1);
});

test("a near-repeat of a recent title is caught, a different story is not", () => {
  const recent = ["Ole Miss Oklahoma Game Moved to Sunday After FAA Ground Stop"];
  assert.ok(similarRecentTitle("Ole Miss vs. Oklahoma Moved to Sunday After Ground Stop", recent));
  assert.equal(similarRecentTitle("Mississippi State Falls to Auburn in Starkville", recent), "");
});

test("next game must match ESPN's schedule and the What's next date", () => {
  assert.deepEqual(nextGameProblems(goodArticle, [schedule], TODAY), []);
  const wrongDate = { ...goodArticle, nextGame: { ...goodArticle.nextGame, date: "2026-11-14" } };
  assert.match(nextGameProblems(wrongDate, [schedule], TODAY)[0], /not on ESPN's Ole Miss football schedule/);
  const wrongTime = { ...goodArticle, nextGame: { ...goodArticle.nextGame, time: "11 a.m." } };
  assert.match(nextGameProblems(wrongTime, [schedule], TODAY)[0], /does not match ESPN's noon/);
  const pmNoon = { ...goodArticle, nextGame: { ...goodArticle.nextGame, time: "12 p.m." } };
  assert.deepEqual(nextGameProblems(pmNoon, [schedule], TODAY), []);
  const noDate = { ...goodArticle, body: [...goodArticle.body.slice(0, 5), "What's next: Ole Miss hosts Oklahoma this weekend."] };
  assert.match(nextGameProblems(noDate, [schedule], TODAY)[0], /must give the next game's date as "Sunday, Nov\. 15"/);
  assert.match(nextGameProblems(goodArticle, [], TODAY)[0], /Call team_schedule for Ole Miss football/);
  const missing = { ...goodArticle, nextGame: undefined };
  assert.match(nextGameProblems(missing, [schedule], TODAY)[0], /plays Oklahoma Sooners on Sunday, Nov\. 15/);
  const otherSchool = { ...goodArticle, school: "Delta State", nextGame: undefined };
  assert.deepEqual(nextGameProblems(otherSchool, [], TODAY), []);
});

test("sources must be read this run, include a page and a trusted source", () => {
  const read = ["https://olemisssports.com/news/2026/11/13/football-oklahoma-game-moved"];
  assert.deepEqual(sourceProblems(goodArticle.sources, read, [schedule.url]), []);
  assert.match(sourceProblems(["https://example.com/never-opened", schedule.url], read, [schedule.url])[0], /not opened with fetch_url/);
  const onlySchedule = sourceProblems([schedule.url], [], [schedule.url]);
  assert.ok(onlySchedule.some((p) => /at least two sources/.test(p)));
  assert.ok(onlySchedule.some((p) => /page you read with fetch_url/.test(p)));
  const untrusted = sourceProblems(["https://blog.example/a", "https://blog.example/b"], ["https://blog.example/a", "https://blog.example/b"], []);
  assert.ok(untrusted.some((p) => /official/.test(p)));
});

test("structure: length, What's next, dashes, betting, school and sport", () => {
  assert.deepEqual(structureProblems(goodArticle), []);
  const dashed = { ...goodArticle, dek: `Moved to Sunday ${String.fromCharCode(0x2014)} at noon.` };
  assert.ok(structureProblems(dashed).some((p) => /em dash/.test(p)));
  const betting = { ...goodArticle, body: [...goodArticle.body.slice(0, 5), `${whatsNext} Ole Miss is a 3.5-point favorite.`] };
  assert.ok(structureProblems(betting).some((p) => /betting/.test(p)));
  const twoNext = { ...goodArticle, body: [...goodArticle.body.slice(0, 4), whatsNext, whatsNext] };
  assert.ok(structureProblems(twoNext).some((p) => /Exactly one paragraph/.test(p)));
  const early = { ...goodArticle, body: [whatsNext, ...goodArticle.body.slice(0, 5)] };
  assert.ok(structureProblems(early).some((p) => /last two paragraphs/.test(p)));
  const short = { ...goodArticle, body: [filler, filler, filler, filler, whatsNext] };
  assert.ok(structureProblems(short).some((p) => /words/.test(p)));
  assert.ok(structureProblems({ ...goodArticle, school: "Alabama" }).some((p) => /school must be one of/.test(p)));
});

test("draftProblems: a clean draft passes; an invented quote is caught", () => {
  const ctx = {
    today: TODAY,
    sourceTexts: ["The SEC announced the game will be played Sunday at noon."],
    readUrls: ["https://olemisssports.com/news/2026/11/13/football-oklahoma-game-moved"],
    schedules: [schedule],
    scheduleUrls: [schedule.url],
    recentSportsTitles: [],
  };
  assert.deepEqual(draftProblems(goodArticle, ctx), []);
  const invented = { ...goodArticle, body: ['"We are thrilled to play on Sunday," the coach said.', ...goodArticle.body.slice(1)] };
  assert.ok(draftProblems(invented, ctx).some((p) => /does not appear word for word/.test(p)));
});
