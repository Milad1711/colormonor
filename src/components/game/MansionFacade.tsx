"use client";

/** Cartoon facade of the Color Manor. Windows light up as wings unlock. */
export function MansionFacade({
  unlockedCount = 1,
  className,
}: {
  unlockedCount?: number;
  className?: string;
}) {
  const lit = Math.min(unlockedCount, 7);
  const winColor = (i: number) => (i < lit ? "#FFE08A" : "#E9DFC8");
  const winStroke = (i: number) => (i < lit ? "#D9A62E" : "#B9A98C");
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Color Manor">
      <defs>
        <linearGradient id="facade-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7E0F2" />
          <stop offset="1" stopColor="#F4E9CF" />
        </linearGradient>
        <linearGradient id="facade-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8ECD7" />
          <stop offset="1" stopColor="#EFD9B4" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="220" rx="20" fill="url(#facade-sky)" />
      <circle cx="330" cy="44" r="26" fill="#FFD98A" />
      <circle cx="330" cy="44" r="34" fill="#FFD98A" opacity="0.35" />
      <path d="M60 58 q 20 -12 40 0 q 20 -12 40 0" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
      <path d="M180 40 q 16 -10 32 0" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
      {/* manor body */}
      <rect x="86" y="86" width="228" height="106" rx="8" fill="url(#facade-body)" stroke="#D9BF98" strokeWidth="3" />
      {/* upper block */}
      <rect x="120" y="52" width="160" height="44" rx="6" fill="#F3E2C4" stroke="#D9BF98" strokeWidth="3" />
      {/* roofs */}
      <path d="M74 90 L200 18 L326 90 Z" fill="#C96F45" stroke="#A45B33" strokeWidth="3" />
      <path d="M112 56 L200 26 L288 56 Z" fill="#B25F3A" stroke="#A45B33" strokeWidth="3" />
      <rect x="252" y="26" width="14" height="26" rx="3" fill="#8C5B33" />
      <rect x="140" y="34" width="12" height="22" rx="3" fill="#8C5B33" />
      {/* door */}
      <rect x="184" y="140" width="32" height="52" rx="6" fill="#8C5B33" stroke="#6F4526" strokeWidth="2" />
      <circle cx="208" cy="168" r="2.5" fill="#F5B301" />
      <rect x="178" y="134" width="44" height="8" rx="4" fill="#C96F45" />
      {/* upper windows */}
      {[138, 176, 214, 252].map((x, i) => (
        <g key={i}>
          <rect x={x} y="60" width="24" height="26" rx="4" fill={winColor(i)} stroke={winStroke(i)} strokeWidth="2.5" />
          <line x1={x + 12} y1="60" x2={x + 12} y2="86" stroke={winStroke(i)} strokeWidth="2" />
        </g>
      ))}
      {/* lower windows */}
      {[110, 148, 240, 278].map((x, i) => (
        <g key={i}>
          <rect x={x} y="106" width="26" height="30" rx="4" fill={winColor(i + 4)} stroke={winStroke(i + 4)} strokeWidth="2.5" />
          <line x1={x + 13} y1="106" x2={x + 13} y2="136" stroke={winStroke(i + 4)} strokeWidth="2" />
          <line x1={x} y1="121" x2={x + 26} y2="121" stroke={winStroke(i + 4)} strokeWidth="2" />
        </g>
      ))}
      {/* ground */}
      <rect x="0" y="192" width="400" height="28" rx="10" fill="#9BCF8E" />
      <ellipse cx="74" cy="196" rx="26" ry="14" fill="#7FAF6E" />
      <ellipse cx="330" cy="196" rx="28" ry="15" fill="#7FAF6E" />
      <ellipse cx="352" cy="204" rx="18" ry="9" fill="#8BC48A" />
      <ellipse cx="52" cy="206" rx="16" ry="8" fill="#8BC48A" />
      <path d="M168 220 L188 192 L212 192 L232 220 Z" fill="#E8D9B5" />
      {/* colorful flower dots on bushes */}
      {["#E2725B", "#F5B301", "#F06EA9", "#A267D8"].map((c, i) => (
        <circle key={i} cx={62 + i * 6} cy={200 - (i % 2) * 8} r="3" fill={c} />
      ))}
      {["#5A8FDE", "#E2725B", "#F5B301", "#F06EA9"].map((c, i) => (
        <circle key={i} cx={320 + i * 7} cy={202 - (i % 2) * 8} r="3" fill={c} />
      ))}
    </svg>
  );
}
