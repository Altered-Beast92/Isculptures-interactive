import GuideGrid from '../components/guide-grid';
import Breadcrumbs from '../components/breadcrumbs';
import { guidesByUpdated, guidePublished, guideUpdated } from '../../lib/guides';
import { CONTACT, SITE_URL, pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Guides to ordering bulk 3D printing', 'How to plan a bulk 3D printing order: what to include in a quote, what affects cost, and ordering favours for weddings, christenings and baby showers.', '/guides');
// The menu calls this section the Blog. The URL stays /guides because the old Shopify
// blog URLs already redirect here, and /blog redirects here too.
export default function GuidesPage() {
  const posts = guidesByUpdated();
  const schema = { '@context': 'https://schema.org', '@type': 'Blog', '@id': SITE_URL + '/guides#blog', url: SITE_URL + '/guides', name: CONTACT.name + ' blog', publisher: { '@id': SITE_URL + '/#organisation' }, blogPost: posts.map(post => ({ '@type': 'BlogPosting', headline: post.title, url: SITE_URL + '/guides/' + post.slug, datePublished: guidePublished(post), dateModified: guideUpdated(post) })) };
  return <main id="main-content" className="document-page guides-index"><Breadcrumbs items={[{ name: 'Blog', path: '/guides' }]}/><header className="page-intro"><p className="section-tag">BLOG</p><h1>Guides to planning <br/><i>your order.</i></h1><p className="document-lede">Help with quotes, pricing, event favours and repeat orders, written by our studio.</p></header><h2 className="visually-hidden">All posts</h2><GuideGrid items={posts} photos/><div className="guide-enquiry"><h2>Ready to get a quote?</h2><p>Send us your idea, how many you need and when. We’ll take it from there.</p><a href="/enquiry" className="primary">Get a quote ↗</a></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/></main>;
}
