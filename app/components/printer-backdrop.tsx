'use client';
import dynamic from 'next/dynamic';
import { Component, type ReactNode, useEffect, useRef, useState } from 'react';
const PrinterScene = dynamic(() => import('./printer-scene'), { ssr: false });
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function PrinterBackdrop() {
  const container = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => setEnabled(!motion.matches && !connection?.saveData && !document.hidden);
    const timer = window.setTimeout(update, 700);
    motion.addEventListener('change', update); document.addEventListener('visibilitychange', update);
    return () => { clearTimeout(timer); motion.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (!enabled || !inView) return;
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
      setProgress(Math.min(1, window.scrollY / Math.max(1, container.current?.offsetHeight || window.innerHeight))); setScrolling(true);
      clearTimeout(timer); timer = setTimeout(() => setScrolling(false), 120);
    }); };
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); window.removeEventListener('scroll', update); };
  }, [enabled, inView]);
  return <div ref={container} className="world" aria-hidden="true">{enabled && inView && <SceneBoundary><PrinterScene progress={progress} isScrolling={scrolling}/></SceneBoundary>}</div>;
}
