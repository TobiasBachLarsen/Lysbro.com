// Compass rose mark — used as small icon (sidebar, favicon)
export function AgoraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="white" xmlns="http://www.w3.org/2000/svg">
      {/* 8-pointed compass star */}
      <path d="M50 22 L53.06 42.61 L61.31 38.69 L57.39 46.94 L78 50 L57.39 53.06 L61.31 61.31 L53.06 57.39 L50 78 L46.94 57.39 L38.69 61.31 L42.61 53.06 L22 50 L42.61 46.94 L38.69 38.69 L46.94 42.61 Z" />
      {/* Crosshair lines */}
      <line x1="50" y1="4"  x2="50" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="78" x2="50" y2="96" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="4"  y1="50" x2="22" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="78" y1="50" x2="96" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Full logo with circle + curved "AGORA" text — used on login/register
export function AgoraLogoFull({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="white" xmlns="http://www.w3.org/2000/svg">
      {/* 8-pointed compass star */}
      <path d="M50 26 L52.8 43.8 L60.2 36.4 L57.4 44.6 L74 50 L57.4 55.4 L60.2 63.6 L52.8 56.2 L50 74 L47.2 56.2 L39.8 63.6 L42.6 55.4 L26 50 L42.6 44.6 L39.8 36.4 L47.2 43.8 Z" />
      {/* Crosshair lines */}
      <line x1="50" y1="8"  x2="50" y2="26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="74" x2="50" y2="92" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8"  y1="50" x2="26" y2="50" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="50" x2="92" y2="50" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Outer circle */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="0.8" />
      {/* Curved "AGORA" text on top arc */}
      <defs>
        <path id="topArc" d="M 6 50 A 44 44 0 0 1 94 50" />
      </defs>
      <text fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" letterSpacing="5" fill="white">
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">AGORA</textPath>
      </text>
    </svg>
  );
}
