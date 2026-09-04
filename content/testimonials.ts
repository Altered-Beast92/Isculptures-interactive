import type { Testimonial } from './types';

// PLACEHOLDER CONTENT — replaced by the normalised export from Judge.me/Loox,
// Google Business and Etsy. Keep `source` accurate on every entry: the badge it
// drives is what separates a verifiable review from marketing copy.
export const testimonials: Testimonial[] = [
  {
    id: 'placeholder-1',
    quote: 'Placeholder review text. Replace with a real quote from the Shopify reviews export.',
    author: 'A. Client',
    company: 'Placeholder Co.',
    source: 'shopify',
    rating: 5,
    projectSlug: 'placeholder-lattice-vessel',
    featured: true,
  },
  {
    id: 'placeholder-2',
    quote: 'Placeholder review text. Replace with a real quote from Google Business.',
    author: 'B. Client',
    role: 'Operations Manager',
    source: 'google',
    rating: 5,
    featured: true,
  },
  {
    id: 'placeholder-3',
    quote: 'Placeholder review text. Replace with a real quote from the Etsy shop.',
    author: 'C. Client',
    source: 'etsy',
    rating: 5,
    featured: true,
  },
];

export const featuredTestimonials = () => testimonials.filter(t => t.featured);
export const testimonialsFor = (slug: string) => testimonials.filter(t => t.projectSlug === slug);
