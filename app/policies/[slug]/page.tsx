import { notFound } from 'next/navigation';
import { policies } from '../../../content/policies';
import { pageMetadata } from '../../../lib/site';
export const dynamicParams = false;
export function generateStaticParams() { return policies.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const policy = policies.find(item => item.slug === slug);
  return policy ? pageMetadata(policy.title + ' | Impeccable Sculptures', policy.intro, '/policies/' + slug) : {};
}
export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const policy = policies.find(item => item.slug === slug); if (!policy) notFound();
  return <main id="main-content" className="document-page"><article><p className="section-tag">STUDIO INFORMATION</p><h1>{policy.title}</h1><p className="document-lede">{policy.intro}</p><div className="document-sections">{policy.sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}</div><a href="mailto:info@isculptures.com.au">Contact info@isculptures.com.au</a></article></main>;
}
