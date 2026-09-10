import type { Metadata } from 'next';
export const SITE_URL = 'https://isculptures.com.au';
// A production opt-in must never make Vercel preview/development builds indexable.
export const INDEXABLE = process.env.SITE_INDEXABLE === 'true'
  && !['preview', 'development'].includes(process.env.VERCEL_ENV || '');
export const CONTACT = { name: 'Impeccable Sculptures', legalName: 'Impeccable Sculptures', email: 'info@isculptures.com.au', phone: '0437 383 684', tel: '+61437383684' };
export function pageMetadata(title: string, description: string, path: string): Metadata {
  const brandedTitle = title.includes(CONTACT.name) ? title : `${title} | ${CONTACT.name}`;
  return { title: brandedTitle, description, alternates: { canonical: path },
    openGraph: { title: brandedTitle, description, url: SITE_URL + path, type: 'website', siteName: CONTACT.name, locale: 'en_AU' },
    twitter: { card: 'summary', title: brandedTitle, description } };
}
