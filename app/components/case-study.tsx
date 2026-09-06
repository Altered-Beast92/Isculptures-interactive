import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProject, projects } from '../../content/projects';
import { testimonialsFor } from '../../content/testimonials';
import { CATEGORY_LABELS, SOURCE_LABELS } from '../../content/types';

// Real photographed examples supplied by the studio.

export async function generateStaticParams() {
  return projects.map(project => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    alternates: { canonical: `/work/${project.slug}` },
    description: project.summary,
    openGraph: { title: project.title, description: project.summary, type: 'article', images: project.images[0] ? [project.images[0].src] : undefined },
  };
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const quotes = testimonialsFor(project.slug);
  const [lead, ...rest] = project.images;

  return <main id="main-content" className="doc">
    <div className="portfolio-breadcrumb"><a href="/work">← Selected work</a></div>
    <article className="study">
      <p className="section-tag">{CATEGORY_LABELS[project.category]}{project.year ? ` · ${project.year}` : ''}</p>
      <h1>{project.title}</h1>
      <p className="study-lede">{project.summary}</p>

      {lead
        ? <img className="study-lead" src={lead.src} alt={lead.alt || project.title} width={lead.width} height={lead.height}/>
        : <div className="study-lead placeholder" role="img" aria-label={`${project.title} — photography pending`}><span>IMAGE PENDING</span></div>}

      <div className="study-body">
        <div>{project.description && <p>{project.description}</p>}</div>
        <dl className="study-meta">
          {project.client && <><dt>Client</dt><dd>{project.client}</dd></>}
          {project.materials?.length ? <><dt>Materials</dt><dd>{project.materials.join(' · ')}</dd></> : null}
          {project.tags?.length ? <><dt>Tags</dt><dd>{project.tags.join(' · ')}</dd></> : null}
        </dl>
      </div>

      {rest.length > 0 && <div className="study-gallery">{rest.map((image, i) => <img key={i} src={image.src} alt={image.alt || `${project.title}, view ${i + 2}`} width={image.width} height={image.height} loading="lazy"/>)}</div>}

      <section className="project-details"><h2>Planning a similar batch?</h2><p>Use this gallery as a reference for your own brief. Tell us the quantity, size, wording and packaging you have in mind, along with your required delivery date.</p><ul><li>Bulk enquiries start at 10 units.</li><li>Design, material, finish and presentation options are reviewed for your order.</li><li>Any sample or approval steps, pricing and timing are confirmed with the quote.</li></ul><a href="/guides/bulk-3d-printing-quote-checklist">See what to include in your enquiry →</a></section>

      {quotes.length > 0 && <section className="study-quotes">{quotes.map(quote => <figure key={quote.id}><blockquote>{quote.quote}</blockquote><figcaption>{quote.author}{quote.company ? `, ${quote.company}` : ''} <span>{SOURCE_LABELS[quote.source]}</span></figcaption></figure>)}</section>}

      <div className="study-cta">
        <a className="primary" href="/enquiry">Start a similar project <span>↗</span></a>
        {project.etsyUrl && <a className="secondary" href={project.etsyUrl} target="_blank" rel="noreferrer">Buy on Etsy <span>↗</span></a>}
      </div>
    </article>
  </main>;
}
