---
description: Build → check → fix loop. Drives the builder and checker subagents until ALL GREEN.
argument-hint: <task description>
---

You are orchestrating a build loop. Do not write code yourself — delegate to subagents.

**Task from the user:**
$ARGUMENTS

**Loop:**

1. Invoke the `builder` subagent with the task above. Wait for it to report what it changed.
2. Invoke the `checker` subagent. Wait for its STATUS line.
3. If `STATUS: ALL GREEN`, the loop is done — go to step 5.
4. If `STATUS: FAIL`, invoke `builder` again with a prompt that includes:
   - the FAILED check name
   - the OUTPUT block verbatim
   - one sentence: "Fix the cause of this failure. Do not modify the check itself."
   Then return to step 2.
5. When green, post a final summary to the user:
   - the task as stated
   - one-line list of files changed (from `git status --porcelain`)
   - "ALL GREEN — build + lint passing"
   Stop. Do not commit, push, or open a PR unless the user asks.

**Stop rules:**
- Hard cap at 6 builder→checker iterations. If still failing after 6, stop and report the last checker output to the user with a diagnosis of what's stuck.
- If the builder reports it can't fix something (e.g. ambiguous requirements, a missing dep that needs human approval), stop and report.
- If the checker keeps reporting the *same* failure for 2 consecutive iterations, stop — the loop is not converging.

**Rules for you (the orchestrator):**
- Never edit files yourself. Builder edits, checker verifies.
- Never bypass the checker. Even if a fix looks obviously right, run the checker.
- Never weaken a check (no `--no-verify`, no eslint-disable, no `any` casts to silence types) and reject any builder report that did so.
