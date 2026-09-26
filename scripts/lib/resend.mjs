// Resend helpers for the Pro scripts (broadcasts to an audience).
const BASE = "https://api.resend.com";

export async function resendRequest(path, apiKey, body, method = "POST") {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON
  }
  if (!res.ok) throw new Error(`Resend API error (${path}): ${data?.message || `HTTP ${res.status}`}`);
  return data;
}

/** Create and send a broadcast to an audience. Returns the broadcast id. */
export async function sendBroadcast({ apiKey, audienceId, from, subject, html, text, replyTo }) {
  const b = await resendRequest("/broadcasts", apiKey, {
    audience_id: audienceId,
    from,
    subject,
    html,
    text,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });
  if (!b?.id) throw new Error("Resend broadcast creation did not return an id.");
  await resendRequest(`/broadcasts/${b.id}/send`, apiKey, {});
  return b.id;
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap sections into a plain, newspaper-style HTML email. */
export function renderEmail({ kicker, title, intro, sections, footer }) {
  const sec = sections
    .map(
      (s) =>
        `<h2 style="font:700 13px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #111;padding-bottom:4px;margin:28px 0 10px">${escapeHtml(s.heading)}</h2>` +
        (s.note ? `<p style="font:14px/1.5 Helvetica,Arial,sans-serif;color:#666;margin:0 0 10px">${escapeHtml(s.note)}</p>` : "") +
        `<ul style="padding-left:18px;margin:0">` +
        s.items
          .map(
            (it) =>
              `<li style="font:15px/1.55 Georgia,serif;color:#222;margin:0 0 10px">${escapeHtml(it.text)}${
                it.url ? ` <a href="${escapeHtml(it.url)}" style="color:#a80000">Document</a>` : ""
              }</li>`,
          )
          .join("") +
        `</ul>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f7f7f7"><div style="max-width:640px;margin:0 auto;background:#fff;padding:28px 24px">
<p style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#a80000;margin:0 0 8px">${escapeHtml(kicker)}</p>
<h1 style="font:900 28px/1.1 Georgia,serif;color:#111;margin:0 0 12px">${escapeHtml(title)}</h1>
${intro ? `<p style="font:16px/1.55 Georgia,serif;color:#222;margin:0 0 8px">${escapeHtml(intro)}</p>` : ""}
${sec}
<p style="font:12px/1.5 Helvetica,Arial,sans-serif;color:#666;border-top:1px solid #d9d9d9;margin-top:32px;padding-top:12px">${escapeHtml(footer)}<br>Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}</p>
</div></body></html>`;
}

export function renderText({ kicker, title, intro, sections, footer }) {
  const lines = [kicker.toUpperCase(), title, ""];
  if (intro) lines.push(intro, "");
  for (const s of sections) {
    lines.push(s.heading.toUpperCase());
    if (s.note) lines.push(s.note);
    for (const it of s.items) lines.push(`- ${it.text}${it.url ? ` ${it.url}` : ""}`);
    lines.push("");
  }
  lines.push("---", footer, "Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}");
  return lines.join("\n");
}
