import type { Guide } from '../../content/guides';
import { guideHero, guideUpdated, monthYear } from '../../lib/guides';
/** Blog cards: each guide's hero photo, category, title, summary and month. Read time stays on
 *  the article itself; on a card, "1 min read" made the shorter posts look thin. */
export default function GuideGrid({ items }: { items: Guide[] }) {
  return <div className="guide-grid">{items.map(guide => {
    const hero = guideHero(guide);
    return <a key={guide.slug} className="guide-card guide-card-photo" href={'/guides/' + guide.slug}>
      <img src={hero.smallSrc} srcSet={`${hero.smallSrc} ${hero.smallWidth}w, ${hero.src} ${hero.width}w`} sizes="(max-width: 650px) 88vw, 44vw" alt={hero.alt} width={hero.smallWidth} height={Math.round(hero.height * hero.smallWidth / hero.width)} loading="lazy"/>
      <span className="section-tag">{guide.category}</span><h3>{guide.title}</h3><p>{guide.summary}</p>
      <span className="guide-card-meta">{monthYear(guideUpdated(guide))}</span>
      <span className="guide-read">Read the guide <span aria-hidden="true">↗</span></span></a>;
  })}</div>;
}
