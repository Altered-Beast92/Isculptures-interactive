import type { Category, Project } from './types';
import media from './work-media.json';
// Photographed work examples, not quantified case studies.
export const projects: Project[] = [
  { slug: 'personalised-rose-sculptures', title: 'Personalised rose sculptures', category: 'printing', featured: true,
    summary: 'Yellow rose sculptures on black bases, each with its own personalised wording.',
    description: 'One rose design printed as a batch, with different wording on each base. If you’d like something similar, send us the colour, wording and quantity, and we’ll quote the design and presentation.',
    tags: ['Custom sculptures', 'Personalised bases', 'Batch orders'],
    images: [media['yellow-rose-sculptures']] },
  { slug: 'personalised-favour-tags', title: 'Personalised favour tags', category: 'events',
    summary: 'Tooth-shaped tags in purple and white with personalised lettering, tied on with lilac ribbon.',
    description: 'Custom-shaped tags like these put a name or message on a favour. Tell us the occasion, wording, colours and how many you need, and we’ll quote a matching set. Packaging and anything that goes inside are quoted separately.',
    tags: ['Custom tags', 'Personalised lettering', 'Event details'],
    images: [media['personalised-favour-tags']] },
  { slug: 'ribbon-finished-event-favours', title: 'Boxed sculpture favours with ribbon', category: 'events', featured: true,
    summary: 'Small white sculptures in clear boxes, finished with matching green ribbon for an event table.',
    description: 'Each favour pairs a small sculpture with a clear box and ribbon, so the whole table matches. For your event, tell us the quantity, colours, any personalisation and your delivery date. We’ll quote packaging options and timing with the order.',
    tags: ['Event favours', 'Batch orders', 'Presentation boxes'],
    images: [media['event-favours'], media['event-display'], media['favour-detail']] },
  { slug: 'personalised-boxed-keepsakes', title: 'Personalised boxed keepsakes', category: 'events',
    summary: 'White sculptural keepsakes in clear boxes with gold tags and white bows.',
    description: 'The box, tag and bow can carry the details of the day as much as the piece inside. Send us your wording and the finish you’re after, and we’ll quote the whole order.',
    tags: ['Bonbonniere', 'Personalisation', 'Gift packaging'],
    images: [media['boxed-keepsakes'], media['personalised-batch'], media['ribbon-tag']] },
  { slug: 'commemorative-religious-icons', title: 'Commemorative religious icons', category: 'printing',
    summary: 'Arched religious icons with a personalised inscription on the base, for a shared occasion or commemorative gift.',
    description: 'Each icon pairs a detailed relief with a personalised inscription on the base. Parishes, community groups and event organisers are welcome to get in touch. Send us the design you’d like, the wording and the quantity.',
    tags: ['Religious keepsakes', 'Commemorative gifts', 'Personalised bases'],
    images: [media['commemorative-icons']] },
  { slug: 'personalised-gift-boxes', title: 'Heart-shaped personalised gift boxes', category: 'events', featured: true,
    summary: 'Heart-shaped gift boxes with contrasting ribbon and a personal message plaque on each.',
    description: 'Colour, ribbon and wording give each of these boxes its own look. Use them as a starting point, then tell us the occasion and how many you need. Contents, packaging and any design changes are worked out in your quote.',
    tags: ['Custom gift boxes', 'Message plaques', 'Colour options'],
    images: [media['gift-boxes'], media['pink-gift-box'], media['red-gift-box']] },
  { slug: 'custom-sculptures-keepsakes', title: 'Gold character sculptures', category: 'printing', featured: true,
    summary: 'Gold-coloured character figures full of expression, made as custom sculptures.',
    description: 'These figures show what a custom character sculpture can look like. Send us the subject, rough size, finish and quantity, and we’ll work out the design involved in your quote.',
    tags: ['Character sculptures', 'Custom keepsakes', 'Decorative pieces'],
    images: [media['custom-sculptures']] },
];
export const getProject = (slug: string) => projects.find(p => p.slug === slug);
export const featuredProjects = () => projects.filter(p => p.featured);
export const projectsByCategory = (category: Category) => projects.filter(p => p.category === category);
