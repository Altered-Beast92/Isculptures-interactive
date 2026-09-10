'use client';
import { useEffect, useRef, useState } from 'react';
import { PRINTER_RIG, PRINTER_MESH, PRINTER_STUDIO, PRINTER_SHADOW, printerAsset } from '../../lib/printer-assets';
import type { PrinterState, PrinterViewState, createPrinterRenderer } from '../../lib/printer-scene';
export default function PrinterScene(props: PrinterState) {
  const container = useRef<HTMLDivElement>(null);
  const state = useRef(props); state.current = props;
  const update = useRef<(() => void) | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false, fallingBack = false;
    let worker: Worker | undefined;
    let renderer: ReturnType<typeof createPrinterRenderer> | undefined;
    let canvas: HTMLCanvasElement;
    const view = (): PrinterViewState => ({ ...state.current, width: element.clientWidth, height: element.clientHeight, dpr: window.devicePixelRatio });
    const makeCanvas = () => {
      const node = document.createElement('canvas');
      Object.assign(node.style, { display: 'block', width: '100%', height: '100%' });
      element.replaceChildren(node); return node;
    };
    const fallback = async () => {
      if (disposed || fallingBack) return;
      fallingBack = true; worker?.terminate(); worker = undefined;
      // A transferred canvas cannot acquire a main-thread context; replace it.
      canvas = makeCanvas();
      try {
        const { createPrinterRenderer } = await import('../../lib/printer-scene');
        if (disposed) return;
        renderer = createPrinterRenderer(canvas, view, setError, () => { canvas.dataset.printerReady = 'true'; });
      } catch (error) { if (!disposed) setError(error instanceof Error ? error : new Error(String(error))); }
    };
    canvas = makeCanvas();
    if (typeof Worker !== 'undefined' && typeof canvas.transferControlToOffscreen === 'function') {
      try {
        worker = new Worker(new URL('../../lib/printer.worker.ts', import.meta.url), { type: 'module', name: 'isculptures-printer' });
        worker.onerror = event => { event.preventDefault(); void fallback(); };
        worker.onmessage = event => {
          if (disposed || fallingBack) return;
          if (event.data?.type === 'ready') canvas.dataset.printerReady = 'true';
          if (event.data?.type === 'error') void fallback();
        };
        const offscreen = canvas.transferControlToOffscreen();
        // Preserve the preload cache for a fallback/remount; transfer copies once.
        void Promise.all([PRINTER_RIG, PRINTER_MESH, PRINTER_STUDIO, PRINTER_SHADOW].map(url => printerAsset(url).then(data => data.slice(0)))).then(([rig, model, environment, shadow]) => {
          if (disposed || !worker) return;
          worker.postMessage({ type: 'init', canvas: offscreen, state: view(), buffers: { rig, model, environment, shadow } }, [offscreen, rig, model, environment, shadow]);
        }).catch(() => { void fallback(); });
      } catch { void fallback(); }
    } else { void fallback(); }
    const notify = () => {
      if (disposed) return;
      worker?.postMessage({ type: 'update', state: view() });
      renderer?.update();
    };
    update.current = notify;
    const observer = new ResizeObserver(notify); observer.observe(element);
    window.addEventListener('resize', notify);
    return () => {
      disposed = true; observer.disconnect(); window.removeEventListener('resize', notify);
      update.current = null; worker?.terminate(); renderer?.dispose(); canvas.remove();
    };
  }, []);
  useEffect(() => { update.current?.(); }, [props.active, props.progress, props.isScrolling]);
  if (error) throw error;
  return <div ref={container} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}/>;
}
