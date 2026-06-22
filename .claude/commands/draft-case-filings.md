---
description: Generate the priority litigation documents for a matter from its analysis memos
argument-hint: <matter-folder>
allowed-tools: Read, Grep, Glob, Write, Edit, Task, WebSearch, WebFetch
model: opus
---

Draft the priority filings/correspondence for the matter in: $ARGUMENTS

This is the drafting phase that follows `/work-case`. It produces DRAFTS for attorney
review — never filing-ready documents. All output goes to the matter's `drafts/` folder
(git-ignored). Do not commit client material.

**Setup**
1. Confirm the matter's `analysis/` memos exist (00–07). If not, run `/work-case` first.
2. Build the deadline-ordered worklist from the CASE-MEMO's action checklist. Put the
   most imminent deadline first.

**Dispatch** the `litigation-drafter` agent once per document (run independent drafts in
parallel). The standard superintendent-termination package, in deadline order:
1. **Hearing submission to each Board member** (contract §10 ¶4) — rebut each charge,
   assert the procedural defects, preserve objections. *Usually the most urgent.*
2. **Document/evidence demand** to the Board President — the witness statements, IT report,
   minutes, leave letter, improvement plans, the spouse-proceeding record.
3. **Motion / letter to continue** the hearing (conditional on evidence being withheld).
4. **Settlement demand letter** — anchored on breach-of-contract balance-of-term, with the
   §1983/§1988 fee tail and the retaliation optics as the amplifier.
5. **Protective appeal / bill of exceptions** to preserve judicial review — lead with the
   deadline-verification flag.

**After drafting**
6. List every draft with its one-line "attorney must confirm" note.
7. Convert the client-facing drafts to .docx (pandoc) if requested.

**Discipline:** every draft carries `DRAFT — FOR ATTORNEY REVIEW`; every citation is
`[VERIFY]`; unconfirmed facts are `[CONFIRM: ...]` placeholders. Never fabricate authority;
never assert facts the memos don't support.
