import type { MetadataRoute } from 'next';
import { services } from '../content/services';
import { projects } from '../content/projects';
import { guides } from '../content/guides';
import { policies } from '../content/policies';
import { SITE_URL } from '../lib/site';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...['/', '/enquiry', '/work', '/services', '/guides', ...guides.map(item => '/guides/' + item.slug), ...services.map(item => '/pages/' + item.slug), ...policies.map(item => '/policies/' + item.slug)].map(path => ({ url: SITE_URL + path })),
    ...projects.map(project => ({ url: SITE_URL + '/work/' + project.slug, images: project.images.map(image => SITE_URL + image.src) })),
  ];
}
