# Pipeline Pro setup

Pipeline Pro is the Wire's paid tier: a Monday briefing, weekday alerts, and
a members-only desk at `/pro/dashboard`. It runs on Resend (email and the
member list), Stripe (billing), and GitHub Actions (the two senders). No
database: the Resend audience is the membership record, and the desk uses
a signed cookie.

## 1. Resend

1. Create a second audience named **Pipeline Pro**. Copy its id.
2. Verify the sending domain so `pro@thejacksonwire.com` can send (the
   same domain setup as the newsletter; see `docs/NEWSLETTER-SETUP.md`).
3. Secrets:
   - GitHub Actions: `RESEND_API_KEY`, `RESEND_PRO_AUDIENCE_ID`
   - Site host (Vercel) environment: `RESEND_API_KEY`, `RESEND_PRO_AUDIENCE_ID`

**Membership rule.** A contact in the Pro audience with `unsubscribed =
false` is an active member: it receives briefings and alerts and can sign
in to the desk. `unsubscribed = true` is a lead or a lapsed member.

## 2. Founding members (no Stripe needed)

The `/pro` page has a founding-member form. Each request creates the
contact in the Pro audience as **unsubscribed** and emails the newsroom
the details. To activate a founding member after they pay by invoice or
another method, open the contact in Resend and mark it subscribed. That
single switch turns on the briefing, the alerts, and desk sign-in.

## 3. Stripe (self-serve billing)

1. Create a product **Pipeline Pro** with two recurring prices: monthly
   ($79) and annual ($790). Copy the price ids.
2. Add a webhook endpoint at `https://www.thejacksonwire.com/api/pro/webhook`
   listening for `checkout.session.completed` and
   `customer.subscription.deleted`. Copy the signing secret.
3. Site host environment: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`,
   `STRIPE_PRICE_ANNUAL`, `STRIPE_WEBHOOK_SECRET`.

When `STRIPE_SECRET_KEY` and `STRIPE_PRICE_MONTHLY` are set, the `/pro`
page shows the two subscribe buttons. Checkout success subscribes the
payer in the Pro audience and sends a welcome note; a cancelled
subscription marks them unsubscribed.

## 4. Desk sign-in

Set `PRO_SESSION_SECRET` in the site host environment to a long random
string (32+ characters). Members enter their email at `/pro/dashboard`,
receive a one-time link (30 minutes), and get a 30-day cookie.

## 5. Senders

- **Pro Briefing** (`.github/workflows/pro-briefing.yml`): Mondays at
  6 a.m. Central. Needs `DEEPSEEK_API_KEY` in addition to the Resend
  secrets. Dispatch it with `dry_run = 1` to print the email in the log
  without sending.
- **Pro Alerts** (`.github/workflows/pro-alerts.yml`): weekdays at 8 a.m.,
  noon, and 4 p.m. Central. Sends one email per run if there is anything
  new among council agendas, federal awards over $250,000 in the three
  metro counties, new federal cases naming watchlist entities, and 8-K
  filings mentioning Jackson. Seen items are recorded in
  `data/pro-alerts-seen.json` and committed.

Both workflows skip cleanly with a notice until their secrets exist.

## Environment summary

| Name | Where | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Actions + site | email and member list |
| `RESEND_PRO_AUDIENCE_ID` | Actions + site | the Pro audience |
| `DEEPSEEK_API_KEY` | Actions | writes the briefing |
| `PRO_SESSION_SECRET` | site | signs desk sessions |
| `STRIPE_SECRET_KEY` | site | checkout and customer lookup |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` | site | the two plans |
| `STRIPE_WEBHOOK_SECRET` | site | verifies webhook calls |
| `COURTLISTENER_API_TOKEN` | Actions + site (optional) | docket feeds |
