# Launch verification — 10 September 2026

## Enquiry connection

Vercel already has `NEXT_PUBLIC_ENQUIRY_ENDPOINT` assigned to Production and Preview:
`https://isculptures-interactive.late-silence-b060.workers.dev/api/enquiry`.

Read-only requests to the deployed API establish:

| Website origin | Result |
| --- | --- |
| `https://isculptures-interactive.vercel.app` | HTTP 200, `available: true`, `uploads: true`, matching CORS header |
| `https://isculptures-interactive-gxc8lcewz-dannys-projects-8300a045.vercel.app` | Initially HTTP 403; now HTTP 200 with matching CORS header |
| `https://isculptures-interactive-git-cod-048558-dannys-projects-8300a045.vercel.app` | HTTP 200, available with uploads, matching CORS header |
| Unrelated Vercel origin | HTTP 403, no CORS allow header |

The preview fallback was caused by the backend origin restriction, not a missing
Vercel endpoint variable. After the owner signed in, both exact preview origins were
added to Cloudflare `ENQUIRY_ALLOWED_ORIGINS`, preserving the three existing origins.
The same two hostnames were added to Turnstile, preserving its original hostname,
Managed mode and disabled pre-clearance. No secrets were revealed or rotated.

All 16 live availability and preflight checks passed across the main origin, two
preview origins and an unrelated origin. The stable branch preview displays
Turnstile Success and enables its file picker after server-side ticket verification.
Use that stable branch URL for subsequent builds to avoid adding every deployment
hostname. Results are saved in `artifacts/preview-cors-results.json` locally.

The intended test-customer email is still required. No valid enquiry, attachment
upload or notification was sent in this verification pass. Mailbox receipt, stored
records and signed file download remain to be proved before cutover. API availability
and a successful ticket do not prove those later steps.

The Cloudflare dashboard also displayed a GitHub integration warning, used
`npm run build` rather than the documented `npm run build:worker`, and had builds
for non-production branches enabled. These build settings were observed but not
changed during the origin fix. Check them before relying on automatic API releases.

## Changes prepared on the SEO branch

- Three original occasion guides with 53 exact legacy-blog redirects, documented
  in [the blog migration review](blog-migration-review.md).
- An SEO build guard that checks every saved blog URL against its declared redirect
  and a real exported destination.
- Corrected the privacy notice to name Vercel as website host and Cloudflare as the
  enquiry processor, private storage and spam-verification provider.

Production build, web/API TypeScript checks and all 26 existing tests pass. The
export audit passes for 29 content pages, 903 internal-link occurrences, 20 breadcrumb
trails, five Service entities and 92 synchronised redirect rules. Output remains
noindex. New changes require a branch push and Vercel deployment before live checks.

## Browser and performance limits

The previously deployed revision `6ff03ae` passed desktop/mobile browser smoke
checks and 70 public HTTP checks, as recorded in the local deployment test report.
Those checks do not validate these new guides or all 92 rules on Vercel yet.

The public PageSpeed API returned quota-exceeded HTTP 429 for homepage and enquiry.
The PageSpeed website report remained in its loading state during this pass; no new
Lighthouse scores or field Core Web Vitals results were obtained. The available
browser rejected both local review URLs with `ERR_BLOCKED_BY_CLIENT`, so the new
guides need visual review on the next deployed preview.

Etsy returned access-denied responses and a browser device-check screen. This is an
access limitation, not evidence that the mapped products are discontinued.

## Remaining cutover requirements

1. Authorised enquiry test with a model/photo, correct mailbox receipts and signed
   download verification on the intended deployed website.
2. Search Console review of high-value source URLs and manual Etsy equivalence checks.
3. Measured mobile performance/accessibility and final business details: identity,
   materials, lead-time expectations, response target and agreed record retention.
4. Store exports and open-order handling, then a reviewed domain cutover preserving
   mail DNS. Enable indexing only for the business-domain production release and
   verify canonical URLs, sitemap and redirects on that domain.

Only the two preview origins and matching Turnstile hostnames were added. No
business-domain, DNS, indexing, mail-provider or retention settings were changed.
