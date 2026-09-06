import type { Testimonial } from './types';
// Add only authentic, attributed reviews with permission to publish.
export const testimonials: Testimonial[] = [];
export const featuredTestimonials = () => testimonials.filter(t => t.featured);
export const testimonialsFor = (slug: string) => testimonials.filter(t => t.projectSlug === slug);
