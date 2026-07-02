# Instagram Auto-Posting Setup

One-time checklist to wire up `scripts/post-instagram.mjs` and
`.github/workflows/instagram.yml`. Each day the workflow posts branded card
images (`/api/card/<slug>`) for any article published that day.

## 1. Create/prepare the Instagram account

1. Create (or use an existing) Instagram account for The Jackson Wire.
2. In the Instagram app, switch it to a **Professional account → Creator**
   (Settings → Account type and tools → Switch to professional account).
   The Graph API's content-publishing endpoints only work on Professional
   accounts.

## 2. Create a Meta app

1. Go to [developers.facebook.com](https://developers.facebook.com) →
   **My Apps → Create App**. Choose a business-type app.
2. In the app dashboard, add the **Instagram** product, using the
   **Instagram Login** setup (not the older Facebook Login / Instagram
   Graph API flavor). This gives you the `graph.instagram.com` endpoints
   used by the poster script.
3. Under the Instagram product's dashboard, generate a **long-lived access
   token** for your account with the `instagram_business_content_publish`
   scope (also grant `instagram_business_basic` for the user-id lookup).
   Long-lived tokens are valid for 60 days.

## 3. Find the IG user ID

The token generation flow in the app dashboard returns the Instagram user
ID alongside the token. If you need to look it up separately:

```
GET https://graph.instagram.com/v23.0/me?fields=user_id,username&access_token=<token>
```

## 4. Add GitHub Actions secrets

In the repo: **Settings → Secrets and variables → Actions → New repository
secret**. Add:

- `IG_USER_ID` — the numeric Instagram user ID from step 3.
- `IG_ACCESS_TOKEN` — the long-lived access token from step 2.

## 5. Verify

Run the workflow manually once (**Actions → Instagram → Run workflow**), or
run it locally:

```
DRY_RUN=1 IG_USER_ID=... IG_ACCESS_TOKEN=... node scripts/post-instagram.mjs
```

`DRY_RUN=1` logs what would be posted without calling the Instagram API or
writing `data/instagram-posted.json`.

## Token expiry

Long-lived IG access tokens last 60 days. `scripts/post-instagram.mjs`
calls Instagram's `refresh_access_token` endpoint at the end of every run,
which extends the current token's expiry by another 60 days (the token
string itself does not change under normal operation). If the workflow log
ever shows a "refresh_access_token returned a NEW token string" warning,
update the `IG_ACCESS_TOKEN` secret with the new value immediately, since
the old one will stop working once it expires.
