'use client';
import { usePathname } from 'next/navigation';
import { CONTACT } from '../../lib/site';
import BrandLogo from './brand-logo';
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === '/enquiry') return <footer className="enquiry-footer"><BrandLogo/><span>© {new Date().getFullYear()} · Sydney, Australia</span><div><a href="/policies/privacy-policy">Privacy</a><a href="/policies/terms-of-service">Enquiries &amp; orders</a><a href="/pages/about">The studio ↗</a></div></footer>;
  return <footer id="about" className="site-footer story-footer"><span>YOUR NEXT CHAPTER</span><h2>Let’s make<br/>something.</h2>
    <a className="primary" href="/enquiry">Request a bulk quote <span>↗</span></a>
    <div className="footer-grid"><div><BrandLogo/><p>Custom 3D printing in Sydney.<br/>Australia-wide delivery.</p><a href={'tel:' + CONTACT.tel}>{CONTACT.phone}</a><br/><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></div>
    <div><b>For your next project</b><a href="/pages/wholesale">Wholesale &amp; bulk orders</a><a href="/pages/ongoing-supply">Repeat orders &amp; supply</a><a href="/pages/bonbonniere-custom">Bonbonniere &amp; keepsakes</a><a href="/pages/about">About the studio</a></div>
    <div><b>Useful information</b><a href="/guides">Guides for your order</a><a href="/policies/privacy-policy">Privacy</a><a href="/policies/terms-of-service">Enquiries &amp; orders</a><a href="/policies/shipping-policy">Delivery</a><a href="/policies/refund-policy">Order issues</a><a href="https://www.etsy.com/au/shop/iSculptures" target="_blank" rel="noreferrer">Shop individual pieces on Etsy ↗</a></div></div>
    <p><a href="/work">Explore our work →</a><br/><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">Follow Impeccable Sculptures on Instagram ↗</a></p>
    <small>© {new Date().getFullYear()} {CONTACT.name} · Sydney, Australia</small></footer>;
}
