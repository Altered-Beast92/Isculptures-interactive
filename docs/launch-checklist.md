# iSculptures B2B draft — launch handoff

## Latest audit — 10 September 2026

See [the latest launch verification](launch-verification-2026-09-10.md) for current
deployment, enquiry and testing status, and [the site audit](site-audit-2026-09-10.md)
for the broader review. Vercel deployments remain noindex. The subsequent
[blog migration review](blog-migration-review.md) maps all 53 recorded blog URLs to
original replacement guides; Search Console and retail destination checks remain.
Run `node scripts/sync-redirects.mjs` after editing the shared redirect map.
Use the Vercel/standalone Cloudflare setup below rather than older combined Sites
deployment notes when configuring the current enquiry flow.

## Hosting update — Vercel and Cloudflare

The owner selected Vercel for the website and Cloudflare for enquiries. Follow
[vercel-cloudflare-setup.md](vercel-cloudflare-setup.md) for the API-only Worker,
private R2 binding, exact website origins, Turnstile and Resend settings. This
supersedes the Sites runtime setup below. Live account configuration and real
mailbox verification remain required; local tests simulate external services.

## Implemented
- Bulk positioning with the owner-confirmed minimum of 10 units.
- Dedicated bulk, event, bonbonniere, functional-parts, ongoing-supply and about pages.
- Shareable /enquiry route and support for old /#project links.
- Accessible labelled enquiry form with separate per-run and annual quantities.
- Private STL/OBJ/3MF/PDF/PNG/JPG/HEIC uploads: 8 files, 50 MB per file, 150 MB combined. Files stream to R2 as they are chosen, each with its own progress and retry; photographs are resized in the browser first.
- Durable R2 storage before success; full commercial brief preserved.
- Turnstile server verification exchanged for a 45-minute upload ticket, strict origin checks, bounded requests and file validation from the streamed bytes.
- Studio notifications and customer receipts through Resend, plus expiring attachment links.
- Authenticated enquiry recovery API and notification retry command.
- Canonicals, sitemap, organisation metadata, draft noindex, service links and real policy routes.
- Placeholder reviews and fabricated projects removed. Ten supplied photographs now illustrate four real work galleries, linked from the homepage, service pages, navigation and sitemap.
- Responsive WebP versions, descriptive alternative text, gallery metadata and a direct link to the studio Instagram profile. Source-to-output mapping is recorded in media-manifest.json.
- Mobile navigation, direct contact links and lazy homepage-only printer animation.
- Analytics integration hooks without an enabled analytics provider.

## Configure before accepting online enquiries

Historical setup notes below describe the earlier unconfigured state. The current
Worker now reports availability for the main Vercel origin. See the latest launch
verification above for the remaining Preview allowlist and mailbox checks.
The existing mailbox receives mail; it does not itself provide an API for the website to send notifications.

Owner confirmed that Resend and Cloudflare accounts are not set up yet. No live email, upload or Turnstile credentials are configured in the local workspace. Existing enquiry tests use mocked services; successful tests do not establish real mailbox delivery. Account setup and a chosen hosting environment are needed before the live connection and delivery check.

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

## Immersive glass design — owner correction
Replaced solid homepage bands with a continuous visible printing scene, individually framed translucent glass chapters, staggered photography, paired photo/story layouts and an inset glass footer. Retained full-page scroll progress, reduced-motion fallback, real work and Guides. This supersedes the conventional solid section layout; the owner explicitly wants an immersive visual identity distinct from the live Shopify store.

## Local-only development — owner instruction
Use http://localhost:3000 for review. Do not save or deploy further hosted Sites versions unless the owner explicitly requests publishing again. Owner requested removal of the existing private hosted preview; no unpublish/delete operation is exposed by the currently available Sites connector, so removal remains pending rather than completed.

## Current design and branding — 6 September 2026
The owner-approved direction uses oversized Onest typography, a continuous scroll-driven printer, and pale-yellow (#e6d4b1) homepage chapters 02, 04, 06 and 08 alternating with glass sections. The enquiry page uses a yellow canvas framed by dark-green header and footer, with four enquiry categories and a three-stage form. This supersedes the earlier all-glass and hero-only layouts.

The business name is Impeccable Sculptures. Supplied logos are used in the shared header/footer and browser icons; metadata and organisation data use the full name. The existing domain and email address are retained. Selected new work adds personalised rose sculptures and favour tags; the homepage retains the gold character figures and only one religious work photo. Local development remains the review target, and real form delivery remains unconfigured.
