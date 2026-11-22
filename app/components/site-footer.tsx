'use client';
import { usePathname } from 'next/navigation';
import { CONTACT, GBP_URL, OPENING_HOURS, openingHoursText, etsyShopLink } from '../../lib/site';
import BrandLogo from './brand-logo';

const groups = [
  { title: 'Services', links: [
    ['All services', '/services'],
    ['Wholesale & bulk orders', '/pages/wholesale'],
    ['Corporate gifts & event favours', '/pages/events-custom-gifts'],
    ['Bonbonniere & keepsakes', '/pages/bonbonniere-custom'],
    ['Parts & prototypes', '/pages/industrial'],
    ['Repeat orders & supply', '/pages/ongoing-supply'],
  ] },
  { title: 'Studio', links: [
    ['Statues & icons', '/products'],
    ['Our work', '/work'],
    ['Blog', '/guides'],
    ['About us', '/pages/about'],
    ['Get a quote', '/enquiry'],
  ] },
  { title: 'Information', links: [
    ['Privacy notice', '/policies/privacy-policy'],
    ['Enquiries & orders', '/policies/terms-of-service'],
    ['Delivery', '/policies/shipping-policy'],
    ['Order issues', '/policies/refund-policy'],
  ] },
] as const;

export default function SiteFooter() {
  const pathname = usePathname();
  const onEnquiry = pathname === '/enquiry';
  // Service and about pages already end on their own quote button just above the footer.
  const endsOnQuote = onEnquiry || pathname.startsWith('/pages/');
  return <footer className={'site-footer story-footer' + (onEnquiry ? ' enquiry-page-footer' : endsOnQuote ? ' no-footer-cta' : '')}>
    {/* The enquiry page is already the call to action, so it keeps the links without repeating it.
        The tagline is a paragraph, not a heading, so it doesn't repeat in every page's outline. */}
    {!endsOnQuote && <><span>GET IN TOUCH</span><p className="footer-heading">Have something <br/>in mind?</p>
    <a className="primary" href="/enquiry">Get a quote <span>↗</span></a></>}
    <div className="footer-grid">
      <div className="footer-brand">
        <BrandLogo/>
        <p>Custom 3D printing in Sydney, delivered Australia-wide.</p>
        <ul className="footer-contact">
          <li><span>Phone</span><a href={'tel:' + CONTACT.tel}>{CONTACT.phone}</a></li>
          <li><span>Email</span><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></li>
          {OPENING_HOURS.length > 0 && <li><span>Hours</span><p>{openingHoursText()}</p></li>}
        </ul>
      </div>
      {groups.map(group => <div key={group.title} className="footer-links">
        <p className="footer-title">{group.title}</p>
        <ul>{group.links.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      </div>)}
    </div>
    <div className="footer-bottom">
      <small>© {new Date().getFullYear()} {CONTACT.name} · Sydney, Australia</small>
      <ul className="footer-social">
        {GBP_URL && <li><a href={GBP_URL} target="_blank" rel="noopener">Google reviews <span aria-hidden="true">↗</span></a></li>}
        <li><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span></a></li>
        <li><a href="https://www.facebook.com/isculptures" target="_blank" rel="noreferrer">Facebook <span aria-hidden="true">↗</span></a></li>
        <li><a href={etsyShopLink('footer')} target="_blank" rel="noopener">Shop single pieces on Etsy <span aria-hidden="true">↗</span></a></li>
      </ul>
    </div>
  </footer>;
}
