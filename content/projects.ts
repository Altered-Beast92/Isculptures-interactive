import type { Category, Project } from './types';
import media from './work-media.json';
// Photographed work examples, not quantified case studies.
export const projects: Project[] = [
  { slug: 'personalised-rose-sculptures', title: 'Personalised rose sculptures', category: 'printing', featured: true,
    summary: 'Bright yellow sculptural roses, each presented on a black base with personalised wording.',
    description: 'A shared design with a personal detail on each base. These yellow roses show how a sculptural keepsake can work as a coordinated batch. Share your preferred colour, wording and quantity so we can review the design and presentation with your quote.',
    tags: ['Custom sculptures', 'Personalised bases', 'Coordinated batches'],
    images: [media['yellow-rose-sculptures']] },
  { slug: 'personalised-favour-tags', title: 'Personalised favour tags', category: 'events',
    summary: 'Purple and white tooth-shaped tags with personalised lettering and lilac ribbon.',
    description: 'These tags add a custom shape and message to the presentation of a favour. Send us your occasion, wording, colour palette and quantity to discuss a matching set. Packaging and contents are confirmed separately with your quote.',
    tags: ['Custom tags', 'Personalised lettering', 'Event details'],
    images: [media['personalised-favour-tags']] },
  { slug: 'ribbon-finished-event-favours', title: 'Ribbon-finished event favours', category: 'events', featured: true,
    summary: 'Sculptural keepsakes, clear presentation boxes and matching ribbon, brought together as a coordinated batch.',
    description: 'These favour arrangements show how the sculpture, box and ribbon can work together across an event table. For your own occasion, tell us the quantity, colour palette, personalisation and delivery date. Packaging options and production timing are confirmed with your quote.',
    tags: ['Event favours', 'Coordinated batches', 'Presentation packaging'],
    images: [media['event-favours'], media['event-display'], media['favour-detail']] },
  { slug: 'personalised-boxed-keepsakes', title: 'Personalised boxed keepsakes', category: 'events',
    summary: 'White sculptural pieces and presentation boxes, with personalised tags and ribbon details.',
    description: 'A keepsake can carry the details of an occasion through its presentation as well as the piece itself. These examples show clear boxes, gold accents and white bows. Share the wording and finish you have in mind so we can discuss the complete order.',
    tags: ['Bonbonniere', 'Personalisation', 'Gift packaging'],
    images: [media['boxed-keepsakes'], media['personalised-batch'], media['ribbon-tag']] },
  { slug: 'commemorative-religious-icons', title: 'Commemorative religious icons', category: 'printing',
    summary: 'Arched religious icons with personalised bases for a shared occasion or commemorative gift.',
    description: 'These icons pair detailed relief designs with a personalised inscription at the base. Enquiries from parishes, community groups and event organisers are welcome. Send your preferred design, wording and quantity for review.',
    tags: ['Religious keepsakes', 'Commemorative gifts', 'Personalised bases'],
    images: [media['commemorative-icons']] },
  { slug: 'personalised-gift-boxes', title: 'Personalised gift boxes', category: 'events', featured: true,
    summary: 'Heart-shaped gift boxes with contrasting ribbons and individual message plaques.',
    description: 'Colour, ribbon and wording give these gift boxes their own character. Use these examples as a starting point for a gifting brief, then tell us the occasion and quantity. Contents, packaging and any design changes are agreed as part of the quote.',
    tags: ['Custom gift boxes', 'Message plaques', 'Colour options'],
    images: [media['gift-boxes'], media['pink-gift-box'], media['red-gift-box']] },
  { slug: 'custom-sculptures-keepsakes', title: 'Custom sculptures & keepsakes', category: 'printing', featured: true,
    summary: 'Character, expression and a gold-coloured finish. Sculptural pieces with a personal touch.',
    description: 'These character figures show another direction for a custom sculpture brief. Share the subject, approximate dimensions, finish and quantity you have in mind. Design requirements and production details are reviewed with your quote.',
    tags: ['Character sculptures', 'Custom keepsakes', 'Decorative pieces'],
    images: [media['custom-sculptures']] },
];
export const getProject = (slug: string) => projects.find(p => p.slug === slug);
export const featuredProjects = () => projects.filter(p => p.featured);
export const projectsByCategory = (category: Category) => projects.filter(p => p.category === category);
