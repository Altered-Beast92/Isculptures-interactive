import type { Metadata } from 'next';
import { DM_Mono, Manrope, Playfair_Display } from 'next/font/google';
import './globals.css';

// globals.css named these three families but nothing ever loaded them, so every
// heading and label was silently falling back to Arial and the default serif.
// next/font self-hosts them at build time: no request to Google at runtime, and
// the metric-adjusted fallback keeps the swap from shifting layout.
const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
// Playfair carries the italic display words in the headings ("Tangible.",
// "made."), which are part of the homepage LCP, so that cut is preloaded.
const playfair = Playfair_Display({ subsets: ['latin'], style: ['italic'], variable: '--font-serif', display: 'swap' });
// The upright cut is only ever used by the blockquote on /work/[slug]. Loading
// it as a separate instance keeps ~39 KB of it off the homepage critical path;
// display:swap plus the metric-adjusted fallback covers the later arrival.
const playfairUpright = Playfair_Display({ subsets: ['latin'], variable: '--font-serif-upright', display: 'swap', preload: false });
// DM Mono is not a variable font, so the two weights the stylesheet asks for
// have to be listed explicitly. It only sets 10-11px eyebrow labels, so it is
// not worth a preload slot either.
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: 'iSculptures — Ideas Made Tangible',
  description: 'Custom 3D printing, design and production in Sydney.'
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Prefetch rather than preload: the canvas now mounts after hydration, so
  // pulling the model at preload priority only competed with the CSS, fonts and
  // JS that the first paint actually depends on.
  return <html lang="en" className={`${manrope.variable} ${playfair.variable} ${playfairUpright.variable} ${dmMono.variable}`}><head><link rel="prefetch" href="/models/homepage_print.glb" as="fetch" type="model/gltf-binary" crossOrigin="anonymous"/></head><body>{children}</body></html>;
}
