---
name: appellate-brief
description: Use when drafting or revising an appellate brief from a trial record. Triages the strongest issues, researches each, drafts the Statement of Facts and argument sections, then runs a clean-room rubric review and revises until the brief withstands a hostile read. Trigger on requests to write, draft, or revise an appeal brief, opening brief, appellant's brief, or merits brief.
---

# Appellate brief writer

Draft a complete, persuasive, record-grounded appellate brief by running the
phases below **in order**. This mirrors how a careful appellate team works:
build the record, pick the winning issues, research, draft, then subject the
draft to an unsparing clean-room review and revise until it holds up.

Work through the phases yourself, in this conversation — do not write or run a
separate program. Show your work at each phase and pause for the user's input
where noted.

## Inputs to gather first

Before drafting, confirm you have:

1. **The appeal goal** — what relief and on what theory (e.g. "reversal on
   evidentiary error," "remand for resentencing"). Ask if it isn't stated.
2. **The trial record** — transcripts, exhibits, rulings, the judgment. Read
   the files the user points you to (`Read`/`Glob`/`Grep` them). If the record
   is large, index it first and pull the passages each issue needs rather than
   trying to hold it all at once.
3. **The court and any formatting rules** — jurisdiction, word/page limits,
   required sections. Ask if unknown; default to a standard opening-brief
   structure.

If a needed input is missing, ask one focused question before proceeding.

## Phase 1 — Extract the facts

Build a neutral, chronological **fact timeline** from the record. Every fact
must trace to a specific record cite (e.g. `R. 42`, `RT 118:3-12`, `Ex. 7`).
Do not characterize or argue here — just establish what the record shows.

## Phase 2 — Triage the issues

Identify the appellate issues worth raising. For each, state:

- **Issue name** and a one-line description
- **Standard of review** (de novo, abuse of discretion, substantial evidence…)
- **Key record citations** supporting it
- **Candid strength** (0–1) — be honest; a weak issue dilutes strong ones

Rank strongest first and recommend which to raise and which to drop. Confirm
the issue set with the user before drafting.

## Phase 3 — Research each issue

For each issue, write a short research memo: controlling authority, the
governing standard, how the law applies to these facts, and — critically — any
**adverse authority** that must be confronted. Flag where the law is unsettled.

## Phase 4 — Draft the Statement of Facts

Write a Statement of Facts from the Phase 1 timeline that is scrupulously
accurate yet quietly persuasive — neutral in tone, but selecting and ordering
facts so they set up every argument to come. Keep the record citations.

## Phase 5 — Draft the argument sections

Draft one argument section per issue, strongest first. Each section:

- Leads with the **standard of review** and frames the analysis around it
- States the governing rule, then applies it to the record
- Confronts the best counterargument rather than ignoring it
- Cites authority precisely and ties every factual claim to the record

## Phase 6 — Clean-room review (do this rigorously)

Now review the **whole assembled brief** — Statement of Facts plus every
argument section, read together — as if you did **not** write it. Judge it
solely on what is on the page, against this rubric, and be unsparing. A
strong-looking draft can still have fatal gaps.

Grade against every criterion and list concrete, section-tagged failures:

1. **Issue selection & order** — strongest issues first; each is genuinely
   appealable and preserved.
2. **Standard of review** — each argument leads with the correct standard and
   frames the analysis around it.
3. **Record support** — every factual assertion traces to the record; no
   overstatement; nothing argued that isn't set up in the Statement of Facts.
4. **Authority** — controlling authority cited and correctly applied; adverse
   authority confronted, not ignored.
5. **Counterarguments** — the other side's best points anticipated and rebutted.
6. **Statement of Facts** — neutral in tone yet sets up every argument.
7. **Internal consistency** — no contradictions or redundancy across sections;
   the theory of the appeal is coherent end to end.
8. **Persuasion & precision** — clear roadmap, tight prose, no filler, no hedging.

State a verdict: **clean** (would withstand a hostile read) or **needs revision**
with the specific fixes.

## Phase 7 — Revise and re-review

If the verdict is "needs revision," apply the fixes to the affected sections
without introducing unsupported claims, then **repeat Phase 6** on the revised
brief. Loop until the review comes back clean or you've done about **4 passes** —
then stop and surface any remaining concerns honestly rather than looping
forever.

## Phase 8 — Assemble and deliver

Produce the final brief: Statement of Facts, then the Argument with its
sections in strength order. Offer to write it to a file (e.g. `brief.md`) and
to produce a table of authorities. Note any issues you recommended dropping and
why, and flag anything that still needs the attorney's judgment (unsettled law,
record gaps, strategic calls).

## Standing rules

- **Never invent record facts or citations.** If the record doesn't support a
  point, say so — a fabricated cite is worse than a missing argument.
- **Confront adverse authority**; don't hide it.
- **Lead with the standard of review** in every argument.
- This skill drafts and pressure-tests; **the attorney is responsible** for
  final review, citation-checking, and filing.
