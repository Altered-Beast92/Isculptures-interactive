import { notFound } from 'next/navigation';
import { policies } from '../../../content/policies';
import { CONTACT, pageMetadata } from '../../../lib/site';
import Breadcrumbs from '../../components/breadcrumbs';
export const dynamicParams = false;
export function generateStaticParams() { return policies.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const policy = policies.find(item => item.slug === slug);
  return policy ? pageMetadata(policy.title + ' | Impeccable Sculptures', policy.intro, '/policies/' + slug) : {};
}
export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const policy = policies.find(item => item.slug === slug); if (!policy) notFound();
  return <main id="main-content" className="document-page policy-page"><article>
    <Breadcrumbs items={[{ name: policy.title, path: '/policies/' + slug }]}/>
    <header className="page-intro"><p className="section-tag">STUDIO INFORMATION</p><h1>{policy.title}</h1><p className="document-lede">{policy.intro}</p></header>
    <div className="policy-layout">
      <div className="policy-body">
        {policy.sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
        <aside className="service-cta is-compact"><div><p className="section-tag">QUESTIONS</p><h2>Talk to the studio.</h2><p>Include your enquiry or order reference if you have one.</p></div><div className="service-cta-actions"><a className="primary" href={'mailto:' + CONTACT.email}>{CONTACT.email}</a><a href={'tel:' + CONTACT.tel}>{CONTACT.phone}</a></div></aside>
      </div>
      <div className="policy-index"><p className="section-tag">MORE INFORMATION</p><ul>{policies.map(item => <li key={item.slug}><a href={'/policies/' + item.slug} aria-current={item.slug === slug ? 'page' : undefined}>{item.title}</a></li>)}</ul></div>
    </div>
  </article></main>;
}
