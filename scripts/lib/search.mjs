// Shared web search for the autopilot scripts, with fallbacks.
//
// Order: Tavily (TAVILY_API_KEY) -> Brave (BRAVE_API_KEY, optional) ->
// DuckDuckGo HTML (no key). Tavily is used at "basic" depth by default
// because "advanced" costs twice the credits and the free plan is 1,000
// credits a month. Once Tavily reports its usage limit (HTTP 432) it is
// skipped for the rest of the run instead of failing every call.
//
// If every provider fails, the tool returns a message that points the model
// at portals that can be read directly with fetch_url, so a research run
// without search still has somewhere to go.

const TIMEOUT_MS = 15000;
const MAX_RESULTS = 5;

let tavilyExhausted = false;

export const KNOWN_PORTALS = [
  "https://www.jacksonms.gov/meetings/ (Jackson council, committee, and board meeting notices with agenda links)",
  "https://www.jacksonms.gov/council-agendas-and-minutes/ (Jackson council agendas, packets, and minutes)",
  "https://www.hindscountyms.com/board-meetings (Hinds County Board of Supervisors meetings)",
  "https://psc.ms.gov/ (Mississippi Public Service Commission home; follow the docket and hearing links on the page)",
  "https://mississippi.org/news/ (Mississippi Development Authority project announcements)",
  "https://www.sos.ms.gov/business-services (Secretary of State business filings portal)",
  "https://www.mdes.ms.gov/ (MDES; labor data and WARN notices are linked from the home page)",
  "https://legislature.ms.gov/ (Mississippi Legislature bills and calendars)",
];

function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

function formatResults(results, provider) {
  if (results.length === 0) return `(no results from ${provider})`;
  return (
    results
      .slice(0, MAX_RESULTS)
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title}\nURL: ${r.url}\n${(r.content || "").slice(0, 1000)}`,
      )
      .join("\n\n") + `\n\n(source: ${provider})`
  );
}

async function tavily(query) {
  const t = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        max_results: MAX_RESULTS,
        search_depth: process.env.TAVILY_SEARCH_DEPTH || "basic",
      }),
      signal: t.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`Tavily HTTP ${res.status}: ${body.slice(0, 300)}`);
      err.quota = res.status === 432 || /usage limit/i.test(body);
      throw err;
    }
    const data = await res.json();
    return (data.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  } finally {
    t.done();
  }
}

async function brave(query) {
  const t = withTimeout(TIMEOUT_MS);
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
      query,
    )}&count=${MAX_RESULTS}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.BRAVE_API_KEY,
      },
      signal: t.signal,
    });
    if (!res.ok) {
      throw new Error(`Brave HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = await res.json();
    return (data.web?.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.description,
    }));
  } finally {
    t.done();
  }
}

function decodeEntities(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Parse DuckDuckGo's HTML endpoint. Exported so it can be unit-tested
// without network access.
export function parseDuckDuckGoHtml(html) {
  const results = [];
  const linkRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const matches = [...html.matchAll(linkRe)];
  for (let i = 0; i < matches.length && results.length < MAX_RESULTS; i++) {
    const m = matches[i];
    let href = m[1];
    const u = href.match(/[?&]uddg=([^&]+)/);
    if (u) href = decodeURIComponent(u[1]);
    if (href.startsWith("//")) href = "https:" + href;
    if (!/^https?:\/\//.test(href)) continue;
    if (/duckduckgo\.com\/y\.js/.test(href)) continue; // ad slot
    // The snippet sits between this link and the next result link.
    const blockEnd = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const block = html.slice(m.index + m[0].length, blockEnd);
    const snip = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    results.push({
      title: decodeEntities(m[2]),
      url: href,
      content: decodeEntities(snip ? snip[1] : ""),
    });
  }
  return results;
}

async function duckduckgo(query) {
  const t = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "text/html",
        },
        signal: t.signal,
      },
    );
    if (!res.ok) throw new Error(`DuckDuckGo HTTP ${res.status}`);
    return parseDuckDuckGoHtml(await res.text());
  } finally {
    t.done();
  }
}

export function searchUnavailableMessage(query, errors) {
  return [
    `Web search is unavailable right now for "${query}".`,
    `Provider errors: ${errors.join(" | ")}`,
    "",
    "Do not retry web_search this run. Work from documents instead: call fetch_url on one of these portals, then fetch only links that appear on a page you have already read. Do not guess URLs.",
    ...KNOWN_PORTALS.map((p) => `- ${p}`),
  ].join("\n");
}

/**
 * Search the web. Returns formatted text for the model. Never throws: when
 * every provider fails it returns searchUnavailableMessage().
 */
export async function webSearch(query, { prefix = "search" } = {}) {
  const errors = [];

  if (process.env.TAVILY_API_KEY && !tavilyExhausted) {
    try {
      return formatResults(await tavily(query), "tavily");
    } catch (e) {
      errors.push(e.message);
      if (e.quota) {
        tavilyExhausted = true;
        console.log(
          `[${prefix}] Tavily usage limit reached; skipping Tavily for the rest of this run.`,
        );
      } else {
        console.log(`[${prefix}] Tavily failed: ${e.message}`);
      }
    }
  } else if (!process.env.TAVILY_API_KEY) {
    errors.push("Tavily: no TAVILY_API_KEY");
  } else {
    errors.push("Tavily: usage limit reached");
  }

  if (process.env.BRAVE_API_KEY) {
    try {
      return formatResults(await brave(query), "brave");
    } catch (e) {
      errors.push(e.message);
      console.log(`[${prefix}] Brave failed: ${e.message}`);
    }
  }

  try {
    const results = await duckduckgo(query);
    if (results.length > 0) return formatResults(results, "duckduckgo");
    errors.push("DuckDuckGo: no results");
  } catch (e) {
    errors.push(e.message);
    console.log(`[${prefix}] DuckDuckGo failed: ${e.message}`);
  }

  console.log(`[${prefix}] All search providers failed for "${query}".`);
  return searchUnavailableMessage(query, errors);
}

// For tests only.
export function _resetSearchState() {
  tavilyExhausted = false;
}
