# Editorial direction: business, economics, and what's coming

The Jackson Wire leans toward business, economics, and development. It works
like a research desk: read the document first, publish what it says before it
becomes a press release, and tell readers what is coming and when.

## Mission

> Our mission is to increase transparency and educate the public, to help
> people make better decisions and to prevent them from being taken advantage
> of or kept in the dark. That should help improve people's lives and outcomes
> and advance human and civil rights.

The statement lives in `lib/mission.json`; the quote above is a copy, so
change both together. The About page, the site footer, `llms.txt`,
`llms-full.txt`, the newsletter footer, and the autopilot, Morning Brief, and
laws desk prompts all read it from there; the organization's structured data
links to it at `/about#mission`. The monthly sales-tax report and the Pro
briefing do not carry it yet.

The reporting rules below live in `scripts/lib/mission.mjs`, which the three
desk prompts include; change the two together. They apply to every autopilot
article, Morning Brief, and What Passed entry, and they never override the
fact, length, or punctuation rules:

- **What it means for you, and what you can do.** Say what the documents show
  the news means for readers and, when a source gives one, the meeting to
  attend, the comment or filing deadline, the office to contact, or the
  record to check. Copy dates, times, addresses, and phone numbers exactly
  from a source; if no source gives a step, leave it out.
- **Follow the money, when money is involved.** Who pays, who benefits, and by
  how much, as the sources give it. If the documents do not show the cost or
  who benefits, say so in one short clause scoped to what was read (for
  example, "the agenda packet does not show the cost") instead of leaving it
  out, and never estimate the missing figure. Point out fees, fine print, and
  terms in the document that cost an ordinary person money or limit a right.
- **Show the source.** Name the primary document and where it is posted, and
  explain jargon in plain words.
- **Rights are part of the story.** When a story touches voting, due process,
  equal treatment, or access to public records and meetings, report what the
  documents and named sources say; call nothing unlawful or unjust unless a
  named source or a court does.
- **Accuracy, not advocacy.** Attribute every claim, give each side its
  strongest case, state options without telling readers or officials what to
  do, and keep the Wire's own analysis labeled.

## Beat weights

- About three of every four articles are **Business**, **Economy**, or
  **Development**. Real Estate, Politics, and General News fill the rest,
  told through the money where possible.
- The corruption case is an archive beat. It gets coverage only when a
  substantive new order, sentencing filing, or ruling lands.

The autopilot enforces this in `scripts/autopilot.mjs`:

| Rule | Trigger |
| --- | --- |
| Must pick Business, Economy, or Development | fewer than 4 of the last 6 non-brief articles were money beats |
| May not cover the corruption case | 2 or more of the last 5 were tagged `corruption-case` |
| May not pick Politics | 3 or more of the last 7 were Politics |

Morning Briefs are excluded from those counts. The brief itself
(`scripts/morning-brief.mjs`) must carry at least three business, economy, or
development items and at least one forward-looking item with a date.

## What counts as a story, in order of value

1. **Ahead of the crowd.** A detail in a filing, agenda, permit, contract,
   bond document, or dataset nobody has reported.
2. **What is coming.** A project, vote, rate change, incentive, hiring,
   closure, or deadline in the next 1 to 18 months, with the date and the
   decision-maker named.
3. **By the numbers.** A public dataset read closely, with a finding the
   reader cannot get elsewhere.
4. **Follow the money.** Who benefits, by how much, and who pays.

Every article ends with a **What's next** section that names the next date,
the decision-maker, and what to watch, and, where a source supports it, how
readers can take part. Every article carries at least one
number the Wire computed or pulled from a document.

## Length

Keep articles short so readers finish them. The publisher's standard, set
Oct. 9, 2026:

| | Target | Ceiling |
| --- | --- | --- |
| Words | 450 to 650, about a 3-minute read | 750 |
| Paragraphs | 5 to 8, each 1 to 4 short sentences | 8 |
| Dek | One or two sentences, under 40 words | 2 sentences |

Lead with the finding, keep one source line per fact, and cut background the
reader can get from a link to an earlier Wire story. In hand-written articles,
detailed sourcing belongs in the reporting note, not the body. Morning Briefs
and the monthly sales tax report keep their own formats. The autopilot carries
the same limits in `scripts/autopilot.mjs`.

## Sources the desk works from

Money and business: Secretary of State business filings (sos.ms.gov), MDA
project and incentive announcements (mississippi.org), MDES WARN notices
(mdes.ms.gov), Department of Revenue sales-tax diversions (dor.ms.gov), BLS
Jackson MSA series, USASpending.gov and SAM.gov, EMMA bond disclosures
(emma.msrb.org), SEC EDGAR, Hinds County land and assessor records.

Government and development: Jackson council, Planning Board, and zoning
packets (jacksonms.gov); Hinds, Madison, and Rankin County boards; suburban
city agendas; JRA and the Capitol Complex Improvement District; JXN Water
filings and the receivership docket; PSC dockets (psc.ms.gov); Legislature
bills and fiscal notes; PEER and State Auditor reports; CourtListener for
business litigation and bankruptcies.

## Search and data providers

The scripts search the web through `scripts/lib/search.mjs`, which tries
providers in order and never throws:

1. **Tavily** (`TAVILY_API_KEY`), at `basic` depth. The free plan is 1,000
   credits a month; basic searches cost 1 credit, advanced cost 2. When Tavily
   answers with its usage-limit error (HTTP 432) the run stops calling it.
2. **Brave Search** (`BRAVE_API_KEY`, optional). Add the secret in repo
   Settings, Secrets and variables, Actions to enable it.
3. **DuckDuckGo** HTML results, no key.

If all three fail, the model is handed a list of portals it can read with
`fetch_url` and told not to guess URLs.

CourtListener calls go through `scripts/lib/courtlistener.mjs`, which tries
the v4 API first and falls back to v3, logging the response body on any
error so an auth problem is visible in the workflow log. The docket-check
workflow runs on whatever branch it is dispatched from, so a change to that
module can be tested before it is merged.

## Real-time data tools

`scripts/lib/data-tools.mjs` gives both scripts the primary-source tools below,
none of which need a search quota. The prompts tell the model to open every
run with `local_feeds`, `news_feed`, `jackson_meetings`, and `public_notices`.

| Tool | Source | Key |
| --- | --- | --- |
| `news_feed` | Google News RSS and GDELT, newest first | none |
| `local_feeds` | Thirty-nine local RSS feeds read directly (newsrooms, Mississippi Today reprints, JXN Water, the airport, suburbs, state officials, campuses, civic groups), by group, deduplicated, newest first, direct links; see the local source map below | none |
| `jackson_meetings` | jacksonms.gov agenda post type and news posts; Hinds County board page | none |
| `federal_awards` | USASpending contracts and grants by place of performance (Hinds, Madison, Rankin) | none |
| `bls_series` | BLS Jackson MSA unemployment, employment, nonfarm jobs; Mississippi unemployment | `BLS_API_KEY` optional |
| `eia_fuel_prices` | EIA weekly diesel and gasoline with a key; AAA daily state and national averages without | `EIA_API_KEY` optional |
| `sec_filings` | SEC EDGAR full-text search | none |
| `federal_register` | Federal Register documents API | none |
| `court_search` | CourtListener RECAP search, S.D. Miss. | existing token |

Three feeds added after the first round, all keyless:

| Tool | Source |
| --- | --- |
| `bankruptcies` | CourtListener, S.D. Miss. bankruptcy court: every Chapter 11, plus Chapter 7 cases and adversary proceedings with a business name |
| `public_notices` | City of Jackson's bid-opportunity posts: invitations for bids, RFPs, zoning publication ads (rezonings, use permits, variances), meeting notices |
| `sales_tax_diversions` | Department of Revenue monthly diversions to cities, parsed from the PDF; feeds `/economy/sales-tax` |
| `meeting_transcripts` | The Record: searchable transcripts of city meetings from the city's own video; see below |
| `hinds_supervisors` | Hinds County Boardroom listing (co.hinds.ms.us): agenda and minutes PDFs by meeting, first 9,000 characters of the newest readable minutes |
| `hinds_land_records` | Hinds County chancery clerk general index: every instrument recorded in a date window (deeds, deeds of trust, releases, lis pendens), business parties by default |
| `madison_supervisors` | Madison County's printed upcoming agenda (tools.madison-co.net, first 9,000 characters) and where the minutes are |
| `rankin_supervisors` | Rankin County's CivicClerk API: meetings with agenda, packet, and minutes files, first 9,000 characters of the newest agenda |
| `mdeq_permits` | MDEQ enSearch "recently issued permits" report, filtered by county column to Hinds, Madison, and Rankin |
| `psc_dockets` | Public Service Commission monthly Utility and Consent docket PDFs, split into docket items, those mentioning metro utilities |
| `sos_tax_forfeited` | Secretary of State tax-forfeited land inventory for Hinds County: the public hosted ArcGIS layer behind tflgis.sos.ms.gov (export dated May 12, 2026, about 2,450 active parcels), queried by neighborhood preset, bbox, street, zip, or owner; rows carry address, assessor value, size, tax sale date, last owner, blight flag, Hinds parcel number, SOS parcel link, and a map pin |

The Secretary of State's main site (sos.ms.gov) sits behind Akamai and
answers a browser-like user agent with 403, but a plain agent gets through;
its statewide tax-forfeited web map is private, while the Hinds County and
City of Jackson exports on the state GIS server (gisserver.its.ms.gov) are
public feature services, which is what `sos_tax_forfeited` reads.

The statewide public-notice site run by the Mississippi Press Association
refuses connections from GitHub's network, so county-level foreclosure and
bond-validation notices are not yet automated.

Run the **Data Check** workflow (Actions, workflow_dispatch) to see every
tool's live output from a runner. It runs on the branch it is dispatched
from, so a change to the module can be tested before merge.

## Local source map

Probed from a GitHub runner on Oct. 9, 2026 with the Data Check workflow's
`feeds` mode (`TOOL=feeds`, no query probes every candidate in
`scripts/lib/local-feeds.mjs`; `QUERY="name=url|..."` probes a list). The
registry in that file holds only feeds that read cleanly. Re-run the probe
before adding a feed, and again if a group starts reporting it unreachable.

Readable, by `local_feeds` group:

| Group | Feeds |
| --- | --- |
| `news` | WLBT (news section and Hinds County section), WJTV (local, politics, bribery case), WAPT, Mississippi Today, Mississippi Free Press, Jackson Advocate, Mississippi Link, SuperTalk, Magnolia Tribune (all and business), Jackson Jambalaya, Mississippi Business Journal, Clinton Courier |
| `syndication` | DeSoto County News, Tippah News, and Our Tupelo, which reprint Mississippi Today in full; Beat of the Capital, which reprints WJTV. When a story also arrives from the original outlet's feed, the tool keeps the original and drops the reprint |
| `government` | JXN Water, Jackson Municipal Airport Authority, Jackson Redevelopment Authority (stale since 2021) |
| `metro` | Ridgeland, Pearl, Brandon, Clinton |
| `state` | Governor, Attorney General, Treasurer, MDEQ, State Department of Health (weekly certificate-of-need report) |
| `campus` | Millsaps, Mississippi College, Hinds Community College, Jackson State (new site, empty so far) |
| `civic` | Jackson Association of Neighborhoods, Innovate Mississippi, Community Foundation for Mississippi |

Mississippi Today's feed reads from a runner even though its article pages
answer 403; the syndication copies carry the full text, which is how the desk
reads a Mississippi Today story end to end.

Not readable from a runner, and the workaround where one exists:

- **Clarion Ledger**: every feed path answers 404 or 406. Use
  `news_feed("site:clarionledger.com ...")`, which goes through Google News.
- **Northside Sun**: 403 on every path (bot wall). **MPB**: no feed at any
  path. **Darkhorse Press**: feed paths return HTML. **Madison County
  Journal, Rankin County News**: connection refused.
- **City of Jackson**: `/feed/` is empty; `jackson_meetings` reads the news
  and agenda post types through the site's JSON API instead.
- **Hinds County** (hindscountyms.com) times out; the boardroom listing on
  co.hinds.ms.us is read by `hinds_supervisors`. **Hinds County Sheriff,
  Jackson Public Schools**: unreachable or no feed.
- **State Auditor**: `rss.xml` is empty and the Drupal news page is HTML only.
  **MDA, MDOT, PSC, PEER, Department of Revenue, MDES, Secretary of State,
  Ethics Commission**: no feed; `psc_dockets` and `mdeq_permits` cover the
  two with structured documents.
- **Legislature** (billstatus.ls.state.ms.us, legislature.ms.gov):
  connection refused from GitHub's network.
- **U.S. Attorney S.D. Miss., FBI Jackson**: no feed, or 403.
- **UMMC, Belhaven, Mississippi State**: no feed found. **Downtown Jackson
  Partners, Greater Jackson Partnership, Visit Jackson, Fondren Renaissance,
  Great City Mississippi, Mississippi Economic Council, Entergy newsroom**:
  no feed or unreachable. **Madison, Flowood, Byram, Canton, Madison County,
  Rankin County**: unreachable or no feed.

## County and state sources: what is automated and what is not

Probed from a GitHub runner on Sept. 29, 2026 (`scripts/lib/county-tools.mjs`):

- **Hinds County supervisors**: agendas are scanned images with no text
  layer, so the tool reads the typed minutes instead; the video is on
  Lifesize, a JavaScript player with no discoverable media URL, so the
  county is not in the Record.
- **Madison County**: the upcoming agenda prints as plain text. The
  minutes archive page lists site-wide PDFs; minutes are reachable through
  the county's search pages, which the tool points to.
- **Rankin County**: CivicClerk's OData API is open; agenda packets and
  minutes stream by file id. Meetings are pre-scheduled a year out, so the
  tool only looks a week ahead.
- **MDEQ**: the recently issued permits report is a plain table. Jackson
  County on the coast shares the city's name, so the tool filters on the
  county column.
- **PSC**: the dockets page links monthly PDFs; the document portal
  (ctsportal.psc.ms.gov) refuses the runner.
- **Hinds County land records**: the general index answers a date-range
  query with no name once both radio parameters are sent (`sn1=3&sn2=3`);
  a week is "more than 100 records" over about 34 pages, paged through the
  ASP session cookie. The tool reads up to six pages and says when the
  window is partial.
- **Not reachable**: the Secretary of State business search (Akamai
  "Access Denied") and the liquor permit search (interactive only). Layoff
  notices exist only as quarterly PDFs with unstable names. These need a
  residential connection or a records request.

## Sales tax series

`scripts/sales-tax-report.mjs` (workflow **Sales Tax Report**, daily) checks
the Department of Revenue listing for a report the dataset has not seen,
backfills up to 14 months of history on the first run, updates
`data/sales-tax-diversions.json`, and has DeepSeek write a "By the Numbers"
Economy story from the parsed table alone. The tracker page at
`/economy/sales-tax` reads the same file: stat tiles, a 24-month column
chart for Jackson, and the metro table with year-over-year and
fiscal-year-to-date changes. Dispatch the workflow with `dry_run = 1` to
refresh the data and preview the story without publishing.

## The Record (meeting archive)

`/meetings` is the searchable archive of what was said at public meetings.
`scripts/meeting-archive.mjs` (workflow **Meeting Archive**, daily at
10:00 UTC) reads the city's own video archive at jacksonms.swagit.com
(`listSwagitVideos` in `scripts/lib/meetings.mjs`), which carries every
council meeting, committee meeting, budget hearing, and special meeting
with its agenda PDF. For each new video it pulls the audio with ffmpeg,
transcribes it (Groq's Whisper endpoint when `GROQ_API_KEY` is set,
otherwise faster-whisper `small.en` on the runner's CPU, roughly a quarter
of the meeting's length), merges the segments into timed blocks, and has
DeepSeek index the meeting with the agenda text alongside: a summary,
topics with start times, people, dollar figures, and votes. Everything
lands in `data/meetings/`: `index.json` (metadata and the index, imported
by the pages) and one `sw<video id>.json` per meeting with the full
transcript.

- `/meetings/<id>` shows the index beside the transcript; every timestamp
  opens the city's player at that moment.
- `/meetings/search?q=` and `/api/meetings/search?q=` return the passages
  containing every query term, newest meeting first.
- The desk tool `meeting_transcripts` runs the same search for the
  autopilot and Pro briefing, so stories can quote what an official said
  rather than a TV station's paraphrase.

Transcripts are speech recognition, so the pages say so and the tool
tells the model to verify spellings. Each run ingests `limit` videos
(default 2, newest first, skipping anything over `MAX_HOURS`), so the
backlog fills in over successive days; the runner job has a five-hour
limit.

Dispatch the workflow with `mode = list` to see what the archive holds,
`video = 400748` plus `dry_run = 1` to preview one meeting's transcript
and index without writing, and `limit` to ingest more per run. Set the
`GROQ_API_KEY` secret for faster, better transcription (its free tier
covers hours of audio a day) and the `WHISPER_MODEL` variable to change
the local model.

YouTube is a second source (`SOURCES` in the library: the City of Jackson
PEG Network channel, which also carries the 1% Sales Tax Commission and
press conferences) but YouTube refuses GitHub's addresses with its
"confirm you're not a bot" check, even with a proof-of-origin token
provider, so it is only tried when the `YOUTUBE_COOKIES` secret (a
Netscape cookie file from a signed-in browser) is set or `YOUTUBE=1` is
passed. `mode = ytprobe` reports which yt-dlp client can read a video.

Not yet archived: Hinds County's Lifesize recordings (playback.lifesize.com
links on the Board of Supervisors page).

## The Pipeline

`/pipeline` is the public tracker. Its data lives in `lib/pipeline.ts`:

- `PROJECTS`: one entry per project or money decision, with a stage
  (`proposed`, `approved`, `under-construction`, `opening`, `stalled`), a
  one-sentence status, what happens next, and the Wire article slugs that
  source it. Every slug must exist in `lib/posts.ts`.
- `MILESTONES`: dated events (votes, deadlines, elections, openings, rate
  changes, fiscal-year starts). Use ISO dates. Set `approx: true` when only a
  month or season is known; the page then prints "Month YYYY (approx.)".

The homepage rail shows the next five milestones under "Coming up". Past
milestones move to "Recently decided" on the hub automatically.

When the autopilot publishes a story about a specific project, bond, rate
case, incentive, lease, or ballot measure it tags it `pipeline`, which lists
it under "Pipeline coverage" on the hub. Adding the project or date to
`lib/pipeline.ts` is a manual step for the editor.

## Sections

`Business`, `Economy`, `Development`, `Real Estate`, `Politics`,
`General News`. The former Commercial Real Estate and Residential Real Estate
sections redirect to Development and Real Estate (see `next.config.ts`).

## Reader-facing site

The pieces of the site that exist to make the reporting easy to find and
pleasant to read:

- `/search?q=` searches every published article: headline, dek, tags, and
  body. A phrase in quotes matches exactly; every other term must appear
  somewhere in the story, and headline matches rank first. Words of three
  letters or fewer match whole words only, so "AI" does not light up
  "said" (`lib/search-terms.ts`). The section menu, the archive, and the
  404 page all carry the search box. The code is in `lib/search.ts`.
- The section bar sticks to the top of every page. On phones, tablets, and
  screens 1280px and wider it shows a small wordmark that links home once
  the masthead has scrolled away.
- On phones the front page shows the six newest stories ("Latest") right
  after the lead, before the "More coverage" grid.
- Article pages have a reading-progress line, a share row (the system
  share sheet where the browser offers one, plus copy link, email,
  Facebook, and X), and body text at 18px on phones and 20px above that.
- Quotes and apostrophes are typed straight in `lib/posts.ts` and rendered
  as typographic quotes in every article's headline, dek, body, timeline,
  and note (`lib/typography.ts`). Writers never need to type curly quotes.
  Pipeline data and page chrome are not converted.
- The rail's "From the Archive" module rotates five older original stories
  (two weeks old or more) once a day. There is no "Most Read" module: the
  site does not count views.
- The masthead date is rendered in Jackson time and corrected on the
  reader's device, so a page built on a Monday never shows Monday's date
  on Friday.

## What Passed (laws, plainly)

`/laws` explains the bills that became law in plain words, one entry per
law, starting with the ones that matter most to Jackson, so a reader can
keep up without reading the text or connecting the dots alone. The data
lives in `lib/laws.ts`; `scripts/laws-desk.mjs` drafts new entries (one
per run) from a bill number and sources, and
`.github/workflows/laws-desk.yml` works through `data/laws-queue.json`
five days a week (Tuesday through Saturday). Each entry gets `/laws/<slug>`, the sitemap, `llms.txt`, and the
"What Passed" rail on the front page.

**Reading level.** A bright 12-year-old. Short sentences, one idea each,
no jargon without a one-line definition in the same breath ("A fiscal
note is the Legislature's own estimate of what a bill will cost."). Prefer
a concrete household to an abstraction: "a family earning $50,000", "about
$8 a month".

**Shape.** Every entry has the same sections, in this order: one sentence
that says the whole law; what it does; why it happened; what's behind it
(who pushed, who fought, the politics and the money, how the vote went);
what it costs and who pays; what changes for you; what it means for
Jackson (only when there is something to say); watch for; sources; a
reporting note. 450 to 800 words in all, 850 at most. Sentences of 40
words or fewer, paragraphs of four sentences or fewer. Analysis only in a sentence that
begins "The Wire's read:". Ranges are written "5 to 15 years", never with
a dash. The reporting note is plain text; the page adds the label.

**Sourcing.** The bill as enacted comes first (the Legislature's bill
history page is linked automatically from the bill number), then the
fiscal note or budget office estimate when one exists, the governor's
action, and at least two news reports. Vote counts, sponsors, dollar
figures, and effective dates come from those documents, attributed once
in-line. Never a number without a source; a gap is stated as "the Wire
could not find". The reporting note says what was read, what could not
be read (the Legislature's site and LegiScan refuse the runner; news
syndication copies usually carry the text), and what the Wire did not do.

**Updates.** When a law is blocked in court, amended, or starts a new
phase, update the entry in place, set `updated`, and say what changed in
the "Watch for" section.
