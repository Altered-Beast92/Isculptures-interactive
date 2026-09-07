# Printer rendering and performance

The homepage automatically loads its 3D printer and keeps scroll-driven print
height, moving filament, spool rotation and camera movement. It renders only
while something changes, then holds its last frame without queuing animation
callbacks. Scrolling, resizing, adaptive resolution, model readiness and returning
to a visible tab wake it again. Ambient particles use independent CSS transforms.

Active rendering is capped at 30 fps on mobile, up to 60 fps during desktop
scrolling, and 30 fps while movement settles. Mobile DPR is capped at 1 and desktop
at 1.5, with the adaptive reduction described below. A hidden tab pauses rendering
without destroying the WebGL context.

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

## Follow-up: sustained rendering on slow devices

GTmetrix subsequently timed out too. A live-site check found no stuck or
third-party requests (22 completed requests). In a more demanding reproduction,
Chrome with SwiftShader, 6x CPU slowdown, a 1440 x 1000 viewport and device scale
factor 2 kept producing long tasks after load. The initial scene rendered at DPR
1.5. This can interfere with the CPU-idle condition required by GTmetrix:
https://gtmetrix.com/blog/browser-timings/

The renderer now samples delivered frame rate and CPU render time over at least
1.5 seconds and six frames. Sustained performance below 18 fps or over 20 ms CPU
per frame reduces the render resolution by 25%, down to a minimum DPR of 0.5.
The model, lighting, particles and print animation remain active. The adjustment
uses measured performance for every visitor, without identifying test services.
Normal mobile/desktop browsers retained their initial DPR of 1/1.5 in checks.
Resolution remains lowered for that scene's lifetime to avoid repeated switches;
scroll updates preserve it, and a newly mounted scene starts at normal quality.

In the final 15-second observation window of the slow-renderer reproduction:

| Measurement | Deployed fixed-resolution version | Local adaptive version |
| --- | ---: | ---: |
| Longest CPU-idle interval | 4.54 s | 12.61 s |
| Main scene renders | 45 | 162 |
| Maximum measured render call | 88 ms | 38.3 ms |
| Pending / failed requests | 0 / 0 | 0 / 0 |

This reproduces a relevant failure mode, not the remote providers' exact machines.
The adaptive version still requires deployment and independent hosted retesting.
The direct PageSpeed API was unavailable to this session due to its API quota;
that does not establish why the user's PageSpeed UI or GTmetrix timed out.

The production build and type checks passed. Browser interaction checks also
confirmed that reduced resolution persists through scrolling and that model
clipping, camera movement, tab visibility, navigation and normal-device quality
continue working.

## Follow-up: render only when the printer changes

The hosted PageSpeed report supplied on 8 September 2026 scored 43 on mobile,
with 26,780 ms total blocking time and 39.3 seconds of main-thread work. The
largest category was Other (38.1 seconds), and all 20 listed longest tasks pointed
to the printer bundle, including tasks late in the capture. That bundle already
contained the earlier adaptive-resolution change. These findings motivated
removing sustained idle rendering rather than assuming resolution alone fixed it.

Report: https://pagespeed.web.dev/analysis/https-isculptures-interactive-vercel-app/w2zjg5r70f?form_factor=mobile

The new frame driver stops scheduling rAF after the camera, rig and carriage
settle. Its first frame uses the current scroll position immediately. A late GLB
shader compilation explicitly wakes the stopped driver so the print appears even
without further input. Damping continues after scroll events end, and idle time
is excluded from animation deltas and adaptive performance samples. Printer
transforms update before the filament geometry and cached shadow.

No crawler detection is involved. The same behaviour runs for visitors and audit
services. The existing reduced-motion and data-saving preferences still apply.
Preview indexing settings remain unchanged; the report's SEO warning is separate.

### Responsive logo

The header/footer previously downloaded a 517,594-byte PNG. Its 2889 x 557 source
now produces 400, 800 and 1200 px WebP variants of 12,818, 34,074 and 58,640 bytes.
The shared logo uses srcset and reserves the correct intrinsic aspect ratio.
Regenerate with `node scripts/prepare-brand-logo.mjs`; retain the original PNG.

### Verification

- All 16 tests pass, including four frame-driver regressions for zero idle
  callbacks, late asset wake-ups, scroll coalescing, frame-rate limits, hidden-tab
  cancellation, bounded resume deltas and disposal.
- TypeScript and the production export build pass.
- An instrumented production export in the in-app browser showed zero WebGL draw
  calls per second after initial load and after scrolling settled. At 70% scroll,
  model clipping changed from -0.8876 to 0.6579 and the camera moved accordingly.
- Resizing from 1265 to 390 px retained the same canvas, visible 17,999-vertex
  model and stable 35-geometry count. Returning to the top restored the initial
  camera. Simulated hidden/visible transitions suspended and resumed rendering
  with the same canvas. No page errors were reported.
- With the GLB response deliberately delayed by 15 seconds on mobile at #work,
  the rig reached zero draw calls while waiting. Model readiness then triggered
  a redraw, revealed the original model and returned to zero draw calls without
  any user input.
- Local Lighthouse 13.4.1 mobile reports completed without audit runtime errors:

| Chrome configuration | Performance | FCP | LCP | TBT | Speed index |
| --- | ---: | ---: | ---: | ---: | ---: |
| Default headless | 57 | 2.1 s | 8.6 s | 640 ms | 2.2 s |
| Headless with GPU disabled | 60 | 2.1 s | 5.6 s | 740 ms | 2.3 s |

These are diagnostic local runs against an uncompressed static server, not a
before/after comparison or a prediction of hosted PageSpeed scores. Initial
loading is still expensive. The Lighthouse CLI saved both complete reports, then
returned EPERM while cleaning its temporary Windows Chrome profiles; the error
was in cleanup, not in either report. Reports and the browser diagnostic fixture
are in the ignored artifacts directory. Deployment and a fresh hosted audit are
still required to assess the remote outcome.
