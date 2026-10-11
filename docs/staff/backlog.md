# Staff backlog

Open items the Jackson Wire's AI staff keeps track of. The owner checks an
item off when it is done by changing `- [ ]` to `- [x]`. The chief of staff
reads this file every morning through the Status Report and reports how many
items are open and which one is oldest. Items are listed oldest first, so add
new ones at the bottom of a section and keep each item on one line.

## Owner decisions

- [x] Upgrade Vercel to Pro (done Oct 10). The owner upgraded on Oct 10, 2026, and deploys succeed again. Before that the site had been paused (HTTP 402), and the free Hobby plan is for non-commercial use only.
- [x] Approve the approval tiers in docs/staff/README.md. Decided Oct 10, 2026: the desks publish on their own, and the standards editor checks each story after it runs.
- [x] Update the About page's AI disclosure (app/about/page.tsx) to match how stories are actually reviewed. Done Oct 10, 2026.
- [ ] Add the bare domain thejacksonwire.com in Vercel, with its A record in Cloudflare, redirecting to www. Today it has no DNS record and does not resolve.
- [ ] Set a Deployment Retention period in the Vercel project settings.
- [ ] Set up a free external uptime monitor that alerts on downtime.
- [ ] Grant read access to Search Console and Google Analytics for the planned growth editor.
- [ ] GitHub starts the desks hours late (median 4h 23m over Sep 11 to Oct 10; the Morning Brief lands about 11 AM to 12:40 PM Central). Fix: have Vercel Cron trigger each desk on time, which needs a GitHub token stored in Vercel. Approve?
- [ ] The daily newsletter has never sent, and every signup on the site fails with "not configured yet": Resend is not connected (no RESEND_API_KEY or RESEND_AUDIENCE_ID in Vercel or in GitHub secrets). See docs/NEWSLETTER-SETUP.md.
- [ ] X, Bluesky, Facebook Page, and Instagram posting have never run: their secrets are not set. The Facebook Page step needs a one-time Meta app and Page token, and the app switched to Live. Bluesky is free and quickest. See docs/SOCIAL-SETUP.md and docs/INSTAGRAM-SETUP.md.
- [ ] Before the business manager reads the tips inbox through Cowork, decide whether tips are excluded or the About page's promise that a tipster's identity stays with the Wire is reworded.

## Corrections to check

- [ ] Oct 5 Farish Street Phase II story (slug farish-street-phase-ii-rfp-october-30-jra-properties): it says the stage was not built and calls the green a $1.5 million project. Check both against the sources and correct what is wrong.
- [ ] Oct 3 Midtown story (slug midtown-partners-486000-ced-grant-jackson): it says the green drew $1.5 million, while the reported cost was $400,000 to $500,000. Check and correct.
- [ ] Museum Trail story (slug museum-trail-downtown-connector-lakeland-bridge-eastover-beltline): it says the city's parks department maintains the trail, a department the city eliminated in May 2026. Check and correct.

## Desk issues

- [ ] The laws desk has rejected two drafts in a row (SB 2322 on Oct 9 at 1,088 words; HB 1944 on Oct 10 at 1,084 words, plus a oneSentence over 30 words), so it is publishing nothing. A fix that gives the model one revision pass before rotating is being built.
- [ ] app/corruption-case/page.tsx hard-codes the Next line, "Owens sentencing · Oct 15, 2026". Update it after that date.
- [ ] Pro alerts: GitHub never starts the 8:00 AM (13:00 UTC) run, 0 of the last 10 weekdays. Move the cron, or accept two runs a day.
- [ ] Pipeline Pro alerts and the Monday briefing depend on Resend too, and they also need RESEND_PRO_AUDIENCE_ID (docs/PRO-SETUP.md); check whether they have ever sent once Resend is connected.
