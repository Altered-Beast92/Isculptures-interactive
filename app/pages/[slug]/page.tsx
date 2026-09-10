import { notFound } from 'next/navigation';
import { services } from '../../../content/services';
import { CONTACT, SITE_URL, pageMetadata } from '../../../lib/site';
import Breadcrumbs from '../../components/breadcrumbs';
import WorkGrid from '../../components/work-grid';
import { projects } from '../../../content/projects';
import { guides } from '../../../content/guides';
export const dynamicParams = false;
export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const service = services.find(item => item.slug === slug);
  return service ? pageMetadata(service.title, service.description, '/pages/' + slug) : {};
}
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const service = services.find(item => item.slug === slug);
  if (!service) notFound();
  const schema = {
    '@context': 'https://schema.org',
    '@type': slug === 'about' ? 'AboutPage' : 'Service',
    '@id': SITE_URL + '/pages/' + slug + (slug === 'about' ? '#about' : '#service'),
    url: SITE_URL + '/pages/' + slug, name: service.title, description: service.description,
    ...(slug === 'about'
      ? { about: { '@id': SITE_URL + '/#organisation' } }
      : { serviceType: service.eyebrow, provider: { '@id': SITE_URL + '/#organisation', name: CONTACT.name }, areaServed: { '@type': 'Country', name: 'Australia' } }),
  };
  return <main id="main-content" className="document-page service-page"><article>
    <Breadcrumbs items={[...(slug === 'about' ? [] : [{ name: 'Services', path: '/services' }]), { name: service.title, path: '/pages/' + slug }]}/>
    <p className="section-tag">{service.eyebrow}</p><h1>{service.title}</h1><p className="document-lede">{service.intro}</p>
    <a className="primary" href={'/enquiry' + (service.route ? '?route=' + service.route : '')}>{service.cta} ↗</a>
    <div className="document-sections">{service.sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p>{section.points && <ul>{section.points.map(point => <li key={point}>{point}</li>)}</ul>}</section>)}</div>
    {slug !== 'industrial' && <section className="service-work"><h2>From the studio</h2><WorkGrid items={projects.filter(project => (slug === 'bonbonniere-custom' ? ['ribbon-finished-event-favours', 'personalised-favour-tags'] : ['personalised-rose-sculptures', 'personalised-gift-boxes']).includes(project.slug))}/><a href="/work">View all selected work →</a></section>}
    <aside className="related-links"><h2>Explore your next step</h2>{guides.filter(guide => guide.service === slug).map(guide => <a key={guide.slug} href={"/guides/" + guide.slug}>{guide.title} →</a>)}{services.filter(item => item.slug !== slug && item.slug !== 'about').map(item => <a key={item.slug} href={'/pages/' + item.slug}>{item.title} →</a>)}</aside>
    <a className="primary" href={'/enquiry' + (service.route ? '?route=' + service.route : '')}>{service.cta} ↗</a>
  </article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/></main>;
}
