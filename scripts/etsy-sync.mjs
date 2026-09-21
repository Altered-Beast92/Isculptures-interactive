// Reads the live Etsy shop and reports where content/products.ts disagrees with it.
//
// The site publishes prices in Product/AggregateOffer schema. When a listing's price
// changes on Etsy and the site is not updated, Google sees a price on the page that the
// destination contradicts, and a customer sees one figure here and another at checkout.
// This script is the check that catches that drift.
//
// Reports only; it never edits content. Run `node scripts/etsy-sync.mjs`, or
// `--json` to write the snapshot for inspection. Exits 1 when drift is found, so it
// can be wired into a build once the catalogue is stable.
import fs from 'node:fs';
import { readEnv, apiHeaders, required } from './etsy-env.mjs';

const env = readEnv();
const [shop] = required(env, 'ETSY_SHOP_ID');
if (!/^\d+$/.test(shop)) throw new Error(`ETSY_SHOP_ID must be the numeric shop id, not the shop name (got "${shop}"). Find it in the /users/me response.`);
const headers = apiHeaders(env);
const API = 'https://api.etsy.com/v3/application';

async function get(path) {
  const response = await fetch(API + path, { headers });
  const text = await response.text();
  if (response.status === 401) throw new Error('Etsy rejected the token (401). Run `npm run etsy:refresh` and try again.');
  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

/** Etsy prices are integer minor units plus a divisor, never a float. */
const money = price => price.amount / price.divisor;

/** The cheapest offering per size, which is what the site's size ladder records. A
 *  listing prices every size/colour combination separately, but colour does not change
 *  the price in this shop, so collapsing to the minimum per size is lossless here. */
function ladder(inventory) {
  const priced = inventory.products.filter(product => product.offerings[0]?.price);
  // The size property is named inconsistently across this shop's listings: "Size",
  // "Height", "Size & Boxed", "Set Size". Match on the known names rather than position.
  const sized = value => /size|height|length/i.test(value.property_name);
  const hasSize = priced.some(product => product.property_values.some(sized));
  // A listing whose only variation is colour has no ladder at all. Collapsing it to one
  // entry keeps it comparable with the single `sizes` row such a product carries on the
  // site; without this, each colour reads as a separate size and every one looks wrong.
  if (!hasSize) {
    const prices = [...new Set(priced.map(product => money(product.offerings[0].price)))];
    if (prices.length === 1) return [{ label: 'One size', price: prices[0] }];
  }
  const sizes = new Map();
  for (const product of priced) {
    const size = product.property_values.find(sized)?.values?.[0]
      ?? product.property_values.map(value => value.values[0]).join(' / ');
    const amount = money(product.offerings[0].price);
    if (!sizes.has(size) || sizes.get(size) > amount) sizes.set(size, amount);
  }
  return [...sizes.entries()].map(([label, price]) => ({ label, price }));
}

const states = ['active', 'inactive', 'draft', 'expired', 'sold_out'];
const live = new Map();
for (const state of states) {
  const page = await get(`/shops/${shop}/listings?state=${state}&limit=100`);
  for (const listing of page.results) live.set(String(listing.listing_id), { state, listing });
}
for (const [id, entry] of live) entry.ladder = ladder(await get(`/listings/${id}/inventory`));
const reviews = (await get(`/shops/${shop}/reviews?limit=100`)).results;

// Imported rather than parsed, so a malformed edit to products.ts fails loudly here.
const { products } = await import('../content/products.ts');

const problems = [];
const decode = value => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

for (const product of products) {
  const entry = live.get(product.listingId);
  if (!entry) { problems.push(`${product.slug}: listingId ${product.listingId} is not in the shop at all`); continue; }
  if (entry.state !== 'active') problems.push(`${product.slug}: listing ${product.listingId} is ${entry.state} on Etsy, but the page links to it as a live product`);
  const siteLadder = product.sizes.map(size => size.price).join('/');
  const liveLadder = entry.ladder.map(size => size.price).join('/');
  if (siteLadder !== liveLadder) {
    problems.push(`${product.slug}: price ladder differs\n      site: ${product.sizes.map(s => `${s.label}=$${s.price}`).join('  ')}\n      etsy: ${entry.ladder.map(s => `${s.label}=$${s.price}`).join('  ')}`);
  }
}

const onSite = new Set(products.map(product => product.listingId));
for (const [id, entry] of live) {
  if (entry.state === 'active' && !onSite.has(id)) problems.push(`Etsy listing ${id} is active but has no page on the site: ${decode(entry.listing.title).slice(0, 60)}`);
}

// A review names the listing it was left on. That is the only reliable join between a
// quote and a product, and it is the field testimonials.ts cannot carry on its own.
const { testimonials } = await import('../content/testimonials.ts');
const linked = new Set(products.flatMap(product => product.reviews ?? []));
const byListing = new Map();
for (const review of reviews) {
  const id = String(review.listing_id);
  byListing.set(id, (byListing.get(id) ?? 0) + 1);
}

console.log(`Shop ${shop}: ${[...live.values()].filter(entry => entry.state === 'active').length} active, ${live.size} total listings, ${reviews.length} reviews.\n`);

console.log('Reviews per listing on Etsy:');
for (const [id, count] of byListing) {
  const product = products.find(item => item.listingId === id);
  const shown = product ? (product.reviews ?? []).length : 0;
  const where = product ? product.slug : '(no page on this site)';
  const flag = product && shown < count ? '  <- site shows fewer than Etsy has' : '';
  console.log(`  ${id}  etsy=${count}  site=${shown}  ${where}${flag}`);
}

const unlinked = testimonials.filter(review => !linked.has(review.id) && review.source === 'etsy');
if (unlinked.length) {
  console.log('\nEtsy quotes in testimonials.ts not attached to any product page:');
  for (const review of unlinked) console.log(`  ${review.id}`);
}

if (process.argv.includes('--json')) {
  const snapshot = [...live.entries()].map(([id, entry]) => ({
    listingId: id, state: entry.state, title: decode(entry.listing.title),
    url: entry.listing.url, sizes: entry.ladder, views: entry.listing.views,
  }));
  fs.writeFileSync('docs/etsy-snapshot.json', JSON.stringify({ shop, fetched: new Date().toISOString().slice(0, 10), listings: snapshot, reviews: reviews.map(r => ({ listingId: String(r.listing_id), rating: r.rating, date: new Date(r.create_timestamp * 1000).toISOString().slice(0, 10) })) }, null, 2) + '\n');
  console.log('\nWrote docs/etsy-snapshot.json');
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.log('  - ' + problem);
  // exitCode rather than exit(): the latter tears down the loop while Node's TypeScript
  // stripping still holds handles open, which trips a libuv assertion on Windows.
  process.exitCode = 1;
} else console.log('\nSite and Etsy agree.');
