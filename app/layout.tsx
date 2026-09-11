import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './studio.css';
import './subpages.css';
import SiteNav from './components/site-nav';
import SiteFooter from './components/site-footer';
import { INDEXABLE, CONTACT, SITE_URL, pageMetadata } from '../lib/site';
const manrope = localFont({ src: '../public/fonts/manrope-latin.woff2', weight: '200 800', variable: '--font-manrope', display: 'swap' });
const playfair = localFont({ src: [
  { path: '../public/fonts/playfair-display-latin.woff2', weight: '500 600', style: 'normal' },
  { path: '../public/fonts/playfair-display-italic-latin.woff2', weight: '500 600', style: 'italic' },
], variable: '--font-playfair', display: 'swap', preload: false });
const mono = localFont({ src: [
  { path: '../public/fonts/dm-mono-regular-latin.woff2', weight: '400', style: 'normal' },
  { path: '../public/fonts/dm-mono-medium-latin.woff2', weight: '500', style: 'normal' },
], variable: '--font-mono', display: 'swap', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMetadata('Custom & bulk 3D printing in Sydney', 'Sydney 3D printing studio making personalised favours, keepsakes, corporate gifts and custom parts. Bulk orders start at 10 units, delivered Australia-wide.', '/'),
  authors: [{ name: CONTACT.name, url: SITE_URL }],
  publisher: CONTACT.name,
  robots: { index: INDEXABLE, follow: INDEXABLE },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organisation = { '@context': 'https://schema.org', '@type': 'Organization', '@id': SITE_URL + '/#organisation', name: CONTACT.name, alternateName: 'iSculptures', logo: SITE_URL + '/brand/impeccable-sculptures-logo.webp', url: SITE_URL, email: CONTACT.email, telephone: CONTACT.tel, areaServed: 'Australia', sameAs: ['https://www.etsy.com/au/shop/iSculptures', 'https://www.instagram.com/impeccablesculptures/'] };
  return <html lang="en-AU" className={`${manrope.variable} ${playfair.variable} ${mono.variable}`}><body><a className="skip-link" href="#main-content">Skip to content</a><SiteNav/>{children}<SiteFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation).replace(/</g, '\\u003c') }}/></body></html>;
}
