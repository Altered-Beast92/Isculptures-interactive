// Scroll position drives the rig every frame, so it lives in a plain mutable
// object rather than React state. Routing it through useState re-rendered the
// entire page — every section, the work grid, the whole canvas tree — on every
// scroll event, which was the single largest source of main-thread blocking.
export const scroll = { progress: 0, isScrolling: false };
