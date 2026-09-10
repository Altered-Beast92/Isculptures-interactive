# Launch verification — 10 September 2026

## Enquiry connection

Vercel already has `NEXT_PUBLIC_ENQUIRY_ENDPOINT` assigned to Production and Preview:
`https://isculptures-interactive.late-silence-b060.workers.dev/api/enquiry`.

Read-only requests to the deployed API establish:

| Website origin | Result |
| --- | --- |
| `https://isculptures-interactive.vercel.app` | HTTP 200, `available: true`, `uploads: true`, matching CORS header |
| `https://isculptures-interactive-gxc8lcewz-dannys-projects-8300a045.vercel.app` | HTTP 403, no CORS allow header |

The preview fallback is therefore caused by the backend origin restriction, not a
missing Vercel endpoint variable. To test the preview, add its exact origin to the
existing Cloudflare `ENQUIRY_ALLOWED_ORIGINS`, preserving current entries. Add its
hostname to the Turnstile widget as required. Do not use a wildcard Vercel allowlist.
Recheck this if the deployment receives a different hostname after a new build.

Cloudflare dashboard and local Wrangler are not authenticated in the available
session. Sign-in and the intended test-customer email were requested. No valid
enquiry, attachment upload or notification was sent in this verification pass.
Mailbox receipt, stored records, signed file download and provider configuration
remain to be proved before cutover. API availability alone does not prove them.

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

No business-domain, DNS, indexing, mail-provider or retention settings were changed.
