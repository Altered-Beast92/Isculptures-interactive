import type { Metadata } from 'next';
import './globals.css';
import SiteNav from './components/site-nav';
import SiteFooter from './components/site-footer';
import { INDEXABLE, CONTACT, SITE_URL, pageMetadata } from '../lib/site';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMetadata('Bulk 3D Printing & Custom Business Orders Sydney | iSculptures', 'Custom 3D printing for bulk orders from 10 units, event favours, branded gifts and repeat supply. Sydney studio. Australia-wide delivery.', '/'),
  robots: { index: INDEXABLE, follow: INDEXABLE },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organisation = { '@context': 'https://schema.org', '@type': 'Organization', '@id': SITE_URL + '/#organisation', name: CONTACT.name, alternateName: CONTACT.legalName, url: SITE_URL, email: CONTACT.email, telephone: CONTACT.tel, areaServed: 'Australia', sameAs: ['https://www.etsy.com/au/shop/iSculptures', 'https://www.instagram.com/impeccablesculptures/'] };
  return <html lang="en-AU"><body><a className="skip-link" href="#main-content">Skip to content</a><SiteNav/>{children}<SiteFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation).replace(/</g, '\\u003c') }}/></body></html>;
}
