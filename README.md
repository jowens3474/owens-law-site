# Press conference transcripts (data only)

This branch holds YouTube caption transcripts of Ole Miss and Mississippi
State press conferences for the sports desk. It is not the site.

- Written by the owner's Mac every two hours: `scripts/press-transcripts-mac.sh`
  and `scripts/press-transcripts-sync.mjs` on main.
- Read by `.github/workflows/sports-desk.yml` before each desk run.
- One file per session: `transcripts/<videoId>.json`. Files older than two
  weeks are deleted.
- `vercel.json` here turns Vercel deployments off for this branch, so these
  pushes never use a site deploy.

Do not merge this branch into main, and do not delete it: the desk falls back
to news reports of the sessions without it.
