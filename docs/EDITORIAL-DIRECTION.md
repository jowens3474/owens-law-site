# Editorial direction: business, economics, and what's coming

The Jackson Wire leans toward business, economics, and development. It works
like a research desk: read the document first, publish what it says before it
becomes a press release, and tell readers what is coming and when.

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
the decision-maker, and what to watch. Every article carries at least one
number the Wire computed or pulled from a document.

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

`scripts/lib/data-tools.mjs` gives both scripts eight primary-source tools
that need no search quota. The prompts tell the model to open every run
with the first two.

| Tool | Source | Key |
| --- | --- | --- |
| `news_feed` | Google News RSS and GDELT, newest first | none |
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

The statewide public-notice site run by the Mississippi Press Association
refuses connections from GitHub's network, so county-level foreclosure and
bond-validation notices are not yet automated.

Run the **Data Check** workflow (Actions, workflow_dispatch) to see every
tool's live output from a runner. It runs on the branch it is dispatched
from, so a change to the module can be tested before merge.

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
