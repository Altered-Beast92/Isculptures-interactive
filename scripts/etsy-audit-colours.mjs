import { readEnv, apiHeaders } from './etsy-env.mjs';

const env = readEnv();
const headers = apiHeaders(env);
const base = 'https://api.etsy.com/v3/application';
const core = [
  'White', 'Marble', 'Grey', 'Bone White/Beige', 'Silk Gold', 'Silk White',
  'Silk Bronze', 'Matte Gold', 'Pink', 'Sky Blue', 'Dark Blue', 'Black',
  'Mint Green', 'Light Green', 'Olive Green',
];
const special = new Set([4579360791, 4579373618, 4311901365, 4579344605]);
async function get(route) {
  const response = await fetch(base + route, { headers });
  if (!response.ok) throw new Error(`${route}: ${response.status} ${(await response.text()).slice(0, 250)}`);
  return response.json();
}
const listings = (await get(`/shops/${env.ETSY_SHOP_ID}/listings?state=active&limit=100`)).results;
let failures = 0;
for (const listing of listings) {
  const id = listing.listing_id;
  const inventory = await get(`/listings/${id}/inventory`);
  const colours = [...new Set(inventory.products.map(product => product.property_values.find(v => v.property_id === 200)?.values[0]).filter(Boolean))];
  const normalized = colours.map(c => c === 'Gray' ? 'Grey' : c);
  const applicable = colours.length > 0 && !special.has(id);
  const ordered = !applicable || core.every((colour, index) => normalized[index] === colour);
  if (!ordered) failures++;
  const description = listing.description ?? '';
  console.log(JSON.stringify({ id, title: listing.title, colours, ordered, staleCopy: /one of (?:twelve|fourteen|ten) finishes|Choose Silk White, Mint Green or Silk Gold/i.test(description), description }));
}
if (failures) process.exitCode = 1;
