"use client";

/**
 * MansionFacade — rich pseudo-3D cartoon manor with left-lit shading,
 * protruding tower, two wings, lit windows (one per unlocked wing),
 * animated smoke, balloons, clouds, garden, path and lamps.
 */

function Win({
  x,
  y,
  w,
  h,
  lit,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lit: boolean;
}) {
  return (
    <g>
      {lit && <circle className="winlit" cx={x + w / 2} cy={y + h / 2} r={Math.max(w, h) * 1.1} fill="url(#mf-halo)" />}
      <rect x={x - 3.5} y={y - 3.5} width={w + 7} height={h + 7} rx={7} fill="#8A5A33" />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={5}
        fill={lit ? "url(#mf-glasslit)" : "url(#mf-glass)"}
        stroke="#B98A55"
        strokeWidth="2"
      />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#8A5A33" strokeWidth="2.5" />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#8A5A33" strokeWidth="2.5" />
      {/* glass diagonal shine */}
      <path d={`M${x} ${y + h * 0.8} L${x + w * 0.75} ${y} L${x + w} ${y} L${x + w * 0.3} ${y + h} Z`} fill="#FFFFFF" opacity={lit ? 0.28 : 0.35} />
    </g>
  );
}

function Smoke({ x, y, base }: { x: number; y: number; base: number }) {
  return (
    <g fill="#FFFFFF">
      {[0, 0.9, 1.8].map((d, i) => (
        <circle
          key={i}
          className="smoke"
          cx={x}
          cy={y}
          r={4.5 - i * 0.6}
          opacity={0.85 - i * 0.15}
          style={{ animationDelay: `${base + d}s` }}
        />
      ))}
    </g>
  );
}

function Balloon({ x, y, c, delay }: { x: number; y: number; c: string; delay: number }) {
  return (
    <g className="balloon" style={{ animationDelay: `${delay}s` }}>
      <path d={`M${x} ${y + 15} q 6 14 2 30`} fill="none" stroke="#B98A55" strokeWidth="1.6" />
      <ellipse cx={x} cy={y} rx={11} ry={14} fill={c} stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
      <ellipse cx={x - 4} cy={y - 5} rx={4} ry={5.5} fill="#FFFFFF" opacity="0.55" />
      <path d={`M${x - 3} ${y + 13} l3 5 l3 -5 z`} fill={c} stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
    </g>
  );
}

function Sparkle({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) {
  return (
    <path
      className="twinkle"
      d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`}
      fill="#FFE08A"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

export function MansionFacade({
  unlockedCount = 1,
  className,
}: {
  unlockedCount?: number;
  className?: string;
}) {
  const lit = Math.min(unlockedCount, 7);
  // lit order: tower balcony, upper-left, upper-right, lower-left, lower-right, wing-left, wing-right
  const isLit = (i: number) => i < lit;

  return (
    <svg viewBox="0 0 480 320" className={className} role="img" aria-label="Color Manor">
      <defs>
        <linearGradient id="mf-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DFF2FB" />
          <stop offset="1" stopColor="#B6DDF0" />
        </linearGradient>
        <radialGradient id="mf-glasslit" cx="0.5" cy="0.42" r="0.85">
          <stop offset="0" stopColor="#FFF6C9" />
          <stop offset="0.65" stopColor="#FFDD75" />
          <stop offset="1" stopColor="#FFB93E" />
        </radialGradient>
        <radialGradient id="mf-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFD966" stopOpacity="0.6" />
          <stop offset="1" stopColor="#FFD966" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mf-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FBF0DC" />
          <stop offset="0.55" stopColor="#F3E1BF" />
          <stop offset="1" stopColor="#E6CFA6" />
        </linearGradient>
        <linearGradient id="mf-wallL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F4E3C6" />
          <stop offset="1" stopColor="#E4CBA1" />
        </linearGradient>
        <linearGradient id="mf-wallR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9D2A9" />
          <stop offset="1" stopColor="#D5B988" />
        </linearGradient>
        <linearGradient id="mf-tower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF6E4" />
          <stop offset="0.6" stopColor="#F7E3C0" />
          <stop offset="1" stopColor="#E9D0A6" />
        </linearGradient>
        <linearGradient id="mf-roofMain" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E08A5C" />
          <stop offset="0.5" stopColor="#C96F45" />
          <stop offset="1" stopColor="#A85330" />
        </linearGradient>
        <linearGradient id="mf-roofL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#DA8459" />
          <stop offset="1" stopColor="#B65C38" />
        </linearGradient>
        <linearGradient id="mf-roofR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B25F3A" />
          <stop offset="1" stopColor="#93462A" />
        </linearGradient>
        <linearGradient id="mf-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9C6538" />
          <stop offset="1" stopColor="#6F4526" />
        </linearGradient>
        <linearGradient id="mf-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9DA9B" />
          <stop offset="1" stopColor="#83BD7C" />
        </linearGradient>
        <linearGradient id="mf-path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EBD9B6" />
          <stop offset="1" stopColor="#D6B98C" />
        </linearGradient>
      </defs>

      {/* sky furniture */}
      <circle cx="430" cy="46" r="36" fill="#FFD98A" opacity="0.35" />
      <circle cx="430" cy="46" r="25" fill="#FFD98A" />
      <g className="cloud" opacity="0.95">
        <ellipse cx="120" cy="40" rx="34" ry="13" fill="#FFFFFF" />
        <ellipse cx="146" cy="32" rx="26" ry="12" fill="#FFFFFF" />
        <ellipse cx="98" cy="32" rx="20" ry="10" fill="#FFFFFF" />
      </g>
      <g className="cloud" opacity="0.8" style={{ animationDuration: "13s", animationDelay: "1.2s" }}>
        <ellipse cx="330" cy="64" rx="26" ry="10" fill="#FFFFFF" />
        <ellipse cx="352" cy="58" rx="18" ry="9" fill="#FFFFFF" />
      </g>
      <path d="M356 96 q5 -7 10 0 q5 -7 10 0" fill="none" stroke="#7A5A38" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M80 116 q4 -6 8 0 q4 -6 8 0" fill="none" stroke="#7A5A38" strokeWidth="2.2" strokeLinecap="round" />

      <Balloon x={40} y={64} c="#E2725B" delay={0} />
      <Balloon x={70} y={88} c="#F5B301" delay={0.7} />
      <Balloon x={52} y={116} c="#5A8FDE" delay={1.4} />

      {/* ground */}
      <ellipse cx="240" cy="268" rx="168" ry="14" fill="rgba(90,60,20,0.16)" />
      <path d="M0 270 Q 240 250 480 270 L480 320 L0 320 Z" fill="url(#mf-grass)" />

      {/* fence */}
      <g stroke="#C9AE7F" strokeWidth="1.4">
        {[10, 24, 38, 52, 66].map((x) => (
          <rect key={x} x={x} y={242} width="7" height="26" rx="2.5" fill="#F6E7C8" />
        ))}
        <line x1="8" y1="249" x2="74" y2="249" strokeWidth="4" stroke="#EFDDB6" />
        <line x1="8" y1="258" x2="74" y2="258" strokeWidth="4" stroke="#EFDDB6" />
        {[406, 420, 434, 448, 462].map((x) => (
          <rect key={x} x={x} y={242} width="7" height="26" rx="2.5" fill="#F6E7C8" />
        ))}
        <line x1="404" y1="249" x2="470" y2="249" strokeWidth="4" stroke="#EFDDB6" />
        <line x1="404" y1="258" x2="470" y2="258" strokeWidth="4" stroke="#EFDDB6" />
      </g>

      {/* left wing */}
      <rect x="84" y="176" width="74" height="86" rx="4" fill="url(#mf-wallL)" stroke="#D9BF98" strokeWidth="2.5" />
      <polygon points="76,180 121,150 166,180" fill="url(#mf-roofL)" stroke="#A45B33" strokeWidth="2.5" />
      <Win x={110} y={202} w={26} h={34} lit={isLit(5)} />

      {/* right wing */}
      <rect x="322" y="176" width="74" height="86" rx="4" fill="url(#mf-wallR)" stroke="#C9AE7F" strokeWidth="2.5" />
      <polygon points="314,180 359,150 404,180" fill="url(#mf-roofR)" stroke="#A45B33" strokeWidth="2.5" />
      <Win x={344} y={202} w={26} h={34} lit={isLit(6)} />

      {/* main block */}
      <rect x="158" y="136" width="164" height="126" rx="4" fill="url(#mf-wall)" stroke="#D9BF98" strokeWidth="2.5" />
      <line x1="160" y1="166" x2="320" y2="166" stroke="rgba(160,120,70,0.2)" strokeWidth="1.6" />
      <line x1="160" y1="196" x2="320" y2="196" stroke="rgba(160,120,70,0.2)" strokeWidth="1.6" />
      <line x1="160" y1="226" x2="320" y2="226" stroke="rgba(160,120,70,0.2)" strokeWidth="1.6" />
      <Win x={166} y={148} w={24} h={32} lit={isLit(1)} />
      <Win x={290} y={148} w={24} h={32} lit={isLit(2)} />
      <Win x={166} y={202} w={24} h={32} lit={isLit(3)} />
      <Win x={290} y={202} w={24} h={32} lit={isLit(4)} />
      {/* flower boxes under lower windows */}
      {[166, 290].map((x) => (
        <g key={x}>
          <rect x={x - 2} y={236} width={28} height={6} rx={2.5} fill="#A9713F" />
          {["#E2725B", "#F5B301", "#F06EA9"].map((c, i) => (
            <circle key={c} cx={x + 3 + i * 9} cy={234} r={3} fill={c} />
          ))}
        </g>
      ))}

      {/* main roof */}
      <polygon points="148,140 240,70 332,140" fill="url(#mf-roofMain)" stroke="#A45B33" strokeWidth="3" />
      <polygon points="240,70 332,140 240,140" fill="#96482A" opacity="0.35" />
      <line x1="148" y1="140" x2="332" y2="140" stroke="#8A4A28" strokeWidth="4" strokeLinecap="round" />

      {/* chimneys + smoke */}
      <rect x="182" y="86" width="16" height="28" rx="3" fill="#8C5B33" />
      <rect x="179" y="82" width="22" height="7" rx="2.5" fill="#6F4526" />
      <Smoke x={190} y={76} base={0} />
      <rect x="282" y="90" width="16" height="26" rx="3" fill="#8C5B33" />
      <rect x="279" y="86" width="22" height="7" rx="2.5" fill="#6F4526" />
      <Smoke x={290} y={80} base={0.5} />

      {/* tower */}
      <rect x="204" y="104" width="72" height="158" rx="4" fill="url(#mf-tower)" stroke="#D9BF98" strokeWidth="2.5" />
      <polygon points="192,110 240,54 288,110" fill="url(#mf-roofMain)" stroke="#A45B33" strokeWidth="3" />
      <polygon points="240,54 288,110 240,110" fill="#96482A" opacity="0.3" />
      <circle cx="240" cy="50" r="5" fill="#F5B301" stroke="#B45309" strokeWidth="1.6" />
      <line x1="240" y1="50" x2="240" y2="30" stroke="#8C5B33" strokeWidth="2.5" />
      <path className="mf-flag" d="M240 31 L264 37 L240 44 Z" fill="#E2725B" />

      {/* rose window */}
      <circle cx="240" cy="88" r="12" fill="url(#mf-glasslit)" stroke="#8A5A33" strokeWidth="3" />
      <line x1="228" y1="88" x2="252" y2="88" stroke="#8A5A33" strokeWidth="2" />
      <line x1="240" y1="76" x2="240" y2="100" stroke="#8A5A33" strokeWidth="2" />

      {/* balcony window + rail */}
      <Win x={226} y={122} w={28} h={34} lit={isLit(0)} />
      <rect x="214" y="162" width="52" height="6" rx="3" fill="#C96F45" />
      {[220, 230, 240, 250, 260].map((x) => (
        <line key={x} x1={x} y1="162" x2={x} y2="170" stroke="#C96F45" strokeWidth="2.5" />
      ))}

      {/* columns + lanterns + door */}
      <rect x="204" y="192" width="18" height="7" rx="2" fill="#E3CBA6" />
      <rect x="207" y="199" width="12" height="58" fill="#F3E3C8" stroke="#D9BF98" strokeWidth="1.5" />
      <rect x="204" y="255" width="18" height="7" rx="2" fill="#E3CBA6" />
      <rect x="258" y="192" width="18" height="7" rx="2" fill="#E3CBA6" />
      <rect x="261" y="199" width="12" height="58" fill="#F3E3C8" stroke="#D9BF98" strokeWidth="1.5" />
      <rect x="258" y="255" width="18" height="7" rx="2" fill="#E3CBA6" />
      <circle className="winlit" cx="205" cy="184" r="10" fill="url(#mf-halo)" />
      <circle cx="205" cy="184" r="5" fill="#FFE08A" stroke="#B98A55" strokeWidth="1.6" />
      <circle className="winlit" cx="275" cy="184" r="10" fill="url(#mf-halo)" />
      <circle cx="275" cy="184" r="5" fill="#FFE08A" stroke="#B98A55" strokeWidth="1.6" />
      <path d="M220 262 L220 228 Q 240 206 260 228 L260 262 Z" fill="#C99C6B" />
      <path d="M224 262 L224 230 Q 240 212 256 230 L256 262 Z" fill="url(#mf-door)" stroke="#5C3A1F" strokeWidth="2" />
      <line x1="240" y1="215" x2="240" y2="262" stroke="#5C3A1F" strokeWidth="1.6" />
      <circle cx="234" cy="242" r="2.4" fill="#F5B301" />
      <circle cx="246" cy="242" r="2.4" fill="#F5B301" />

      {/* steps */}
      <rect x="214" y="262" width="52" height="7" rx="3" fill="#E9D5AF" />
      <rect x="206" y="269" width="68" height="7" rx="3" fill="#DCC294" />
      <rect x="198" y="276" width="84" height="7" rx="3" fill="#CDB287" />

      {/* garden */}
      <polygon points="224,283 256,283 290,318 190,318" fill="url(#mf-path)" stroke="#C9AE7F" strokeWidth="1.5" />
      <path d="M216 296 Q 240 292 264 296" fill="none" stroke="#C9AE7F" strokeWidth="2" opacity="0.7" />
      <path d="M204 308 Q 240 302 276 308" fill="none" stroke="#C9AE7F" strokeWidth="2" opacity="0.7" />

      <ellipse cx="96" cy="264" rx="22" ry="13" fill="#7FAF6E" />
      <ellipse cx="90" cy="260" rx="12" ry="8" fill="#8BC48A" />
      <ellipse cx="384" cy="264" rx="22" ry="13" fill="#7FAF6E" />
      <ellipse cx="378" cy="260" rx="12" ry="8" fill="#8BC48A" />

      {/* trees */}
      <rect x="44" y="226" width="9" height="36" rx="3.5" fill="#8C5B33" />
      <circle cx="48" cy="208" r="25" fill="#6FA85F" />
      <circle cx="34" cy="218" r="16" fill="#7FB56C" />
      <circle cx="64" cy="218" r="16" fill="#7FB56C" />
      <circle cx="40" cy="200" r="10" fill="#8BC48A" />
      {["#E2725B", "#F5B301", "#F06EA9"].map((c, i) => (
        <circle key={c} cx={36 + i * 12} cy={212 + (i % 2) * 8} r={3.2} fill={c} />
      ))}
      <rect x="427" y="230" width="9" height="34" rx="3.5" fill="#8C5B33" />
      <circle cx="431" cy="212" r="23" fill="#6FA85F" />
      <circle cx="418" cy="221" r="15" fill="#7FB56C" />
      <circle cx="444" cy="221" r="15" fill="#7FB56C" />
      <circle cx="426" cy="205" r="9" fill="#8BC48A" />

      {/* flower beds */}
      <ellipse cx="152" cy="300" rx="30" ry="11" fill="#7FAF6E" />
      {["#E2725B", "#F5B301", "#F06EA9", "#A267D8", "#5A8FDE"].map((c, i) => (
        <circle key={c} cx={134 + i * 10} cy={296 + (i % 2) * 5} r={3.4} fill={c} />
      ))}
      <ellipse cx="330" cy="300" rx="30" ry="11" fill="#7FAF6E" />
      {["#5A8FDE", "#E2725B", "#F5B301", "#F06EA9", "#A267D8"].map((c, i) => (
        <circle key={c} cx={312 + i * 10} cy={296 + (i % 2) * 5} r={3.4} fill={c} />
      ))}

      {/* lamps along the path */}
      <rect x="167" y="238" width="5" height="32" rx="2" fill="#6F4526" />
      <circle className="winlit" cx="169.5" cy="233" r="10" fill="url(#mf-halo)" />
      <circle cx="169.5" cy="233" r="6" fill="#FFE08A" stroke="#B98A55" strokeWidth="1.8" />
      <rect x="308" y="238" width="5" height="32" rx="2" fill="#6F4526" />
      <circle className="winlit" cx="310.5" cy="233" r="10" fill="url(#mf-halo)" />
      <circle cx="310.5" cy="233" r="6" fill="#FFE08A" stroke="#B98A55" strokeWidth="1.8" />

      {/* sparkles */}
      <Sparkle x={172} y={74} s={5} delay={0} />
      <Sparkle x={314} y={98} s={4} delay={0.9} />
      <Sparkle x={240} y={44} s={4.5} delay={1.7} />
    </svg>
  );
}
