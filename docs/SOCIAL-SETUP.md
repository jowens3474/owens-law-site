# Social Auto-Posting Setup (X / Bluesky)

One-time checklist to wire up `scripts/post-social.mjs` and
`.github/workflows/social.yml`. Each day the workflow posts any article
published that day to X (Twitter) and Bluesky. The two platforms are
independently optional -- if you only set up one, the other is simply
skipped (logged as "skipping <platform> (no credentials)"), it does not
block the run.

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

## Verify

Run the workflow manually once (**Actions → Social → Run workflow**), or
run it locally:

```
DRY_RUN=1 \
  BLUESKY_HANDLE=... BLUESKY_APP_PASSWORD=... \
  X_API_KEY=... X_API_SECRET=... X_ACCESS_TOKEN=... X_ACCESS_SECRET=... \
  node scripts/post-social.mjs
```

`DRY_RUN=1` logs what would be posted to each platform without calling
either API or writing `data/social-posted.json`. You can also omit one
platform's variables entirely (even under `DRY_RUN`) to confirm the
"skipping" log line for that platform.
