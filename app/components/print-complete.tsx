import type { CSSProperties } from 'react';
// A small vase printing layer by layer, shown once an enquiry has arrived. The animation lives in
// studio.css (.print-complete), which hard-codes these 12 layers of 6 units. With reduced motion it
// shows the finished vase with the print head parked above it, which is also the drawing's resting state.
const LAYERS = 12;
export default function PrintComplete() {
  return <div className="print-complete" aria-hidden="true">
    <svg viewBox="20 8 160 118" focusable="false">
      <defs><clipPath id="print-complete-shape"><path d="M84 120C78 112 70 102 70 90C70 76 84 68 88 60C89 56 86 52 84 48H116C114 52 111 56 112 60C116 68 130 76 130 90C130 102 122 112 116 120Z"/></clipPath></defs>
      <line className="print-bed" x1="40" y1="121" x2="160" y2="121"/>
      {/* Gaps between the layers let the panel show through as layer lines. */}
      <g clipPath="url(#print-complete-shape)">
        {Array.from({ length: LAYERS }, (_, k) => <rect key={k} className={'print-layer' + (k % 2 ? ' from-right' : '')} x="70" y={114 - 6 * k} width="60" height="5.2" style={{ '--k': k } as CSSProperties}/>)}
      </g>
      <g className="print-rise">
        <line className="print-rail" x1="30" y1="92" x2="170" y2="92"/>
        <g className="print-sweep">
          <rect className="print-carriage" x="60" y="87" width="20" height="10" rx="2"/>
          <rect className="print-block" x="64" y="97" width="12" height="8"/>
          <path className="print-nozzle" d="M66 105h8l-2.5 7h-3z"/>
          <circle className="print-glow" cx="70" cy="113.5" r="2.4"/>
        </g>
      </g>
    </svg>
  </div>;
}
