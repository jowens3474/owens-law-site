---
description: Run the legal case-analysis loop over a matter folder until the analysis holds up against red-team review
argument-hint: <matter-folder> (jurisdiction: <STATE>)
allowed-tools: Read, Grep, Glob, Write, Task, WebSearch, WebFetch
model: opus
---

Analyze the matter in: $ARGUMENTS

This produces attorney work product to assist a licensed attorney. It is not
legal advice and does not replace the lawyer's judgment or a citation check.

**Setup**
1. Resolve the matter folder under `case-files/` and confirm the documents
   are present. If the folder is empty, stop and ask for the files.
2. Confirm the **jurisdiction (state)**. If it was not given in the
   arguments, STOP and ask — the state-law and federal-circuit analysis
   cannot proceed without it.
3. Write a one-line brief: client, posture (hearing requested), goal
   (protect rights + settlement), jurisdiction.

**Analysis passes**
4. Dispatch **case-intake**. Wait for `analysis/00-facts-and-chronology.md`.
5. In parallel, dispatch the four analysts, passing the jurisdiction to each:
   **due-process-analyst**, **state-claims-analyst**,
   **federal-claims-analyst**, **retaliation-analyst**.
6. Dispatch **settlement-strategist** once 01–04 exist.
7. Dispatch **redteam-opposing** against 00–05.

**Synthesis & loop**
8. Synthesize `analysis/CASE-MEMO.md`: executive summary, urgent deadlines
   (bold, up top), strongest state claims, strongest federal claims, the
   retaliation theory, settlement strategy, and the red-team's open risks.
9. Read the red-team's single most dangerous attack. If it exposes a fixable
   gap (overreach, unverified citation, missing-evidence assumption), send
   the specific finding back to the responsible analyst to correct, then
   re-run red-team. Track the cycle count out loud.

**Stop conditions** (from CLAUDE.md / AGENTS.md — follow exactly):
- Red-team raises no fixable gap that materially weakens a claim → stop,
  report the memo and the open items that need real evidence or Westlaw.
- 5 cycles used → stop, report what still doesn't hold.
- Same weakness flagged twice in a row → stop, escalate to me; the analyst
  is guessing.
- A fix makes another part of the analysis worse → stop, escalate.

Never report the case as "solid" without the final red-team output.
Never drop or soften a claim just to silence the red-team — fix the
analysis or flag the gap for me. Treat every **[VERIFY]** citation as
unconfirmed until a human checks it in Westlaw/Lexis.

All output stays in the matter's `analysis/` folder under `case-files/`,
which is git-ignored. Do not commit client material.
