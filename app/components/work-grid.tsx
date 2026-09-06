import type { Project } from '../../content/types';
export default function WorkGrid({ items }: { items: Project[] }) {
  return <div className="portfolio-grid">{items.map(project => {
    const photo = project.images[0];
    return <a className="portfolio-card" href={'/work/' + project.slug} key={project.slug}>
      <img src={photo.src} srcSet={photo.smallWidth && photo.width && photo.smallWidth < photo.width ? `${photo.src.replace('.webp', '-small.webp')} ${photo.smallWidth}w, ${photo.src} ${photo.width}w` : undefined} sizes="(max-width: 650px) 88vw, (max-width: 1000px) 44vw, 30vw" alt={photo.alt} width={photo.width} height={photo.height} loading="lazy"/>
      <div><h3>{project.title} <span aria-hidden="true">↗</span></h3><p>{project.summary}</p></div>
    </a>;
  })}</div>;
}
