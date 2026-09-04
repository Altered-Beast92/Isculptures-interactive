# Etsy relisting worksheet

Closes the TODOs in `public/_redirects`. Every row here is a Shopify URL that
has been indexed and currently has **no Etsy destination**, so its redirect
falls back to a shop search.

Why this has a deadline: a 301 pointing at a shop that does not stock the item
reads to Google as a soft-404. It keeps the link alive for a while, then the
ranking goes anyway. Each row below ends either as a relisting (repoint the
redirect at the new listing) or as a deliberate `410 Gone` (tell Google to drop
it cleanly, which loses the URL but protects the rest of the domain).

Asset counts are files already present in the Shopify files export
(`d11266-38-files-...`). "0 assets" means new photography is required before
the listing can exist at all.

---

## Priority 1 — Bonbonnière and favour range

**Do this first.** It is the only group that both recovers search traffic and
feeds the new positioning. The Etsy shop currently carries **2 favour listings
out of 11**, while the files export holds photography for at least five more.

Every listing in this group should carry a line in its description pointing at
the trade enquiry on the new site — something like *"Ordering for an event?
We produce these in runs of 100+ — [enquire here]"*. That turns each retail
listing into top-of-funnel for bulk work, which is the whole point.

| Item | Assets | Action |
|---|---|---|
| Saint Anne Bonbonnière | `SaintAnneBonbonniere.jpg` | Relist |
| Saint Anthony Bonbonnière | `SaintAnthonyBonbonnierre.jpg` | Relist |
| Saint Elias Bonbonnière | `SaintEliasBonbonnierre.jpg` + `.png` | Relist |
| Saint Peter Bonbonnière | `Saint_Peter_Bonbonniere.jpg` + reel | Relist |
| Orthodox Icon Bonbonnière (Virgin Mary / Christ) | `Orthodox_Icon_Bonbonniere_Virgin_Mary_Christ.png` | Relist |

Note: `/products/bonbonniere-gifts` and `/products/bonbonnieres-gifts` are
**not** in this table. They already redirect to `/#events` on the new site,
which is correct — those are category-level URLs with bulk intent and should
land on the trade section, not on Etsy.

---

## Priority 2 — Statues and icons with photography ready

Old URLs that ranked, with assets on hand. Straight backfill.

| Old URL | Assets | Action |
|---|---|---|
| `/products/saint-dominic-de-guzman-statue` | 2 (12 MB each, high-res) | Relist |
| `/products/saint-peter-keeper-of-keys` | 3 angles (back/left/right) | Relist |
| `/products/saint-paisios` | 1 | Relist |
| `/products/virgin-mary-statue` | 4 (`ImmaculateMary*`) | Relist |
| `/products/virgin-mary-full-body-statue` | shares the above | Relist as one listing with variants, not two |
| `/virgin-mary-killing-snake-statue/` (legacy flat URL) | shares the above | Point at the same relisting |
| `/products/jesus-bust` | `Jesus_Christ_Pantocrator_Orthodox.jpg` — **verify this is the right piece** | Relist if it matches |

---

## Priority 3 — Seasonal, relist to the calendar

No urgency now; these only earn traffic in season. Relist ahead of the season
and repoint then.

| Old URL | Assets | Action |
|---|---|---|
| `/products/christmas-twist-off-tree` | 1 | Relist ~October |
| `/products/valentines-chocolate-personalised-gift-box` | 6 | Relist ~January |

---

## Priority 4 — Recommend `410 Gone`

**No photography exists for these in the export**, so relisting means new
product shots before anything else can happen. Unless they were sellers worth
reshooting, letting them 410 is the cleaner outcome.

| Old URL | Assets | Recommendation |
|---|---|---|
| `/products/rear-mirror-orthodox-cross` | 0 | 410 unless reshooting |
| `/products/personalised-rear-view-mirror-thorns-of-jesus-cross` | 0 | 410 unless reshooting |
| `/products/holy-family-statue-jesus-mary-and-joseph` | 0 | 410 unless reshooting |
| `/products/jesus-christ-full-body-statue` | 0 | 410 unless reshooting |
| `/jesus-christ-full-body-statue/` (legacy flat URL) | 0 | 410 unless reshooting |

Check Shopify or Etsy sales history before deciding — if any of these actually
sold, they are worth the reshoot.

---

## How to close each row

1. Create the Etsy listing.
2. Copy its URL — the shape is
   `https://www.etsy.com/au/listing/<id>/<slug>`.
3. Replace the matching search-fallback line in `public/_redirects` with the
   real listing URL.
4. Delete that row from this file.

For anything settled as 410: Cloudflare Pages `_redirects` cannot emit a 410,
so remove the rule and let the URL 404, or add a Pages Function returning 410
if the cleaner signal is worth the extra file.

## Already mapped — no action

Ten URLs already point at verified live listings and need nothing:
Sacred Heart, both Saint Charbel variants, Saint Michael (statue and icon),
Saint George, Divine Jesus, Virgin Mary and Jesus icon, Saint Nicholas, plus
the two legacy flat URLs for Charbel and Michael.
