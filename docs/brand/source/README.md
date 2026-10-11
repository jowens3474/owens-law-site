# Brand images

The site's share image and the Facebook images are rendered from the HTML in
this folder, so they can be remade whenever the name, tagline, or wordmark
changes:

| Source | Output | Size |
| --- | --- | --- |
| `og.html` | `app/opengraph-image.png`, shown when the home page is shared | 1200x630 |
| `cover.html` | `docs/brand/jackson-wire-facebook-cover.png` | 1640x624 |
| `profile.html` | `docs/brand/jackson-wire-facebook-profile.png` | 720x720 |

The tagline is typed into `og.html` and `cover.html` by hand, so copy it
from `lib/site.ts` when it changes. The alt text for the share image lives
in `app/opengraph-image.alt.txt`. Keep that file to one line with no
trailing newline: Next.js copies it verbatim into `og:image:alt` and
`twitter:image:alt`.

To render, run `docs/brand/source/render.mjs` from the repo root with
Playwright available (its header has the command). After replacing the
share image, ask Facebook to re-read the home page with its Sharing
Debugger ("Scrape Again" on https://www.thejacksonwire.com/), or old link
previews keep the old picture.
