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
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => {
      const wanted = !motion.matches && !connection?.saveData;
      setEnabled(wanted);
      // Start the binaries here, not inside the scene: they are then in flight
      // while the scene's own chunk is still downloading and running.
      if (wanted) preloadPrinterAssets();
    };
    const visibility = () => setActive(!document.hidden);
    visibility(); update();
    motion.addEventListener('change', update); document.addEventListener('visibilitychange', visibility);
    return () => { motion.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!enabled) return;
    // Hold the scene's chunk until the hero has painted, so evaluating it cannot
    // push out the largest contentful paint. Its assets are already downloading.
    // A background tab paints no frames, so the timer releases it there instead.
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setMounted(true)); });
    const fallback = setTimeout(() => setMounted(true), 250);
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(fallback); };
  }, [enabled]);
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
    {mounted && <SceneBoundary><PrinterScene progress={progress} isScrolling={scrolling} active={active}/></SceneBoundary>}
    {/* Ambient dust moves independently so it does not redraw the 3D scene. */}
    <div className="printer-dust">{Array.from({ length: 20 }, (_, i) => <i key={i} style={{
      left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
      '--dust-duration': `${8 + i % 7}s`, '--dust-delay': `-${i * 1.3}s`,
    } as CSSProperties}/>)}</div>
  </>}</div>;
}
