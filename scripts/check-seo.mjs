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
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([, json]) => JSON.parse(json));
  assert.ok(schemas.some(schema => schema['@type'] === 'Organization'), `Missing organisation: ${url}`);
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
  if (location.pathname === '/') assert.ok(schemas.some(schema => schema['@type'] === 'WebSite'), 'Missing website name schema');
  if (location.pathname.startsWith('/guides/')) assert.ok(schemas.some(schema => schema['@type'] === 'Article'), `Missing article: ${url}`);
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
for (const rule of redirects) {
  assert.ok(!pages.has(rule.source), `Redirect hides a real page: ${rule.source}`);
  if (rule.destination.startsWith('/')) {
    const target = new URL(rule.destination, origin);
    assert.ok(pages.has(target.pathname), `Missing redirect destination: ${rule.destination}`);
    if (target.hash) assert.ok(pages.get(target.pathname).visible.includes(`id="${target.hash.slice(1)}"`));
  }
}
execFileSync(process.execPath, ['scripts/sync-redirects.mjs', '--check'], { stdio: 'inherit' });
console.log(`SEO checks passed: ${pages.size} pages, ${links} internal links, ${breadcrumbCount} breadcrumb trails, ${serviceCount} services; ${indexable ? 'indexable' : 'noindex draft'}.`);
