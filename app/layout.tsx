import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'iSculptures — Ideas Made Tangible',
  description: 'Custom 3D printing, design and production in Sydney.'
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
