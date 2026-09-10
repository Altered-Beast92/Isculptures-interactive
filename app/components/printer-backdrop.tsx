'use client';
import dynamic from 'next/dynamic';
import { Component, type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { preloadPrinterAssets } from '../../lib/printer-assets';
const PrinterScene = dynamic(() => import('./printer-scene'), { ssr: false });
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function PrinterBackdrop() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(true);
  const [progress, setProgress] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const update = () => {
      const wanted = !motion.matches && !connection?.saveData;
      setEnabled(wanted);
      if (wanted) preloadPrinterAssets();
    };
    const visibility = () => setActive(!document.hidden);
    visibility(); update();
    motion.addEventListener('change', update);
    connection?.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      motion.removeEventListener('change', update);
      connection?.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    if (!enabled) return;
    // Let the hero paint before loading the live scene automatically.
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setMounted(true)); });
    const fallback = setTimeout(() => setMounted(true), 250);
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(fallback); };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    let distance = 1;
    // Cache document measurements on resize, not during every scroll frame.
    const measure = () => { distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setProgress(window.scrollY / distance);
        setScrolling(true);
        clearTimeout(timer);
        timer = setTimeout(() => setScrolling(false), 120);
      });
    };
    const resize = () => { measure(); update(); };
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    measure(); update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect(); clearTimeout(timer); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update); window.removeEventListener('resize', resize);
    };
  }, [enabled]);
  return <div className="world" aria-hidden="true" data-active={active}>
    {enabled && mounted && <>
      <SceneBoundary><PrinterScene progress={progress} isScrolling={scrolling} active={active}/></SceneBoundary>
      <div className="printer-dust">{Array.from({ length: 20 }, (_, i) => <i key={i} style={{
        left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
        '--dust-duration': `${8 + i % 7}s`, '--dust-delay': `-${i * 1.3}s`,
      } as CSSProperties}/>)}</div>
    </>}
  </div>;
}
