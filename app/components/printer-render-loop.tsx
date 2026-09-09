'use client';

import { useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useRef } from 'react';
import { createPrinterFrameDriver } from '../../lib/printer-frame-driver';

type Props = {
  active: boolean;
  compact: boolean;
  isScrolling: boolean;
  progress: number;
  moving: RefObject<boolean>;
  wake: RefObject<(() => void) | null>;
  onPressure: () => void;
};

export default function PrinterRenderLoop({ active, compact, isScrolling, progress, moving, wake, onPressure }: Props) {
  const advance = useThree(state => state.advance);
  const get = useThree(state => state.get);
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);
  const clock = useThree(state => state.clock);
  const width = useThree(state => state.size.width);
  const height = useThree(state => state.size.height);
  const dpr = useThree(state => state.viewport.dpr);
  const fps = useRef(30);
  const presented = useRef(false);
  fps.current = isScrolling && !compact ? 60 : 30;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let sampleStart = 0;
    let sampleFrames = 0;
    let sampleCpu = 0;
    const driver = createPrinterFrameDriver({
      request: requestAnimationFrame,
      cancel: cancelAnimationFrame,
      fps: () => fps.current,
      elapsed: clock.elapsedTime,
      draw: (elapsed, now, first) => {
        // Idle time must not count as a slow device when rendering resumes.
        if (first) { sampleStart = now; sampleFrames = 0; sampleCpu = 0; }
        moving.current = false;
        const started = performance.now();
        advance(elapsed);
        if (!presented.current) {
          // Fade the populated canvas once; CSS handles opacity without more draws.
          gl.domElement.dataset.printerReady = 'true';
          presented.current = true;
        }
        sampleFrames++;
        sampleCpu += performance.now() - started;
        const sampleDuration = now - sampleStart;
        if (sampleDuration >= 1500 && sampleFrames >= 6) {
          const deliveredFps = (sampleFrames - 1) * 1000 / sampleDuration;
          if ((deliveredFps < 18 || sampleCpu / sampleFrames > 20) && get().viewport.dpr > .5) onPressure();
          sampleStart = now; sampleFrames = 0; sampleCpu = 0;
        }
        return moving.current;
      },
    });
    wake.current = driver.wake;
    const start = () => { if (!cancelled) driver.resume(); };
    void gl.compileAsync(scene, camera).then(start, start);
    return () => {
      cancelled = true;
      driver.dispose();
      if (wake.current === driver.wake) wake.current = null;
    };
  }, [active, advance, camera, clock, get, gl, moving, onPressure, scene, wake]);

  // These can change while the last frame is held, including adaptive DPR.
  useEffect(() => { wake.current?.(); }, [compact, dpr, height, isScrolling, progress, wake, width]);
  return null;
}
