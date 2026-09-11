import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProject } from '../../content/projects';
import { testimonialsFor } from '../../content/testimonials';
import { SOURCE_LABELS } from '../../content/types';
import { pageMetadata } from '../../lib/site';
import Breadcrumbs from './breadcrumbs';
import MockupNote from './mockup-note';

// Real photographed examples supplied by the studio.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const metadata = pageMetadata(project.title, project.summary, `/work/${project.slug}`);
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, type: 'article', images: project.images[0] ? [project.images[0].src] : undefined },
  };
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const quotes = testimonialsFor(project.slug);
  const [lead, ...rest] = project.images;
  const enquiryUrl = `/enquiry?route=${project.category === 'events' ? 'bulk' : 'design'}&project=${encodeURIComponent(project.title)}`;

  return <main id="main-content" className="doc">
    <Breadcrumbs items={[{ name: 'Our work', path: '/work' }, { name: project.title, path: '/work/' + project.slug }]}/>
    <article className="study">
      <div className="study-hero"><div className="study-intro">
      <p className="section-tag">OUR WORK{project.year ? ` · ${project.year}` : ''}</p>
      <h1>{project.title}</h1>
      <p className="study-lede">{project.summary}</p>
      <a className="primary" href={enquiryUrl}>Ask about something similar ↗</a>
      <p className="study-order-note">The minimum order is 10 units. We’ll confirm the design, finish and timing in your quote.</p>
      <MockupNote/>
      </div>
      {lead
        ? <img className="study-lead" src={lead.src} alt={lead.alt || project.title} width={lead.width} height={lead.height}/>
        : <div className="study-lead placeholder" role="img" aria-label={`${project.title} — photography pending`}><span>IMAGE PENDING</span></div>}
      </div>
      <div className="study-body">
        <div>{project.description && <p>{project.description}</p>}</div>
        <dl className="study-meta">
          {project.client && <><dt>Client</dt><dd>{project.client}</dd></>}
          {project.materials?.length ? <><dt>Materials</dt><dd>{project.materials.join(' · ')}</dd></> : null}
          {project.tags?.length ? <><dt>Details</dt><dd>{project.tags.join(' · ')}</dd></> : null}
        </dl>
      </div>

      {rest.length > 0 && <div className="study-gallery">{rest.map((image, i) => <img key={i} src={image.src} alt={image.alt || `${project.title}, view ${i + 2}`} width={image.width} height={image.height} loading="lazy"/>)}</div>}

      <section className="project-details"><h2>Want something like this?</h2><p>Feel free to use these photos as a reference. Tell us the quantity, size, wording and packaging you have in mind, and when you need it delivered.</p><ul><li>The minimum order is 10 units.</li><li>We’ll go through design, material, finish and packaging options with you.</li><li>Pricing, timing and any samples are set out in your quote.</li></ul><a href="/guides/bulk-3d-printing-quote-checklist">What to include in your enquiry →</a></section>

      {quotes.length > 0 && <section className="study-quotes">{quotes.map(quote => <figure key={quote.id}><blockquote>{quote.quote}</blockquote><figcaption>{quote.author}{quote.company ? `, ${quote.company}` : ''} <span>{SOURCE_LABELS[quote.source]}</span></figcaption></figure>)}</section>}

      <div className="study-cta">
        <a className="primary" href={enquiryUrl}>Get a quote <span>↗</span></a>
        {project.etsyUrl && <a className="secondary" href={project.etsyUrl} target="_blank" rel="noreferrer">Buy on Etsy <span>↗</span></a>}
      </div>
    </article>
  </main>;
}
