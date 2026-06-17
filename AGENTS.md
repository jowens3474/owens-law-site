<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Build-loop stop conditions

`/build-loop` drives the `builder` and `checker` subagents until the
project is ALL GREEN. The orchestrator stops when **any** of these is
true:

- **Green.** The checker reports `ALL GREEN`. Show the result and stop.
- **Cycle cap.** Five builder→checker cycles have completed without
  green. Stop and report the last checker output.
- **Not converging.** The checker reports the same failure line
  (same `file:line - what broke`) in two consecutive cycles. Stop —
  the builder is stuck.
- **Builder bailout.** The builder reports it can't fix something
  without human judgement (ambiguous requirements, missing dep that
  needs approval, conflicting instructions). Stop and surface the
  question to the user.
- **Weakening attempt.** The builder's report shows it disabled a
  check instead of fixing the cause: `--no-verify`, `eslint-disable`,
  `@ts-ignore`/`@ts-nocheck`, `as any` to silence types, skipped or
  deleted tests, or commented-out assertions. Reject the change,
  stop, and tell the user which check was bypassed.

Never commit or push from inside the loop. After stopping, the user
decides what to do with the working tree.

