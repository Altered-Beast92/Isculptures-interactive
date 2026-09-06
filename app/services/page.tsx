import { services } from '../../content/services';
import { pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Custom 3D printing services for bulk & business', 'Explore bulk orders, custom event favours, religious keepsakes, parts and prototypes, and ongoing supply enquiries with our Sydney studio.', '/services');
export default function ServicesPage() {
  return <main id="main-content" className="document-page services-index"><p className="section-tag">CUSTOM 3D PRINTING</p><h1>What are<br/>you planning?</h1><p className="document-lede">An occasion, a batch for your customers or a product to make again. Start with the service closest to your brief.</p><div className="guide-grid">{services.filter(service => service.slug !== 'about').map(service => <a className="guide-card" key={service.slug} href={'/pages/' + service.slug}><span className="section-tag">{service.eyebrow}</span><h2>{service.title}</h2><p>{service.description}</p><span className="guide-read">Explore the service ↗</span></a>)}</div><a href="/enquiry" className="primary">Not sure where to start? Send your brief ↗</a></main>;
}

