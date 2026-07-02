#!/usr/bin/env node
// Instagram poster — reads today's freshly published articles from
// feed.xml, waits for each article's branded card image to deploy, and
// posts it to Instagram via the Graph API (Instagram Login flavor).
// Plain Node, fetch only, no new deps. Triggered by
// .github/workflows/instagram.yml on a cron schedule, ~90 min after
// autopilot.mjs publishes (so the site has time to deploy).

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SITE_URL = "https://www.thejacksonwire.com";
const FEED_URL = `${SITE_URL}/feed.xml`;
const POSTED_FILE = "data/instagram-posted.json";
const GRAPH_BASE = "https://graph.instagram.com/v23.0";

const MAX_POSTS_PER_RUN = 3;
const CARD_LIVE_MAX_ATTEMPTS = 5;
const CARD_LIVE_WAIT_MS = 60_000;
const CONTAINER_MAX_ATTEMPTS = 10;
const CONTAINER_POLL_WAIT_MS = 5_000;

// Thrown for auth/credential failures that should abort the whole run
// (as opposed to a single article failing, which just logs and continues).
class CredentialsError extends Error {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const category = unescapeXml(extractTag(block, "category"));
    if (!title || !link || !pubDate) continue;
    items.push({ title, link, pubDate, dek, category });
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
  if (!existsSync(POSTED_FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(POSTED_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePosted(slugs) {
  const unique = Array.from(new Set(slugs)).sort();
  writeFileSync(POSTED_FILE, JSON.stringify(unique, null, 2) + "\n");
}

// --- caption -------------------------------------------------------------------

function stripDashes(s) {
  // No em-dashes or en-dashes anywhere in the caption.
  return s.replace(/[–—]/g, "-");
}

function buildCaption(item) {
  const hay = `${item.title} ${item.dek} ${item.category}`.toLowerCase();

  const hashtags = ["#Jackson", "#Mississippi", "#JacksonMS", "#News"];

  const corruptionCase =
    /bribery|corruption/.test(hay) ||
    /owens/.test(hay) ||
    /lumumba/.test(hay) ||
    (/banks/.test(hay) && /(trial|bribery|corruption|council president)/.test(hay));
  if (corruptionCase) hashtags.push("#JacksonBriberyTrial");

  const dataCenters = /data center|data-center|datacenter/.test(hay);
  if (dataCenters) hashtags.push("#DataCenters");

  const caption = [
    item.title,
    "",
    item.dek,
    "",
    `Full story: thejacksonwire.com/article/${item.slug}`,
    "",
    hashtags.join(" "),
  ].join("\n");

  return stripDashes(caption);
}

// --- Instagram Graph API ------------------------------------------------------

async function igRequest(url, options) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response; fall through to generic error below
  }
  if (!res.ok || data?.error) {
    const error = data?.error;
    const message = error?.message || `HTTP ${res.status}`;
    if (error && (error.type === "OAuthException" || error.code === 190)) {
      throw new CredentialsError(`Instagram credentials error: ${message}`);
    }
    throw new Error(`Instagram API error: ${message}`);
  }
  return data;
}

async function waitForCardLive(cardUrl) {
  for (let attempt = 1; attempt <= CARD_LIVE_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(cardUrl);
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.startsWith("image/jpeg")) {
        return true;
      }
      console.log(
        `[instagram] card not live yet (attempt ${attempt}/${CARD_LIVE_MAX_ATTEMPTS}): HTTP ${res.status}, content-type=${contentType || "(none)"}`,
      );
    } catch (e) {
      console.log(
        `[instagram] card check errored (attempt ${attempt}/${CARD_LIVE_MAX_ATTEMPTS}): ${e.message}`,
      );
    }
    if (attempt < CARD_LIVE_MAX_ATTEMPTS) {
      await sleep(CARD_LIVE_WAIT_MS);
    }
  }
  return false;
}

async function createContainer(igUserId, accessToken, imageUrl, caption) {
  const url = `${GRAPH_BASE}/${igUserId}/media`;
  const body = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });
  const data = await igRequest(url, { method: "POST", body });
  if (!data?.id) {
    throw new Error("Instagram media endpoint did not return a container id.");
  }
  return data.id;
}

async function waitForContainerFinished(containerId, accessToken) {
  for (let attempt = 1; attempt <= CONTAINER_MAX_ATTEMPTS; attempt++) {
    const url = `${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`;
    const data = await igRequest(url);
    console.log(
      `[instagram] container ${containerId} status=${data.status_code} (attempt ${attempt}/${CONTAINER_MAX_ATTEMPTS})`,
    );
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      throw new Error(`Instagram container ${containerId} failed: status_code=${data.status_code}`);
    }
    if (attempt < CONTAINER_MAX_ATTEMPTS) {
      await sleep(CONTAINER_POLL_WAIT_MS);
    }
  }
  throw new Error(`Instagram container ${containerId} did not finish processing in time.`);
}

async function publishContainer(igUserId, accessToken, containerId) {
  const url = `${GRAPH_BASE}/${igUserId}/media_publish`;
  const body = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });
  const data = await igRequest(url, { method: "POST", body });
  return data.id;
}

async function refreshAccessToken(accessToken) {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`;
  const data = await igRequest(url);
  // Per Meta's long-lived IG token docs, a refresh extends the SAME token
  // string's expiry in place -- it should not change. If the API ever
  // returns a different token string here, the operator must update the
  // IG_ACCESS_TOKEN GitHub secret, or every run after the old token expires
  // (60 days from issuance) will start failing with a credentials error.
  if (data.access_token && data.access_token !== accessToken) {
    console.warn(
      "[instagram] WARNING: refresh_access_token returned a NEW token string, different from IG_ACCESS_TOKEN. " +
        "Update the IG_ACCESS_TOKEN GitHub Actions secret with this new value, or future runs will fail once the old token expires.",
    );
  }
  const days = data.expires_in ? Math.round(data.expires_in / 86400) : "unknown";
  console.log(`[instagram] Access token refreshed. New expiry in ~${days} days.`);
}

// --- main ----------------------------------------------------------------------

async function main() {
  const igUserId = process.env.IG_USER_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId) {
    throw new Error("Missing IG_USER_ID environment variable.");
  }
  if (!accessToken) {
    throw new Error("Missing IG_ACCESS_TOKEN environment variable.");
  }
  const dryRun = process.env.DRY_RUN === "1";
  if (dryRun) {
    console.log("[instagram] DRY_RUN=1 -- will log actions but skip all Instagram API writes.");
  }

  const today = todayLocalIso();
  console.log(`[instagram] today=${today} (America/Chicago)`);

  console.log(`[instagram] Fetching ${FEED_URL}...`);
  const feedRes = await fetch(FEED_URL);
  if (!feedRes.ok) {
    throw new Error(`Failed to fetch feed.xml: HTTP ${feedRes.status}`);
  }
  const xml = await feedRes.text();
  const items = parseFeedItems(xml);
  console.log(`[instagram] Parsed ${items.length} feed item(s).`);

  const posted = loadPosted();
  const postedSet = new Set(posted);

  const todaysItems = items
    .map((item) => ({ ...item, slug: slugFromLink(item.link) }))
    .filter((item) => item.slug && itemDateIso(item.pubDate) === today)
    .filter((item) => !postedSet.has(item.slug))
    .slice(0, MAX_POSTS_PER_RUN);

  if (todaysItems.length === 0) {
    console.log("[instagram] No unposted articles published today. Nothing to do.");
  } else {
    console.log(
      `[instagram] ${todaysItems.length} article(s) to post: ${todaysItems.map((i) => i.slug).join(", ")}`,
    );
  }

  for (const item of todaysItems) {
    console.log(`[instagram] --- ${item.slug} ---`);
    try {
      const cardUrl = `${SITE_URL}/api/card/${item.slug}`;
      console.log(`[instagram] Verifying card is live: ${cardUrl}`);
      const live = await waitForCardLive(cardUrl);
      if (!live) {
        console.error(
          `[instagram] Card never came live for "${item.slug}" after ${CARD_LIVE_MAX_ATTEMPTS} attempts. ` +
            "Skipping for now -- leaving it unposted so a future run retries.",
        );
        continue;
      }
      console.log("[instagram] Card is live.");

      const caption = buildCaption(item);
      console.log(`[instagram] Caption:\n${caption}`);

      if (dryRun) {
        console.log(`[instagram] DRY_RUN: would post "${item.title}" with image ${cardUrl}.`);
        continue;
      }

      console.log("[instagram] Creating media container...");
      const containerId = await createContainer(igUserId, accessToken, cardUrl, caption);
      console.log(`[instagram] Container created: ${containerId}`);

      console.log("[instagram] Waiting for container to finish processing...");
      await waitForContainerFinished(containerId, accessToken);

      console.log("[instagram] Publishing...");
      const mediaId = await publishContainer(igUserId, accessToken, containerId);
      console.log(`[instagram] Published. media id=${mediaId}`);

      posted.push(item.slug);
      savePosted(posted);
      console.log(`[instagram] Recorded "${item.slug}" in ${POSTED_FILE}.`);
    } catch (e) {
      if (e instanceof CredentialsError) {
        throw e;
      }
      console.error(`[instagram] Failed to post "${item.slug}": ${e.message}`);
      console.error("[instagram] Continuing to next article.");
    }
  }

  if (!dryRun) {
    console.log("[instagram] Refreshing access token...");
    try {
      await refreshAccessToken(accessToken);
    } catch (e) {
      if (e instanceof CredentialsError) {
        throw e;
      }
      console.error(`[instagram] Token refresh failed: ${e.message}`);
    }
  }

  console.log("[instagram] Done.");
}

main().catch((err) => {
  console.error("[instagram] FAILED:", err?.message || err);
  process.exit(1);
});
