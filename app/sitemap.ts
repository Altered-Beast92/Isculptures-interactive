import type { MetadataRoute } from 'next';
import { services } from '../content/services';
import { projects } from '../content/projects';
import { SITE_URL } from '../lib/site';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/enquiry', '/work', ...services.map(item => '/pages/' + item.slug), ...projects.map(item => '/work/' + item.slug)].map(path => ({ url: SITE_URL + path }));
}
