import { notFound } from 'next/navigation';
import { services } from '../../../content/services';
import { projects } from '../../../content/projects';
import { guides } from '../../../content/guides';
import { testimonials } from '../../../content/testimonials';
import { SOURCE_LABELS } from '../../../content/types';
import { CONTACT, SITE_URL, pageMetadata } from '../../../lib/site';
import Breadcrumbs from '../../components/breadcrumbs';
import WorkGrid from '../../components/work-grid';
import GuideGrid from '../../components/guide-grid';
import MockupNote from '../../components/mockup-note';
export const dynamicParams = false;
export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const service = services.find(item => item.slug === slug);
  return service ? pageMetadata(service.title, service.description, '/pages/' + slug) : {};
}
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const service = services.find(item => item.slug === slug);
  if (!service) notFound();
  const about = slug === 'about';
  const heading = service.heading ?? service.title;
  const enquiry = '/enquiry' + (service.route ? '?route=' + service.route : '');
  // Content lists slugs and ids in display order, so keep that order rather than the source arrays'.
  const work = (service.work ?? []).flatMap(item => projects.filter(project => project.slug === item));
  const reviews = (service.reviews ?? []).flatMap(item => testimonials.filter(review => review.id === item));
  const related = guides.filter(guide => guide.service === slug);
  const schema = {
    '@context': 'https://schema.org',
    '@type': about ? 'AboutPage' : 'Service',
    '@id': SITE_URL + '/pages/' + slug + (about ? '#about' : '#service'),
    url: SITE_URL + '/pages/' + slug, name: service.title, description: service.description,
    ...(about
      ? { about: { '@id': SITE_URL + '/#organisation' } }
      : { serviceType: service.eyebrow, provider: { '@id': SITE_URL + '/#organisation', name: CONTACT.name }, areaServed: { '@type': 'Country', name: 'Australia' } }),
  };
  return <main id="main-content" className="document-page service-page"><article>
    <Breadcrumbs items={[...(about ? [] : [{ name: 'Services', path: '/services' }]), { name: heading, path: '/pages/' + slug }]}/>

    <header className="service-hero">
      <div>
        <p className="section-tag">{service.eyebrow}</p><h1>{heading}</h1><p className="document-lede">{service.intro}</p>
        <div className="service-actions"><a className="primary" href={enquiry}>{service.cta} <span aria-hidden="true">↗</span></a>{!about && <a href={'tel:' + CONTACT.tel}>Or call {CONTACT.phone}</a>}</div>
        <MockupNote/>
      </div>
      {service.facts && <div className="service-glance"><p className="section-tag">QUICK FACTS</p><dl>{service.facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.href ? <a href={fact.href}>{fact.value}</a> : fact.value}</dd></div>)}</dl></div>}
    </header>

    <section className="service-ledger" aria-labelledby="service-ledger-title">
      <div className="service-ledger-head"><p className="section-tag">{about ? 'HOW WE WORK' : 'GOOD TO KNOW'}</p><h2 id="service-ledger-title">{about ? 'Working with us' : 'Before you get in touch'}</h2></div>
      <ol>{service.sections.map((section, index) => <li key={section.title}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h3>{section.title}</h3><p>{section.text}</p>{section.points && <ul>{section.points.map(point => <li key={point}>{point}</li>)}</ul>}</div></li>)}</ol>
    </section>

    {work.length > 0 && <section className="service-band" aria-labelledby="service-work-title">
      <div className="service-band-head"><div><p className="section-tag">OUR WORK</p><h2 id="service-work-title">Examples of our work</h2></div><a href="/work">See all our work →</a></div>
      <WorkGrid items={work}/>
    </section>}

    {reviews.length > 0 && <section className="service-band" aria-labelledby="service-reviews-title">
      <div className="service-band-head"><div><p className="section-tag">REVIEWS</p><h2 id="service-reviews-title">What customers say</h2></div></div>
      <div className="service-reviews">{reviews.map(review => <figure key={review.id}>
        {review.rating ? <span className="service-review-rating" role="img" aria-label={review.rating + ' out of 5 stars'}>{'★'.repeat(review.rating)}</span> : null}
        <blockquote>{review.quote}</blockquote>
        <figcaption><strong>{review.author}</strong>{review.role && <span>{review.role}</span>}<small>{SOURCE_LABELS[review.source]}</small></figcaption>
      </figure>)}</div>
    </section>}

    <section className="service-band" aria-labelledby="service-next-title">
      <div className="service-band-head"><div><p className="section-tag">MORE</p><h2 id="service-next-title">{related.length > 0 ? 'Guides and other services' : 'Our services'}</h2></div></div>
      {related.length > 0 && <GuideGrid items={related}/>}
      <ul className="service-links">{services.filter(item => item.slug !== slug && item.slug !== 'about').map(item => <li key={item.slug}><a href={'/pages/' + item.slug}><span className="section-tag">{item.eyebrow}</span><b>{item.title}</b><span aria-hidden="true">→</span></a></li>)}</ul>
    </section>

    <aside className="service-cta">
      <div><p className="section-tag">{about ? 'CONTACT' : 'GET A QUOTE'}</p><h2>{about ? 'Get in touch.' : 'Tell us what you need.'}</h2><p>Send what you know so far, like the quantity, size, finish and when you need it. We’ll get back to you with pricing and timing.</p></div>
      <div className="service-cta-actions"><a className="primary" href={enquiry}>{service.cta} <span aria-hidden="true">↗</span></a><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a><a href={'tel:' + CONTACT.tel}>{CONTACT.phone}</a></div>
    </aside>
  </article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/></main>;
}
