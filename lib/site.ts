import type { Metadata } from 'next';
export const SITE_URL = 'https://isculptures.com.au';
export const INDEXABLE = process.env.SITE_INDEXABLE === 'true';
export const CONTACT = { name: 'Impeccable Sculptures', legalName: 'Impeccable Sculptures', email: 'info@isculptures.com.au', phone: '0437 383 684', tel: '+61437383684' };
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path },
    openGraph: { title, description, url: SITE_URL + path, type: 'website', siteName: CONTACT.name, locale: 'en_AU' },
    twitter: { card: 'summary', title, description } };
}
