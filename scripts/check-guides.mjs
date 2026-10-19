// Guide integrity check. Runs inside build:web before `next build`, so a broken link, a missing
// body or an unknown photo fails the build instead of shipping.
//
// Errors (exit 1):
//   - a registered TSX body without metadata, or metadata with neither sections nor a body
//   - an internal link in a TSX body to a route that doesn't exist
//   - a TSX guide with no link to another guide, or none to a /pages/ service page
//   - an etsy.com link in a TSX body (link the product page instead)
//   - an unknown product slug or photo reference
//   - a description (the summary) over 155 characters
//   - duplicate slugs, or near-duplicate titles (word overlap of 0.6 or more after stop words)
// Warnings (printed only), for TSX guides:
//   - fewer than 2 product links, takeaways not 3 to 4, a body under 900 words, no readMinutes
// Warning for every guide: a title over 60 characters.
//
// Node cannot import .ts files directly, so content/guides.ts and content/products.ts (which have
// no imports) are loaded through stripTypeScriptTypes, and the other sources are read as text.
//
// Run on its own with: npm run check:guides

import fs from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const load = async file => import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(read(file))).toString('base64'));
const slugsIn = file => [...read(file).matchAll(/^\s*\{\s*slug:\s*'([^']+)'/gm)].map(match => match[1]);

const { guides } = await load('content/guides.ts');
const { products } = await load('content/products.ts');
const workMedia = JSON.parse(read('content/work-media.json'));
const productMedia = JSON.parse(read('content/product-media.json'));
const enquiryRoutes = [...(read('lib/enquiry.ts').match(/export const ROUTES = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([a-z]+)'/g)].map(match => match[1]);

const productSlugs = new Set(products.map(product => product.slug));
const guideSlugs = guides.map(guide => guide.slug);
const routes = new Set([
  '/', '/guides', '/products', '/work', '/enquiry', '/services',
  ...guideSlugs.map(slug => '/guides/' + slug),
  ...slugsIn('content/services.ts').map(slug => '/pages/' + slug),
  ...[...productSlugs].map(slug => '/products/' + slug),
  ...slugsIn('content/projects.ts').map(slug => '/work/' + slug),
  ...slugsIn('content/policies.ts').map(slug => '/policies/' + slug),
]);
const serviceRoutes = new Set(slugsIn('content/services.ts').map(slug => '/pages/' + slug));

const errors = [];
const warnings = [];

// Registered bodies: keys of the map in app/guides/posts/index.ts, and the files beside it.
const postsDir = path.join(root, 'app/guides/posts');
const registry = read('app/guides/posts/index.ts');
const registered = [...registry.matchAll(/^\s*'([a-z0-9-]+)'\s*:/gm)].map(match => match[1]);
const bodyFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.tsx')).map(file => file.replace(/\.tsx$/, ''));
for (const slug of registered) {
  if (!guideSlugs.includes(slug)) errors.push(`${slug}: registered in app/guides/posts/index.ts but has no entry in content/guides.ts`);
  if (!bodyFiles.includes(slug)) errors.push(`${slug}: registered but app/guides/posts/${slug}.tsx does not exist`);
}
for (const file of bodyFiles) if (!registered.includes(file)) errors.push(`app/guides/posts/${file}.tsx: not registered in app/guides/posts/index.ts`);

const dupes = guideSlugs.filter((slug, i) => guideSlugs.indexOf(slug) !== i);
for (const slug of new Set(dupes)) errors.push(`${slug}: duplicate slug`);

const STOP = new Set('a an and are as at be by for from how in is it of on or the to what when which with your you our do does can should vs not'.split(' '));
const words = title => new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(word => word && !STOP.has(word)));
for (let i = 0; i < guides.length; i++) for (let j = i + 1; j < guides.length; j++) {
  const a = words(guides[i].title), b = words(guides[j].title);
  const shared = [...a].filter(word => b.has(word)).length;
  const overlap = shared / Math.max(1, a.size + b.size - shared); // shared words over all distinct words
  if (overlap >= 0.6) errors.push(`${guides[i].slug} and ${guides[j].slug}: titles are near-duplicates (word overlap ${overlap.toFixed(2)})`);
}

const wordCount = source => source
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/^\s*(import|export)\b.*$/gm, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/[{}]/g, ' ').split(/\s+/).filter(word => /[A-Za-z0-9]/.test(word)).length;

for (const guide of guides) {
  const tag = guide.slug;
  const tsx = registered.includes(guide.slug) && bodyFiles.includes(guide.slug);
  if (!tsx && !guide.sections?.length) errors.push(`${tag}: no sections and no registered TSX body`);
  if (tsx && guide.sections) errors.push(`${tag}: has both sections and a TSX body; remove one`);

  if (guide.summary.length > 155) errors.push(`${tag}: description is ${guide.summary.length} characters (max 155)`);
  if (guide.title.length > 60) warnings.push(`${tag}: title is ${guide.title.length} characters (aim for 60 or fewer)`);
  if (!guide.title.includes('Impeccable Sculptures') && guide.title.length + ' | Impeccable Sculptures'.length > 90) warnings.push(`${tag}: branded title would be very long`);

  for (const slug of guide.products ?? []) if (!productSlugs.has(slug)) errors.push(`${tag}: unknown product "${slug}"`);
  if (!workMedia[guide.image]) errors.push(`${tag}: image "${guide.image}" is not in content/work-media.json`);
  if (guide.hero) {
    const { source, key, index = 0 } = guide.hero;
    const photo = source === 'work' ? workMedia[key] : source === 'product' ? productMedia[key]?.[index] : null;
    if (!photo) errors.push(`${tag}: hero photo ${source}:${key}${source === 'product' ? '#' + index : ''} does not exist`);
    else for (const file of [photo.src, photo.src.replace('.webp', '-small.webp')]) if (!fs.existsSync(path.join(root, 'public', file))) errors.push(`${tag}: hero file public${file} is missing`);
  }

  if (!tsx) continue;
  const source = read(`app/guides/posts/${guide.slug}.tsx`);
  const hrefs = [...source.matchAll(/href=(?:"([^"]*)"|'([^']*)'|\{\s*['"`]([^'"`]*)['"`]\s*\})/g)].map(match => match[1] ?? match[2] ?? match[3]);
  const internal = [];
  for (const href of hrefs) {
    if (/etsy\.com/i.test(href)) { errors.push(`${tag}: links to Etsy (${href}); link the product page instead`); continue; }
    if (!href.startsWith('/')) continue;
    const [beforeHash] = href.split('#');
    const [route, query] = beforeHash.split('?');
    const clean = route.replace(/\/$/, '') || '/';
    internal.push(clean);
    if (!routes.has(clean)) errors.push(`${tag}: links to ${href}, which doesn't exist`);
    if (query !== undefined && clean !== '/enquiry') errors.push(`${tag}: ${href} has a query string; only /enquiry takes one`);
    if (clean === '/enquiry' && query !== undefined) {
      const route = new URLSearchParams(query).get('route');
      if (!route || !enquiryRoutes.includes(route)) errors.push(`${tag}: ${href} has an unknown enquiry route (use ${enquiryRoutes.join(', ')})`);
    }
  }
  if (/etsy\.com/i.test(source.replace(/\{\/\*[\s\S]*?\*\/\}/g, ''))) {
    if (!hrefs.some(href => /etsy\.com/i.test(href))) errors.push(`${tag}: mentions an etsy.com address in the body; link the product page instead`);
  }
  if (!internal.some(href => href.startsWith('/guides/') && href !== '/guides/' + guide.slug)) errors.push(`${tag}: no link to another guide`);
  if (!internal.some(href => serviceRoutes.has(href))) errors.push(`${tag}: no link to a /pages/ service page`);

  const linked = new Set([...(guide.products ?? []), ...internal.filter(href => href.startsWith('/products/')).map(href => href.slice('/products/'.length))]);
  if (linked.size < 2) warnings.push(`${tag}: only ${linked.size} product link(s); aim for at least 2`);
  const takeaways = guide.takeaways?.length ?? 0;
  if (takeaways < 3 || takeaways > 4) warnings.push(`${tag}: has ${takeaways} takeaways (aim for 3 to 4)`);
  const count = wordCount(source);
  if (count < 900) warnings.push(`${tag}: body is about ${count} words (aim for 1,000 to 1,500)`);
  if (!guide.readMinutes) warnings.push(`${tag}: no readMinutes set`);
}

for (const warning of warnings) console.warn(`  warning  ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`  error    ${error}`);
  console.error(`\nGuide check failed: ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`Guide check passed: ${guides.length} guides (${registered.length} with TSX bodies), ${routes.size} known routes, ${warnings.length} warning(s).`);
