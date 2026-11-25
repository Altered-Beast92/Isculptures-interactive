import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './studio.css';
import './subpages.css';
import SiteNav from './components/site-nav';
import SiteFooter from './components/site-footer';
import MobileCta from './components/mobile-cta';
import SiteAnalytics from './components/site-analytics';
import { INDEXABLE, CONTACT, SITE_URL, pageMetadata, businessSchema } from '../lib/site';
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
  ...pageMetadata('Custom & bulk 3D printing in Sydney', 'Sydney 3D printing studio making personalised favours, keepsakes, corporate gifts and custom parts. Bulk orders welcome, delivered Australia-wide.', '/'),
  authors: [{ name: CONTACT.name, url: SITE_URL }],
  publisher: CONTACT.name,
  robots: { index: INDEXABLE, follow: INDEXABLE },
};
// Inlined at build time, so an unset id drops the tag from the static export entirely.
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
// Google tag GT-M6JLBKMS, which sends to the GA4 stream G-S74FNSJV33 (Google serves no tag for
// the G- id on its own, so loading that 404s). Only production builds on Vercel carry it, so previews and
// local development never add test visits to the studio's figures.
const GOOGLE_TAG_ID = process.env.VERCEL_ENV === 'production' ? 'GT-M6JLBKMS' : undefined;
const googleTag = GOOGLE_TAG_ID && `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(GOOGLE_TAG_ID)});`;
const clarityTag = CLARITY_ID && `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(CLARITY_ID)});`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organisation = businessSchema();
  return <html lang="en-AU" className={`${manrope.variable} ${playfair.variable} ${mono.variable}`}><body>{googleTag && <><script async src={'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_TAG_ID}/><script dangerouslySetInnerHTML={{ __html: googleTag }}/></>}{clarityTag &&<script dangerouslySetInnerHTML={{ __html: clarityTag }}/>}<a className="skip-link" href="#main-content">Skip to content</a><SiteNav/>{children}<SiteFooter/><MobileCta/><SiteAnalytics/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation).replace(/</g, '\\u003c') }}/></body></html>;
}
