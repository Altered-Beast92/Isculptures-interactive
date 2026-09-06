# iSculptures B2B draft — launch handoff

## Implemented
- Bulk positioning with the owner-confirmed minimum of 10 units.
- Dedicated bulk, event, bonbonniere, functional-parts, ongoing-supply and about pages.
- Shareable /enquiry route and support for old /#project links.
- Accessible labelled enquiry form with separate per-run and annual quantities.
- Private STL/OBJ/3MF/PDF/PNG/JPG uploads: 5 files, 10 MB per file, 20 MB combined.
- Durable R2 storage before success; full commercial brief preserved.
- Turnstile server verification, strict origin checks, bounded requests and file validation.
- Studio notifications and customer receipts through Resend, plus expiring attachment links.
- Authenticated enquiry recovery API and notification retry command.
- Canonicals, sitemap, organisation metadata, draft noindex, service links and real policy routes.
- Placeholder reviews and fabricated projects removed. Ten supplied photographs now illustrate four real work galleries, linked from the homepage, service pages, navigation and sitemap.
- Responsive WebP versions, descriptive alternative text, gallery metadata and a direct link to the studio Instagram profile. Source-to-output mapping is recorded in media-manifest.json.
- Mobile navigation, direct contact links and lazy homepage-only printer animation.
- Analytics integration hooks without an enabled analytics provider.

## Configure before accepting online enquiries
The existing mailbox receives mail; it does not itself provide an API for the website to send notifications.

Recommended setup: Cloudflare R2 private storage + Resend delivery to info@isculptures.com.au + Turnstile. Files stay out of email attachments; the studio receives private download links valid for seven days.

Set runtime variables in Sites, not the browser bundle:
- ENQUIRY_TO: info@isculptures.com.au
- ENQUIRY_FROM: an address on a domain verified in Resend (e.g. quotes@isculptures.com.au after verification).
- RESEND_API_KEY: restricted sending key for the verified domain.
- TURNSTILE_SITE_KEY and TURNSTILE_SECRET: widget configured for the draft/final hostnames; action is enquiry.
- FILE_LINK_SECRET: at least 32 random bytes, stored as a secret.
- ENQUIRY_ADMIN_TOKEN: at least 32 random bytes, stored as a secret for private operational access.
- ENQUIRIES_ENABLED: true only once all of the above are configured and tested.

The logical R2 binding ENQUIRIES is declared in .openai/hosting.json. Do not publish the bucket publicly. Draft deployments remain owner-only and noindex.

Add an edge rate-limit rule for POST /api/enquiry before public launch. Turnstile is mandatory in the application; origin checks are an additional protection, not a replacement.

## Verify delivery and recovery
- Send an owner-authorised test enquiry on the deployed site with a small STL and image.
- Confirm the actual studio mailbox and customer test address receive the right messages.
- Check per-run/annual quantity, pricing, timing, dimensions, finish, packaging and delivery notes.
- Download the attachment through the email link; confirm an altered/expired signature fails.
- Simulate failed notification in a test environment and confirm it remains in the recovery queue.
- Operational access: set ENQUIRY_SITE_URL and ENQUIRY_ADMIN_TOKEN in the operator environment; run npm run enquiries -- list, read <reference>, or retry <reference>.
- Check pending notifications daily until an automated monitor is configured. Resend idempotency covers short retries; do not repeatedly retry old sent notifications.
- Decide a retention period for unsuccessful enquiries and attachments; configure storage lifecycle/deletion and update the privacy notice to match.
- Open supplied files in appropriate isolated/updated tooling. Extension/signature checks are not malware scanning.

## Owner content still needed
- Confirm materials currently supplied, normal lead time and enquiry response target.
- Business legal identity / ABN and any address suitable for publication.
- Three real bulk jobs: photos, quantity, material, delivery requirement and outcome.
- Authentic reviews with author/source and permission; no placeholder rating claims.
- Evidence for capacity and any industrial or contractual claims.
- Approve draft policy wording and have commercial supply terms reviewed.
- A capability statement needs verified equipment, capacity examples and case studies before it can be used for procurement.

## Shopify migration — do not change DNS yet
- Export Shopify content, images, reviews, orders and URL inventory.
- Export Search Console landing pages, queries and links; prioritise existing search demand.
- Existing /pages/wholesale, /pages/industrial, /pages/events-custom-gifts and /pages/bonbonniere-custom are retained.
- Review all product/collection mappings in public/_redirects against the live Etsy catalogue. Existing retail destinations are retained provisionally, not reverified.
- Decide which retail pages deserve on-domain showcases instead of Etsy redirects.
- Inventory blog posts and migrate valuable content; no generic blog-to-home redirect is included.
- Test redirects/status codes on the final hosting layer, including trailing slashes and unknown pages.
- Preserve all mail DNS records while changing web hosting.
- Deal with open Shopify orders, customer support and exports before closing the store.
- At approved cutover rebuild with SITE_INDEXABLE=true, verify robots/canonicals/HTTPS, then submit sitemap.xml in Search Console.
- Check sitemap, indexing, 404s and enquiries after launch; retain previous version and DNS details for rollback.

## Measurement
Use a privacy-reviewed analytics setup once an account/provider is selected. The code emits isculptures:analytics events and pushes to dataLayer only if one is already present. No analytics collection is enabled by default. Do not send names, email addresses, file names, briefs or signed file links to analytics.

Measure qualified enquiries, quotes, wins, average order value and repeat orders. Connect sales outcomes to a CRM or controlled lead register. Current campaign attribution is limited to the current session; it is not a cross-device tracker.

## Validation limits
Automated tests exercise the handler with mocked R2, Turnstile and email responses; they do not prove delivery to the real mailbox. The production build and internal route checks do not establish Google rankings or real-user Core Web Vitals. Mobile/desktop browser checks are separate from a Lighthouse or field performance assessment.

## Design and guides update — 6 September 2026
- Shorter homepage with explicit bulk 3D printing headline, early photographed work, compact service overview and Services / Our Work / Guides / About navigation.
- Printer animation is confined to the hero and unmounts when offscreen; reduced-motion and data-saving preferences remain respected.
- Four original buying guides have static routes, unique metadata, article structured data, on-page contents, related service/project links and enquiry calls to action. Added to sitemap; preview remains noindex.
- Guide copy describes the enquiry process and planning considerations; owner confirmation is still needed for materials, lead times, capacity, reviews and quantified case studies. No such claims were invented.
- Existing Shopify blog URLs are recorded in shopify-blog-inventory.json from the live sitemap. Similar slugs suggest overlap, but article bodies and traffic have not been audited. Do not infer that a URL is disposable or redirect the whole blog to the homepage.
- Validate source copy with the owner before public cutover. Preserve useful existing articles/URLs or use individually justified redirects after content and Search Console review.
- Desktop hero and 390px mobile navigation/guide layout checked; guide page had no horizontal overflow. Build and seven enquiry tests pass. Real email delivery remains unconfigured.

## Owner design preference restored
The owner requested the original full-page scroll-driven printer and spacious translucent sections. Restored the homepage and printer backdrop from the media-gallery version. Removed compact hero/service overrides. Retained the Guides and Services routes, navigation access and article styling. This supersedes the compact homepage and hero-only animation notes above.
