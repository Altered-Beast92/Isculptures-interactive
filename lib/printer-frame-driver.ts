type FrameDriverOptions = {
  request: (callback: (now: number) => void) => number;
  cancel: (id: number) => void;
  fps: () => number;
  draw: (elapsed: number, now: number, first: boolean) => boolean;
  elapsed?: number;
};

// A stopped driver has no queued rAF. Call wake when the scene changes; draw
// returns true only while motion still needs to settle.
export function createPrinterFrameDriver({ request, cancel, fps, draw, elapsed = 0 }: FrameDriverOptions) {
  let frame: number | null = null;
  let previous: number | null = null;
  let enabled = false;
  let disposed = false;
  let dirty = false;
  const queue = () => {
    if (enabled && !disposed && frame === null) frame = request(render);
  };
  const render = (now: number) => {
    frame = null;
    if (!enabled || disposed) return;
    const interval = 1000 / fps();
    if (previous !== null && now - previous < interval - .5) { queue(); return; }
    const first = previous === null;
    elapsed += first ? interval / 1000 : Math.min((now - previous!) / 1000, .1);
    previous = now;
    dirty = false;
    const moving = draw(elapsed, now, first);
    if (moving || dirty) queue();
    else previous = null;
  };
  const wake = () => { dirty = true; queue(); };
  const suspend = () => {
    enabled = false;
    if (frame !== null) cancel(frame);
    frame = null;
    previous = null;
  };
  return {
    wake,
    resume: () => { enabled = true; wake(); },
    suspend,
    dispose: () => { suspend(); disposed = true; },
  };
}
