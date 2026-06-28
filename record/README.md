# Case record

Drop the appeal's source materials here, then ask Claude Code (in this repo) to
draft the brief — the `appellate-brief` skill reads these files.

## What to put here

- **Transcripts** — reporter's transcript, hearing transcripts (`.txt`, `.md`,
  or `.pdf`).
- **Clerk's record / exhibits** — pleadings, motions, the challenged rulings,
  jury instructions, exhibits.
- **The judgment / order** being appealed.
- **A short `case.md`** (optional but helpful) noting: the appeal goal (relief +
  theory), the court and case number, word/page limits, and filing deadline.

## How to use it

Start a Claude Code session in this repo and say, for example:

> Draft an appellant's opening brief seeking reversal on the evidentiary
> ruling. The record is in `./record/`. California Court of Appeal, 14,000-word
> limit.

The skill will index the record, triage issues with you, then draft, review
against its rubric, and revise.

## Notes

- Keep filenames descriptive (`reporters-transcript-vol1.pdf`, `ruling-msj.pdf`)
  so citations are easy to trace.
- These are case materials — mind client confidentiality before committing
  anything sensitive to git. Add files to `.gitignore` if they shouldn't be
  pushed.
