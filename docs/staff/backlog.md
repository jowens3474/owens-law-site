# Staff backlog

Open items the Jackson Wire's AI staff keeps track of. The owner checks an
item off when it is done by changing `- [ ]` to `- [x]`. The chief of staff
reads this file every morning through the Status Report and reports how many
items are open and which one is oldest. Items are listed oldest first, so add
new ones at the bottom of a section and keep each item on one line.

## Owner decisions

- [ ] Upgrade Vercel to Pro. The site has been paused since Oct 10, 2026 (it returns HTTP 402), and the free Hobby plan is for non-commercial use only.
- [ ] Approve the approval tiers in docs/staff/README.md, or change them. Until the owner approves them, the desks keep publishing as they do today.
- [ ] Update the About page's AI disclosure (app/about/page.tsx) to match how stories are actually reviewed.
- [ ] Add the bare domain thejacksonwire.com in Vercel, with its A record in Cloudflare, redirecting to www. Today it has no DNS record and does not resolve.
- [ ] Set a Deployment Retention period in the Vercel project settings.
- [ ] Set up a free external uptime monitor that alerts on downtime.
- [ ] Grant read access to Search Console and Google Analytics for the planned growth editor.

## Corrections to check

- [ ] Oct 5 Farish Street Phase II story (slug farish-street-phase-ii-rfp-october-30-jra-properties): it says the stage was not built and calls the green a $1.5 million project. Check both against the sources and correct what is wrong.
- [ ] Oct 3 Midtown story (slug midtown-partners-486000-ced-grant-jackson): it says the green drew $1.5 million, while the reported cost was $400,000 to $500,000. Check and correct.
- [ ] Museum Trail story (slug museum-trail-downtown-connector-lakeland-bridge-eastover-beltline): it says the city's parks department maintains the trail, a department the city eliminated in May 2026. Check and correct.

## Desk issues

- [ ] The laws desk's Oct 9 SB 2322 draft ran 1,088 words against the 800-word limit and was moved to the back of the queue. Tune scripts/laws-desk.mjs if it repeats.
- [ ] app/corruption-case/page.tsx hard-codes the Next line, "Owens sentencing · Oct 15, 2026". Update it after that date.
