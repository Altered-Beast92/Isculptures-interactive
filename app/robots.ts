import type { MetadataRoute } from 'next';
import { INDEXABLE, SITE_URL } from '../lib/site';
export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  return INDEXABLE ? { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: SITE_URL + '/sitemap.xml' } : { rules: { userAgent: '*', disallow: '/' } };
}
