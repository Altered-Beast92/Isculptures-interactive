import type { MetadataRoute } from 'next';
import { services } from '../content/services';
import { projects } from '../content/projects';
import { guides } from '../content/guides';
import { policies } from '../content/policies';
import { products } from '../content/products';
import { SITE_URL, CONTENT_DATES } from '../lib/site';
export const dynamic = 'force-static';
// Every URL carries a lastmod. Crawlers use it to decide what to re-fetch, and a sitemap
// that reports nothing gives them no reason to come back after content changes.
const stamp = (url: string, updated: string) => ({ url: SITE_URL + url, lastModified: new Date(updated + 'T00:00:00Z') });
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    stamp('/', CONTENT_DATES.site.updated),
    stamp('/enquiry', CONTENT_DATES.site.updated),
    stamp('/work', CONTENT_DATES.projects.updated),
    stamp('/services', CONTENT_DATES.services.updated),
    stamp('/guides', CONTENT_DATES.guides.updated),
    stamp('/products', CONTENT_DATES.site.updated),
    ...guides.map(item => stamp('/guides/' + item.slug, item.updated ?? CONTENT_DATES.guides.updated)),
    ...services.map(item => stamp('/pages/' + item.slug, item.updated ?? CONTENT_DATES.services.updated)),
    ...policies.map(item => stamp('/policies/' + item.slug, CONTENT_DATES.site.updated)),
    ...products.map(item => stamp('/products/' + item.slug, item.updated ?? CONTENT_DATES.site.updated)),
    ...projects.map(project => ({
      ...stamp('/work/' + project.slug, project.updated ?? CONTENT_DATES.projects.updated),
      images: project.images.map(image => SITE_URL + image.src),
    })),
  ];
}
