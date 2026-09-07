# Printer rendering and performance

The homepage keeps its animated 3D printer, moving filament, scroll-driven print
height, camera movement and particles. It uses a 30 fps idle loop, 30 fps mobile
scrolling and up to 60 fps desktop scrolling. Mobile rendering uses device pixel
ratio 1; desktop is capped at 1.5. A hidden tab pauses rendering without destroying
the WebGL context.

The ground shadow is captured once in the printer's coordinate system and moves
with the rig. The solid base supplies its footprint; the growing print does not
need a freshly blurred floor shadow every frame.

## Studio lighting asset

`public/models/printer-studio.bin.gz` contains the original studio lighting,
already converted to Three.js's prefiltered CubeUV format. This moves environment
capture and filtering out of visitors' browsers. It is 83,821 bytes compressed,
with a 384 x 512 RGBA half-float atlas. The source geometry and lights are in the
bake script. No new npm dependencies are required.

Regenerate it after changing studio lighting or upgrading Three.js:

```powershell
node scripts/bake-printer-environment.mjs
```

The script uses the installed Three.js version (0.185.1 for this bake) and a
separate headless Chrome/Chromium profile. Set `CHROME_PATH` if the browser is not
in a standard location. Rebuild the site after regenerating the asset. The loader
accepts both gzip bytes and an HTTP response already decompressed by its host.

## Local verification, 8 September 2026

Lighthouse mobile, identical local production-export server and Chrome setup:

| Metric | Original | Optimised |
| --- | ---: | ---: |
| Performance score | 46 | 57 |
| Total blocking time | 1,590 ms | 680 ms |
| Largest contentful paint | 9.5 s | 7.6 s |
| First contentful paint | 2.1 s | 2.1 s |

These are individual local lab runs, not PageSpeed Insights results. The local
server serves uncompressed files and does not reproduce Vercel's CDN. Scores
vary; the change still needs deployment and a new hosted PageSpeed run. An
additional run forcing SwiftShader software rendering completed without a
Lighthouse runtime error (49 performance, 1,160 ms blocking time).

Instrumented mobile rendering fell from approximately 4,447 to 1,048 draw calls
per second while idle. The longest observed startup task in that separate,
unthrottled browser check fell from 555 ms to 156 ms.

Browser checks verified at 390 px and 1440 px:

- The original 17,999-vertex model loads and remains visible.
- Scroll changes the print's clipping height and the camera position.
- Geometry count remains stable through repeated scrolling.
- Hidden-tab rendering stops and resumes with the same canvas.
- Viewport resizing retains the canvas and animation.
- The enquiry link and navigation back to the homepage work without page errors.
- The existing reduced-motion preference remains respected.

TypeScript, the production build and all 12 existing tests passed. Local reports,
interaction results and screenshots are in the ignored `artifacts` directory.
