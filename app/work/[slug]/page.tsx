import { projects } from '../../../content/projects';
export { default, generateMetadata } from '../../components/case-study';
export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map(project => ({ slug: project.slug }));
}
