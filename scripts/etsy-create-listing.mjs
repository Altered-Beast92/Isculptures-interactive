// Creates an Etsy listing from a JSON spec, uploads its photographs and sets its
// size/colour matrix. Creates a draft by default; `--activate` publishes it, which is
// when Etsy charges the listing fee, so that flag is always deliberate.
//
//   node --experimental-strip-types scripts/etsy-create-listing.mjs spec.json
//   node --experimental-strip-types scripts/etsy-create-listing.mjs spec.json --activate
//
// Three Etsy behaviours are handled here because each one fails quietly or obscurely:
//   1. `readiness_state_id` is mandatory for physical listings, and the error naming it
//      only appears once every other required field is already valid.
//   2. Tags must be ONE comma-separated field. Repeating the key saves a single tag and
//      returns 201, so a listing looks created but ships with 1 tag instead of 13.
//   3. Inventory property values need `property_name` as well as `property_id`, even
//      though the id alone identifies the property.
import fs from 'node:fs';
import { readEnv, apiHeaders, required } from './etsy-env.mjs';

const specPath = process.argv[2];
if (!specPath) throw new Error('Usage: etsy-create-listing.mjs <spec.json> [--activate]');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const activate = process.argv.includes('--activate');

const env = readEnv();
const [shop] = required(env, 'ETSY_SHOP_ID');
const headers = apiHeaders(env);
const API = 'https://api.etsy.com/v3/application';
// Shop-wide settings. Read once from any existing listing rather than hard-coded here:
// they differ per shop, and a wrong id is rejected with a message that does not say which.
const DEFAULTS = { taxonomy_id: 1163, shipping_profile_id: 265965856876, return_policy_id: 1279203142104, readiness_state_id: 1405110082367 };

async function call(path, { method = 'GET', body, json, form } = {}) {
  const options = { method, headers: { ...headers } };
  if (form) options.body = form;
  else if (json) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(json); }
  else if (body) { options.headers['Content-Type'] = 'application/x-www-form-urlencoded'; options.body = body; }
  const response = await fetch(API + path, options);
  const text = await response.text();
  if (response.status === 401) throw new Error('Etsy rejected the token (401). Run `npm run etsy:refresh`.');
  if (!response.ok) throw new Error(`${method} ${path} -> ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const settings = { ...DEFAULTS, ...(spec.settings ?? {}) };
const basePrice = spec.ladder ? Math.min(...Object.values(spec.ladder)) : spec.price;
if (!basePrice) throw new Error('Spec needs either `price` or `ladder`.');

const body = new URLSearchParams({
  quantity: String(spec.quantity ?? 50),
  title: spec.title,
  description: spec.description,
  price: basePrice.toFixed(2),
  who_made: spec.who_made ?? 'i_did',
  when_made: spec.when_made ?? 'made_to_order',
  type: 'physical',
  taxonomy_id: String(settings.taxonomy_id),
  shipping_profile_id: String(settings.shipping_profile_id),
  return_policy_id: String(settings.return_policy_id),
  readiness_state_id: String(settings.readiness_state_id),
  is_personalizable: String(spec.personalizable ?? true),
});
const listing = await call(`/shops/${shop}/listings`, { method: 'POST', body });
console.log(`created draft ${listing.listing_id}`);

// Tags and materials go in a follow-up PATCH: sent on the create call they are accepted
// but only partially applied (see note 2 above).
if (spec.tags?.length || spec.materials?.length) {
  const patch = new URLSearchParams();
  if (spec.tags?.length) patch.set('tags', spec.tags.join(','));
  if (spec.materials?.length) patch.set('materials', spec.materials.join(','));
  const updated = await call(`/shops/${shop}/listings/${listing.listing_id}`, { method: 'PATCH', body: patch });
  console.log(`  tags ${updated.tags.length}/13, materials ${JSON.stringify(updated.materials)}`);
  if (spec.tags && updated.tags.length !== spec.tags.length) throw new Error(`Only ${updated.tags.length} of ${spec.tags.length} tags saved.`);
}

for (const [index, file] of (spec.images ?? []).entries()) {
  const form = new FormData();
  form.set('image', new Blob([fs.readFileSync(file)]), file.split(/[\\/]/).pop());
  form.set('rank', String(index + 1));
  const image = await call(`/shops/${shop}/listings/${listing.listing_id}/images`, { method: 'POST', form });
  console.log(`  image ${index + 1}: ${image.listing_image_id} (${image.full_width}x${image.full_height})`);
}

// A size/colour matrix is copied from an existing listing rather than rebuilt, because
// Etsy's value_ids are per-shop and cannot be guessed from the labels alone.
if (spec.ladder && spec.variantsFrom) {
  const source = await call(`/listings/${spec.variantsFrom}/inventory`);
  const sizeProperty = spec.sizeProperty ?? 513;
  const products = source.products.map(product => {
    const size = product.property_values.find(value => value.property_id === sizeProperty).values[0];
    const price = spec.ladder[size];
    if (price === undefined) throw new Error(`Spec ladder has no price for size "${size}".`);
    return {
      sku: '',
      property_values: product.property_values.map(value => ({
        property_id: value.property_id, property_name: value.property_name,
        value_ids: value.value_ids, values: value.values,
      })),
      offerings: [{ price, quantity: spec.quantity ?? 50, is_enabled: true, readiness_state_id: settings.readiness_state_id }],
    };
  });
  const saved = await call(`/listings/${listing.listing_id}/inventory`, {
    method: 'PUT',
    json: { products, price_on_property: [sizeProperty], quantity_on_property: [], sku_on_property: [] },
  });
  console.log(`  ${saved.products.length} variants priced on property ${sizeProperty}`);
}

if (activate) {
  const live = await call(`/shops/${shop}/listings/${listing.listing_id}`, { method: 'PATCH', body: new URLSearchParams({ state: 'active' }) });
  console.log(`  activated -> ${live.state}`);
} else {
  console.log('  left as a draft. Re-run with --activate to publish (Etsy charges the listing fee then).');
}
console.log(`\nhttps://www.etsy.com/au/listing/${listing.listing_id}/`);
