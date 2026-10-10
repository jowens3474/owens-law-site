// UTM tags for links the Wire sends out (social posts, emails), so every
// reader can be traced to the channel that sent them.
//
// Tag only links that people click. Never tag canonical URLs, the sitemap,
// the RSS feed, JSON-LD, IndexNow pings, or anything the site renders
// itself: those must stay one clean URL per page.

const SITE_HOSTS = new Set(["www.thejacksonwire.com", "thejacksonwire.com"]);

// Adds utm_source, utm_medium, and utm_campaign to a link to the Wire's own
// site. Anything else comes back exactly as it went in: other hosts, text
// that is not a valid absolute URL, and a link that already has utm_source.
// Existing query parameters and the #hash are kept, and no parameter is
// ever added twice.
export function tagUrl(url, { source, medium, campaign } = {}) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!SITE_HOSTS.has(parsed.hostname)) return url;
  if (parsed.searchParams.has("utm_source")) return url;

  const tags = Object.entries({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  }).filter(([key, value]) => value && !parsed.searchParams.has(key));
  if (tags.length === 0) return url;

  for (const [key, value] of tags) parsed.searchParams.append(key, value);
  return parsed.toString();
}

// Tags every item link in the sections of a Pro email, { heading, items:
// [{ text, url }] }. Headings, notes, items without a link, and links to
// other sites come back untouched.
export function tagSections(sections, utm) {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.url ? { ...item, url: tagUrl(item.url, utm) } : item,
    ),
  }));
}
