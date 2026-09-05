import type { Category, Project } from './types';
// Publish only verified projects with approved photography. No fabricated case studies.
export const projects: Project[] = [];
export const getProject = (slug: string) => projects.find(p => p.slug === slug);
export const featuredProjects = () => projects.filter(p => p.featured);
export const projectsByCategory = (category: Category) => projects.filter(p => p.category === category);
