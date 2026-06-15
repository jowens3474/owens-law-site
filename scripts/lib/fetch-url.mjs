// Shared helper for autopilot scripts: fetch a public URL and return its
// text content. Handles HTML (strips markup), PDFs (extracts text via
// pdfjs-dist), and JSON. Refuses private / localhost / non-http(s) targets.

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 30000;
const MAX_PDF_PAGES = 60;

function isPrivateOrInvalidUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return true;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "0.0.0.0" || host === "::1")
      return true;
    if (/^127\./.test(host)) return true;
    if (/^10\./.test(host)) return true;
    if (/^192\.168\./.test(host)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)) return true;
    if (/\.(local|internal|lan)$/.test(host)) return true;
    return false;
  } catch {
    return true;
  }
}

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr|article|section)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, ",")
    .replace(/&ndash;/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n\n\n+/g, "\n\n")
    .trim();
}

async function pdfToText(buffer) {
  const data = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
  }).promise;
  const numPages = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const pages = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean)
      .join(" ");
    pages.push(`--- page ${i} ---\n${text}`);
  }
  const result = pages.join("\n\n");
  return pdf.numPages > MAX_PDF_PAGES
    ? `${result}\n\n[truncated: PDF has ${pdf.numPages} pages, showing first ${MAX_PDF_PAGES}]`
    : result;
}

export async function fetchUrl(url) {
  if (isPrivateOrInvalidUrl(url)) {
    throw new Error("URL not allowed (must be public https/http)");
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        "User-Agent":
          "The Jackson Wire Autopilot (newsroom: capitolmain42@gmail.com)",
        Accept: "text/html,application/pdf,application/json,text/plain,*/*;q=0.5",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`Response too large (${buf.byteLength} bytes)`);
    }
    const looksPdf =
      ct.includes("application/pdf") ||
      url.toLowerCase().split("?")[0].endsWith(".pdf");
    if (looksPdf) {
      const text = await pdfToText(buf);
      return { contentType: "pdf", text };
    }
    if (ct.includes("application/json")) {
      const raw = Buffer.from(buf).toString("utf8");
      try {
        const parsed = JSON.parse(raw);
        return { contentType: "json", text: JSON.stringify(parsed, null, 2) };
      } catch {
        return { contentType: "json", text: raw };
      }
    }
    const raw = Buffer.from(buf).toString("utf8");
    if (ct.includes("text/html") || /<html|<!doctype/i.test(raw.slice(0, 500))) {
      return { contentType: "html", text: htmlToText(raw) };
    }
    return { contentType: "text", text: raw };
  } finally {
    clearTimeout(timer);
  }
}
