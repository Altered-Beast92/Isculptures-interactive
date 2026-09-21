import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Inspect the exported HTML, not just the source metadata objects. This catches
// Next.js metadata inheritance, broken static links and missing export assets.
const root = path.resolve('out');
const origin = 'https://isculptures.com.au';
const read = file => fs.readFileSync(file, 'utf8');
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'");
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
const htmlPath = pathname => path.join(root, pathname === '/' ? 'index.html' : pathname.replace(/^\//, '') + '.html');
const sitemap = read(path.join(root, 'sitemap.xml'));
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => decode(url));
assert.ok(urls.length > 0, 'Sitemap must contain pages');
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => block);
assert.equal(entries.length, urls.length, 'Sitemap entry count mismatch');
for (const entry of entries) assert.match(entry, /<lastmod>\d{4}-\d{2}-\d{2}/, `Sitemap entry has no lastmod: ${entry.match(/<loc>(.*?)<\/loc>/)?.[1]}`);
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URL');
for (const file of fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html'))) {
  const relative = file.replaceAll('\\', '/');
  if (['404.html', '_not-found.html'].includes(relative)) continue;
  const pathname = relative === 'index.html' ? '/' : '/' + relative.slice(0, -5);
  assert.ok(urls.includes(origin + pathname), `Exported page missing from sitemap: ${pathname}`);
}
const pages = new Map();
const titles = new Set();
const descriptions = new Set();
let indexable;
let breadcrumbCount = 0;
let serviceCount = 0;
let productCount = 0;
for (const url of urls) {
  const location = new URL(url);
  assert.equal(location.origin, origin, `Wrong sitemap origin: ${url}`);
  assert.equal(location.search + location.hash, '', `Non-canonical sitemap URL: ${url}`);
  const html = read(htmlPath(location.pathname));
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attrs(tag));
  const field = key => meta.find(item => item.name === key || item.property === key)?.content;
  const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || '');
  const description = field('description');
  assert.ok(title && title.includes('Impeccable Sculptures'), `Missing branded title: ${url}`);
  assert.ok(description, `Missing description: ${url}`);
  assert.ok(!titles.has(title), `Duplicate title: ${url}`);
  assert.ok(!descriptions.has(description), `Duplicate description: ${url}`);
  titles.add(title); descriptions.add(description);
  const canonicals = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => attrs(tag)).filter(item => item.rel === 'canonical');
  assert.equal(canonicals.length, 1, `Expected one canonical: ${url}`);
  assert.equal(new URL(canonicals[0].href).href, url, `Canonical mismatch: ${url}`);
  assert.equal(new URL(field('og:url')).href, url, `Open Graph URL mismatch: ${url}`);
  assert.equal(field('og:title'), title, `Open Graph title mismatch: ${url}`);
  assert.equal(field('twitter:title'), title, `X title mismatch: ${url}`);
  assert.equal(field('og:description'), description, `Open Graph description mismatch: ${url}`);
  assert.equal(field('twitter:description'), description, `X description mismatch: ${url}`);
  assert.equal([...visible.matchAll(/<h1\b/g)].length, 1, `Expected one H1: ${url}`);
  assert.ok(field('robots'), `Missing indexing policy: ${url}`);
  const pageIndexable = !field('robots').includes('noindex');
  indexable ??= pageIndexable;
  assert.equal(pageIndexable, indexable, `Inconsistent indexing policy: ${url}`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, json]) => [JSON.parse(json)].flat());
  const business = schemas.find(schema => schema['@type'] === 'LocalBusiness' && schema.address);
  assert.ok(business, `Missing business: ${url}`);
  assert.equal(business['@id'], origin + '/#organisation', `Business identity must be stable: ${url}`);
  assert.ok(business.address.addressLocality && business.address.addressRegion, `Business needs a locality: ${url}`);
  assert.ok(!business.address.streetAddress, `Service-area listing must not publish a street address: ${url}`);
  assert.ok(business.areaServed?.length, `Business needs a service area: ${url}`);
  // Reviews are only ever marked up where a visitor can read them on the same page.
  for (const node of schemas.filter(schema => schema.review || schema.aggregateRating)) {
    // A rating belongs either to the business as a whole or to one product, never floating free.
    assert.ok(node['@id'] === origin + '/#organisation' || node['@type'] === 'Product', `Ratings must attach to the business or a product: ${url}`);
    for (const review of node.review || []) {
      assert.ok(visible.includes(review.reviewBody.slice(0, 40).replace(/&/g, '&amp;')), `Marked-up review is not visible: ${url}`);
      assert.ok(review.author?.name && review.publisher?.name, `Review needs an author and a source: ${url}`);
    }
    if (node.aggregateRating) assert.ok(node.aggregateRating.reviewCount > 0 && node.aggregateRating.ratingValue <= 5, `Bad rating: ${url}`);
  }
  const crumbs = schemas.find(schema => schema['@type'] === 'BreadcrumbList');
  if (/^\/(work|guides)\//.test(location.pathname) || location.pathname.startsWith('/pages/')) {
    assert.ok(crumbs, `Missing breadcrumbs: ${url}`);
    assert.equal(crumbs.itemListElement.at(-1).item, url);
    crumbs.itemListElement.forEach((item, i) => {
      assert.equal(item.position, i + 1);
      assert.ok(urls.includes(item.item), `Broken breadcrumb: ${item.item}`);
    });
    breadcrumbCount++;
  }
  if (location.pathname.startsWith('/pages/') && location.pathname !== '/pages/about') {
    assert.ok(schemas.some(schema => schema['@type'] === 'Service' && schema.url === url), `Missing service schema: ${url}`);
    serviceCount++;
  }
  if (location.pathname === '/') {
    assert.ok(schemas.some(schema => schema['@type'] === 'WebSite'), 'Missing website name schema');
    const faq = schemas.find(schema => schema['@type'] === 'FAQPage');
    assert.ok(faq?.mainEntity.length, 'Missing FAQ schema');
    for (const question of faq.mainEntity) {
      assert.ok(visible.includes(question.name.replace(/&/g, '&amp;')), `FAQ question not visible: ${question.name}`);
      assert.ok(visible.includes(question.acceptedAnswer.text.slice(0, 40).replace(/&/g, '&amp;')), `FAQ answer not visible: ${question.name}`);
    }
  }
  if (/^\/products\/.+/.test(location.pathname)) {
    const item = schemas.find(schema => schema['@type'] === 'Product');
    assert.ok(item, `Missing product schema: ${url}`);
    assert.ok(item.image?.length, `Product needs a photograph: ${url}`);
    const offers = item.offers;
    // A piece sold across a size range carries an AggregateOffer; one sold at a single
    // price carries a plain Offer, because an aggregate whose bounds are equal is a
    // weaker signal than a real price. Both shapes are checked, neither is optional.
    assert.ok(['AggregateOffer', 'Offer'].includes(offers?.['@type']), `Product needs an offer: ${url}`);
    assert.equal(offers.priceCurrency, 'AUD', `Product prices must be in AUD: ${url}`);
    const shown = offers['@type'] === 'Offer' ? [offers.price] : [offers.lowPrice, offers.highPrice];
    assert.ok(shown.every(price => price > 0), `Bad price: ${url}`);
    if (offers['@type'] === 'AggregateOffer') assert.ok(offers.highPrice >= offers.lowPrice, `Bad price range: ${url}`);
    // A price is a promise to a buyer, so it has to appear on the page, not only in markup.
    for (const price of shown) assert.ok(visible.includes(`AU$${price}`), `Price not shown to visitors: AU$${price} on ${url}`);
    assert.ok(/etsy\.com\/au\/listing\/\d+/.test(offers.url), `Product must link to its listing: ${url}`);
    productCount++;
  }
  if (location.pathname.startsWith('/guides/')) {
    const article = schemas.find(schema => schema['@type'] === 'Article');
    assert.ok(article, `Missing article: ${url}`);
    assert.match(article.datePublished || '', /^\d{4}-\d{2}-\d{2}$/, `Article needs a publish date: ${url}`);
    assert.match(article.dateModified || '', /^\d{4}-\d{2}-\d{2}$/, `Article needs a modified date: ${url}`);
    assert.ok(article.dateModified >= article.datePublished, `Article modified before published: ${url}`);
  }
  for (const [tag] of visible.matchAll(/<img\b[^>]*>/g)) {
    const image = attrs(tag);
    assert.ok('alt' in image, `Missing image alt: ${url}`);
    assert.ok(Number(image.width) > 0 && Number(image.height) > 0, `Missing image dimensions: ${url}`);
    if (image.src?.startsWith('/')) assert.ok(fs.existsSync(path.join(root, image.src)), `Missing image: ${image.src}`);
    for (const candidate of (image.srcSet || image.srcset || '').split(',').filter(Boolean)) {
      const source = candidate.trim().split(/\s+/)[0];
      if (source.startsWith('/')) assert.ok(fs.existsSync(path.join(root, source)), `Missing responsive image: ${source}`);
    }
  }
  pages.set(location.pathname, { visible, url });
}
let links = 0;
for (const { visible, url } of pages.values()) {
  for (const [tag] of visible.matchAll(/<a\b[^>]*>/g)) {
    const href = attrs(tag).href;
    if (!href || /^(mailto:|tel:)/.test(href)) continue;
    const target = new URL(href, url);
    if (target.origin !== origin) continue;
    const page = pages.get(target.pathname);
    assert.ok(page || fs.existsSync(path.join(root, target.pathname)), `Broken link from ${url}: ${href}`);
    if (page && target.hash) assert.ok(page.visible.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `Missing anchor from ${url}: ${href}`);
    links++;
  }
}
for (const [, image] of sitemap.matchAll(/<image:loc>(.*?)<\/image:loc>/g)) {
  const location = new URL(decode(image));
  assert.equal(location.origin, origin);
  assert.ok(fs.existsSync(path.join(root, location.pathname)), `Missing sitemap image: ${image}`);
}
const robots = read(path.join(root, 'robots.txt'));
if (indexable) {
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(!/^Disallow: \/\s*$/m.test(robots), 'Indexable site blocks crawlers');
} else {
  assert.match(robots, /^Disallow: \/\s*$/m);
}
if (process.argv.includes('--expect-indexable')) assert.ok(indexable, 'Launch build is still noindex');
if (process.argv.includes('--expect-noindex')) assert.ok(!indexable, 'Draft build is indexable');
assert.match(read(path.join(root, '404.html')), /name="robots" content="[^"]*noindex/, '404 must not be indexed');
const redirects = JSON.parse(read('vercel.json')).redirects;
const blogInventory = JSON.parse(read('docs/shopify-blog-inventory.json'));
for (const entry of blogInventory) {
  const source = new URL(entry.url).pathname;
  const matches = redirects.filter(rule => rule.source === source);
  assert.equal(matches.length, 1, `Expected one legacy blog redirect: ${source}`);
  assert.equal(matches[0].destination, entry.destination, `Blog migration map drift: ${source}`);
  assert.equal(matches[0].statusCode, entry.statusCode, `Blog migration status drift: ${source}`);
  assert.equal(entry.statusCode, 301, `Blog consolidation must be permanent: ${source}`);
}
for (const rule of redirects) {
  assert.ok(!/etsy\.com/.test(rule.destination), `Redirect still leaves the site for Etsy: ${rule.source}`);
  assert.ok(!pages.has(rule.source), `Redirect hides a real page: ${rule.source}`);
  if (rule.destination.startsWith('/')) {
    const target = new URL(rule.destination, origin);
    assert.ok(pages.has(target.pathname), `Missing redirect destination: ${rule.destination}`);
    if (target.hash) assert.ok(pages.get(target.pathname).visible.includes(`id="${target.hash.slice(1)}"`));
  }
}
execFileSync(process.execPath, ['scripts/sync-redirects.mjs', '--check'], { stdio: 'inherit' });
console.log(`SEO checks passed: ${pages.size} pages, ${links} internal links, ${breadcrumbCount} breadcrumb trails, ${serviceCount} services, ${productCount} products, ${entries.length} dated sitemap entries; ${indexable ? 'indexable' : 'noindex draft'}.`);
