# Blog migration review — 10 September 2026

All 53 saved Shopify blog URLs were requested successfully: one index and 52
articles. Article bodies were extracted, with 1,349–2,358 words per article. The
titles and section outlines repeatedly cover choosing favours, personalisation,
guest numbers, budget, packaging and timing across three occasion topics.

The branch consolidates this overlap into three original practical guides. It does
not copy the old titles, keyword repetition, unsupported guest-preference claims or
claims about materials and production capacity. Existing bulk-order guides remain
first in the guide list and on the homepage.

| Source group | Count | Replacement |
| --- | ---: | --- |
| Baby-shower favours and keepsakes | 41 | `/guides/personalised-baby-shower-keepsakes` |
| Wedding bonbonniere | 8 | `/guides/personalised-wedding-bonbonniere` |
| Christening and baptism keepsakes | 3 | `/guides/christening-baptism-keepsakes` |
| Blog index | 1 | `/guides` |

Each source has an exact 301 rule in `public/_redirects` and `vercel.json`. No
wildcard blog rule is used. The new guides have their own canonical URL, metadata,
Article and breadcrumb data, contents anchors, studio example and enquiry link.
The sitemap includes them automatically. The SEO build check verifies every saved
source appears once in the map and resolves to a real exported destination.

## Before business-domain cutover

Search Console traffic, queries and backlinks were not available. These are
content-based consolidation decisions, not proof that all old URLs have equal
search value. Review the highest-traffic and most-linked source pages against this
map before switching the domain; retain or expand a destination if a source serves
a useful distinct intent. Local extraction is not a complete Shopify backup:
export store content, media and operational records separately.

`shopify-blog-inventory.json` records every source, reviewed title, word count,
destination and the outstanding Search Console check. Raw article extracts are in
the ignored `artifacts/legacy-content/` directory for local review.

## Retail destinations remain unverified

The 19 distinct Etsy destinations in the existing map returned access-denied
responses to automated requests. This does not establish that a listing is missing
or available. Listing equivalence and search-result usefulness still need catalogue
review. Existing Etsy rules have not been replaced with guessed listing IDs.

Google supports consolidating old pages into a relevant replacement and cautions
against sending unrelated pages to one destination. See
[Google's site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
