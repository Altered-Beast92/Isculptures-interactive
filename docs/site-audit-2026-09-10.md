# Website review — 10 September 2026

The replacement has a coherent visual identity and useful service pages. The next
priority is proving the offer and the enquiry journey, then completing the Shopify
migration. The old shop should stay available until those launch checks pass.

Reviewed the repository, generated HTML for all 26 content pages, the public Shopify
homepage/contact/blog pages, and current Google and Vercel documentation. This is a
source and technical SEO audit, not a browser interaction or field-performance audit.
No hosting, DNS, mailbox, Search Console or analytics account settings were changed.

## SEO improvements implemented locally

- Rewrote the homepage search title/description around custom and bulk 3D printing in
  Sydney. The visible introduction now names event favours, corporate gifts and
  Australia-wide service without replacing the established creative headline.
- Applied consistent branded titles and page-specific Open Graph/X text. Portfolio
  pages previously used a separate metadata path that could inherit homepage X text;
  they now share the same canonical/title/description helper. Existing portfolio
  preview images are preserved.
- Added WebSite structured data for the business name; five Service entities tied
  to the existing Organization; and an AboutPage entity. No unverified address,
  ratings, prices, certifications or production capacity were added.
- Added visible breadcrumb navigation and matching structured data on all 17
  service/about, portfolio-detail and guide-detail pages.
- Added the four policy pages to the sitemap and included the portfolio image URLs.
  No fabricated publication dates or automatically refreshed last-modified dates.
- Added homepage/footer links to corporate gifts and a footer link to all services.
  Corrected the navigation state that identified the bonbonniere link as the current
  page when viewing the different corporate-gifts page.
- Converted the shared 39-rule migration map into Vercel configuration, including
  existing security headers and consistent trailing-slash handling. The earlier
  configuration only supplied Cloudflare Pages files to a Vercel website.
- Removed blanket `/products/*` and `/collections/*` redirects to the Etsy homepage.
  Unmapped URLs now remain genuine missing pages, so missing migration decisions are
  not hidden. Existing exact Etsy listing/search mappings still require review.
- Protected Vercel preview/development builds from indexing even if they inherit
  `SITE_INDEXABLE=true`. Public indexing still requires an explicit production opt-in.
- Added a build-time SEO check for actual exported titles, descriptions, canonicals,
  social text, H1 counts, sitemap coverage, structured data, internal links/anchors,
  local image references, indexing consistency and redirect-map drift.

## What to do next, in order

| Priority | Finding | Concrete next action / completion evidence |
| --- | --- | --- |
| Before launch | Real online enquiry delivery is not established by this review. The default local `/api/enquiry` returns 404; the UI correctly falls back to email. | Complete the Vercel endpoint and Cloudflare R2/Turnstile/Resend configuration in `docs/vercel-cloudflare-setup.md`. Submit an authorised test through the intended website with a model and photo. Verify the reference, stored record, studio email, customer receipt and signed file download. Check the email-failure recovery path. |
| Before launch | The Shopify migration is incomplete. The saved inventory contains 53 blog URLs, while the replacement contains four original guides and no migrated blog routes. | Export Shopify URLs/content and Search Console landing-page/link data. Decide each URL: retain content, redirect to a genuinely equivalent page, or deliberately retire. Validate every Etsy listing/search destination, including product variants and collection-scoped product URLs. Avoid redirecting all blogs to Guides or Home. |
| Before launch | Production indexing is intentionally disabled by default. Host redirects have been configured but not exercised on Vercel. | At approved cutover, set `SITE_INDEXABLE=true` for Production only and rebuild. Check actual HTTPS/host/trailing-slash redirects, canonical URLs, robots, 404 status and sitemap on the final domain. Submit the sitemap in Search Console. Keep mail DNS intact, retain store exports and handle open orders before cancelling Shopify. |
| High | Seven photographed work examples have no recorded client, material, quantity, turnaround or outcome; there are zero testimonials in the content data. | Turn three real jobs into useful case studies: brief, quantity, material/finish, approval process, delivery requirement, result and genuine photos. Obtain named/source-attributed reviews with publication permission. Add one credible parts/prototype example to support that service. |
| High | Buyers cannot assess many practical constraints without enquiring. Current copy largely says details will be confirmed with the quote. | Confirm available materials/finishes, realistic size limits, standard lead-time ranges, response target, sample/design costs and packaging options. Clarify whether one-off prototypes are available alongside the 10-unit bulk minimum, and the scope/eligibility of the advertised free mockup. Publish only information the studio can stand behind. |
| High | The About page is generic and the draft business/policy details need completion. | Add the studio story, who customers deal with, an authentic studio/team image if available, and confirmed business identity/ABN. Review policy wording: privacy currently says Cloudflare hosting, while the documented website host is Vercel. Agree file/record retention and implement it; the current sweep deletes abandoned drafts, not submitted enquiries. |
| High | The immersive printer needs measured mobile and accessibility QA. Static SEO checks cannot establish responsiveness or Core Web Vitals. | Test the homepage and enquiry flow on a mid-range phone/slow connection, keyboard navigation, 200% zoom, reduced motion, failed WebGL and upload errors. Measure LCP/INP/CLS. The largest exported JS chunk in this build is about 725 KB uncompressed; this is a measurement lead, not a proven performance failure. Preserve the chosen visual direction while addressing measured issues. |
| Next | Analytics currently emits events but has no configured collection provider. | Choose a measurement setup and verify enquiry starts, submissions, errors, email/phone clicks and qualified lead outcomes. Keep briefs, names and file links out of analytics. Track service-page enquiries and conversion quality rather than only traffic. |
| Next | The site has useful planning guides but little original manufacturing detail or proof. | Expand the existing service pages with verified specifications and real examples. Build guide topics from customer questions and Search Console demand after launch. Avoid repeated near-identical occasion articles and unsupported suburb pages. |
| Later | No shared homepage social-preview image is configured. | Commission a deliberate branded sharing image if desired. This is secondary to enquiry readiness, migration and customer proof; no new image was generated in this audit. |

## Search positioning to develop

These are intent targets based on the current offering, not measured keyword volumes
or ranking promises. Retain the existing service URLs; clearer URLs alone do not
justify another migration.

| Page | Primary intent | Content that would make it more useful |
| --- | --- | --- |
| `/` | Custom / bulk 3D printing Sydney | Clear service scope, local studio identity, real work and route to quote. |
| `/pages/wholesale` | Wholesale and bulk 3D printing Australia | Minimums, batch examples, price factors, resale/packaging requirements. |
| `/pages/events-custom-gifts` | Custom corporate gifts and event favours | Branded examples, artwork requirements, deadlines and personalisation options. |
| `/pages/bonbonniere-custom` | Personalised wedding/christening bonbonniere | Relevant photographs, guest quantities, names/dates, finishes and presentation. |
| `/pages/industrial` | 3D printed parts and prototypes Sydney | Real functional work, verified materials, dimensions and tolerances. |
| `/pages/ongoing-supply` | Repeat production and recurring batches | A demonstrated repeat order, version control and ordering process. |

## Validation and practical limits

- Production build, website/API TypeScript checks and 26 existing automated tests pass.
- Export audit covers 26 pages, 792 internal link occurrences, 17 breadcrumb trails
  and five service entities. It verifies all sitemap pages and local image references.
- Production indexing was tested with the launch opt-in; a Vercel preview build
  with that same opt-in correctly stayed noindex. Final local output remains noindex;
  publishing and domain cutover were not performed.
- `npm run build:web` checks Vercel-map consistency, builds the website, then audits
  its output. Run `node scripts/sync-redirects.mjs` after editing `public/_redirects`.
  Run `npm run check:seo -- --expect-indexable` against the final launch build.
- Parsing JSON-LD is not the Google Rich Results Test. Service markup describes the
  offering; it does not guarantee a special search display or rankings.
- Search Console data, deployed HTTP redirect behaviour, external listing validity,
  real emails, visual/mobile interactions and field performance remain unverified.
- A direct request for the old site's sitemap returned a Shopify error page during
  this audit, so the saved 53-URL blog inventory was not presented as a fresh crawl.
- The legacy combined Sites worker has not been updated to the newer ticket/upload
  routes. Use the documented standalone Cloudflare enquiry worker for Vercel; review
  that older combined path before returning to Sites hosting.

## Reference guidance

The recommendations use the new site's actual offer, rather than copying the old
site's SEO. Historical URLs/traffic are relevant to preserving useful content and
links during migration.

- [Google: descriptive titles and visible page signals](https://developers.google.com/search/docs/appearance/title-link).
- [Google: useful descriptions for search snippets](https://developers.google.com/search/docs/appearance/snippet).
- [Google: WebSite data for site names](https://developers.google.com/search/docs/appearance/site-names).
- [Google: migration mapping, relevant redirects and launch indexing checks](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
- [Vercel: platform redirects, headers and trailing-slash configuration](https://vercel.com/docs/project-configuration/vercel-json).
