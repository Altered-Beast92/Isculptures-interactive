import type { Metadata } from 'next';
export const SITE_URL = 'https://isculptures.com.au';
// A production opt-in must never make Vercel preview/development builds indexable.
export const INDEXABLE = process.env.SITE_INDEXABLE === 'true'
  && !['preview', 'development'].includes(process.env.VERCEL_ENV || '');
export const CONTACT = { name: 'Impeccable Sculptures', legalName: 'Impeccable Sculptures', email: 'info@isculptures.com.au', phone: '0437 383 684', tel: '+61437383684' };
// The branded card shown when any page is shared; project pages swap in their own photograph.
export const SHARE_IMAGE = { url: SITE_URL + '/brand/impeccable-sculptures-share.jpg', width: 1200, height: 630, alt: 'Impeccable Sculptures, custom 3D printing in Sydney, with photographs of rose sculptures, boxed event favours and gift boxes' };

// --- Google Business Profile alignment -------------------------------------
// The profile is a service-area listing, so its street address is hidden. The site
// must not publish one either: an address here that Google cannot match against the
// profile splits one business into two entities and weakens both.
export const SERVICE_AREA = { addressLocality: 'Sydney', addressRegion: 'NSW', addressCountry: 'AU' };
export const AREA_SERVED = ['Sydney', 'New South Wales', 'Australia'];
// Both of these are omitted from the schema while empty rather than guessed. Opening
// hours that disagree with the Business Profile are worse than publishing none at all.
// Fill them from the profile itself, copied exactly.
// GBP_URL is the profile's own share link (Business Profile → Share → Copy link,
// e.g. https://share.google/…). Setting it ties the profile and this site together as one business
// in the schema (sameAs, hasMap) and shows a "Google reviews" link on the homepage and footer.
export const GBP_URL = 'https://share.google/1kZsvqiPr3rKBPJWz';
// Opening hours as the owner gave them on 2026-11-21: weekdays 9 to 5, Saturday 9 to 12,
// closed Sunday. Days not listed are closed. Change them here and on the profile together.
export const OPENING_HOURS: { days: string[]; opens: string; closes: string }[] = [
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' },
  { days: ['Saturday'], opens: '09:00', closes: '12:00' },
];
// "09:00" → "9am", "12:30" → "12:30pm".
const clock = (time: string) => { const [hour, minute] = time.split(':').map(Number); return (hour % 12 || 12) + (minute ? ':' + String(minute).padStart(2, '0') : '') + (hour < 12 ? 'am' : 'pm'); };
/** The same hours in words for visitors, e.g. "Mon–Fri 9am–5pm · Sat 9am–12pm". */
export const openingHoursText = () => OPENING_HOURS.map(({ days, opens, closes }) => {
  const short = days.map(day => day.slice(0, 3));
  return (short.length > 2 ? short[0] + '–' + short.at(-1) : short.join(', ')) + ' ' + clock(opens) + '–' + clock(closes);
}).join(' · ');

// --- Content freshness ------------------------------------------------------
// Seeded from this repository's git history for the file each collection lives in.
// Individual entries override these with their own `published` / `updated` fields;
// bump the collection value when you revise a file wholesale.
export const CONTENT_DATES = {
  guides: { published: '2026-09-06', updated: '2026-09-11' },
  projects: { published: '2026-09-04', updated: '2026-09-11' },
  services: { published: '2026-09-06', updated: '2026-09-11' },
  site: { published: '2026-09-04', updated: '2026-09-11' },
};
export const displayDate = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** The single business node every other schema on the site points at by `@id`.
 *  Typed LocalBusiness rather than Organization so the Business Profile, the map
 *  listing and the website describe one entity with one set of contact details. */
export function businessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': SITE_URL + '/#organisation',
    name: CONTACT.name,
    legalName: CONTACT.legalName,
    alternateName: 'iSculptures',
    description: 'Sydney 3D printing studio making personalised favours, keepsakes, corporate gifts and custom parts in batches from 10 units, delivered Australia-wide.',
    url: SITE_URL,
    logo: SITE_URL + '/brand/impeccable-sculptures-logo.webp',
    image: SHARE_IMAGE.url,
    email: CONTACT.email,
    telephone: CONTACT.tel,
    priceRange: '$$',
    currenciesAccepted: 'AUD',
    address: { '@type': 'PostalAddress', ...SERVICE_AREA },
    areaServed: AREA_SERVED.map(name => ({ '@type': 'Place', name })),
    ...(OPENING_HOURS.length ? { openingHoursSpecification: OPENING_HOURS.map(hours => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: hours.days, opens: hours.opens, closes: hours.closes })) } : {}),
    ...(GBP_URL ? { hasMap: GBP_URL } : {}),
    sameAs: ['https://www.etsy.com/au/shop/iSculptures', 'https://www.instagram.com/impeccablesculptures/', GBP_URL].filter(Boolean),
  };
}

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const brandedTitle = title.includes(CONTACT.name) ? title : `${title} | ${CONTACT.name}`;
  return { title: brandedTitle, description, alternates: { canonical: path },
    openGraph: { title: brandedTitle, description, url: SITE_URL + path, type: 'website', siteName: CONTACT.name, locale: 'en_AU', images: [SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', title: brandedTitle, description, images: [SHARE_IMAGE] } };
}

// --- Guide author -----------------------------------------------------------
// Shown as the byline on every guide and emitted as a schema.org Person that works for
// the business node above. First name only, no surname and no photo, at the owner's request.
export const GUIDE_AUTHOR = {
  name: 'Daniel',
  role: 'maker at Impeccable Sculptures',
  // TODO(owner): extend this bio with real background (years making, where you trained, what you are known for). Keep every claim true.
  bio: 'Daniel runs Impeccable Sculptures, a 3D printing studio in Sydney that makes saint statues, icons, bonbonniere and custom pieces, delivered Australia-wide.',
};
