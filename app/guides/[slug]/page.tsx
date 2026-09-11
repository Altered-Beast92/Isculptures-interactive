import { notFound } from 'next/navigation';
import { guides, getGuide } from '../../../content/guides';
import media from '../../../content/work-media.json';
import GuideGrid from '../../components/guide-grid';
import Breadcrumbs from '../../components/breadcrumbs';
import { CONTACT, SITE_URL, pageMetadata } from '../../../lib/site';
export const dynamicParams = false;
export const generateStaticParams = () => guides.map(({ slug }) => ({ slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const guide = getGuide(slug);
  if (!guide) return {};
  const metadata = pageMetadata(guide.title, guide.summary, '/guides/' + slug);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: 'article' as const } };
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const guide = getGuide(slug); if (!guide) notFound();
  const photo = media[guide.image as keyof typeof media];
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: guide.title, description: guide.summary, mainEntityOfPage: SITE_URL + '/guides/' + slug, image: SITE_URL + photo.src, author: { '@type': 'Organization', '@id': SITE_URL + '/#organisation', name: CONTACT.name }, publisher: { '@id': SITE_URL + '/#organisation' } };
  return <main id="main-content" className="document-page guide-page"><article>
    <Breadcrumbs items={[{ name: 'Guides', path: '/guides' }, { name: guide.title, path: '/guides/' + slug }]}/><p className="section-tag">{guide.category}</p><h1>{guide.title}</h1><p className="document-lede">{guide.summary}</p><p className="guide-byline">Written by Impeccable Sculptures</p>
    <nav className="guide-contents" aria-label="In this guide"><b>In this guide</b><ol>{guide.sections.map(section => <li key={section.id}><a href={'#' + section.id}>{section.title}</a></li>)}</ol></nav>
    <div className="guide-body">{guide.sections.map(section => <section key={section.id} id={section.id}><h2>{section.title}</h2>{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}{section.points && <ul>{section.points.map(point => <li key={point}>{point}</li>)}</ul>}</section>)}</div>
    <figure className="guide-example"><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy"/><figcaption>An example of our work. <a href={'/work/' + guide.project}>See more photos →</a></figcaption></figure>
    <section className="guide-enquiry"><h2>Ready to get a quote?</h2><p>Send us what you know so far. We’ll get back to you with options, pricing and timing.</p><div className="portfolio-actions"><a className="primary" href={'/enquiry' + (guide.enquiryRoute ? '?route=' + guide.enquiryRoute : '')}>Get a quote ↗</a><a href={'/pages/' + guide.service}>{guide.serviceLabel} →</a></div></section>
    <section className="guide-related"><h2>More guides</h2><GuideGrid items={guides.filter(item => item.slug !== slug).slice(0, 2)}/></section>
  </article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/></main>;
}

