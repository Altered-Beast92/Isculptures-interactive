import type { EnquiryRoute } from '../../lib/enquiry';

/* Line marks for the four starting points. They inherit currentColor so a hovered tab flips them with the rest of the card. */
const marks: Record<EnquiryRoute, React.ReactNode> = {
  bulk: <>
    <path d="M4.6 13.6h22.8v3.9H4.6z"/>
    <path d="M6.4 17.5v9.3c0 .9.7 1.6 1.6 1.6h16c.9 0 1.6-.7 1.6-1.6v-9.3"/>
    <path d="M16 13.6v14.8"/>
    <path d="M16 13.6h-4.2a3.5 3.5 0 1 1 0-7c2.9 0 4.2 3.4 4.2 7z"/>
    <path d="M16 13.6h4.2a3.5 3.5 0 1 0 0-7c-2.9 0-4.2 3.4-4.2 7z"/>
  </>,
  supply: <>
    <rect x="2.6" y="19" width="8.2" height="9.4" rx="1"/>
    <rect x="11.9" y="14" width="8.2" height="14.4" rx="1"/>
    <rect x="21.2" y="9" width="8.2" height="19.4" rx="1"/>
    <path d="M2.6 22.4h8.2M6.7 19v3.4"/>
    <path d="M11.9 17.4h8.2M16 14v3.4"/>
    <path d="M21.2 12.4h8.2M25.3 9v3.4"/>
  </>,
  design: <>
    <path d="M26.1 3.3l2.6 2.6L18 16.6l-3.7 1.1 1.1-3.7z"/>
    <path d="M24.2 5.2l2.6 2.6"/>
    <path d="M3.6 27.4c0-7.8 3.4-12.6 8.7-12.6 2 0 3.5.7 4.7 1.9"/>
    <circle cx="3.6" cy="27.4" r="1.8"/>
  </>,
  file: <>
    <path d="M16 2.8l12.2 6.9v13.6L16 30.2 3.8 23.3V9.7z"/>
    <path d="M3.8 9.7L16 16.6l12.2-6.9"/>
    <path d="M16 16.6v13.6"/>
  </>,
};

export default function RouteIcon({ route }: { route: EnquiryRoute }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{marks[route]}</svg>;
}
