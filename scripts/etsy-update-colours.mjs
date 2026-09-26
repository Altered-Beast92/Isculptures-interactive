// One-off Etsy colour variation alignment. Run without --apply to inspect the plan.
// Inventory backups are written to the OS temp directory before every update.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readEnv, apiHeaders } from './etsy-env.mjs';

const CORE = [
  'White', 'Marble', 'Grey', 'Bone White/Beige', 'Silk Gold', 'Silk White',
  'Silk Bronze', 'Matte Gold', 'Pink', 'Sky Blue', 'Dark Blue', 'Black',
  'Mint Green', 'Light Green', 'Olive Green',
];
const EXCLUDE = new Set([4579360791, 4579373618, 4311901365, 4579344605]);
// Etsy rejects inventory API edits on listings with domestic/global prices.
// These five arched icons must be updated in Shop Manager instead.
const REGIONAL = new Set([1879775206, 1879773522, 1879771208, 1879769792, 1893949429]);
const NORMAL = new Map([['Gray', 'Grey'], ['Beige', 'Bone White/Beige'], ['Beige/Bone', 'Bone White/Beige']]);
const env = readEnv();
const headers = apiHeaders(env);
const api = 'https://api.etsy.com/v3/application';
const apply = process.argv.includes('--apply');
const only = process.argv.includes('--id') ? Number(process.argv[process.argv.indexOf('--id') + 1]) : null;

async function get(endpoint) {
  const response = await fetch(api + endpoint, { headers });
  if (!response.ok) throw new Error(`GET ${endpoint}: ${response.status} ${(await response.text()).slice(0, 200)}`);
  return response.json();
}
function money(price) { return price.amount / price.divisor; }
function variantKey(product) {
  return product.property_values.filter(v => v.property_id !== 200).map(v => `${v.property_id}:${v.values.join(',')}`).join('|');
}
function colour(product) { return product.property_values.find(v => v.property_id === 200)?.values[0]; }

async function update(listing) {
  const id = listing.listing_id;
  const before = await get(`/listings/${id}/inventory`);
  const first = before.products[0];
  if (!first?.property_values.some(v => v.property_id === 200)) return;
  const original = [...new Set(before.products.map(colour))];
  const extras = original.map(c => NORMAL.get(c) ?? c).filter(c => !CORE.includes(c));
  const target = [...CORE, ...new Set(extras)];
  if (target.length > 30) throw new Error(`${id}: ${target.length} colours exceeds 30`);
  const groups = new Map();
  for (const product of before.products) {
    const key = variantKey(product);
    if (!groups.has(key)) groups.set(key, new Map());
    groups.get(key).set(colour(product), product);
  }
  const updated = [];
  let groupNumber = 0;
  for (const [key, variants] of groups) {
    groupNumber += 1;
    const reference = variants.get('White') ?? variants.values().next().value;
    for (const [optionIndex, name] of target.entries()) {
      const exact = variants.get(name);
      const alias = [...variants].find(([old]) => NORMAL.get(old) === name)?.[1];
      const source = exact ?? alias ?? reference;
      const pv = source.property_values.map(v => v.property_id === 200
        ? { property_id: 200, property_name: v.property_name, scale_id: v.scale_id, value_ids: exact ? v.value_ids : [], values: [name] }
        : { property_id: v.property_id, property_name: v.property_name, scale_id: v.scale_id, value_ids: v.value_ids, values: v.values });
      const sku = exact || alias ? source.sku ?? '' : before.sku_on_property.includes(200) ? `IS-${id}-${groupNumber}-${optionIndex + 1}` : source.sku ?? '';
      updated.push({
        sku,
        property_values: pv,
        offerings: source.offerings.map(o => ({ price: money(o.price), quantity: o.quantity, is_enabled: o.is_enabled, readiness_state_id: o.readiness_state_id })),
      });
    }
  }
  const current = original.map(c => NORMAL.get(c) ?? c);
  if (current.join('\0') === target.join('\0')) { console.log(`${id}: already ordered (${target.length})`); return; }
  const beforePrices = new Map(before.products.map(p => [`${variantKey(p)}|${colour(p)}`, money(p.offerings[0].price)]));
  for (const p of updated) {
    const old = beforePrices.get(`${variantKey(p)}|${colour(p)}`);
    if (old != null && old !== p.offerings[0].price) throw new Error(`${id}: existing price would change`);
  }
  console.log(`${id}: ${original.length} -> ${target.length} colours, ${before.products.length} -> ${updated.length} products; extras: ${extras.join(', ') || 'none'}`);
  if (!apply || (only && id !== only)) return;
  const backup = path.join(os.tmpdir(), `etsy-inventory-${id}-${Date.now()}.json`);
  fs.writeFileSync(backup, JSON.stringify(before, null, 2));
  const body = {
    products: updated,
    price_on_property: before.price_on_property,
    quantity_on_property: before.quantity_on_property,
    sku_on_property: before.sku_on_property,
    readiness_state_on_property: before.readiness_state_on_property ?? [],
  };
  const response = await fetch(`${api}/listings/${id}/inventory?legacy=true&max_variations_supported=3`, {
    method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${id}: PUT ${response.status}: ${text.slice(0, 500)}; backup ${backup}`);
  const after = JSON.parse(text);
  const actual = [...new Set(after.products.map(colour))];
  if (actual.map(c => NORMAL.get(c) ?? c).join('\0') !== target.join('\0') || after.products.length !== updated.length) throw new Error(`${id}: response differs; backup ${backup}`);
  console.log(`  saved and verified; backup ${backup}`);
}

const listings = (await get(`/shops/${env.ETSY_SHOP_ID}/listings?state=active&limit=100`)).results;
for (const listing of listings) {
  if (EXCLUDE.has(listing.listing_id) || REGIONAL.has(listing.listing_id)) continue;
  if (only && listing.listing_id !== only) continue;
  await update(listing);
}
