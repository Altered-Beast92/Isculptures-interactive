'use client';
import { usePathname } from 'next/navigation';
import { CONTACT } from '../../lib/site';
import BrandLogo from './brand-logo';
export default function SiteFooter() {
  const pathname = usePathname();
  const onEnquiry = pathname === '/enquiry';
  return <footer id="about" className={'site-footer story-footer' + (onEnquiry ? ' enquiry-page-footer' : '')}>
    {/* The enquiry page is already the call to action, so it keeps the links without repeating it. */}
    {!onEnquiry && <><span>GET IN TOUCH</span><h2>Have something<br/>in mind?</h2>
    <a className="primary" href="/enquiry">Get a quote <span>↗</span></a></>}
    <div className="footer-grid"><div><BrandLogo/><p>Custom 3D printing in Sydney.<br/>Delivering Australia-wide.</p><a href={'tel:' + CONTACT.tel}>{CONTACT.phone}</a><br/><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></div>
    <div><b>Services</b><a href="/services">All services</a><a href="/pages/events-custom-gifts">Corporate gifts &amp; event favours</a><a href="/pages/wholesale">Wholesale &amp; bulk orders</a><a href="/pages/ongoing-supply">Repeat orders &amp; supply</a><a href="/pages/bonbonniere-custom">Bonbonniere &amp; keepsakes</a><a href="/pages/industrial">Parts &amp; prototypes</a><a href="/pages/about">About us</a></div>
    <div><b>Information</b><a href="/guides">Ordering guides</a><a href="/policies/privacy-policy">Privacy</a><a href="/policies/terms-of-service">Enquiries &amp; orders</a><a href="/policies/shipping-policy">Delivery</a><a href="/policies/refund-policy">Order issues</a><a href="https://www.etsy.com/au/shop/iSculptures" target="_blank" rel="noreferrer">Buy single pieces on Etsy ↗</a></div></div>
    <p><a href="/work">See our work →</a><br/><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">Follow us on Instagram ↗</a></p>
    <small>© {new Date().getFullYear()} {CONTACT.name} · Sydney, Australia</small></footer>;
}
