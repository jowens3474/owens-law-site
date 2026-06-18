<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Loop stop rules

The team loops until one of these is true:

- ALL GREEN: every check passes. Stop and report success with proof.
- 5 cycles used: stop. Report what still fails and what was tried.
- Same failure twice in a row: stop. The builder is guessing, not
  fixing. Escalate to me.
- A fix makes a previously passing check fail: stop. Something is
  being broken to fix something else.

Never report success without checker output from the final cycle.
Never weaken or delete a check to reach ALL GREEN.

