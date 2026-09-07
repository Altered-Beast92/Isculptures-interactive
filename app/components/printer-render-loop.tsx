'use client';

import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

// Keep the subtle idle animation, but leave time for input and page loading
// between frames. Scroll movement gets the higher frame rate.
export default function PrinterRenderLoop({ active, compact, isScrolling, onPressure }: { active: boolean; compact: boolean; isScrolling: boolean; onPressure: () => void }) {
  const advance = useThree(state => state.advance);
  const get = useThree(state => state.get);
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const camera = useThree(state => state.camera);
  const clock = useThree(state => state.clock);
  const fps = useRef(30);
  fps.current = isScrolling ? (compact ? 30 : 60) : 30;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let frame = 0;
    let previous = 0;
    let elapsed = clock.elapsedTime;
    let sampleStart = 0;
    let sampleFrames = 0;
    let sampleCpu = 0;
    const render = (now: number) => {
      if (cancelled) return;
      if (!previous || now - previous >= 1000 / fps.current - .5) {
        // Do not jump the animation forward after a suspended/slow frame.
        elapsed += previous ? Math.min((now - previous) / 1000, .1) : 1 / fps.current;
        previous = now;
        const started = performance.now();
        advance(elapsed);
        // rAF slows down when the GPU cannot keep up, even if gl.render()
        // itself returns quickly. Measure both delivered frames and CPU work.
        if (!sampleStart) sampleStart = now;
        sampleFrames++;
        sampleCpu += performance.now() - started;
        const sampleDuration = now - sampleStart;
        if (sampleDuration >= 1500 && sampleFrames >= 6) {
          const deliveredFps = (sampleFrames - 1) * 1000 / sampleDuration;
          if ((deliveredFps < 18 || sampleCpu / sampleFrames > 20) && get().viewport.dpr > .5) {
            onPressure();
          }
          sampleStart = 0;
          sampleFrames = 0;
          sampleCpu = 0;
        }
      }
      frame = requestAnimationFrame(render);
    };
    // Let the driver compile shaders asynchronously before the first draw.
    // The regular render path remains available on drivers without the extension.
    const start = () => { if (!cancelled) frame = requestAnimationFrame(render); };
    void gl.compileAsync(scene, camera).then(start, start);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [active, advance, camera, clock, get, gl, onPressure, scene]);

  return null;
}
