// Content schema for the studio's portfolio and social proof.
//
// The shapes here are deliberately aligned with the Shopify product CSV export,
// so the migration script can map columns onto fields without a translation
// layer. The Shopify column each field comes from is noted alongside it; fields
// with no column are studio metadata that has to be filled in by hand once the
// products have landed.

/** The three capability pillars the homepage is organised around. */
export type Category = 'printing' | 'industrial' | 'events';

export const CATEGORY_LABELS: Record<Category, string> = {
  printing: '3D Printing',
  industrial: 'Industrial',
  events: 'Events & Spatial',
};

export type ProjectImage = {
  /** Shopify `Image Src` while migrating; rewritten to a local path once the
   *  binaries are pulled down, because the Shopify CDN goes away with the store. */
  src: string;
  /** Shopify `Image Alt Text`. Falls back to the project title when empty. */
  alt?: string;
  /** Intrinsic dimensions, so the grid can reserve space and avoid layout shift. */
  width?: number;
  height?: number;
  smallWidth?: number;
};

export type Project = {
  /** Shopify `Handle`. Also the URL segment: /work/<slug>. */
  slug: string;
  /** Shopify `Title`. */
  title: string;
  /** One-line summary for cards. Not in the CSV — written per project. */
  summary: string;
  /** Longer body. Shopify `Body (HTML)` needs stripping to plain text first. */
  description?: string;
  /** Derived from Shopify `Product Category`/`Type`/`Tags` during migration. */
  category: Category;
  /** Shopify `Tags`, split on commas. Used for filtering. */
  tags?: string[];
  /** Shopify `Image Src` rows, ordered by `Image Position`. */
  images: ProjectImage[];
  /** Studio metadata, added by hand. */
  client?: string;
  year?: number;
  /** Materials and process notes shown on the case study. */
  materials?: string[];
  /** Pulls the project onto the homepage grid. */
  featured?: boolean;
  /** Where to buy it, now that commerce lives on Etsy rather than Shopify. */
  etsyUrl?: string;
};

/** Where a testimonial came from. Shown as a badge — an attributed review from a
 *  named platform reads as evidence, an unattributed one reads as copywriting. */
export type ReviewSource = 'google' | 'etsy' | 'judgeme' | 'shopify' | 'direct';

export const SOURCE_LABELS: Record<ReviewSource, string> = {
  google: 'via Google',
  etsy: 'via Etsy',
  judgeme: 'via Judge.me',
  shopify: 'via Shopify',
  direct: 'Client',
};

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  role?: string;
  company?: string;
  source: ReviewSource;
  /** Out of 5, where the source records one. */
  rating?: number;
  /** ISO date, for ordering and for schema.org output. */
  date?: string;
  /** Ties the quote to a piece of work, which is what makes it persuasive. */
  projectSlug?: string;
  featured?: boolean;
};
