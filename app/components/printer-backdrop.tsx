'use client';
import dynamic from 'next/dynamic';
import { Component, type CSSProperties, type ReactNode, useEffect, useState } from 'react';
const PrinterScene = dynamic(() => import('./printer-scene'), { ssr: false });
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function PrinterBackdrop() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(true);
  const [progress, setProgress] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => setEnabled(!motion.matches && !connection?.saveData);
    const visibility = () => setActive(!document.hidden);
    visibility();
    const timer = window.setTimeout(update, 700);
    motion.addEventListener('change', update); document.addEventListener('visibilitychange', visibility);
    return () => { clearTimeout(timer); motion.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
      setProgress(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)); setScrolling(true);
      clearTimeout(timer); timer = setTimeout(() => setScrolling(false), 120);
    }); };
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [enabled]);
  return <div className="world" aria-hidden="true" data-active={active}>{enabled && <>
    <SceneBoundary><PrinterScene progress={progress} isScrolling={scrolling} active={active}/></SceneBoundary>
    {/* Ambient dust moves independently so it does not redraw the 3D scene. */}
    <div className="printer-dust">{Array.from({ length: 20 }, (_, i) => <i key={i} style={{
      left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
      '--dust-duration': `${8 + i % 7}s`, '--dust-delay': `-${i * 1.3}s`,
    } as CSSProperties}/>)}</div>
  </>}</div>;
}
