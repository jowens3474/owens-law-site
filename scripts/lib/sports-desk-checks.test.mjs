// Tests for the sports desk's checks and ESPN schedule parsing.
// Run: node --test scripts/lib/sports-desk-checks.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { apDate, apTime, weekdayOf, parseSchedule, formatSchedule, scheduleUrl } from "./espn-schedule.mjs";
import {
  BETTING,
  normalizeUrl,
  isTrusted,
  mentionsDate,
  mentionsTime,
  mentionsName,
  extractQuotes,
  unmatchedQuotes,
  unsourcedNumbers,
  weekdayMismatches,
  similarRecentTitle,
  nextGameProblems,
  staleGameProblems,
  sourceProblems,
  structureProblems,
  draftProblems,
} from "./sports-desk-checks.mjs";

const TODAY = "2026-11-14";
const MORNING = "2026-11-14T14:00:00Z"; // 8 a.m. Central

const team = (id, location, mascot) => ({ id, location, displayName: `${location} ${mascot}` });
const OLE_MISS = team("145", "Ole Miss", "Rebels");

// An ESPN team schedule response, trimmed to the fields the parser reads.
function scheduleJson(extra = []) {
  return {
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
              { homeAway: "home", team: team("61", "Georgia", "Bulldogs"), score: { displayValue: "42" }, winner: true },
              { homeAway: "away", team: OLE_MISS, score: { displayValue: "7" }, winner: false },
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
              { homeAway: "home", team: OLE_MISS },
              { homeAway: "away", team: team("201", "Oklahoma", "Sooners") },
            ],
          },
        ],
      },
      {
        id: "3",
        // Time not set: ESPN's placeholder is midnight Eastern, 11 p.m. Central the night before.
        date: "2026-11-21T05:00Z",
        timeValid: false,
        competitions: [
          {
            status: { type: { name: "STATUS_SCHEDULED", completed: false } },
            broadcasts: [{ media: { shortName: "SECN+" } }],
            competitors: [
              { homeAway: "home", team: OLE_MISS },
              { homeAway: "away", team: team("2747", "Wofford", "Terriers") },
            ],
          },
        ],
      },
      ...extra,
    ],
  };
}

const games = parseSchedule(scheduleJson());
const schedule = { school: "Ole Miss", sport: "football", url: scheduleUrl("Ole Miss", "football"), games };

const whatsNext = "What's next: Ole Miss hosts Oklahoma on Sunday, Nov. 15, at noon at Vaught-Hemingway Stadium; TV has not been announced.";
const filler =
  "The Rebels fell to Georgia last week and now host Oklahoma in a game the SEC moved after the national ground stop disrupted travel across the country. The change gives both teams an extra day to prepare, and it leaves fans who planned a Saturday trip to Oxford rearranging hotel rooms and work schedules. The school said tickets for the original date will be honored, and parking lots on campus will open Sunday morning for fans driving in from around the state.";
const goodArticle = {
  title: "Ole Miss vs. Oklahoma Moves to Sunday After FAA Ground Stop",
  dek: "The SEC moved Ole Miss's home game with Oklahoma to Sunday at noon after Friday's nationwide ground stop.",
  seoTitle: "Ole Miss: Oklahoma game moved to Sunday",
  school: "Ole Miss",
  sport: "football",
  body: [filler, filler, filler, filler, filler, whatsNext],
  nextGame: { school: "Ole Miss", sport: "football", opponent: "Oklahoma", date: "2026-11-15", time: "noon" },
  sources: ["https://olemisssports.com/news/2026/11/13/football-oklahoma-game-moved", scheduleUrl("Ole Miss", "football")],
};
const withWhatsNext = (text) => ({ ...goodArticle, body: [...goodArticle.body.slice(0, 5), text] });

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

test("parseSchedule reads results, Central times, TBA dates, school names and TV", () => {
  assert.equal(games.length, 3);
  assert.deepEqual(
    { date: games[0].date, result: games[0].result, us: games[0].us, them: games[0].them, side: games[0].homeAway },
    { date: "2026-11-07", result: "L", us: "7", them: "42", side: "away" },
  );
  assert.equal(games[1].date, "2026-11-15");
  assert.equal(games[1].weekday, "Sunday");
  assert.equal(games[1].time, "noon");
  assert.equal(games[1].opponent, "Oklahoma Sooners");
  assert.equal(games[1].opponentShort, "Oklahoma");
  // The TBA placeholder is 11 p.m. Central on Nov. 20; the game is Nov. 21.
  assert.equal(games[2].date, "2026-11-21");
  assert.equal(games[2].weekday, "Saturday");
  assert.equal(games[2].time, "TBA");
  assert.deepEqual(games[2].tv, ["SECN+"]);
  const text = formatSchedule("Ole Miss", "football", games, schedule.url, new Date(MORNING));
  assert.match(text, /Saturday, Nov\. 7: L 7-42 at Georgia Bulldogs/);
  assert.match(text, /Sunday, Nov\. 15, noon: vs\. Oklahoma Sooners \(Vaught-Hemingway Stadium\), TV: not listed/);
  assert.match(text, /Saturday, Nov\. 21, time TBA: vs\. Wofford Terriers, TV: SECN\+/);
});

test("a game under way stays under way, even past four hours", () => {
  const during = new Date("2026-11-15T18:40:00Z");
  const text = formatSchedule("Ole Miss", "football", games, schedule.url, during);
  assert.match(text, /Under way now \(started at noon; do not preview it\): Sunday, Nov\. 15 vs\. Oklahoma Sooners/);
  assert.match(text, /Next games:\n- Saturday, Nov\. 21/);
  const longGame = parseSchedule(
    scheduleJson([
      {
        id: "9",
        date: "2026-11-16T15:00Z",
        timeValid: true,
        competitions: [
          {
            status: { type: { name: "STATUS_IN_PROGRESS", completed: false } },
            competitors: [
              { homeAway: "home", team: OLE_MISS },
              { homeAway: "away", team: team("9", "Arkansas", "Razorbacks") },
            ],
          },
        ],
      },
    ]),
  );
  const late = formatSchedule("Ole Miss", "baseball", longGame, "u", new Date("2026-11-16T21:00:00Z"));
  assert.match(late, /Under way now \(started at 9 a\.m\.; do not preview it\): Monday, Nov\. 16 vs\. Arkansas Razorbacks/);
});

test("normalizeUrl and trusted domains", () => {
  assert.equal(normalizeUrl("https://www.ClarionLedger.com/story/x/?utm_source=fb#top"), "clarionledger.com/story/x");
  assert.equal(normalizeUrl("ftp://example.com/x"), "");
  assert.ok(isTrusted("https://olemisssports.com/news/1"));
  assert.ok(isTrusted("https://site.api.espn.com/apis/site/v2/x"));
  assert.ok(isTrusted("https://hottytoddy.com/2026/11/14/x"));
  assert.ok(!isTrusted("https://www.on3.com/teams/ole-miss-rebels/news/x"));
  assert.ok(!isTrusted("https://sports.yahoo.com/articles/x"));
  assert.ok(!isTrusted("https://randomblog.example/x"));
});

test("dates, times and names are matched whole", () => {
  assert.ok(mentionsDate("Kickoff is Sunday, Nov. 15.", "2026-11-15"));
  assert.ok(!mentionsDate("Kickoff is Sunday, Nov. 15.", "2026-11-01"));
  assert.ok(mentionsDate("The game is Nov. 1 at noon.", "2026-11-01"));
  assert.ok(mentionsTime("at 7:30 p.m. Central", "7:30 p.m."));
  assert.ok(mentionsTime("at 7:30 pm", "7:30 p.m."));
  assert.ok(mentionsTime("Kickoff is at noon.", "noon"));
  assert.ok(!mentionsTime("at 11 a.m.", "1 a.m."));
  assert.ok(mentionsName("Ole Miss plays at Oklahoma.", "Oklahoma"));
  assert.ok(!mentionsName("Ole Miss plays at Oklahoma State.", "Oklahoma State Cowboys"));
  assert.ok(mentionsName("They host Alabama State on Tuesday.", "Alabama State"));
});

test("quotes of two words or more must appear word for word in what the desk read", () => {
  const read = ["Coach said: “We are ready to play on Sunday and we will be prepared.” Fans call it the Egg Bowl."];
  assert.deepEqual(extractQuotes('He said "we will be ready" and "Rebels" and "go Rebels"'), ["we will be ready", "go Rebels"]);
  assert.deepEqual(unmatchedQuotes(["“We are ready to play on Sunday,” he said."], read), []);
  assert.deepEqual(unmatchedQuotes(['"We are ready to play Sunday," he said.'], read), ["We are ready to play Sunday"]);
  assert.deepEqual(unmatchedQuotes(['"We are ready to play ... we will be prepared," he said.'], read), []);
  assert.deepEqual(unmatchedQuotes(['They call it "the Egg Bowl"'], read), []);
  assert.deepEqual(unmatchedQuotes(['He called it "a statement win"'], read), ["a statement win"]);
});

test("numbers must appear in what the desk read", () => {
  const read = [
    "Ole Miss (6-3, 4-3 SEC) fell to No. 19 after a 42\u20137 loss. She shot 71.4 percent. A crowd of 53,885 watched on Nov. 7 at 11 a.m. in 2026.",
  ];
  assert.deepEqual(
    unsourcedNumbers(["Ole Miss is 6-3 and 4-3 in the SEC, No. 19, after losing 7-42 before 53,885 fans; she shot 71.4 percent."], read),
    [],
  );
  assert.deepEqual(unsourcedNumbers(["The Rebels are 4-1 at home and scored 114 points; she shot 71.5 percent."], read), ["4-1", "71.5", "114"]);
  // Dates, clock times, years and small numbers are left alone.
  assert.deepEqual(unsourcedNumbers(["On Sunday, Nov. 15, at 11 a.m. in 2027, the Rebels need 3 wins."], read), []);
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

test("next game must be the next one on ESPN's schedule, stated in full", () => {
  assert.deepEqual(nextGameProblems(goodArticle, [schedule], TODAY, MORNING), []);
  const wrongDate = { ...goodArticle, nextGame: { ...goodArticle.nextGame, date: "2026-11-14" } };
  assert.match(nextGameProblems(wrongDate, [schedule], TODAY, MORNING)[0], /not on ESPN's Ole Miss football schedule/);
  const wrongTime = { ...goodArticle, nextGame: { ...goodArticle.nextGame, time: "11 a.m." } };
  assert.match(nextGameProblems(wrongTime, [schedule], TODAY, MORNING)[0], /does not match ESPN's noon/);
  const pmNoon = { ...goodArticle, nextGame: { ...goodArticle.nextGame, time: "12 p.m." } };
  assert.deepEqual(nextGameProblems(pmNoon, [schedule], TODAY, MORNING), []);
  const noDate = withWhatsNext("What's next: Ole Miss hosts Oklahoma this weekend at noon.");
  assert.ok(nextGameProblems(noDate, [schedule], TODAY, MORNING).some((p) => /date as "Sunday, Nov\. 15"/.test(p)));
  const novFirst = withWhatsNext("What's next: Ole Miss hosts Oklahoma on Sunday, Nov. 1, at noon.");
  assert.ok(nextGameProblems(novFirst, [schedule], TODAY, MORNING).some((p) => /date as "Sunday, Nov\. 15"/.test(p)));
  const sevenPm = withWhatsNext("What's next: Ole Miss hosts Oklahoma on Sunday, Nov. 15, at 7 p.m.");
  assert.ok(nextGameProblems(sevenPm, [schedule], TODAY, MORNING).some((p) => /game time as ESPN lists it: noon/.test(p)));
  const noOpponent = withWhatsNext("What's next: Ole Miss plays again on Sunday, Nov. 15, at noon.");
  assert.ok(nextGameProblems(noOpponent, [schedule], TODAY, MORNING).some((p) => /name the opponent, Oklahoma/.test(p)));
  const skipsAhead = {
    ...withWhatsNext("What's next: Ole Miss hosts Wofford on Saturday, Nov. 21."),
    nextGame: { school: "Ole Miss", sport: "football", opponent: "Wofford", date: "2026-11-21", time: "TBA" },
  };
  assert.ok(nextGameProblems(skipsAhead, [schedule], TODAY, MORNING).some((p) => /next Ole Miss football game is Oklahoma/.test(p)));
  assert.match(nextGameProblems(goodArticle, [], TODAY, MORNING)[0], /Call team_schedule for Ole Miss football/);
  const missing = { ...goodArticle, nextGame: undefined };
  assert.match(nextGameProblems(missing, [schedule], TODAY, MORNING)[0], /plays Oklahoma on Sunday, Nov\. 15/);
  const otherSchool = { ...goodArticle, school: "Delta State", nextGame: undefined };
  assert.deepEqual(nextGameProblems(otherSchool, [], TODAY, MORNING), []);
});

test("canceled, postponed and started games cannot be the next game", () => {
  const status = (name) =>
    parseSchedule({
      ...scheduleJson(),
      events: scheduleJson().events.map((e) =>
        e.id === "2" ? { ...e, competitions: [{ ...e.competitions[0], status: { type: { name, completed: false } } }] } : e,
      ),
    });
  const canceled = { ...schedule, games: status("STATUS_CANCELED") };
  assert.ok(nextGameProblems(goodArticle, [canceled], TODAY, MORNING).some((p) => /as canceled/.test(p)));
  const postponed = { ...schedule, games: status("STATUS_POSTPONED") };
  assert.ok(nextGameProblems(goodArticle, [postponed], TODAY, MORNING).some((p) => /as postponed/.test(p)));
  const started = nextGameProblems(goodArticle, [schedule], "2026-11-15", "2026-11-15T18:40:00Z");
  assert.ok(started.some((p) => /has already started or finished/.test(p)));
});

test("a game from the last 18 hours is reported with its final score, never previewed", () => {
  const sat = parseSchedule(
    scheduleJson([
      {
        id: "7",
        date: "2026-11-14T17:00Z",
        timeValid: true,
        competitions: [
          {
            status: { type: { name: "STATUS_FINAL", completed: true } },
            competitors: [
              { homeAway: "home", team: OLE_MISS, score: { displayValue: "80" }, winner: true },
              { homeAway: "away", team: team("8", "Buffalo", "Bulls"), score: { displayValue: "61" } },
            ],
          },
        ],
      },
      {
        id: "8",
        date: "2026-11-14T22:00Z",
        timeValid: true,
        competitions: [
          {
            status: { type: { name: "STATUS_SCHEDULED", completed: false } },
            competitors: [
              { homeAway: "home", team: OLE_MISS },
              { homeAway: "away", team: team("10", "Troy", "Trojans") },
            ],
          },
        ],
      },
    ]),
  );
  const s = { school: "Ole Miss", sport: "women's basketball", url: "u", games: sat };
  const evening = "2026-11-14T23:00:00Z";
  const preview = { ...goodArticle, body: ["Ole Miss plays Buffalo this morning.", ...goodArticle.body.slice(1)] };
  assert.ok(staleGameProblems(preview, [s], evening).some((p) => /Buffalo .* is over: ESPN has it final, 80-61/.test(p)));
  const recap = { ...goodArticle, body: ["Ole Miss beat Buffalo 80-61.", ...goodArticle.body.slice(1)] };
  assert.deepEqual(staleGameProblems(recap, [s], evening), []);
  const live = { ...goodArticle, body: ["Ole Miss takes on Troy tonight.", ...goodArticle.body.slice(1)] };
  assert.ok(staleGameProblems(live, [s], evening).some((p) => /Troy started at 4 p\.m\. .* under way/.test(p)));
  assert.deepEqual(staleGameProblems(live, [s], MORNING), []);
});

test("sources must be read this run, include a page and a trusted source", () => {
  const read = ["https://olemisssports.com/news/2026/11/13/football-oklahoma-game-moved"];
  assert.deepEqual(sourceProblems(goodArticle.sources, read, [schedule.url]), []);
  assert.match(sourceProblems(["https://example.com/never-opened", schedule.url], read, [schedule.url])[0], /not read with fetch_url/);
  const onlySchedule = sourceProblems([schedule.url], [], [schedule.url]);
  assert.ok(onlySchedule.some((p) => /at least two sources/.test(p)));
  assert.ok(onlySchedule.some((p) => /page you read with fetch_url/.test(p)));
  const insider = ["https://www.on3.com/a", "https://247sports.com/b"];
  assert.ok(sourceProblems(insider, insider, []).some((p) => /official/.test(p)));
});

test("betting language is caught; reporting a gambling investigation is not", () => {
  assert.ok(BETTING.test("Ole Miss is a 3.5-point favorite."));
  assert.ok(BETTING.test("Oklahoma is favored by a touchdown."));
  assert.ok(BETTING.test("a three-leg parlay"));
  assert.ok(BETTING.test("a player prop bet"));
  assert.ok(BETTING.test("odds at Hard Rock Bet"));
  assert.ok(!BETTING.test("The NCAA said the player placed bets through a sportsbook and was suspended."));
});

test("structure: length, What's next, dashes, betting, school and sport", () => {
  assert.deepEqual(structureProblems(goodArticle), []);
  const dashed = { ...goodArticle, dek: `Moved to Sunday ${String.fromCharCode(0x2014)} at noon.` };
  assert.ok(structureProblems(dashed).some((p) => /em dash/.test(p)));
  const betting = withWhatsNext(`${whatsNext} Ole Miss is a 3.5-point favorite.`);
  assert.ok(structureProblems(betting).some((p) => /betting/.test(p)));
  const twoNext = { ...goodArticle, body: [...goodArticle.body.slice(0, 4), whatsNext, whatsNext] };
  assert.ok(structureProblems(twoNext).some((p) => /Exactly one paragraph/.test(p)));
  const early = { ...goodArticle, body: [whatsNext, ...goodArticle.body.slice(0, 5)] };
  assert.ok(structureProblems(early).some((p) => /last two paragraphs/.test(p)));
  const short = { ...goodArticle, body: [filler, filler, filler, filler, whatsNext] };
  assert.ok(structureProblems(short).some((p) => /words/.test(p)));
  assert.ok(structureProblems({ ...goodArticle, school: "Alabama" }).some((p) => /school must be one of/.test(p)));
});

test("draftProblems: a clean draft passes; an invented quote or number is caught", () => {
  const ctx = {
    today: TODAY,
    now: MORNING,
    sourceTexts: ["The SEC announced the game will be played Sunday at noon."],
    readUrls: ["https://olemisssports.com/news/2026/11/13/football-oklahoma-game-moved"],
    schedules: [schedule],
    scheduleUrls: [schedule.url],
    recentSportsTitles: [],
  };
  assert.deepEqual(draftProblems(goodArticle, ctx), []);
  const invented = { ...goodArticle, body: ['"We are thrilled to play on Sunday," the coach said.', ...goodArticle.body.slice(1)] };
  assert.ok(draftProblems(invented, ctx).some((p) => /does not appear word for word/.test(p)));
  const made = { ...goodArticle, body: ["Ole Miss is 4-1 at home this season.", ...goodArticle.body.slice(1)] };
  assert.ok(draftProblems(made, ctx).some((p) => /numbers do not appear in anything you read: 4-1/.test(p)));
});
