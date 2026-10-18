import { guides, type Guide } from '../content/guides';
import { products, priceRange, aud, type Product } from '../content/products';
import workMedia from '../content/work-media.json';
import productMedia from '../content/product-media.json';
import { CONTENT_DATES } from './site';

export type Photo = { src: string; smallSrc: string; alt: string; width: number; height: number; smallWidth: number };
type RawPhoto = { src: string; alt: string; width: number; height: number; smallWidth: number };

const toPhoto = (raw: RawPhoto): Photo => ({ ...raw, smallSrc: raw.src.replace('.webp', '-small.webp') });

/** The guide's hero photo, resolved from the media JSON files. Throws on a bad reference so a typo fails the build. */
export function guideHero(guide: Guide): Photo {
  const hero = guide.hero ?? { source: 'work' as const, key: guide.image };
  const raw = hero.source === 'work'
    ? (workMedia as Record<string, RawPhoto>)[hero.key]
    : (productMedia as Record<string, RawPhoto[]>)[hero.key]?.[hero.index ?? 0];
  if (!raw) throw new Error(`Guide ${guide.slug}: no photo for ${hero.source} "${hero.key}"`);
  return toPhoto(raw);
}

/** First photo of a catalogue piece. */
export const productPhoto = (slug: string): Photo => {
  const raw = (productMedia as Record<string, RawPhoto[]>)[slug]?.[0];
  if (!raw) throw new Error(`No photo for product "${slug}"`);
  return toPhoto(raw);
};

export const guidePublished = (guide: Guide) => guide.published ?? CONTENT_DATES.guides.published;
export const guideUpdated = (guide: Guide) => guide.updated ?? CONTENT_DATES.guides.updated;

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
export const WORDS_PER_MINUTE = 200;
export const minutesFor = (words: number) => Math.max(1, Math.round(words / WORDS_PER_MINUTE));

/** `readMinutes` when the guide sets it, otherwise worked out from its sections. */
export function guideReadMinutes(guide: Guide, bodyWords = 0): number {
  if (guide.readMinutes) return guide.readMinutes;
  const words = (guide.sections ?? []).reduce((total, section) => total + wordCount(section.title) + section.paragraphs.reduce((n, p) => n + wordCount(p), 0) + (section.points ?? []).reduce((n, p) => n + wordCount(p), 0), 0);
  return minutesFor(words || bodyWords);
}

/** Newest first by `updated`. The sort is stable, so guides sharing a date keep their listed order. */
export const guidesByUpdated = () => [...guides].sort((a, b) => guideUpdated(b).localeCompare(guideUpdated(a)));

export const monthYear = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function guideProducts(guide: Guide): Product[] {
  return (guide.products ?? []).flatMap(slug => products.find(product => product.slug === slug) ?? []);
}

/** "set of 5", or "sets of 5 to 20" when the piece is sold in several set sizes. Empty when not sold as a set. */
export function setLabel(product: Product): string {
  if (!product.soldAsSet) return '';
  const counts = [...new Set(product.sizes.flatMap(size => [...size.label.matchAll(/set of (\d+)/gi)].map(match => Number(match[1]))))].sort((a, b) => a - b);
  if (!counts.length) return '';
  return counts.length === 1 ? `set of ${counts[0]}` : `sets of ${counts[0]} to ${counts.at(-1)}`;
}

export function priceLabel(product: Product): string {
  const { low, high } = priceRange(product);
  return low === high ? aud(low) : `${aud(low)} – ${aud(high)}`;
}
