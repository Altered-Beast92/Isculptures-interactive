import type { Category, Project } from './types';

// PLACEHOLDER CONTENT — replaced by real projects once the photography is
// selected. Two rules this list has to keep obeying:
//
// 1. Nothing in here is stock imagery. The banners in the Shopify files export
//    (Industrial_3D_Printing.png, Jigs_Fixtures_Custom_Solutions.png, and the
//    rest) are stock photos. They are fine as decorative service-page headers
//    and must never appear here, because this grid claims authorship.
// 2. There are no industrial entries, because there are no industrial jobs yet.
//    Industrial stays a stated capability on the homepage, not a portfolio
//    category, until there is real work to show.
//
// The proven volume business is event favours and bonbonnieres, so that is what
// the placeholders describe.
export const projects: Project[] = [
  {
    slug: 'placeholder-christening-favours',
    title: 'Christening Favour Run',
    summary: 'Several hundred personalised favours produced to a single christening deadline.',
    description: 'Placeholder copy. Replace with the real project write-up.',
    category: 'events',
    tags: ['bonbonniere', 'bulk', 'personalised'],
    images: [],
    materials: ['Resin detail'],
    year: 2025,
    featured: true,
  },
  {
    slug: 'placeholder-wedding-bonbonniere',
    title: 'Wedding Bonbonnière',
    summary: 'A custom favour designed with the couple and produced as a matched set.',
    category: 'events',
    tags: ['bonbonniere', 'wedding'],
    images: [],
    materials: ['Resin detail'],
    year: 2025,
    featured: true,
  },
  {
    slug: 'placeholder-parish-commission',
    title: 'Parish Commission',
    summary: 'A commissioned piece produced at scale for a church community.',
    category: 'events',
    tags: ['commission', 'bulk'],
    images: [],
    materials: ['Matte nylon'],
    year: 2024,
    featured: true,
  },
  {
    slug: 'placeholder-corporate-gifting',
    title: 'Corporate Gifting Set',
    summary: 'Branded keepsakes produced as a repeatable annual run.',
    category: 'events',
    tags: ['corporate', 'bulk', 'repeat'],
    images: [],
    materials: ['Recycled PLA'],
    year: 2024,
  },
];

export const getProject = (slug: string) => projects.find(p => p.slug === slug);
export const featuredProjects = () => projects.filter(p => p.featured);
export const projectsByCategory = (category: Category) => projects.filter(p => p.category === category);
