'use client';
import { useEffect, useState } from 'react';

const chapters = [
  ['top', 'The studio'], ['b2b', 'Bulk & trade'], ['work', 'Selected work'],
  ['events', 'Events'], ['supply', 'Ongoing supply'], ['printing', 'Parts & design'],
  ['process', 'The process'], ['guides', 'Guides'], ['faq', 'Questions'],
] as const;

export default function ChapterNavigation() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-15% 0px -65% 0px' });
    chapters.forEach(([id]) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);
  return <nav className="chapter-navigation" aria-label="Page chapters">{chapters.map(([id, label], index) => <a key={id} href={'#' + id} aria-label={label} aria-current={active === id ? 'location' : undefined}><span>{String(index).padStart(2, '0')}</span><i aria-hidden="true"/><b>{label}</b></a>)}</nav>;
}
