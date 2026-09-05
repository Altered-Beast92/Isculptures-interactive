import { notFound } from 'next/navigation';
import { services } from '../../../content/services';
import { pageMetadata } from '../../../lib/site';
import WorkGrid from '../../components/work-grid';
import { projects } from '../../../content/projects';
export const dynamicParams = false;
export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const service = services.find(item => item.slug === slug);
  return service ? pageMetadata(service.title, service.description, '/pages/' + slug) : {};
}
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const service = services.find(item => item.slug === slug);
  if (!service) notFound();
  return <main id="main-content" className="document-page"><article>
    <p className="section-tag">{service.eyebrow}</p><h1>{service.title}</h1><p className="document-lede">{service.intro}</p>
    <a className="primary" href={'/enquiry' + (service.route ? '?route=' + service.route : '')}>{service.cta} ↗</a>
    <div className="document-sections">{service.sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p>{section.points && <ul>{section.points.map(point => <li key={point}>{point}</li>)}</ul>}</section>)}</div>
    {slug !== 'industrial' && <section className="service-work"><h2>From the studio</h2><WorkGrid items={(slug === 'bonbonniere-custom' ? projects.slice(0, 2) : [projects[0], projects[3]])}/><a href="/work">View all selected work →</a></section>}
    <aside className="related-links"><h2>Explore your next step</h2>{services.filter(item => item.slug !== slug && item.slug !== 'about').map(item => <a key={item.slug} href={'/pages/' + item.slug}>{item.title} →</a>)}</aside>
    <a className="primary" href={'/enquiry' + (service.route ? '?route=' + service.route : '')}>{service.cta} ↗</a>
  </article></main>;
}
