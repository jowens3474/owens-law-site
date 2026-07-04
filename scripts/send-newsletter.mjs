#!/usr/bin/env node
// Daily newsletter sender -- builds a branded digest of today's published
// articles and sends it to the Resend audience as a Broadcast. Plain Node
// ESM, fetch only, no resend npm package. Triggered by
// .github/workflows/newsletter.yml on a cron schedule, after autopilot and
// social posting have had time to publish and deploy.
//
// NOTE: sending from brief@thejacksonwire.com requires that domain be
// verified in Resend (the SPF/DKIM DNS records Resend shows you). Until
// that's done, Resend will reject the from address -- for testing, the
// operator can temporarily switch FROM below to "onboarding@resend.dev".

const SITE_URL = "https://www.thejacksonwire.com";
const FEED_URL = `${SITE_URL}/feed.xml`;
const RESEND_API_BASE = "https://api.resend.com";
const FROM = "The Jackson Wire <brief@thejacksonwire.com>";

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

// --- email building -----------------------------------------------------------

function escHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s, max) {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function buildSubject(items) {
  const first = items[0];
  return truncate(`The Wire: ${first.title}`, 78);
}

function buildHtml(items) {
  const articleBlocks = items
    .map(
      (item, i) => `
              <tr>
                <td style="padding: 24px 32px 0 32px;">
                  <a href="${escHtml(item.link)}" style="color: #060a12; font-size: 20px; font-weight: 700; line-height: 1.3; text-decoration: none; font-family: Georgia, 'Times New Roman', serif;">
                    ${escHtml(item.title)}
                  </a>
                  <p style="margin: 8px 0 0 0; color: #555555; font-size: 15px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                    ${escHtml(item.dek)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px 0 32px;">
                  <div style="border-top: 1px solid #e2e2e2; font-size: 0; line-height: 0;">&nbsp;</div>
                </td>
              </tr>${i === items.length - 1 ? '<tr><td style="height: 8px;">&nbsp;</td></tr>' : ""}`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Jackson Wire</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #eef1f5; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #eef1f5;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 100%; background-color: #ffffff;">
            <tr>
              <td style="background-color: #060a12; padding: 28px 32px 24px 32px;">
                <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                  THE JACKSON WIRE
                </span>
              </td>
            </tr>
            <tr>
              <td style="background-color: #22d3ee; height: 3px; line-height: 3px; font-size: 0;">&nbsp;</td>
            </tr>
${articleBlocks}
            <tr>
              <td style="padding: 24px 32px 32px 32px; background-color: #f7f8fa;">
                <p style="margin: 0; color: #888888; font-size: 12px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                  You're receiving this because you subscribed at thejacksonwire.com.<br />
                  <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildText(items) {
  const lines = ["THE JACKSON WIRE", ""];
  for (const item of items) {
    lines.push(item.title);
    lines.push(item.link);
    lines.push(item.dek);
    lines.push("");
  }
  lines.push("---");
  lines.push("You're receiving this because you subscribed at thejacksonwire.com.");
  lines.push("Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}");
  return lines.join("\n");
}

// --- Resend API ----------------------------------------------------------------

async function resendRequest(path, apiKey, body) {
  const res = await fetch(`${RESEND_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response; fall through to generic error below
  }
  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`;
    throw new Error(`Resend API error (${path}): ${message}`);
  }
  return data;
}

// --- main ----------------------------------------------------------------------

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }
  if (!audienceId) {
    throw new Error("Missing RESEND_AUDIENCE_ID environment variable.");
  }
  const dryRun = process.env.DRY_RUN === "1";
  if (dryRun) {
    console.log("[newsletter] DRY_RUN=1 -- will log the email but skip all Resend API calls.");
  }

  const today = todayLocalIso();
  console.log(`[newsletter] today=${today} (America/Chicago)`);

  console.log(`[newsletter] Fetching ${FEED_URL}...`);
  const feedRes = await fetch(FEED_URL);
  if (!feedRes.ok) {
    throw new Error(`Failed to fetch feed.xml: HTTP ${feedRes.status}`);
  }
  const xml = await feedRes.text();
  const items = parseFeedItems(xml);
  console.log(`[newsletter] Parsed ${items.length} feed item(s).`);

  const todaysItems = items.filter((item) => itemDateIso(item.pubDate) === today);

  if (todaysItems.length === 0) {
    console.log("No articles today; no send.");
    process.exit(0);
  }

  console.log(
    `[newsletter] ${todaysItems.length} article(s) today: ${todaysItems.map((i) => i.title).join(", ")}`,
  );

  const subject = buildSubject(todaysItems);
  const html = buildHtml(todaysItems);
  const text = buildText(todaysItems);

  console.log(`[newsletter] Subject: ${subject}`);

  if (dryRun) {
    console.log(`[newsletter] DRY_RUN: html preview (first 500 chars):\n${html.slice(0, 500)}`);
    return;
  }

  console.log("[newsletter] Creating broadcast...");
  const broadcast = await resendRequest("/broadcasts", apiKey, {
    audience_id: audienceId,
    from: FROM,
    subject,
    html,
    text,
  });
  const broadcastId = broadcast?.id;
  if (!broadcastId) {
    throw new Error("Resend broadcast creation did not return an id.");
  }
  console.log(`[newsletter] Broadcast created: ${broadcastId}`);

  console.log("[newsletter] Sending broadcast...");
  const sendResult = await resendRequest(`/broadcasts/${broadcastId}/send`, apiKey, {});
  console.log(`[newsletter] Broadcast sent. id=${broadcastId}`, sendResult?.id ? `send id=${sendResult.id}` : "");
}

main().catch((err) => {
  console.error("[newsletter] FAILED:", err?.message || err);
  process.exit(1);
});
