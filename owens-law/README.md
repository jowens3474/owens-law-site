# Owens Injury Law — Mississippi Personal Injury Site

A standalone Next.js 16 app for the personal-injury law firm. It lives in this
subdirectory so it deploys independently of the Jackson Wire site at the repo
root — its own Vercel project, its own domain, zero coupling.

## Develop

```bash
cd owens-law
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy to Vercel (new project + new domain)

1. Create a **new** Vercel project from this repo.
2. Set **Root Directory** to `owens-law` (Settings → General → Root Directory).
3. Add your domain under Settings → Domains.
4. (Optional) Set `NEXT_PUBLIC_GA_ID` (e.g. `G-XXXXXXXXXX`) to enable Google
   Analytics; leave unset for none.

The Jackson Wire deployment is unaffected — it builds from the repo root.

## Edit everything in one place

`lib/site.ts` is the single source of truth: firm name, phone, address,
practice areas, results, reviews, and service areas. Change values there and the
whole site (pages, footer, structured data, sitemap) updates.

## Before launch — replace placeholders

Items marked `PLACEHOLDER` in `lib/site.ts` and on the About/Results/Reviews
pages must be replaced with real, verified information:

- **Phone, email, office address, map coordinates**
- **Attorney bio** (`app/about/page.tsx`) + a real headshot in `/public`
- **Case results** — must be true, not misleading (MS Bar Rule 7.x)
- **Client reviews** — real testimonials used with permission only
- **Domain** (`site.url`)

## Wire up lead capture

`app/components/IntakeForm.tsx` is front-end only today. To actually receive
leads, add a Route Handler at `app/api/intake/route.ts` that emails the firm
and/or writes to a CRM, then post the form to it.

## Compliance note

This site is configured as attorney advertising with the required disclaimers
in the footer. Confirm the final copy and disclaimers comply with the
Mississippi Rules of Professional Conduct (Rules 7.1–7.5) before going live.
