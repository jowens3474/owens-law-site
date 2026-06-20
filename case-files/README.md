# case-files/  — privileged, NOT version-controlled

Everything in this folder (except this README) is git-ignored. Client
documents and attorney work product live here and **never** get committed
or pushed to the website repo.

## What goes here

Drop the source documents for a matter into a subfolder named for the
matter, e.g. `case-files/superintendent-termination/`. Suggested inputs:

- The employment contract (esp. the due-process / termination clauses)
- The board's notice of termination / charges
- Any improvement plan(s)
- The document the principal sent to the board
- Investigation report(s) / findings
- The hearing request and any scheduling/correspondence
- Board meeting minutes / agendas

## What the loop writes back here

The `/work-case` loop writes its work product into a `analysis/`
subfolder of the matter, e.g.:

```
case-files/superintendent-termination/
  analysis/
    00-facts-and-chronology.md   (intake)
    01-due-process.md
    02-state-claims.md
    03-federal-claims.md
    04-retaliation-theory.md
    05-settlement-strategy.md
    06-redteam.md
    CASE-MEMO.md                 (synthesis)
```

## Run it

```
/work-case case-files/superintendent-termination  (jurisdiction: <STATE>)
```
