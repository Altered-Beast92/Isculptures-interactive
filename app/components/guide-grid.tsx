import type { Guide } from '../../content/guides';
export default function GuideGrid({ items }: { items: Guide[] }) {
  return <div className="guide-grid">{items.map(guide => <a key={guide.slug} className="guide-card" href={'/guides/' + guide.slug}><span className="section-tag">{guide.category}</span><h3>{guide.title}</h3><p>{guide.summary}</p><span className="guide-read">Read the guide <span aria-hidden="true">↗</span></span></a>)}</div>;
}

