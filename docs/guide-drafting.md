# Guide drafting playbook

Instructions for the twice-monthly drafting routine, and a checklist for anyone writing a guide by hand. The
routine drafts. The owner reviews, adds real experience, and merges. Nothing in this process publishes on its own.

The routine runs on the 8th and 22nd of each month at 00:00 UTC (`0 0 8,22 * *`), which keeps its pull requests
off the days the ImpSolutions blog drafter opens its own.

## Each run

1. Start from an up-to-date `main` and create a branch named `draft/<slug>`.
2. Open `docs/content-calendar.md` and take the first row with status `planned`. If there is none, stop and
   report that the calendar is empty. Do not invent a topic.
3. **Duplicate guard.** Read every guide in `content/guides.ts` and every body in `app/guides/posts/` first. If the
   row's search intent overlaps an existing guide (same question, same buyer), stop. Open no draft; instead
   propose a `Refresh` row for the existing guide in your final report, and leave the calendar unchanged.
4. Research the topic (see "Research"). Every price, date, statistic or product detail must come from a source
   you checked during this run.
5. Write the guide (see "Writing"), register it, and add its metadata.
6. Do the editing pass (see "Editing pass"). It is a separate, full read of the whole guide, not a skim.
7. Choose the photo (see "Photo").
8. Run `npm run check:guides`, `npm run typecheck`, `npm test` and `npm run build:web`. All four must pass.
9. Open a pull request against `main` titled `Draft: <title>`. Do not merge it and do not push to `main`.
10. Once the PR exists, set the calendar row to `drafted (PR #n)` and push that change to the same branch.

### New rows and Refresh rows

- **New** adds a guide: a new entry at the top of `guides` in `content/guides.ts` (no `sections`), a new body in
  `app/guides/posts/<slug>.tsx`, and a line in `app/guides/posts/index.ts`.
- **Refresh** rewrites an existing guide in place. Keep the same slug (old Shopify URLs redirect to it), keep
  `published` exactly as it is, set `updated` to today, remove `sections` and move the content into a TSX body.
  Keep what was already useful, but bring it up to the standard below: product picks, prices, photos, and the
  word count the calendar row asks for.

## Files to touch

- `app/guides/posts/<slug>.tsx`: the body, a default-exported function component returning a fragment. No hooks.
  Section headings are top-level `<h2>` elements (the contents list is built from them). Use `<h3>` for
  subsections and put every `<table>` inside `<div className="guide-table-wrap">`. Do not repeat the title, the
  takeaways, the product cards or the hero photo in the body: the page adds them.
- `app/guides/posts/index.ts`: import the component and register the slug, as `'<slug>': Component,`.
- `content/guides.ts`: the metadata:
  - `title` up to 60 characters, phrased the way people search. The page title gets ` | Impeccable Sculptures`
    added; keep the title itself short enough that the pair is not truncated.
  - `summary`, which is also the meta description: 155 characters or fewer.
  - `category` in capitals, `image` and `project` (an existing work-media key and project slug, used for the
    "example of our work" figure), `service` and `serviceLabel` (the closest `/pages/` service).
  - `published` and `updated` set to today's date for a new guide (the owner changes them if it merges later).
  - `readMinutes`: body words divided by 200, rounded.
  - `takeaways`: 3 or 4 lines. Each restates something the body says, with the same numbers. Never a new claim.
  - `products`: slugs from `content/products.ts` that genuinely fit. Aim for two.
  - `hero`: `{ source: 'product', key: '<product slug>', index?: 0 }` or `{ source: 'work', key: '<work-media key>' }`.
- `docs/content-calendar.md`: the row's status only.
- Link back from one or two existing guides where it fits, by adding a single sentence with a link. That is the
  only change allowed to an existing guide in a New run. Never rewrite, reorder or shorten other guides, and
  never touch `app/page.tsx`, `app/globals.css` or `app/studio.css`. Styles go in `app/subpages.css`.
- The byline ("By Daniel, maker at Impeccable Sculptures") and the author bio come from `GUIDE_AUTHOR` in
  `lib/site.ts`. Do not add names, photos or personal details anywhere else.

## Research

- Prefer primary sources: Australia Post, ACCC, the Australian Taxation Office, Etsy's own help pages, and for
  religious content the church or diocesan source itself.
- Prices are in AUD, and are only ever the ones mirrored from Etsy in `content/products.ts`. Never quote a
  price from memory, from a competitor, or from Etsy directly. Say "AU$" and the piece.
- Anything time-sensitive (cut-off dates, postage times, feast days, Easter dates) says "as of <Month Year>"
  and names its source in the PR.
- Do not state materials, sizes, lead times, capacity, minimums other than the site's 10 units, or turnaround
  that the site does not already state. Where the guide would benefit, leave a comment for the owner instead:
  `{/* TODO(owner): confirm lead time for orders of 50+ */}`.
- Never invent customers, orders, quantities or stories. Quote a review only word for word from
  `content/testimonials.ts`, with its author and source as listed.

## Religious content

- Name the tradition every time it matters (Catholic, Maronite, Orthodox, Coptic and so on). Saints, feast days and
  customs differ between them, and a general statement is usually wrong for one of them.
- Cite church or diocesan sources for any fact about a saint, feast, sacrament or custom.
- Keep a respectful, plain tone. No jokes, no marketing about faith, no claims of blessing, healing or protection.
- List anything doctrinal or devotional in the PR under "Claims to double-check" so the owner can check it.

## Writing

- Plain Australian English, written as "we". 1,000 to 1,500 words for a new guide.
- Open with the short answer, then the detail.
- Link to at least one other guide and at least one `/pages/` service page. Link catalogue pieces that genuinely
  fit (aim for two) at `/products/<slug>`. **Never link to Etsy directly**: the product page carries the
  "Buy on Etsy" button, and the check fails the build on an etsy.com link.
- Internal links are plain `<a href="/guides/...">`. Known routes: `/`, `/guides`, `/guides/<slug>`,
  `/pages/<service>`, `/products`, `/products/<slug>`, `/work`, `/work/<slug>`, `/enquiry` (optionally
  `?route=bulk|supply|design|file`), `/services`, `/policies/<slug>`.
- No filler sections ("Conclusion", "In today's world"). End with a practical next step and one sentence
  pointing to the relevant service page or the enquiry form.

## Buyer and call to action

The site's priority is business, trade and event buyers. Each calendar row names its `Buyer`, which decides where
the guide sends people:

| Buyer | Service page to link in the first half | Closing link |
| ----- | -------------------------------------- | ------------ |
| Business | `/pages/wholesale`, `/pages/events-custom-gifts` or `/pages/industrial`, whichever fits | `/enquiry?route=supply` (files: `?route=file`) |
| Trade | `/pages/wholesale`, and `/pages/ongoing-supply` for reorders | `/enquiry?route=supply` |
| Events | `/pages/bonbonniere-custom` or `/pages/events-custom-gifts` | `/enquiry?route=bulk` |
| Single pieces | the matching catalogue pages at `/products/<slug>` | one sentence on bulk orders for an event or parish, linking `/enquiry?route=bulk` |

- Link the service page within the first half of the guide, in a sentence where it helps the reader, not only at
  the end.
- Close with a short paragraph for bulk or event orders: what to send us (quantity, date needed, names or
  wording) and the closing link from the table. Keep it to two or three sentences.
- Mention the 10-unit minimum only where the guide is about quantities, pricing or how to order, and then once.
  Don't repeat it in every section or in the takeaways.
- Business and trade guides tend to need figures only the owner has: lead times for larger runs, price bands,
  reseller minimums, packaging for retail. Never estimate them. Leave a `TODO(owner)` comment at each spot and list
  them in the PR.

## Editing pass

Once the draft is complete, read the whole guide from the top as the owner would, and edit it. The aim is writing
that sounds like a maker explaining something across the counter, and that is exact about every fact.

**Precision**

- Check every number, price, date, product name and tradition against the source it came from. If it doesn't match,
  or you can't find the source again, fix it or remove it.
- State units and currency every time (AU$, millimetres, per set). Time-sensitive facts say "as of <Month Year>".
- Replace vague words ("many", "most", "often", "significantly") with the actual figure, or cut them.
- Hypothetical examples are fine if clearly hypothetical ("say a family is hosting 40 guests..."). Never present
  one as a real customer or order.
- Read the takeaways against the body once more: same numbers, same advice.

**Plain voice**

- Lead each section with the answer, then the reasons. Cut sentences that only announce what comes next.
- Vary sentence length. Short sentences for the point, longer ones to explain.
- Remove machine-sounding phrasing: delve, navigate the landscape, leverage, robust, seamless, game-changer,
  "it's important to note", "when it comes to", "not just X but Y", "whether you're X or Y", and opening a section
  with a rhetorical question.
- At most one em dash per paragraph. No bold scattered through sentences. Not every list in threes.
- Don't repeat a point made in an earlier section, and don't end a section by summarising it.
- Australian spelling: colour, organise, personalise, centre.

## Photo

Real studio photos only, taken from `content/work-media.json` and `content/product-media.json` (files in
`public/work/` and `public/products/`). No AI-generated or stock images, and no image-generation script. Choose
the most relevant photo. Never choose one that shows a product the guide isn't about. Record the choice, and why,
in the PR. If no photo fits, use the closest `work` key and say so in the PR.

## Checks

```
npm run check:guides   # errors fail the build; warnings are advice
npm run typecheck
npm test
npm run build:web
```

`check:guides` errors: a registered body without metadata (or the reverse), a link to a route that doesn't exist,
no link to another guide or to a service page, an etsy.com link, an unknown product or photo, a description over
155 characters, duplicate slugs or near-duplicate titles. Warnings: fewer than two product links, takeaways not 3 to 4,
a body under 900 words, a title over 60 characters.

## The pull request

Title `Draft: <title>`. Body, in this order:

1. **Sources**: every URL used, with the month it was checked.
2. **Claims to double-check**: each fact a reviewer should verify, including anything doctrinal.
3. **TODO(owner) items**: each comment left in the body or metadata.
4. **Key takeaways**: as written in the metadata.
5. **Editing pass**: a short note on what was cut, tightened or corrected.
6. **Photo**: which one, and why it fits.
7. **Checks**: the four commands and their results.

## Appendix: prompt for the recurring routine

Cron `0 0 8,22 * *`, model `claude-sonnet-5-5`, tools Bash, Read, Write, Edit, Glob, Grep, WebSearch, WebFetch.
Paste everything in the block below.

```
You are working on isculptures.com.au, the website of Impeccable Sculptures, a 3D printing studio in Sydney, Australia. It makes saint statues, icons, bonbonniere and personalised favours, takes custom and bulk orders from 10 units, and sells single pieces only on Etsy. The site's /products pages are a catalogue whose 'Buy on Etsy' buttons hand the sale to Etsy. The site is a Next.js 16 static export in this repository (Altered-Beast92/Isculptures-interactive), deployed by Vercel from main.

Your job this run: draft one guide and open a pull request for the owner to review. Never merge, never push to main, never deploy, and never create or change routines or other cloud configuration. Do not edit app/page.tsx, app/globals.css or app/studio.css. Styles go in app/subpages.css.

Read AGENTS.md first: this Next.js version has breaking changes, so check node_modules/next/dist/docs/ for anything you use. Run npm ci if node_modules is missing.

Then read docs/guide-drafting.md and follow it exactly. In short:
1. Branch draft/<slug> from the latest main.
2. Take the first row of docs/content-calendar.md whose status is planned. If there is none, stop and say the calendar is empty. A New row adds a guide. A Refresh row rewrites an existing guide in place: same slug, keep published, set updated, convert it to a TSX body.
3. Duplicate guard: read every existing guide first. If the row's search intent overlaps one, stop and propose a Refresh row instead of drafting.
4. Research: every fact from a source you checked during this run, prices in AUD, 'as of <Month Year>' on anything time-sensitive. Quote prices only as mirrored from Etsy in content/products.ts. Make no claims about materials, sizes, lead times or capacity that the site doesn't already state; leave {/* TODO(owner): ... */} instead. Never invent customers, orders, quantities or stories. Quote reviews only word for word from content/testimonials.ts.
5. Religious content: name the tradition (Catholic, Maronite, Orthodox and so on), cite church or diocesan sources, keep a respectful tone, and list anything doctrinal in the PR for the owner to check.
6. Write: plain Australian English, as 'we', 1,000 to 1,500 words for a new guide, the short answer first, at least one link to another guide and one to a /pages/ service page, the catalogue pieces that genuinely fit (aim for two), never a link to etsy.com. Follow the 'Buyer and call to action' section for the row's Buyer column: link the matching service page in the first half and close with a short paragraph for bulk or event orders, linking the enquiry route it names. Mention the 10-unit minimum only where the guide is about quantities, pricing or how to order, and then only once. Never estimate lead times, price bands or reseller minimums; leave a TODO(owner) instead. Add the body in app/guides/posts/<slug>.tsx, register it in app/guides/posts/index.ts, and add the metadata (title up to 60 characters, summary up to 155, readMinutes, 3 to 4 takeaways, products, hero) to content/guides.ts.
7. Editing pass as a separate full read: check every figure against its source; state units and currency; replace vague words with figures or cut them; recheck the takeaways against the body; lead each section with the answer; vary sentence length; cut throat-clearing and repetition; remove delve, navigate the landscape, leverage, robust, seamless, game-changer, 'it's important to note', 'when it comes to', 'not just X but Y', 'whether you're X or Y' and rhetorical-question openers; at most one em dash per paragraph; Australian spelling.
8. Photo: the most relevant real photo from content/work-media.json or content/product-media.json. No AI-generated images, and never a photo of a product the guide isn't about.
9. Run npm run check:guides, npm run typecheck, npm test and npm run build:web. All must pass. Leave next-env.d.ts and AGENTS.md out of the commit if tooling rewrote them.
10. Open a PR against main titled 'Draft: <title>'. The description lists sources, claims to double-check, TODO(owner) items, the takeaways, an editing-pass note, the photo chosen and the check results. Then set the calendar row to 'drafted (PR #n)' and push that to the same branch.

If a check still fails after reasonable effort, open the PR anyway with 'Checks failing' and the error output at the top. If you cannot run at all (access denied, a command fails, you get stuck), say so plainly in your final message. Reply at the end with the PR link and a two-line summary.
```
