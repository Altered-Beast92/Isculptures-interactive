import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';
import { guides, getGuide } from '../../../content/guides';
import media from '../../../content/work-media.json';
import { guideBodies } from '../posts';
import GuideGrid from '../../components/guide-grid';
import Breadcrumbs from '../../components/breadcrumbs';
import { withHeadingIds } from '../../../lib/article-headings';
import { guideHero, guidePublished, guideUpdated, guideReadMinutes, guideProducts, setLabel, priceLabel, productPhoto } from '../../../lib/guides';
import { GUIDE_AUTHOR, SITE_URL, pageMetadata, displayDate } from '../../../lib/site';
export const dynamicParams = false;
export const generateStaticParams = () => guides.map(({ slug }) => ({ slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const guide = getGuide(slug);
  if (!guide) return {};
  const metadata = pageMetadata(guide.title, guide.summary, '/guides/' + slug);
  const hero = guideHero(guide);
  const image = { url: SITE_URL + hero.src, width: hero.width, height: hero.height, alt: hero.alt };
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, type: 'article' as const, images: [image], publishedTime: guidePublished(guide), modifiedTime: guideUpdated(guide), authors: [GUIDE_AUTHOR.name] },
    twitter: { ...metadata.twitter, images: [image] },
  };
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const guide = getGuide(slug); if (!guide) notFound();
  const Body = guideBodies[slug];
  if (!Body && !guide.sections) throw new Error(`Guide ${slug} has neither sections nor a body in app/guides/posts`);
  const body = Body ? withHeadingIds(Body as () => ReactElement) : null;
  const contents = body ? body.toc.map(({ id, text }) => ({ id, title: text })) : (guide.sections ?? []).map(({ id, title }) => ({ id, title }));
  const minutes = guideReadMinutes(guide, body ? body.text.split(/\s+/).filter(Boolean).length : 0);
  const hero = guideHero(guide);
  const photo = media[guide.image as keyof typeof media];
  const pieces = guideProducts(guide);
  const published = guidePublished(guide);
  const updated = guideUpdated(guide);
  const author = { '@type': 'Person', name: GUIDE_AUTHOR.name, jobTitle: GUIDE_AUTHOR.role, description: GUIDE_AUTHOR.bio, worksFor: { '@id': SITE_URL + '/#organisation' } };
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: guide.title, description: guide.summary, mainEntityOfPage: SITE_URL + '/guides/' + slug, datePublished: published, dateModified: updated, image: { '@type': 'ImageObject', url: SITE_URL + hero.src, width: hero.width, height: hero.height, caption: hero.alt }, author, publisher: { '@id': SITE_URL + '/#organisation' } };
  return <main id="main-content" className="document-page guide-page"><article>
    <Breadcrumbs items={[{ name: 'Guides', path: '/guides' }, { name: guide.title, path: '/guides/' + slug }]}/><p className="section-tag">{guide.category}</p><h1>{guide.title}</h1><p className="document-lede">{guide.summary}</p><p className="guide-byline">By {GUIDE_AUTHOR.name}, {GUIDE_AUTHOR.role} &middot; <time dateTime={updated}>Updated {displayDate(updated)}</time> &middot; {minutes} min read</p>
    <figure className="guide-hero"><img src={hero.src} srcSet={`${hero.smallSrc} ${hero.smallWidth}w, ${hero.src} ${hero.width}w`} sizes="(max-width: 800px) 92vw, 760px" alt={hero.alt} width={hero.width} height={hero.height} loading="eager" fetchPriority="high"/></figure>
    {guide.takeaways && <aside className="guide-takeaways" aria-labelledby="guide-takeaways-title"><b id="guide-takeaways-title">Key takeaways</b><ul>{guide.takeaways.map(point => <li key={point}>{point}</li>)}</ul></aside>}
    <nav className="guide-contents" aria-label="In this guide"><b>In this guide</b><ol>{contents.map(section => <li key={section.id}><a href={'#' + section.id}>{section.title}</a></li>)}</ol></nav>
    <div className="guide-body">{body ? body.content : (guide.sections ?? []).map(section => <section key={section.id} id={section.id}><h2>{section.title}</h2>{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}{section.points && <ul>{section.points.map(point => <li key={point}>{point}</li>)}</ul>}</section>)}</div>
    {pieces.length > 0 && <section className="guide-pieces"><h2>Pieces in this guide</h2><div className="product-grid">{pieces.map(product => {
      const image = productPhoto(product.slug);
      const set = setLabel(product);
      return <a className="product-card" key={product.slug} href={'/products/' + product.slug}>
        <img src={image.src} srcSet={`${image.smallSrc} ${image.smallWidth}w, ${image.src} ${image.width}w`} sizes="(max-width: 700px) 88vw, 30vw" alt={image.alt} width={image.width} height={image.height} loading="lazy"/>
        <div className="product-card-body"><h3>{product.title}</h3><span className="product-card-price">{priceLabel(product)}{set && <> &middot; {set}</>}</span></div>
      </a>;
    })}</div></section>}
    {photo.src !== hero.src && <figure className="guide-example"><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy"/><figcaption>An example of our work. <a href={'/work/' + guide.project}>See more photos →</a></figcaption></figure>}
    <section className="guide-enquiry"><h2>Ready to get a quote?</h2><p>Send us what you know so far. We’ll get back to you with options, pricing and timing.</p><div className="portfolio-actions"><a className="primary" href={'/enquiry' + (guide.enquiryRoute ? '?route=' + guide.enquiryRoute : '')}>Get a quote ↗</a><a href={'/pages/' + guide.service}>{guide.serviceLabel} →</a></div></section>
    <section className="guide-related"><h2>More guides</h2><GuideGrid items={guides.filter(item => item.slug !== slug).slice(0, 2)} photos/></section>
  </article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/></main>;
}
