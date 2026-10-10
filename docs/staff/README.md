# The Jackson Wire staff

The Jackson Wire is published by its owner, J. Edward Owens, and staffed by AI roles: ten scheduled desks that research and publish, a Status Report that checks on them, a chief of staff who reads that report each morning, and a build team that changes the code. This file and the charters it links to are the source of truth for every AI staff role. If a role's instructions anywhere else disagree with them, these files win. The owner keeps a planning copy of the staff plan in a private document. That copy is not the source of truth and is not quoted here.

Files in this folder:

- `README.md`: this roster, the approval tiers, and the rules every role follows.
- `chief-of-staff.md`: the chief of staff's charter.
- `backlog.md`: open items the staff tracks. The owner checks them off.

## Roster

| Role | Status | Runs (Central) | Where | Charter or script |
| --- | --- | --- | --- | --- |
| Meeting archive | active | daily 5:00 AM | GitHub Actions: `.github/workflows/meeting-archive.yml` | `scripts/meeting-archive.mjs` |
| Morning Brief | active | daily 6:00 AM | GitHub Actions: `.github/workflows/morning-brief.yml` | `scripts/morning-brief.mjs` |
| Pro briefing | active | Mondays 6:00 AM | GitHub Actions: `.github/workflows/pro-briefing.yml` | `scripts/pro-briefing.mjs` |
| Pro alerts | active | weekdays 8:00 AM, noon, 4:00 PM | GitHub Actions: `.github/workflows/pro-alerts.yml` | `scripts/pro-alerts.mjs` |
| Autopilot | active | daily 9:00 AM | GitHub Actions: `.github/workflows/autopilot.yml` | `scripts/autopilot.mjs` |
| Laws desk | active | Tuesday to Saturday 10:00 AM | GitHub Actions: `.github/workflows/laws-desk.yml` | `scripts/laws-desk.mjs` |
| Sales tax | active | daily 10:00 AM | GitHub Actions: `.github/workflows/sales-tax.yml` | `scripts/sales-tax-report.mjs` |
| Instagram | active | daily 10:30 AM, and after any change to `lib/posts.ts` | GitHub Actions: `.github/workflows/instagram.yml` | `scripts/post-instagram.mjs` |
| Social | active | daily 10:45 AM, and after any change to `lib/posts.ts` | GitHub Actions: `.github/workflows/social.yml` | `scripts/post-social.mjs` |
| Newsletter | active | daily 11:00 AM | GitHub Actions: `.github/workflows/newsletter.yml` | `scripts/send-newsletter.mjs` |
| Status Report | active | daily 6:35 AM | GitHub Actions: `.github/workflows/status-report.yml` | `scripts/status-report.mjs` |
| Chief of staff | active, read only in week 1 | daily 6:51 AM | Claude Code routine | `docs/staff/chief-of-staff.md` |
| Standards editor | planned | not scheduled yet | Claude Code routine | none yet |
| Site reliability | planned | not scheduled yet | Claude Code routine | none yet |
| Growth editor | planned | not scheduled yet | Claude Code routine | none yet |
| Business manager | planned | not scheduled yet | Cowork | none yet |
| Build team: orchestrator, planner, builder, checker, reviewer | active | when the owner asks for a change | Claude Code subagents in `.claude/agents` | `.claude/agents/*.md`, following `AGENTS.md` |

Notes on the times:

- They are Central daylight time now. Schedules are set in UTC, so after Nov. 1 each one runs an hour earlier on the Central clock.
- They are the scheduled times, not the start times. GitHub starts this repo's scheduled runs late: about 4 hours at the median and up to 9 hours (174 runs, Sep. 11 to Oct. 10, 2026). The Morning Brief, for example, usually runs in the late morning. The Status Report shows when each run really started.

## Approval tiers (proposed, not yet in force)

These tiers say what a role may do alone and what waits for the owner. They are a proposal. Until the owner approves them, the desks keep publishing as they do today, and nothing in this section changes how any desk works.

**Goes out on its own**

- The Morning Brief
- Meeting transcripts
- Data updates
- Law explainers that pass their checks
- Scheduled social posts and newsletters
- Pro alerts
- Typo fixes
- Code fixes that pass checks and review

**Goes out, then the owner is told**

- Daily news stories built from public documents that accuse no named person of wrongdoing

**Waits for the owner's OK**

- Allegations of crime or misconduct against a named person or business
- Lawsuits and criminal cases
- Unnamed sources
- Stories about private individuals
- Stories touching the owner's business interests
- Corrections that change a fact
- Taking a story down
- Extra emails to subscribers
- Anything that spends money or changes Vercel, Cloudflare, Stripe, or prices
- New desks or rule changes

## Rules for every staff role

- The repo is public. Never put secrets, tips, sources, unpublished allegations, subscriber data, or business numbers in commits, issues, pull requests, or workflow logs.
- Every commit to main redeploys the site, and deploys are limited. Commit to main only when your charter says so.
- Follow `AGENTS.md` for code changes.
- Follow `docs/EDITORIAL-DIRECTION.md`, and use no em or en dashes in reader-facing copy.
- Never change billing, DNS, secrets, or account settings.
