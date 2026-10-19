# Guide content calendar

Two guides a month, drafted on the 8th and 22nd at 00:00 UTC. The drafting routine takes the first row whose
status is `planned`, drafts it as a pull request, and changes the status to `drafted (PR #n)`. Nothing is
published until the owner reviews and merges it. `New` rows add a guide. `Refresh` rows rewrite an existing
guide in place (same slug, same `published` date) and convert it to a TSX body.

To change what gets written next, reorder the rows, edit them, or set a row to `skip`. Rows marked `later` are
kept for after the planned ones and are never drafted while they say `later`. Add new ideas at the bottom.

The site's priority is business, trade and event buyers, so most rows target them. The `Buyer` column decides how
a guide ends (see "Buyer and call to action" in `docs/guide-drafting.md`).

| Status | Month | Type | Buyer | Working title | Search intent | Link to |
| ------ | ----- | ---- | ----- | ------------- | ------------- | ------- |
| drafted (PR #29) | Oct 2026 | New | Business | Corporate Christmas gifts you can 3D print with your logo | Commercial, business | /pages/events-custom-gifts, /pages/wholesale, /guides/bulk-3d-printing-quote-checklist |
| planned | Nov 2026 | New | Events | Personalised Christmas place settings for venues, dinners and events | Seasonal, commercial | /products/personalised-christmas-tree, /guides/ordering-custom-event-favours, /pages/events-custom-gifts |
| planned | Nov 2026 | Refresh | Events | personalised-baby-shower-keepsakes: 1,200+ words, product picks and photos (41 old Shopify URLs redirect here) | Commercial | /products/first-tooth-favour-tag, /products/personalised-rose-sculpture, /pages/bonbonniere-custom |
| planned | Dec 2026 | New | Trade | Wholesale saint statues and icons for church shops and religious stores | Commercial, trade | /pages/wholesale, /pages/ongoing-supply, /products, /products/saint-michael-statue, /products/saint-charbel-statue, /products/saint-joseph-icon |
| planned | Dec 2026 | Refresh | Events | christening-baptism-keepsakes: product picks, prices and photos | Commercial | /products/st-gabriel-icon-bonbonniere, /products/christening-coaster-bonbonniere, /products/pantocrator-icon-bonbonniere, /pages/bonbonniere-custom |
| planned | Jan 2027 | New | Business | STL, OBJ or 3MF? Sending a 3D file for a production run | Informational, business | /pages/industrial, /guides/bulk-3d-printing-quote-checklist, /guides/what-affects-bulk-3d-printing-cost |
| planned | Jan 2027 | New | Events | Easter 2027 gifts and favours for parishes, schools and families (Western Easter 28 March, Orthodox Easter 2 May) | Seasonal, commercial | /pages/bonbonniere-custom, /pages/wholesale, statue and icon product pages |
| planned | Feb 2027 | Refresh | Events | personalised-wedding-bonbonniere: guest-count maths and product picks | Commercial | /products/personalised-rose-sculpture, /products/st-gabriel-icon-bonbonniere, /pages/bonbonniere-custom |
| planned | Feb 2027 | New | Events | First Holy Communion and Confirmation favours in batches | Commercial | /pages/bonbonniere-custom, /products/pantocrator-icon-bonbonniere, /products/st-gabriel-icon-bonbonniere, /products/saint-elias-icon-bonbonniere |
| planned | Mar 2027 | New | Single pieces | Choosing a Saint Michael statue or icon: sizes, finishes and meaning | Commercial investigation | /products/saint-michael-statue, /products/saint-michael-the-archangel-defender-of-faith-icon |
| later | | New | Single pieces | Saint Charbel statues: which one, what size and where to place it | Commercial investigation | /products/saint-charbel-statue, /products/saint-charbel |
| later | | New | Events | First tooth celebration favours: wording, colours and tag ideas | Informational, commercial | /products/first-tooth-favour-tag |

## Notes

- Draft seasonal guides about two months ahead of the season.
- Re-verify the Easter dates when drafting the Easter row (Western and Orthodox) against a published church or calendar source.
- Ideas to add later: silk, marble or matte finishes explained; caring for a 3D printed statue; name day gifts.
- Business and trade rows often need figures only the owner has (lead times for 50+ units, price bands, minimums
  for resellers). Leave a `TODO(owner)` for each one rather than estimating it.
