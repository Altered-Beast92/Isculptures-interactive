import type { Testimonial } from '../content/types';
import { testimonials } from '../content/testimonials';
import { CONTACT, SITE_URL } from './site';

// The platform that collected and published the review, which is not the same as the
// business being reviewed. Naming it keeps the markup honest about where each quote lives.
const COLLECTED_BY: Record<Testimonial['source'], string> = {
  google: 'Google', etsy: 'Etsy', judgeme: 'Judge.me', shopify: 'Shopify', direct: CONTACT.name,
};

/** Marks up one quote. Only ever emitted on a page where that quote is actually visible. */
export function reviewSchema(review: Testimonial) {
  return {
    '@type': 'Review',
    '@id': SITE_URL + '/#review-' + review.id,
    author: { '@type': 'Person', name: review.author },
    reviewBody: review.quote,
    ...(review.date ? { datePublished: review.date } : {}),
    ...(review.rating ? { reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 1 } } : {}),
    publisher: { '@type': 'Organization', name: COLLECTED_BY[review.source] },
  };
}

const rated = testimonials.filter((review): review is Testimonial & { rating: number } => typeof review.rating === 'number');

/** Covers every rated review the studio publishes, across all three platforms, so the
 *  count matches what a visitor can actually go and read rather than one page's sample.
 *
 *  Google does not render stars for a business that rates itself on its own site, so this
 *  will not produce a rich result. It is here because it is the machine-readable form of
 *  proof the site already shows in prose, which AI search engines do read, and because
 *  product pages added later can reuse it where stars are supported. */
export const aggregateRating = {
  '@type': 'AggregateRating',
  ratingValue: Number((rated.reduce((total, review) => total + review.rating, 0) / rated.length).toFixed(1)),
  reviewCount: rated.length,
  bestRating: 5,
  worstRating: 1,
};

/** A partial node that merges into the business by `@id`, so the identity, contact details
 *  and hours are not repeated on every page that happens to show a quote. */
export const reviewedBusiness = (shown: Testimonial[]) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': SITE_URL + '/#organisation',
  name: CONTACT.name,
  aggregateRating,
  review: shown.map(reviewSchema),
});

/** A rating for one product, computed only from reviews that name that piece. The
 *  business-wide aggregate above would misrepresent a product it does not describe,
 *  and unlike the business node, a Product rating is eligible for a rich result. */
export function productRating(shown: Testimonial[]) {
  const rated = shown.filter((review): review is Testimonial & { rating: number } => typeof review.rating === 'number');
  if (!rated.length) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue: Number((rated.reduce((total, review) => total + review.rating, 0) / rated.length).toFixed(1)),
    reviewCount: rated.length,
    bestRating: 5,
    worstRating: 1,
  };
}
