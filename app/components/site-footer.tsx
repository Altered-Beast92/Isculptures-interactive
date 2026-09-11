'use client';
import { usePathname } from 'next/navigation';
import { CONTACT } from '../../lib/site';
import BrandLogo from './brand-logo';

const groups = [
  { title: 'Services', links: [
    ['All Services', '/services'],
    ['Wholesale & Bulk Orders', '/pages/wholesale'],
    ['Corporate Gifts & Event Favours', '/pages/events-custom-gifts'],
    ['Bonbonniere & Keepsakes', '/pages/bonbonniere-custom'],
    ['Parts & Prototypes', '/pages/industrial'],
    ['Repeat Orders & Supply', '/pages/ongoing-supply'],
  ] },
  { title: 'Studio', links: [
    ['Our Work', '/work'],
    ['Ordering Guides', '/guides'],
    ['About Us', '/pages/about'],
    ['Get a Quote', '/enquiry'],
  ] },
  { title: 'Information', links: [
    ['Privacy Notice', '/policies/privacy-policy'],
    ['Enquiries & Orders', '/policies/terms-of-service'],
    ['Delivery', '/policies/shipping-policy'],
    ['Order Issues', '/policies/refund-policy'],
  ] },
] as const;

export default function SiteFooter() {
  const pathname = usePathname();
  const onEnquiry = pathname === '/enquiry';
  return <footer className={'site-footer story-footer' + (onEnquiry ? ' enquiry-page-footer' : '')}>
    {/* The enquiry page is already the call to action, so it keeps the links without repeating it.
        The tagline is a paragraph, not a heading, so it doesn't repeat in every page's outline. */}
    {!onEnquiry && <><span>GET IN TOUCH</span><p className="footer-heading">Have something <br/>in mind?</p>
    <a className="primary" href="/enquiry">Get a quote <span>↗</span></a></>}
    <div className="footer-grid">
      <div className="footer-brand">
        <BrandLogo/>
        <p>Custom 3D printing in Sydney, delivered Australia-wide.</p>
        <ul className="footer-contact">
          <li><span>Phone</span><a href={'tel:' + CONTACT.tel}>{CONTACT.phone}</a></li>
          <li><span>Email</span><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></li>
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
        <li><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span></a></li>
        <li><a href="https://www.etsy.com/au/shop/iSculptures" target="_blank" rel="noreferrer">Shop Single Pieces on Etsy <span aria-hidden="true">↗</span></a></li>
      </ul>
    </div>
  </footer>;
}
