# Social Auto-Posting Setup (X / Bluesky / Facebook)

One-time checklist to wire up `scripts/post-social.mjs` and
`.github/workflows/social.yml`. Each day the workflow posts any article
published that day to X (Twitter), Bluesky, and the Wire's Facebook Page.
The platforms are independently optional -- any platform without its
secrets is simply skipped (logged as "skipping <platform> (no
credentials)"), it does not block the run.

## Bluesky

1. Create (or use an existing) Bluesky account for The Jackson Wire, e.g.
   `@thejacksonwire.bsky.social`.
2. In the Bluesky app: **Settings → App Passwords → Add App Password**.
   Create one named something like "jackson-wire-autopilot". Bluesky
   shows the password once -- copy it immediately.
3. In the repo: **Settings → Secrets and variables → Actions → New
   repository secret**. Add:
   - `BLUESKY_HANDLE` — the account handle, e.g. `thejacksonwire.bsky.social`.
   - `BLUESKY_APP_PASSWORD` — the app password from step 2 (not your
     regular account password).

The poster script logs in with `com.atproto.server.createSession`,
uploads the article's branded card image as a thumbnail when it's
available, and posts a link card via `app.bsky.embed.external`. Do not
reuse a personal Bluesky app password for anything else -- app passwords
can be revoked independently from Settings → App Passwords.

## X (Twitter)

1. Go to [developer.x.com](https://developer.x.com) and sign up for the
   **Free** tier developer account.
2. Create a Project and an App inside it.
3. **Before generating any keys**, go to the app's **Settings → User
   authentication settings** and set **App permissions** to **Read and
   write**. If you generate tokens before setting this, they will only
   have read access and posting will fail with an HTTP 403 mentioning
   permissions -- you'll need to regenerate the tokens after fixing the
   permission setting.
4. Under **Keys and tokens**, generate:
   - **API Key and Secret** (the app's consumer key/secret).
   - **Access Token and Secret** (user-context tokens for the account
     that will post).
5. In the repo: **Settings → Secrets and variables → Actions → New
   repository secret**. Add:
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_SECRET`

The poster script signs each request with OAuth 1.0a (HMAC-SHA1) using
`node:crypto` -- no OAuth library dependency. The Free tier allows
roughly 500 posts/month, which comfortably covers 2-3 posts/day.

## Facebook Page

The poster publishes each article to the Page as a link post through the
Graph API (`POST /{page-id}/feed`), with the article's dek as the text and
a tagged link. Facebook builds the preview card (headline, image,
description) from the article's own tags. Facebook groups cannot be posted
to automatically; share to groups by hand.

1. **Create a Meta app.** At [developers.facebook.com](https://developers.facebook.com),
   go to **My Apps → Create App**, name it something like "Jackson Wire
   Poster", and pick the use case for managing a Page (in older flows,
   choose **Business** as the app type). You do not need App Review: Meta
   gives every new app Standard Access, which works for people with a role
   on the app, and you are its admin.
2. **Get a Page token.** Open the **Graph API Explorer**
   (developers.facebook.com/tools/explorer), select the new app, and add
   the permissions `pages_show_list`, `pages_read_engagement`, and
   `pages_manage_posts`. Click **Generate Access Token** and approve the
   Wire's Page. This is a short-lived *user* token.
3. **Make it last.** Paste that user token into the **Access Token
   Debugger** (developers.facebook.com/tools/debug/accesstoken) and click
   **Extend Access Token** to get a long-lived user token. Back in the
   Explorer, paste the long-lived token into the token box and run
   `GET me/accounts`. The Page's `access_token` in that response is a Page
   token with no expiration date, and its `id` is the Page ID. Check it in
   the debugger: **Expires** should read **Never**.
4. **Switch the app to Live.** In the app dashboard, add the Privacy
   Policy URL `https://www.thejacksonwire.com/privacy` and a category under
   **App settings → Basic**, then flip the app mode to **Live**. While an
   app is in Development mode, Meta shows its posts only to people with a
   role on the app, so readers would never see them.
5. **Add the secrets.** In the repo: **Settings → Secrets and variables →
   Actions → New repository secret**. Add:
   - `FACEBOOK_PAGE_ID`: the Page ID from step 3.
   - `FACEBOOK_PAGE_TOKEN`: the Page token from step 3.

The Page token stops working if you change your Facebook password, remove
the app, or lose admin on the Page. The run then logs "Facebook post
rejected"; repeat steps 2, 3 and 5. The Graph API version is set in
`scripts/post-social.mjs` (`FB_GRAPH_BASE`); move it forward before Meta
retires it (see the Graph API changelog).

## Verify

Run the workflow manually once (**Actions → Social → Run workflow**), or
run it locally:

```
DRY_RUN=1 \
  BLUESKY_HANDLE=... BLUESKY_APP_PASSWORD=... \
  X_API_KEY=... X_API_SECRET=... X_ACCESS_TOKEN=... X_ACCESS_SECRET=... \
  FACEBOOK_PAGE_ID=... FACEBOOK_PAGE_TOKEN=... \
  node scripts/post-social.mjs
```

`DRY_RUN=1` logs what would be posted to each platform without calling
any API or writing `data/social-posted.json`. You can also omit one
platform's variables entirely (even under `DRY_RUN`) to confirm the
"skipping" log line for that platform.

## Before the secrets are set

Until at least one platform has its secrets, the Social workflow checks for them first and skips with a notice instead of failing, so no failure emails are sent.
