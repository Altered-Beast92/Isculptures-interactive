'use client';
import { useEffect, useState } from 'react';

const chapters = [
  ['top', 'Home'], ['b2b', 'Bulk orders'], ['work', 'Our work'],
  ['events', 'Events & keepsakes'], ['supply', 'Repeat orders'], ['printing', 'Parts & 3D files'],
  ['process', 'How it works'], ['guides', 'Guides'], ['faq', 'FAQ'],
  ['testimonials', 'Reviews'],
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
  return <nav className="chapter-navigation" aria-label="Page chapters">{chapters.map(([id, label], index) => <a key={id} href={'#' + id} aria-label={`${String(index).padStart(2, '0')} ${label}`} aria-current={active === id ? 'location' : undefined}><span>{String(index).padStart(2, '0')}</span><i aria-hidden="true"/><b>{label}</b></a>)}</nav>;
}
