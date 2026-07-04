# Newsletter Setup (Resend)

One-time checklist to wire up newsletter signups (`app/api/subscribe/route.ts`,
`app/components/NewsletterSignup.tsx`) and the daily digest sender
(`scripts/send-newsletter.mjs`, `.github/workflows/newsletter.yml`).

## 1. Create a Resend account

1. Sign up at [resend.com](https://resend.com). The free tier covers
   3,000 emails/month and 100/day, which is plenty for a daily digest to a
   small list.

## 2. Create an Audience

1. In the Resend dashboard, go to **Audiences → Add Audience**. Name it
   something like "Jackson Wire Subscribers."
2. Copy the **Audience ID** shown on the audience's page. You'll need this
   as `RESEND_AUDIENCE_ID`.

## 3. Create an API key

1. Go to **API Keys → Create API Key**.
2. Give it **Full access** (the subscribe route writes contacts, and the
   sender creates and sends broadcasts, so restricting to "Sending access"
   only isn't enough).
3. Copy the key. You'll need this as `RESEND_API_KEY`. It is only shown
   once.

## 4. Add GitHub Actions secrets

In the repo: **Settings → Secrets and variables → Actions → New repository
secret**. Add:

- `RESEND_API_KEY` — the API key from step 3.
- `RESEND_AUDIENCE_ID` — the audience ID from step 2.

This is what `.github/workflows/newsletter.yml` uses to run the daily send.

## 5. Add the same variables to the site host

The signup form (`/api/subscribe`) runs on the live site, not in GitHub
Actions, so the site host needs these as runtime environment variables too
(e.g. Vercel: **Project Settings → Environment Variables**). Add the same
`RESEND_API_KEY` and `RESEND_AUDIENCE_ID` there and redeploy. Until both are
set, the signup route responds with 503 "Newsletter signup is not
configured yet."

## 6. Verify the sending domain

To send broadcasts from `brief@thejacksonwire.com`, the domain
`thejacksonwire.com` must be verified in Resend:

1. Go to **Domains → Add Domain**, enter `thejacksonwire.com`.
2. Resend shows a set of DNS records (SPF and DKIM, typically TXT and
   CNAME records). Add these at your DNS provider.
3. Wait for verification (usually a few minutes to a few hours, depending
   on DNS propagation). The domain's status in Resend must show
   "Verified" before broadcasts from `brief@thejacksonwire.com` will send;
   until then, Resend rejects that from address.
4. For testing before the domain is verified, temporarily change the
   `FROM` constant in `scripts/send-newsletter.mjs` to
   `"The Jackson Wire <onboarding@resend.dev>"`, Resend's shared testing
   address. Switch it back to `brief@thejacksonwire.com` once verified.

## 7. How the daily send works

- `.github/workflows/newsletter.yml` runs `scripts/send-newsletter.mjs` at
  11 a.m. Central (16:00 UTC) every day, after the autopilot article
  writer, morning brief, and social posting jobs have had time to publish.
- The script fetches `https://www.thejacksonwire.com/feed.xml`, and sends a
  digest only for articles whose publish date is today's calendar date in
  America/Chicago. If nothing published today, it logs "No articles today;
  no send." and exits cleanly — no email goes out.
- You can trigger a manual run from **Actions → Newsletter → Run
  workflow**, or test locally with:

  ```
  DRY_RUN=1 RESEND_API_KEY=... RESEND_AUDIENCE_ID=... node scripts/send-newsletter.mjs
  ```

  `DRY_RUN=1` prints the subject line and the first 500 characters of the
  HTML body without calling the Resend API.
