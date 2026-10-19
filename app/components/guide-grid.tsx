import type { Guide } from '../../content/guides';
import { guideHero, guideReadMinutes, guideUpdated, monthYear } from '../../lib/guides';
/** `photos` adds each guide's hero photo and read time. Left off, the cards stay text only, as on the service pages. */
export default function GuideGrid({ items, photos = false }: { items: Guide[]; photos?: boolean }) {
  return <div className="guide-grid">{items.map(guide => {
    const hero = photos ? guideHero(guide) : null;
    return <a key={guide.slug} className={'guide-card' + (hero ? ' guide-card-photo' : '')} href={'/guides/' + guide.slug}>
      {hero && <img src={hero.smallSrc} srcSet={`${hero.smallSrc} ${hero.smallWidth}w, ${hero.src} ${hero.width}w`} sizes="(max-width: 650px) 88vw, 44vw" alt={hero.alt} width={hero.smallWidth} height={Math.round(hero.height * hero.smallWidth / hero.width)} loading="lazy"/>}
      <span className="section-tag">{guide.category}</span><h3>{guide.title}</h3><p>{guide.summary}</p>
      {hero && <span className="guide-card-meta">{guideReadMinutes(guide)} min read &middot; {monthYear(guideUpdated(guide))}</span>}
      <span className="guide-read">Read the guide <span aria-hidden="true">↗</span></span></a>;
  })}</div>;
}
