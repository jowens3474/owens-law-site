#!/usr/bin/env node
// Social poster — reads today's freshly published articles from feed.xml
// and posts them to X (Twitter) and Bluesky. Plain Node, fetch only, no
// new deps (X's OAuth 1.0a signing is done with node:crypto). Each
// platform is independently optional: missing credentials for one
// platform just skip that platform, they don't block the other.
// Triggered by .github/workflows/social.yml on a cron schedule.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes, createHmac } from "node:crypto";

const SITE_URL = "https://www.thejacksonwire.com";
const FEED_URL = `${SITE_URL}/feed.xml`;
const POSTED_FILE = "data/social-posted.json";

const BSKY_BASE = "https://bsky.social";
const X_TWEETS_URL = "https://api.x.com/2/tweets";

const MAX_POSTS_PER_RUN = 3;
const X_MAX_CHARS = 270;
const BSKY_MAX_GRAPHEMES = 300;

// Thrown for auth/credential failures on a given post attempt. Counted
// separately so the run's exit code can distinguish "everything failed
// because the credentials are bad" from "some transient error happened".
class CredentialsError extends Error {}

// --- Time helpers ------------------------------------------------------------

// Today's calendar date (YYYY-MM-DD) in America/Chicago, matching how
// lib/posts.ts and the autopilot scripts date articles.
function todayLocalIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

// feed.xml builds each item's <pubDate> from `new Date(post.date).toUTCString()`,
// where post.date is a bare "YYYY-MM-DD" (parsed as UTC midnight). Formatting
// that instant back out in the UTC zone recovers the exact original date
// string, which is what we want to compare against "today" -- not a
// timezone-shifted reinterpretation of the pubDate instant.
function itemDateIso(pubDate) {
  const d = new Date(pubDate);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(d);
}

// --- feed.xml parsing (regex, no XML parser dependency) ----------------------

function unescapeXml(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : "";
}

function parseFeedItems(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRe.exec(xml))) {
    const block = match[1];
    const title = unescapeXml(extractTag(block, "title"));
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const dek = unescapeXml(extractTag(block, "description"));
    if (!title || !link || !pubDate) continue;
    items.push({ title, link, pubDate, dek });
  }
  return items;
}

function slugFromLink(link) {
  try {
    const path = new URL(link).pathname;
    return path.split("/").filter(Boolean).pop() || null;
  } catch {
    return null;
  }
}

// --- posted-state file --------------------------------------------------------

function loadPosted() {
  if (!existsSync(POSTED_FILE)) return { x: [], bluesky: [] };
  try {
    const parsed = JSON.parse(readFileSync(POSTED_FILE, "utf8"));
    return {
      x: Array.isArray(parsed?.x) ? parsed.x : [],
      bluesky: Array.isArray(parsed?.bluesky) ? parsed.bluesky : [],
    };
  } catch {
    return { x: [], bluesky: [] };
  }
}

function savePosted(posted) {
  const out = {
    x: Array.from(new Set(posted.x)).sort(),
    bluesky: Array.from(new Set(posted.bluesky)).sort(),
  };
  writeFileSync(POSTED_FILE, JSON.stringify(out, null, 2) + "\n");
}

// --- text composition ----------------------------------------------------------

function stripDashes(s) {
  // No em-dashes or en-dashes anywhere in posted text.
  return s.replace(/[–—]/g, "-");
}

function trimToLength(s, maxLen) {
  if (maxLen <= 0) return "";
  if (s.length <= maxLen) return s;
  const ellipsis = "…";
  const budget = Math.max(0, maxLen - ellipsis.length);
  let truncated = s.slice(0, budget);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > budget * 0.6) {
    truncated = truncated.slice(0, lastSpace);
  }
  return truncated.trimEnd() + ellipsis;
}

// Bluesky counts text length in Unicode grapheme clusters, not UTF-16 code
// units. Segment with Intl.Segmenter (built into Node, no dependency).
function graphemeSegments(s) {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(s), (part) => part.segment);
  }
  return Array.from(s);
}

function graphemeLength(s) {
  return graphemeSegments(s).length;
}

function trimToGraphemes(s, maxGraphemes) {
  const segments = graphemeSegments(s);
  if (segments.length <= maxGraphemes) return s;
  const ellipsis = "…";
  const budget = Math.max(0, maxGraphemes - 1);
  let truncated = segments.slice(0, budget).join("");
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > budget * 0.6) {
    truncated = truncated.slice(0, lastSpace);
  }
  return truncated.trimEnd() + ellipsis;
}

function buildXText(item) {
  const title = stripDashes(item.title);
  const url = item.link;
  // total = title + "\n\n" + dek + "\n" + url
  const overhead = title.length + 2 + 1 + url.length;
  const budget = Math.max(0, X_MAX_CHARS - overhead);
  const dek = trimToLength(stripDashes(item.dek), budget);
  return `${title}\n\n${dek}\n${url}`;
}

function buildBlueskyText(item) {
  const title = stripDashes(item.title);
  const overhead = graphemeLength(title) + 2; // "\n\n"
  const budget = Math.max(0, BSKY_MAX_GRAPHEMES - overhead);
  const dek = trimToGraphemes(stripDashes(item.dek), budget);
  return `${title}\n\n${dek}`;
}

// --- credentials ---------------------------------------------------------------

function getXCredentials() {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) return null;
  return { apiKey, apiSecret, accessToken, accessSecret };
}

function getBlueskyCredentials() {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !appPassword) return null;
  return { handle, appPassword };
}

// --- X (Twitter) OAuth 1.0a + API v2 ---------------------------------------------

function percentEncode(str) {
  return encodeURIComponent(str).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function buildOAuthHeader({ method, url, creds }) {
  const oauthParams = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  // JSON request bodies are not part of the OAuth 1.0a signature base for
  // API v2 endpoints -- only the oauth_* params go into the base string.
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(oauthParams[key])}`)
    .join("&");

  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join(
    "&",
  );

  const signingKey = `${percentEncode(creds.apiSecret)}&${percentEncode(creds.accessSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams = { ...oauthParams, oauth_signature: signature };
  return (
    "OAuth " +
    Object.keys(headerParams)
      .sort()
      .map((key) => `${percentEncode(key)}="${percentEncode(headerParams[key])}"`)
      .join(", ")
  );
}

async function postToX(text, creds) {
  const authHeader = buildOAuthHeader({ method: "POST", url: X_TWEETS_URL, creds });
  const res = await fetch(X_TWEETS_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response; fall through to generic error below
  }
  if (!res.ok) {
    const message = data?.detail || data?.title || `HTTP ${res.status}`;
    if (res.status === 401) {
      throw new CredentialsError(`X API 401 Unauthorized: ${message}`);
    }
    if (res.status === 403) {
      const bodyText = JSON.stringify(data || {});
      if (/permission/i.test(bodyText)) {
        console.error(
          "[social] X 403: app likely lacks Read and Write permissions -- fix in the X developer portal, then regenerate access tokens.",
        );
        throw new CredentialsError(`X API 403 Forbidden: ${message}`);
      }
      throw new Error(`X API 403 Forbidden: ${message}`);
    }
    throw new Error(`X API error: ${message}`);
  }
  return data;
}

// --- Bluesky (AT Protocol) --------------------------------------------------------

async function createBlueskySession(creds) {
  const res = await fetch(`${BSKY_BASE}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: creds.handle, password: creds.appPassword }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response; fall through to generic error below
  }
  if (!res.ok) {
    throw new CredentialsError(
      `Bluesky login failed: HTTP ${res.status} ${data?.message || data?.error || ""}`.trim(),
    );
  }
  if (!data?.accessJwt || !data?.did) {
    throw new CredentialsError("Bluesky login response missing accessJwt/did.");
  }
  return { accessJwt: data.accessJwt, did: data.did };
}

async function uploadBlueskyThumb(session, slug) {
  try {
    const cardUrl = `${SITE_URL}/api/card/${slug}`;
    const imgRes = await fetch(cardUrl);
    if (!imgRes.ok) return null;
    const contentType = imgRes.headers.get("content-type") || "";
    if (!contentType.startsWith("image/jpeg")) return null;
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const uploadRes = await fetch(`${BSKY_BASE}/xrpc/com.atproto.repo.uploadBlob`, {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: buf,
    });
    if (!uploadRes.ok) return null;
    const uploadData = await uploadRes.json();
    return uploadData?.blob || null;
  } catch {
    // Thumbnail is a nice-to-have -- never fail the post over it.
    return null;
  }
}

async function createBlueskyPost(session, item) {
  const thumb = await uploadBlueskyThumb(session, item.slug);
  const text = buildBlueskyText(item);
  const record = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: new Date().toISOString(),
    embed: {
      $type: "app.bsky.embed.external",
      external: {
        uri: item.link,
        title: stripDashes(item.title),
        description: stripDashes(item.dek),
        ...(thumb ? { thumb } : {}),
      },
    },
  };

  const res = await fetch(`${BSKY_BASE}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record,
    }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response; fall through to generic error below
  }
  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`;
    if (res.status === 401) {
      throw new CredentialsError(`Bluesky createRecord 401: ${message}`);
    }
    throw new Error(`Bluesky createRecord failed: ${message}`);
  }
  return data;
}

// --- main ----------------------------------------------------------------------

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  if (dryRun) {
    console.log("[social] DRY_RUN=1 -- will log actions but skip all posting API calls.");
  }

  const xCreds = getXCredentials();
  const blueskyCreds = getBlueskyCredentials();

  if (!xCreds) console.log("[social] skipping x (no credentials)");
  if (!blueskyCreds) console.log("[social] skipping bluesky (no credentials)");
  if (!xCreds && !blueskyCreds) {
    console.error("[social] No credentials for X or Bluesky. Nothing to do.");
    process.exit(1);
  }

  const today = todayLocalIso();
  console.log(`[social] today=${today} (America/Chicago)`);

  console.log(`[social] Fetching ${FEED_URL}...`);
  const feedRes = await fetch(FEED_URL);
  if (!feedRes.ok) {
    throw new Error(`Failed to fetch feed.xml: HTTP ${feedRes.status}`);
  }
  const xml = await feedRes.text();
  const items = parseFeedItems(xml);
  console.log(`[social] Parsed ${items.length} feed item(s).`);

  // No slice here: the per-run cap is applied per platform AFTER filtering
  // out already-posted slugs, so re-runs work through any backlog instead
  // of permanently skipping articles beyond the cap.
  const todaysItems = items
    .map((item) => ({ ...item, slug: slugFromLink(item.link) }))
    .filter((item) => item.slug && itemDateIso(item.pubDate) === today);

  if (todaysItems.length === 0) {
    console.log("[social] No articles published today. Nothing to do.");
    console.log("[social] Done.");
    return;
  }

  console.log(
    `[social] ${todaysItems.length} article(s) published today: ${todaysItems.map((i) => i.slug).join(", ")}`,
  );

  const posted = loadPosted();
  const postedX = new Set(posted.x);
  const postedBluesky = new Set(posted.bluesky);

  let attempted = 0;
  let credentialFailures = 0;

  // --- Bluesky ---
  if (blueskyCreds) {
    const blueskyItems = todaysItems
      .filter((item) => !postedBluesky.has(item.slug))
      .slice(0, MAX_POSTS_PER_RUN);
    if (blueskyItems.length === 0) {
      console.log("[social] bluesky: nothing new to post.");
    } else if (dryRun) {
      for (const item of blueskyItems) {
        console.log(
          `[social] bluesky DRY_RUN: would post "${item.slug}":\n${buildBlueskyText(item)}`,
        );
      }
    } else {
      let session = null;
      try {
        session = await createBlueskySession(blueskyCreds);
      } catch (e) {
        console.error(`[social] bluesky: login failed: ${e.message}`);
        attempted += blueskyItems.length;
        credentialFailures += blueskyItems.length;
      }
      if (session) {
        for (const item of blueskyItems) {
          attempted++;
          console.log(`[social] bluesky: --- ${item.slug} ---`);
          try {
            await createBlueskyPost(session, item);
            posted.bluesky.push(item.slug);
            savePosted(posted);
            console.log(`[social] bluesky: posted "${item.slug}" and recorded it.`);
          } catch (e) {
            if (e instanceof CredentialsError) credentialFailures++;
            console.error(`[social] bluesky: failed to post "${item.slug}": ${e.message}`);
            console.error("[social] bluesky: continuing to next article.");
          }
        }
      }
    }
  }

  // --- X ---
  if (xCreds) {
    const xItems = todaysItems
      .filter((item) => !postedX.has(item.slug))
      .slice(0, MAX_POSTS_PER_RUN);
    if (xItems.length === 0) {
      console.log("[social] x: nothing new to post.");
    } else if (dryRun) {
      for (const item of xItems) {
        console.log(`[social] x DRY_RUN: would post "${item.slug}":\n${buildXText(item)}`);
      }
    } else {
      for (const item of xItems) {
        attempted++;
        console.log(`[social] x: --- ${item.slug} ---`);
        try {
          await postToX(buildXText(item), xCreds);
          posted.x.push(item.slug);
          savePosted(posted);
          console.log(`[social] x: posted "${item.slug}" and recorded it.`);
        } catch (e) {
          if (e instanceof CredentialsError) credentialFailures++;
          console.error(`[social] x: failed to post "${item.slug}": ${e.message}`);
          console.error("[social] x: continuing to next article.");
        }
      }
    }
  }

  if (attempted > 0 && credentialFailures === attempted) {
    console.error(
      "[social] Every attempted post failed with a credential-type error. Check the secrets for the platform(s) above.",
    );
    process.exit(1);
  }

  console.log("[social] Done.");
}

main().catch((err) => {
  console.error("[social] FAILED:", err?.message || err);
  process.exit(1);
});
