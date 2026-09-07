'use client';

import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

// Keep the subtle idle animation, but leave time for input and page loading
// between frames. Scroll movement gets the higher frame rate.
export default function PrinterRenderLoop({ active, compact, isScrolling }: { active: boolean; compact: boolean; isScrolling: boolean }) {
  const advance = useThree(state => state.advance);
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
    const render = (now: number) => {
      if (cancelled) return;
      if (!previous || now - previous >= 1000 / fps.current - .5) {
        // Do not jump the animation forward after a suspended/slow frame.
        elapsed += previous ? Math.min((now - previous) / 1000, .1) : 1 / fps.current;
        previous = now;
        advance(elapsed);
      }
      frame = requestAnimationFrame(render);
    };
    // Let the driver compile shaders asynchronously before the first draw.
    // The regular render path remains available on drivers without the extension.
    const start = () => { if (!cancelled) frame = requestAnimationFrame(render); };
    void gl.compileAsync(scene, camera).then(start, start);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [active, advance, camera, clock, gl, scene]);

  return null;
}
