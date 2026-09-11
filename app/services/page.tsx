import { services } from '../../content/services';
import { CONTACT, pageMetadata } from '../../lib/site';
import Breadcrumbs from '../components/breadcrumbs';
export const metadata = pageMetadata('3D printing services for events, business & parts', 'Bulk orders, event favours, bonbonniere, religious keepsakes, parts, prototypes and repeat supply from our Sydney 3D printing studio.', '/services');
export default function ServicesPage() {
  return <main id="main-content" className="document-page services-index">
    <Breadcrumbs items={[{ name: 'Services', path: '/services' }]}/>
    <header className="page-intro"><p className="section-tag">SERVICES</p><h1>What do you need printed?</h1><p className="document-lede">Favours for an event, stock for your shop or a part for a machine. Start with the closest match below.</p></header>
    <ol className="service-index">{services.filter(service => service.slug !== 'about').map((service, index) => <li key={service.slug}><a href={'/pages/' + service.slug}>
      <span className="service-index-number">{String(index + 1).padStart(2, '0')}</span>
      <div className="service-index-title"><span className="section-tag">{service.eyebrow}</span><h2>{service.title}</h2></div>
      <p>{service.description}</p>
      <span className="service-index-arrow" aria-hidden="true">↗</span>
    </a></li>)}</ol>
    <aside className="service-cta">
      <div><p className="section-tag">NOT SURE?</p><h2>Just send us your idea.</h2><p>Tell us what you want made, roughly how many and when. We’ll work out the best way to do it.</p></div>
      <div className="service-cta-actions"><a className="primary" href="/enquiry">Get a quote <span aria-hidden="true">↗</span></a><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a><a href={'tel:' + CONTACT.tel}>{CONTACT.phone}</a></div>
    </aside>
  </main>;
}
