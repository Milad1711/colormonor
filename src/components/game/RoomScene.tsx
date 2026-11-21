"use client";

/**
 * RoomScene — cartoon SVG backgrounds for the 7 manor wings.
 * viewBox 0 0 400 280; the ground line sits around y=232.
 */

function Floor({ color, y = 232 }: { color: string; y?: number }) {
  return (
    <>
      <rect x="0" y={y} width="400" height={280 - y} fill={color} />
      <rect x="0" y={y} width="400" height="5" fill="rgba(70,45,25,0.18)" />
    </>
  );
}

function Wall({ color }: { color: string }) {
  return <rect x="0" y="0" width="400" height="232" fill={color} />;
}

function Wainscot({ y = 170 }: { y?: number }) {
  return (
    <>
      <rect x="0" y={y} width="400" height={232 - y} fill="#EBD7B8" />
      <rect x="0" y={y} width="400" height="4" fill="#D9BF98" />
      {Array.from({ length: 13 }).map((_, i) => (
        <rect key={i} x={10 + i * 30} y={y + 8} width="18" height={232 - y - 14} rx="4" fill="#E3CBA6" />
      ))}
    </>
  );
}

function Window({ x, y, w = 64, h = 84, sky = "#BFE3F0" }: { x: number; y: number; w?: number; h?: number; sky?: string }) {
  return (
    <g>
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx="6" fill="#8A5A33" />
      <rect x={x} y={y} width={w} height={h} fill={sky} />
      <circle cx={x + w * 0.3} cy={y + h * 0.3} r="9" fill="#FFE9A8" />
      <path d={`M${x} ${y + h * 0.7} q ${w * 0.25} -10 ${w * 0.5} 0 t ${w * 0.5} 0 V ${y + h} H ${x} Z`} fill="#A8D8A0" />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#8A5A33" strokeWidth="4" />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#8A5A33" strokeWidth="4" />
    </g>
  );
}

function Planks({ color = "#C99C6B" }: { color?: string }) {
  const line = "rgba(70,45,25,0.14)";
  void color;
  return (
    <g>
      {[0, 1, 2].map((r) => (
        <line key={r} x1="0" y1={244 + r * 14} x2="400" y2={244 + r * 14} stroke={line} strokeWidth="2" />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
        <line key={c} x1={30 + c * 55} y1="232" x2={18 + c * 55} y2="280" stroke={line} strokeWidth="2" />
      ))}
    </g>
  );
}

const SCENES: Record<string, React.ReactNode> = {
  living: (
    <g>
      <Wall color="#F7E8D3" />
      <Window x={288} y={56} w={70} h={92} />
      {/* arched doorway alcove (architecture, not decor) */}
      <path d="M52 208 L52 96 Q 92 62 132 96 L132 208 Z" fill="#EFDCC0" stroke="#D9BF98" strokeWidth="4" />
      <path d="M60 208 L60 100 Q 92 70 124 100 L124 208 Z" fill="#F3E3C8" />
      <Wainscot />
      <Floor color="#C99C6B" />
      <Planks />
    </g>
  ),
  library: (
    <g>
      <Wall color="#EFE0C8" />
      {/* two tall backdrop shelves */}
      {[0, 340].map((sx) => (
        <g key={sx}>
          <rect x={sx} y="30" width="52" height="180" rx="4" fill="#A9713F" />
          {[0, 1, 2, 3, 4].map((r) => (
            <g key={r}>
              <rect x={sx + 4} y={40 + r * 34} width="44" height="28" rx="2" fill="#8C5B33" />
              {["#E2725B", "#5A8FDE", "#55B85B", "#F5B301", "#A267D8", "#F06EA9"].map((c, i) => (
                <rect key={i} x={sx + 7 + i * 6.5} y={44 + r * 34} width="5" height="20" rx="1" fill={c} opacity="0.92" />
              ))}
            </g>
          ))}
        </g>
      ))}
      <Window x={186} y={50} w={60} h={80} />
      <Wainscot y={180} />
      <Floor color="#B98A55" />
      <Planks color="#B98A55" />
    </g>
  ),
  kitchen: (
    <g>
      <Wall color="#F5EFE0" />
      {/* tile backsplash */}
      <rect x="0" y="0" width="400" height="120" fill="#EAF2EC" />
      {Array.from({ length: 10 }).map((_, r) =>
        Array.from({ length: 14 }).map((_, c) => (
          <rect key={`${r}-${c}`} x={c * 30} y={r * 24} width="28" height="22" rx="3" fill={(r + c) % 2 ? "#DDEBDF" : "#F2F8F3"} />
        )),
      )}
      <Window x={160} y={36} w={70} h={78} />
      <Floor color="#D8CBB2" />
      {Array.from({ length: 6 }).map((_, r) => (
        <g key={r}>
          <line x1="0" y1={232 + r * 10} x2="400" y2={232 + r * 10} stroke="rgba(70,45,25,0.1)" strokeWidth="2" />
          <line x1={(r * 80) % 120} y1="232" x2={(r * 80 + 60) % 400} y2="280" stroke="rgba(70,45,25,0.1)" strokeWidth="2" />
        </g>
      ))}
    </g>
  ),
  bedroom: (
    <g>
      <Wall color="#F3E3DC" />
      <circle cx="60" cy="70" r="34" fill="#F8D8C8" opacity="0.6" />
      <circle cx="60" cy="70" r="26" fill="#FAD9CE" opacity="0.7" />
      <Window x={288} y={52} w={68} h={90} sky="#CBE6EE" />
      <Wainscot y={182} />
      <Floor color="#D2A878" />
      <Planks color="#D2A878" />
    </g>
  ),
  greenhouse: (
    <g>
      {/* sky through glass */}
      <defs>
        <linearGradient id="gh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#AEDCF0" />
          <stop offset="1" stopColor="#E6F6E9" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="232" fill="url(#gh-sky)" />
      <circle cx="320" cy="52" r="24" fill="#FFE9A8" />
      <path d="M20 70 q 30 -16 60 0 q 30 -16 60 0" fill="none" stroke="#FFFFFF" strokeWidth="8" opacity="0.7" strokeLinecap="round" />
      {/* glass frame */}
      <rect x="0" y="0" width="400" height="232" fill="#DFF1F7" opacity="0.25" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={i * 80} y1="0" x2={i * 80 + 40} y2="232" stroke="#7FA888" strokeWidth="5" opacity="0.85" />
      ))}
      <line x1="0" y1="0" x2="400" y2="0" stroke="#7FA888" strokeWidth="8" />
      <line x1="0" y1="70" x2="400" y2="60" stroke="#7FA888" strokeWidth="5" opacity="0.8" />
      <line x1="0" y1="140" x2="400" y2="136" stroke="#7FA888" strokeWidth="5" opacity="0.8" />
      <rect x="0" y="208" width="400" height="24" fill="#B98A55" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={i * 46} y="208" width="42" height="24" rx="3" fill="#A9713F" />
      ))}
      <Floor color="#BFB39A" />
    </g>
  ),
  garden: (
    <g>
      <defs>
        <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9FD4EC" />
          <stop offset="1" stopColor="#DFF2FA" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="150" fill="url(#g-sky)" />
      <circle cx="70" cy="46" r="22" fill="#FFE9A8" />
      <circle cx="70" cy="46" r="30" fill="#FFE9A8" opacity="0.4" />
      <path d="M150 52 q 26 -14 52 0 q 26 -14 52 0" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" opacity="0.85" />
      {/* manor glimpse */}
      <rect x="230" y="60" width="150" height="90" rx="6" fill="#F3DFC0" />
      <path d="M222 64 L305 16 L388 64 Z" fill="#C96F45" />
      <rect x="252" y="80" width="26" height="34" rx="4" fill="#FFE9A8" stroke="#C99C6B" strokeWidth="3" />
      <rect x="308" y="80" width="26" height="34" rx="4" fill="#FFE9A8" stroke="#C99C6B" strokeWidth="3" />
      {/* hedge */}
      <rect x="0" y="120" width="400" height="42" fill="#7FAF6E" />
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={i * 30 + 10} cy="122" r="17" fill="#8BC48A" />
      ))}
      <Floor color="#9BCF8E" y={160} />
      <path d="M170 280 L200 160 L240 160 L280 280 Z" fill="#E8D9B5" />
      <path d="M180 280 L206 160 L212 160 L188 280 Z" fill="#D9C79E" opacity="0.7" />
    </g>
  ),
  hallway: (
    <g>
      <Wall color="#EFE3CD" />
      {/* grand staircase backdrop */}
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <rect x={210 + i * 30} y={196 - i * 24} width="34" height="24" fill="#D9BF98" />
            <rect x={210 + i * 30} y={196 - i * 24} width="34" height="6" fill="#B98A55" />
          </g>
        ))}
        <path d="M210 200 L400 76 L400 200 Z" fill="#E8D5B0" opacity="0.7" />
      </g>
      <Window x={70} y={50} w={62} h={86} />
      <Wainscot y={178} />
      <Floor color="#C99C6B" />
      <Planks />
    </g>
  ),
};

export function RoomScene({ room, className }: { room: string; className?: string }) {
  const scene = SCENES[room] ?? SCENES.living;
  return (
    <svg viewBox="0 0 400 280" className={className} role="img" aria-label={room} preserveAspectRatio="xMidYMid slice">
      {scene}
    </svg>
  );
}
