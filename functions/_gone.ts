/**
 * Shared 410 Gone handler for retired product URLs.
 *
 * These are Shopify products that were indexed, have no Etsy equivalent, and
 * have no photography in the files export to relist from — see
 * `docs/etsy-relisting.md`. Redirecting them into a shop that cannot serve the
 * visitor reads to Google as a soft-404: the ranking goes anyway, and the
 * bogus redirect drags on the rest of the domain in the meantime. A 410 says
 * "this is deliberately gone", which drops the URL cleanly.
 *
 * Why a Function rather than a `_redirects` rule: `_redirects` supports only
 * 301/302/303/307/308, so 410 is not expressible there. A Function is also the
 * only way to escape the `/products/*` catch-all, because redirects are not
 * applied to requests a Function serves — which is exactly the precedence we
 * need here.
 *
 * The body is a real page, not a bare status. Crawlers act on the 410 and
 * ignore the body; a person who followed an old link or a bookmark still needs
 * somewhere to go.
 */

const ETSY = 'https://www.etsy.com/au/shop/iSculptures';

const page = (title: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>No longer available — iSculptures</title>
<meta name="robots" content="noindex">
<style>
:root{color-scheme:dark}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:8vh 7vw;
background:#191b1a;color:#f1eee6;font-family:Manrope,system-ui,Arial,sans-serif;line-height:1.6}
main{max-width:520px}
p.tag{font:500 10px ui-monospace,monospace;letter-spacing:.12em;color:#c9b48a;margin:0}
h1{font-size:clamp(34px,6vw,54px);line-height:1;letter-spacing:-.05em;margin:18px 0 14px;font-weight:600}
p{color:#c3c2bb;font-size:15px}
.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
a{text-decoration:none;font-size:12px;font-weight:700;padding:14px 17px;display:inline-block}
.primary{background:#f1eee6;color:#191b1a}
.secondary{border:1px solid rgba(241,238,230,.3);color:#f1eee6;font-weight:400}
</style></head>
<body><main>
<p class="tag">NO LONGER AVAILABLE</p>
<h1>This piece has been retired.</h1>
<p>${title} is no longer in production. Our current range is on Etsy, and we still take on custom and volume commissions directly.</p>
<div class="actions">
<a class="primary" href="${ETSY}">Browse the shop &#8599;</a>
<a class="secondary" href="/#project">Commission something &#8594;</a>
</div>
</main></body></html>`;

/** Returns a 410 with a human-readable page. `title` names the retired piece. */
export const gone = (title: string) =>
  new Response(page(title), {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Retired for good, but keep the cache short enough that relisting one of
      // these later (see the worksheet) takes effect without a purge.
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex',
    },
  });

/** A Pages Function route that serves the 410 for every method. */
export const goneRoute = (title: string) => () => gone(title);
