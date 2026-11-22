"use client";

/**
 * DecorArt — cartoon SVG art for every shop item, in 3 distinct models
 * (classic / modern / rustic). Each drawing lives in a 100x100 box with the
 * anchor at the bottom-center (50, ~96) so rooms can place items on floors.
 */
import { cn } from "@/lib/utils";

interface Palette {
  wood: string;
  woodDark: string;
  accent: string;
  accentSoft: string;
  metal: string;
  fabric: string;
  cushion: string;
  leaf: string;
  leafDark: string;
}

export const PALETTES: Palette[] = [
  // Classic — warm woods, cream fabric, terracotta, brass
  {
    wood: "#B07A4A",
    woodDark: "#8C5B33",
    accent: "#E2725B",
    accentSoft: "#F2A48F",
    metal: "#D9A62E",
    fabric: "#F6EBDC",
    cushion: "#E9967A",
    leaf: "#5BA85C",
    leafDark: "#3E7F44",
  },
  // Modern — charcoal, teal accent, brushed steel, light gray fabric
  {
    wood: "#52525B",
    woodDark: "#3F3F46",
    accent: "#2A9D8F",
    accentSoft: "#7ECCC3",
    metal: "#71717A",
    fabric: "#E8EAED",
    cushion: "#94A3B8",
    leaf: "#4F9D69",
    leafDark: "#35704B",
  },
  // Rustic — honey wood, terracotta-orange, copper, warm canvas
  {
    wood: "#C98A3D",
    woodDark: "#A5692A",
    accent: "#E76F51",
    accentSoft: "#F2A17E",
    metal: "#B87333",
    fabric: "#F5E6C8",
    cushion: "#DD8A4B",
    leaf: "#6BA84F",
    leafDark: "#4C7F3A",
  },
];

const STROKE = "rgba(60,40,20,0.22)";

function shade(y: number, x: number, w: number, _color = "", o = 0.14) {
  return <ellipse cx={x} cy={y} rx={w} ry={w * 0.18} fill="#3c2a1a" opacity={o} />;
}

/* --------------------------------- items --------------------------------- */

function Sofa({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    // Modern — boxy low arms
    return (
      <g>
        {shade(96, 50, 40)}
        <rect x="8" y="52" width="84" height="30" rx="7" fill={p.accent} stroke={STROKE} />
        <rect x="4" y="44" width="16" height="30" rx="5" fill={p.accent} stroke={STROKE} />
        <rect x="80" y="44" width="16" height="30" rx="5" fill={p.accent} stroke={STROKE} />
        <rect x="20" y="48" width="28" height="16" rx="4" fill={p.fabric} stroke={STROKE} />
        <rect x="52" y="48" width="28" height="16" rx="4" fill={p.fabric} stroke={STROKE} />
        <rect x="10" y="80" width="6" height="12" rx="2" fill={p.metal} />
        <rect x="84" y="80" width="6" height="12" rx="2" fill={p.metal} />
      </g>
    );
  }
  if (v === 2) {
    // Rustic — exposed wood frame
    return (
      <g>
        {shade(96, 50, 40)}
        <rect x="10" y="34" width="80" height="14" rx="6" fill={p.woodDark} stroke={STROKE} />
        <rect x="4" y="40" width="12" height="40" rx="5" fill={p.wood} stroke={STROKE} />
        <rect x="84" y="40" width="12" height="40" rx="5" fill={p.wood} stroke={STROKE} />
        <rect x="14" y="50" width="72" height="14" rx="4" fill={p.wood} stroke={STROKE} />
        <rect x="16" y="44" width="30" height="16" rx="4" fill={p.cushion} stroke={STROKE} />
        <rect x="54" y="44" width="30" height="16" rx="4" fill={p.cushion} stroke={STROKE} />
        <rect x="16" y="62" width="68" height="18" rx="6" fill={p.accent} stroke={STROKE} />
        <rect x="14" y="78" width="8" height="14" rx="3" fill={p.woodDark} />
        <rect x="78" y="78" width="8" height="14" rx="3" fill={p.woodDark} />
      </g>
    );
  }
  // Classic — rolled arms
  return (
    <g>
      {shade(96, 50, 40)}
      <rect x="10" y="42" width="80" height="40" rx="12" fill={p.fabric} stroke={STROKE} />
      <circle cx="16" cy="50" r="10" fill={p.fabric} stroke={STROKE} />
      <circle cx="84" cy="50" r="10" fill={p.fabric} stroke={STROKE} />
      <rect x="20" y="52" width="27" height="15" rx="5" fill={p.accent} stroke={STROKE} />
      <rect x="53" y="52" width="27" height="15" rx="5" fill={p.accent} stroke={STROKE} />
      <rect x="18" y="68" width="64" height="12" rx="5" fill={p.accentSoft} stroke={STROKE} />
      <rect x="18" y="80" width="7" height="12" rx="2.5" fill={p.woodDark} />
      <rect x="75" y="80" width="7" height="12" rx="2.5" fill={p.woodDark} />
    </g>
  );
}

function Armchair({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 30)}
        <rect x="20" y="40" width="60" height="34" rx="10" fill={p.accent} stroke={STROKE} />
        <rect x="16" y="36" width="14" height="30" rx="6" fill={p.accent} stroke={STROKE} />
        <rect x="70" y="36" width="14" height="30" rx="6" fill={p.accent} stroke={STROKE} />
        <rect x="30" y="48" width="40" height="12" rx="4" fill={p.fabric} stroke={STROKE} />
        <rect x="24" y="74" width="5" height="16" rx="2" fill={p.metal} />
        <rect x="71" y="74" width="5" height="16" rx="2" fill={p.metal} />
      </g>
    );
  }
  const winged = v === 0;
  return (
    <g>
      {shade(96, 50, 30)}
      {winged ? (
        <>
          <rect x="22" y="30" width="56" height="44" rx="10" fill={p.fabric} stroke={STROKE} />
          <rect x="14" y="42" width="12" height="30" rx="5" fill={p.fabric} stroke={STROKE} />
          <rect x="74" y="42" width="12" height="30" rx="5" fill={p.fabric} stroke={STROKE} />
        </>
      ) : (
        <>
          <rect x="24" y="34" width="52" height="40" rx="8" fill={p.wood} stroke={STROKE} />
          <rect x="16" y="44" width="12" height="30" rx="5" fill={p.wood} stroke={STROKE} />
          <rect x="72" y="44" width="12" height="30" rx="5" fill={p.wood} stroke={STROKE} />
        </>
      )}
      <rect x="26" y="60" width="48" height="14" rx="5" fill={p.cushion} stroke={STROKE} />
      <rect x="26" y="74" width="6" height="16" rx="2.5" fill={p.woodDark} />
      <rect x="68" y="74" width="6" height="16" rx="2.5" fill={p.woodDark} />
    </g>
  );
}

function CoffeeTable({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 34)}
        <rect x="12" y="60" width="76" height="8" rx="4" fill={p.woodDark} stroke={STROKE} />
        <rect x="16" y="68" width="6" height="24" rx="3" fill={p.metal} />
        <rect x="78" y="68" width="6" height="24" rx="3" fill={p.metal} />
        <rect x="34" y="52" width="14" height="8" rx="2" fill={p.accent} />
        <rect x="52" y="50" width="10" height="10" rx="2" fill={p.accentSoft} />
      </g>
    );
  }
  const oval = v === 0;
  return (
    <g>
      {shade(96, 50, 34)}
      {oval ? (
        <ellipse cx="50" cy="60" rx="36" ry="10" fill={p.wood} stroke={STROKE} />
      ) : (
        <rect x="16" y="52" width="68" height="12" rx="6" fill={p.wood} stroke={STROKE} />
      )}
      <rect x="22" y="66" width="7" height="26" rx="3" fill={p.woodDark} />
      <rect x="71" y="66" width="7" height="26" rx="3" fill={p.woodDark} />
      <ellipse cx="40" cy="56" rx="8" ry="4" fill={p.accent} opacity="0.9" />
      <rect x="56" y="48" width="8" height="8" rx="2" fill={p.metal} />
    </g>
  );
}

function Chandelier({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    // modern ring
    return (
      <g>
        <rect x="48" y="4" width="4" height="16" fill={p.metal} />
        <ellipse cx="50" cy="34" rx="34" ry="9" fill="none" stroke={p.metal} strokeWidth="5" />
        {[26, 38, 50, 62, 74].map((x, i) => (
          <g key={i}>
            <rect x={x - 1.5} y="42" width="3" height="8" fill={p.metal} />
            <circle cx={x} cy="54" r="5" fill="#FFE9A8" stroke="#E8B84B" />
          </g>
        ))}
      </g>
    );
  }
  if (v === 2) {
    // rustic wagon wheel
    return (
      <g>
        <rect x="48" y="4" width="4" height="12" fill={p.metal} />
        <ellipse cx="50" cy="32" rx="36" ry="10" fill="none" stroke={p.woodDark} strokeWidth="6" />
        <ellipse cx="50" cy="32" rx="14" ry="4.5" fill="none" stroke={p.woodDark} strokeWidth="3" />
        {[24, 50, 76].map((x, i) => (
          <g key={i}>
            <rect x={x - 1} y="40" width="2" height="8" fill={p.metal} />
            <path d={`M${x - 7} 48 h14 l-2.5 14 h-9 z`} fill={p.metal} stroke={STROKE} />
            <circle cx={x} cy={55} r="3" fill="#FFF3C4" />
          </g>
        ))}
      </g>
    );
  }
  // classic 5-arm brass
  return (
    <g>
      <rect x="48" y="4" width="4" height="14" fill={p.metal} />
      <circle cx="50" cy="22" r="6" fill={p.metal} stroke={STROKE} />
      <path d="M50 26 C 30 30, 22 34, 20 44 M50 26 C 70 30, 78 34, 80 44 M50 26 L50 40" fill="none" stroke={p.metal} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="20" cy="47" r="4.5" fill="#FFE9A8" stroke="#E8B84B" />
      <circle cx="50" cy="44" r="4.5" fill="#FFE9A8" stroke="#E8B84B" />
      <circle cx="80" cy="47" r="4.5" fill="#FFE9A8" stroke="#E8B84B" />
      <circle cx="50" cy="30" r="3" fill="#FBD47F" />
    </g>
  );
}

function Curtain({ p, v }: { p: Palette; v: number }) {
  const cloth = p.accent;
  const clothSoft = p.accentSoft;
  if (v === 1) {
    return (
      <g>
        <rect x="6" y="14" width="88" height="7" rx="3" fill={p.metal} />
        <rect x="8" y="21" width="32" height="72" rx="3" fill={cloth} stroke={STROKE} />
        <rect x="60" y="21" width="32" height="72" rx="3" fill={cloth} stroke={STROKE} />
        <rect x="40" y="21" width="20" height="34" rx="2" fill={clothSoft} stroke={STROKE} />
      </g>
    );
  }
  return (
    <g>
      <rect x="6" y="14" width="88" height="9" rx="4" fill={v === 0 ? p.metal : p.woodDark} />
      <path d="M8 23 C 4 60, 10 82, 14 92 L 30 92 C 24 62, 26 40, 30 23 Z" fill={cloth} stroke={STROKE} />
      <path d="M92 23 C 96 60, 90 82, 86 92 L 70 92 C 76 62, 74 40, 70 23 Z" fill={cloth} stroke={STROKE} />
      <path d="M38 23 C 34 55, 36 75, 42 92 L 58 92 C 64 75, 66 55, 62 23 Z" fill={clothSoft} stroke={STROKE} />
      {v === 2 && (
        <>
          <rect x="12" y="56" width="20" height="5" rx="2" fill={p.metal} />
          <rect x="68" y="56" width="20" height="5" rx="2" fill={p.metal} />
        </>
      )}
    </g>
  );
}

function Carpet({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(98, 50, 44, "", 0.1)}
        <rect x="6" y="72" width="88" height="26" rx="10" fill={p.accent} stroke={STROKE} />
        <rect x="12" y="77" width="76" height="16" rx="7" fill="none" stroke={p.fabric} strokeWidth="3" />
        <line x1="26" y1="77" x2="26" y2="93" stroke={p.fabric} strokeWidth="2" />
        <line x1="50" y1="77" x2="50" y2="93" stroke={p.fabric} strokeWidth="2" />
        <line x1="74" y1="77" x2="74" y2="93" stroke={p.fabric} strokeWidth="2" />
      </g>
    );
  }
  return (
    <g>
      {shade(98, 50, 44, "", 0.1)}
      <rect x="6" y="72" width="88" height="26" rx="9" fill={v === 0 ? "#C0392B" : p.accent} stroke={STROKE} />
      <rect x="11" y="76" width="78" height="18" rx="6" fill={v === 0 ? "#E2725B" : p.accentSoft} stroke={STROKE} />
      {v === 0 ? (
        <>
          <circle cx="30" cy="85" r="4" fill="#F6EBDC" />
          <circle cx="50" cy="85" r="4" fill="#F6EBDC" />
          <circle cx="70" cy="85" r="4" fill="#F6EBDC" />
        </>
      ) : (
        <>
          <path d="M30 80 l5 5 -5 5 -5 -5 z M50 80 l5 5 -5 5 -5 -5 z M70 80 l5 5 -5 5 -5 -5 z" fill={p.fabric} />
        </>
      )}
    </g>
  );
}

function Bookcase({ p, v }: { p: Palette; v: number }) {
  const books = ["#E2725B", "#5A8FDE", "#55B85B", "#F5B301", "#A267D8", "#F06EA9"];
  const shelf = (y: number) => <rect x="14" y={y} width="72" height="4" rx="2" fill={p.woodDark} stroke={STROKE} />;
  const row = (y: number, seed: number) => (
    <g>
      {books.map((c, i) => (
        <rect key={i} x={20 + ((i * 9 + seed) % 46)} y={y - 13} width="6" height="13" rx="1.5" fill={c} stroke={STROKE} strokeWidth="0.8" />
      ))}
    </g>
  );
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 42)}
        <rect x="12" y="18" width="76" height="76" rx="6" fill={p.fabric} stroke={STROKE} />
        <rect x="12" y="18" width="76" height="76" rx="6" fill="none" stroke={p.accent} strokeWidth="4" />
        {shelf(46)}
        {shelf(72)}
        {row(46, 2)}
        {row(72, 5)}
        {row(94, 1)}
      </g>
    );
  }
  const arch = v === 0;
  return (
    <g>
      {shade(96, 50, 42)}
      {arch && <path d="M12 30 Q 50 4 88 30 L88 30 L12 30 Z" fill={p.woodDark} stroke={STROKE} />}
      <rect x="12" y="26" width="76" height="70" rx={arch ? 4 : 3} fill={p.wood} stroke={STROKE} />
      {shelf(46)}
      {shelf(68)}
      {row(46, 0)}
      {row(68, 3)}
      {row(92, 6)}
    </g>
  );
}

function Shelf({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <rect x="12" y="46" width="76" height="6" rx="3" fill={p.wood} stroke={STROKE} />
      {v === 1 ? (
        <path d="M16 52 L16 68 M84 52 L84 68" stroke={p.metal} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d="M18 52 L26 66 M82 52 L74 66" stroke={p.woodDark} strokeWidth="4" strokeLinecap="round" />
      )}
      <rect x="24" y="34" width="12" height="12" rx="2" fill={p.accent} stroke={STROKE} />
      <rect x="40" y="30" width="8" height="16" rx="2" fill={p.fabric} stroke={STROKE} />
      <ellipse cx="62" cy="40" rx="7" ry="6" fill={p.accentSoft} stroke={STROKE} />
      <rect x="70" y="36" width="10" height="10" rx="2" fill={p.leaf} />
      {v === 2 && <rect x="24" y="52" width="52" height="3" rx="1.5" fill={p.woodDark} opacity="0.5" />}
    </g>
  );
}

function Chair({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 26)}
        <path d="M30 28 Q 50 20 70 28 L74 58 Q 50 66 26 58 Z" fill={p.accent} stroke={STROKE} />
        <rect x="26" y="58" width="48" height="10" rx="5" fill={p.fabric} stroke={STROKE} />
        <path d="M30 68 L26 90 M70 68 L74 90" stroke={p.metal} strokeWidth="5" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      {shade(96, 50, 26)}
      <rect x="30" y="24" width="40" height="34" rx={v === 0 ? 8 : 4} fill={v === 0 ? p.wood : p.woodDark} stroke={STROKE} />
      <rect x="34" y="30" width="32" height="22" rx="5" fill={p.cushion} stroke={STROKE} />
      <rect x="24" y="58" width="52" height="9" rx="4" fill={p.wood} stroke={STROKE} />
      <rect x="28" y="67" width="6" height="24" rx="3" fill={p.woodDark} />
      <rect x="66" y="67" width="6" height="24" rx="3" fill={p.woodDark} />
      <rect x="24" y="67" width="52" height="4" rx="2" fill={p.woodDark} opacity="0.6" />
    </g>
  );
}

function FloorLamp({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 44, 22)}
        <path d="M44 88 L44 44 M44 44 C 56 40, 66 44, 70 54" fill="none" stroke={p.metal} strokeWidth="4" strokeLinecap="round" />
        <path d="M62 50 h20 l-4 12 h-12 z" fill={p.accent} stroke={STROKE} />
        <ellipse cx="72" cy="64" rx="4" ry="3" fill="#FFE9A8" />
        <ellipse cx="44" cy="90" rx="12" ry="4" fill={p.woodDark} stroke={STROKE} />
      </g>
    );
  }
  const tripod = v === 0;
  return (
    <g>
      {shade(96, 50, 22)}
      <path d="M50 42 L50 82" stroke={tripod ? p.woodDark : p.metal} strokeWidth="4" />
      {tripod ? (
        <path d="M50 82 L36 92 M50 82 L64 92 M50 82 L50 92" stroke={p.woodDark} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <ellipse cx="50" cy="90" rx="13" ry="4" fill={p.woodDark} stroke={STROKE} />
      )}
      <path d="M32 16 h36 l6 24 h-48 z" fill={p.fabric} stroke={STROKE} />
      <ellipse cx="50" cy="42" rx="10" ry="3" fill="#FFE9A8" />
      <circle cx="50" cy="18" r="3" fill={p.metal} />
    </g>
  );
}

function Rug({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <ellipse cx="50" cy="86" rx="42" ry="12" fill={p.accent} stroke={STROKE} />
      <ellipse cx="50" cy="86" rx="30" ry="8" fill="none" stroke={p.fabric} strokeWidth="3" />
      {v === 0 ? (
        <ellipse cx="50" cy="86" rx="16" ry="4.5" fill={p.fabric} opacity="0.7" />
      ) : v === 1 ? (
        <path d="M34 86 l8 -4 8 4 -8 4 z M58 86 l8 -4 8 4 -8 4 z" fill={p.fabric} opacity="0.8" />
      ) : (
        <g fill={p.fabric} opacity="0.8">
          <circle cx="34" cy="86" r="2.5" />
          <circle cx="50" cy="86" r="2.5" />
          <circle cx="66" cy="86" r="2.5" />
        </g>
      )}
    </g>
  );
}

function Cabinet({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 42)}
        <rect x="10" y="46" width="80" height="44" rx="4" fill={p.woodDark} stroke={STROKE} />
        <rect x="10" y="42" width="80" height="7" rx="3" fill={p.fabric} stroke={STROKE} />
        <rect x="16" y="52" width="30" height="32" rx="3" fill={p.accent} stroke={STROKE} />
        <rect x="54" y="52" width="30" height="32" rx="3" fill={p.accent} stroke={STROKE} />
        <rect x="42" y="64" width="4" height="10" rx="2" fill={p.metal} />
      </g>
    );
  }
  return (
    <g>
      {shade(96, 50, 42)}
      <rect x="10" y="46" width="80" height="44" rx={v === 0 ? 5 : 3} fill={p.wood} stroke={STROKE} />
      <rect x="10" y="42" width="80" height="7" rx="3" fill={p.fabric} stroke={STROKE} />
      <rect x="16" y="52" width="30" height="32" rx="3" fill={p.woodDark} stroke={STROKE} />
      <rect x="54" y="52" width="30" height="32" rx="3" fill={p.woodDark} stroke={STROKE} />
      <circle cx="43" cy="68" r="2.5" fill={p.metal} />
      <circle cx="57" cy="68" r="2.5" fill={p.metal} />
      {v === 2 && (
        <g stroke={p.woodDark} strokeWidth="1" opacity="0.5">
          <line x1="24" y1="52" x2="24" y2="84" />
          <line x1="32" y1="52" x2="32" y2="84" />
          <line x1="62" y1="52" x2="62" y2="84" />
          <line x1="70" y1="52" x2="70" y2="84" />
        </g>
      )}
    </g>
  );
}

function KitchenTable({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 38)}
        <rect x="10" y="56" width="80" height="9" rx="4.5" fill={p.woodDark} stroke={STROKE} />
        <rect x="18" y="65" width="6" height="27" rx="3" fill={p.metal} />
        <rect x="76" y="65" width="6" height="27" rx="3" fill={p.metal} />
        <ellipse cx="42" cy="52" rx="8" ry="3" fill={p.accent} />
        <rect x="56" y="46" width="6" height="10" rx="2" fill={p.accentSoft} />
      </g>
    );
  }
  return (
    <g>
      {shade(96, 50, 38)}
      {v === 0 ? (
        <>
          <rect x="12" y="54" width="76" height="11" rx="5" fill={p.fabric} stroke={STROKE} />
          <rect x="16" y="65" width="68" height="5" rx="2" fill={p.accentSoft} opacity="0.8" />
        </>
      ) : (
        <ellipse cx="50" cy="58" rx="38" ry="10" fill={p.wood} stroke={STROKE} />
      )}
      <rect x="22" y="66" width="7" height="26" rx="3" fill={p.woodDark} />
      <rect x="71" y="66" width="7" height="26" rx="3" fill={p.woodDark} />
      <ellipse cx="38" cy="52" rx="6" ry="3" fill={p.accent} />
    </g>
  );
}

function KitchenChair({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 24)}
      <rect x="32" y="26" width="36" height="32" rx={v === 1 ? 6 : 4} fill={v === 1 ? p.accent : p.wood} stroke={STROKE} />
      {v !== 1 && <rect x="36" y="32" width="28" height="20" rx="4" fill={p.fabric} stroke={STROKE} />}
      <rect x="26" y="58" width="48" height="8" rx="4" fill={p.wood} stroke={STROKE} />
      <rect x="30" y="66" width="5" height="26" rx="2.5" fill={p.woodDark} />
      <rect x="65" y="66" width="5" height="26" rx="2.5" fill={p.woodDark} />
    </g>
  );
}

function PendantLight({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        <rect x="49" y="6" width="2.5" height="26" fill={p.metal} />
        <path d="M32 40 L50 32 L68 40 L68 44 L32 44 Z" fill={p.accent} stroke={STROKE} />
        <ellipse cx="50" cy="47" rx="6" ry="3" fill="#FFE9A8" />
      </g>
    );
  }
  return (
    <g>
      <rect x="49" y="6" width="2.5" height="24" fill={p.metal} />
      {v === 0 ? (
        <path d="M34 46 Q 50 24 66 46 Z" fill={p.fabric} stroke={STROKE} />
      ) : (
        <path d="M36 46 L46 28 h8 l10 18 Z" fill={p.metal} stroke={STROKE} />
      )}
      <ellipse cx="50" cy="48" rx="6" ry="3" fill="#FFE9A8" />
      <circle cx="50" cy="26" r="3" fill={p.metal} />
    </g>
  );
}

function KitchenDecor({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <rect x="10" y="52" width="80" height="6" rx="3" fill={p.wood} stroke={STROKE} />
      <path d="M18 58 L18 72 M82 58 L82 72" stroke={p.woodDark} strokeWidth="3.5" strokeLinecap="round" />
      <rect x="22" y="38" width="14" height="14" rx="3" fill={v === 1 ? p.accent : p.fabric} stroke={STROKE} />
      <rect x="26" y="34" width="6" height="5" rx="1.5" fill={p.woodDark} />
      <rect x="42" y="42" width="12" height="10" rx="2" fill={p.accentSoft} stroke={STROKE} />
      <path d="M62 52 l3 -12 M68 52 l0 -12 M74 52 l-3 -12" stroke={p.metal} strokeWidth="2.5" strokeLinecap="round" />
      {v === 2 && <ellipse cx="50" cy="55" rx="5" ry="2.5" fill={p.accent} />}
    </g>
  );
}

function Bed({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 44)}
        <rect x="8" y="34" width="84" height="40" rx="4" fill={p.woodDark} stroke={STROKE} />
        <rect x="14" y="52" width="72" height="16" rx="3" fill={p.fabric} stroke={STROKE} />
        <rect x="14" y="46" width="26" height="8" rx="3" fill="#FFFFFF" stroke={STROKE} />
        <rect x="14" y="66" width="72" height="10" rx="3" fill={p.accent} stroke={STROKE} />
        <rect x="10" y="76" width="6" height="14" rx="2" fill={p.metal} />
        <rect x="84" y="76" width="6" height="14" rx="2" fill={p.metal} />
      </g>
    );
  }
  return (
    <g>
      {shade(96, 50, 44)}
      <rect x="8" y="26" width="84" height="24" rx={v === 0 ? 12 : 5} fill={v === 0 ? p.wood : p.woodDark} stroke={STROKE} />
      {v === 0 && <circle cx="50" cy="30" r="9" fill={p.accentSoft} stroke={STROKE} />}
      <rect x="10" y="50" width="80" height="18" rx="5" fill={p.fabric} stroke={STROKE} />
      <rect x="12" y="44" width="26" height="9" rx="4" fill="#FFFFFF" stroke={STROKE} />
      <rect x="40" y="44" width="26" height="9" rx="4" fill="#FFFFFF" stroke={STROKE} />
      <rect x="10" y="66" width="80" height="12" rx="5" fill={v === 0 ? p.accent : p.cushion} stroke={STROKE} />
      <rect x="14" y="78" width="7" height="12" rx="3" fill={p.woodDark} />
      <rect x="79" y="78" width="7" height="12" rx="3" fill={p.woodDark} />
    </g>
  );
}

function Wardrobe({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 40)}
        <rect x="12" y="22" width="76" height="68" rx="4" fill={p.woodDark} stroke={STROKE} />
        <line x1="50" y1="22" x2="50" y2="90" stroke={p.fabric} strokeWidth="2" />
        <rect x="42" y="52" width="4" height="12" rx="2" fill={p.metal} />
        <rect x="54" y="52" width="4" height="12" rx="2" fill={p.metal} />
        <rect x="16" y="30" width="28" height="26" rx="2" fill={p.accent} opacity="0.85" />
      </g>
    );
  }
  return (
    <g>
      {shade(96, 50, 40)}
      <rect x="12" y="20" width="76" height="70" rx={v === 0 ? 8 : 3} fill={p.wood} stroke={STROKE} />
      <line x1="50" y1="20" x2="50" y2="90" stroke={p.woodDark} strokeWidth="2.5" />
      {v === 0 && <rect x="17" y="28" width="28" height="36" rx="10" fill={p.fabric} stroke={STROKE} opacity="0.95" />}
      {v === 2 && (
        <>
          <rect x="16" y="26" width="30" height="60" rx="2" fill={p.woodDark} opacity="0.25" />
          <rect x="54" y="26" width="30" height="60" rx="2" fill={p.woodDark} opacity="0.25" />
        </>
      )}
      <circle cx="44" cy="54" r="2.8" fill={p.metal} />
      <circle cx="56" cy="54" r="2.8" fill={p.metal} />
    </g>
  );
}

function BedsideLamp({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <ellipse cx="50" cy="92" rx="18" ry="4" fill="#3c2a1a" opacity="0.14" />
      {v === 1 ? (
        <>
          <rect x="44" y="62" width="12" height="8" rx="2" fill={p.woodDark} />
          <rect x="42" y="70" width="16" height="22" rx="4" fill={p.wood} stroke={STROKE} />
        </>
      ) : (
        <>
          <rect x="46" y="62" width="8" height="26" rx="3" fill={v === 0 ? p.wood : p.metal} />
          <ellipse cx="50" cy="90" rx="12" ry="4" fill={p.woodDark} stroke={STROKE} />
        </>
      )}
      <path d={v === 0 ? "M32 48 Q 50 30 68 48 Z" : v === 1 ? "M34 62 h32 l-6 -16 h-20 z" : "M36 60 L44 36 h12 l8 24 Z"} fill={p.accent} stroke={STROKE} />
      <ellipse cx="50" cy={v === 0 ? 50 : v === 1 ? 63 : 62} rx="8" ry="3" fill="#FFE9A8" />
    </g>
  );
}

function Planter({ p, v }: { p: Palette; v: number }) {
  const potColor = v === 0 ? "#5A8FDE" : v === 1 ? p.fabric : "#C96F45";
  return (
    <g>
      {shade(96, 50, 26)}
      <path d="M46 60 C 40 46, 30 42, 24 44 M50 58 C 50 40, 56 30, 62 28 M52 62 C 62 54, 72 54, 76 58" fill="none" stroke={p.leafDark} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="24" cy="43" rx="7" ry="10" fill={p.leaf} transform="rotate(-30 24 43)" />
      <ellipse cx="63" cy="26" rx="8" ry="12" fill={p.leaf} transform="rotate(15 63 26)" />
      <ellipse cx="77" cy="57" rx="8" ry="6" fill={p.leaf} transform="rotate(-10 77 57)" />
      <ellipse cx="50" cy="62" rx="16" ry="5" fill={p.leafDark} />
      <path d="M34 62 h32 l-4 32 h-24 z" fill={potColor} stroke={STROKE} />
      <rect x="32" y="60" width="36" height="7" rx="3" fill={potColor} stroke={STROKE} />
      {v === 2 && <rect x="34" y="74" width="32" height="4" rx="2" fill="#A45B33" opacity="0.7" />}
      {v === 0 && <circle cx="50" cy="80" r="4" fill="#FFFFFF" opacity="0.55" />}
    </g>
  );
}

function FlowerStand({ p, v }: { p: Palette; v: number }) {
  const pot = v === 1 ? p.fabric : p.accent;
  return (
    <g>
      {shade(96, 50, 24)}
      <rect x="46" y="40" width="8" height="50" fill={p.metal} />
      <rect x="26" y="58" width="48" height="5" rx="2.5" fill={p.metal} />
      <ellipse cx="50" cy="90" rx="16" ry="4" fill={p.metal} stroke={STROKE} />
      <g>
        <path d="M32 40 h16 l-2 10 h-12 z" fill={pot} stroke={STROKE} />
        <path d="M40 38 C 36 30, 34 28, 32 26 M40 38 C 42 28, 46 26, 46 24" fill="none" stroke={p.leafDark} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="31" cy="24" r="4.5" fill={p.accent} />
        <circle cx="47" cy="22" r="4.5" fill={p.accentSoft} />
      </g>
      <g>
        <path d="M52 54 h16 l-2 8 h-12 z" fill={pot} stroke={STROKE} />
        <circle cx="60" cy="50" r="4.5" fill={p.accent} />
        <circle cx="66" cy="48" r="3.5" fill="#FFFFFF" />
      </g>
    </g>
  );
}

function GreenShelf({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 32)}
      <rect x="16" y="30" width="68" height="62" rx="4" fill={v === 1 ? p.fabric : p.wood} stroke={STROKE} />
      <rect x="16" y="56" width="68" height="4" fill={p.woodDark} opacity="0.8" />
      <g>
        <path d="M26 52 h14 l-2 6 h-10 z" fill={v === 1 ? p.accent : "#C96F45"} stroke={STROKE} />
        <path d="M33 50 C 30 42, 28 40, 26 38 M33 50 C 35 40, 38 38, 40 36" fill="none" stroke={p.leafDark} strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="26" cy="37" rx="4.5" ry="7" fill={p.leaf} transform="rotate(-25 26 37)" />
        <ellipse cx="41" cy="35" rx="4.5" ry="7" fill={p.leaf} transform="rotate(20 41 35)" />
      </g>
      <g>
        <path d="M58 80 h16 l-2 6 h-12 z" fill={v === 2 ? p.accent : "#C96F45"} stroke={STROKE} />
        <path d="M66 78 C 62 70, 60 68, 58 66 M66 78 C 69 68, 72 66, 74 64" fill="none" stroke={p.leafDark} strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="58" cy="65" rx="4.5" ry="7" fill={p.leaf} transform="rotate(-25 58 65)" />
        <ellipse cx="75" cy="63" rx="4.5" ry="7" fill={p.leaf} transform="rotate(20 75 63)" />
      </g>
    </g>
  );
}

function GrowLamp({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <rect x="49" y="4" width="2.5" height="20" fill={p.metal} />
      <rect x="26" y="24" width="48" height="10" rx="4" fill={v === 1 ? p.accent : p.metal} stroke={STROKE} />
      <rect x="30" y="36" width="40" height="5" rx="2.5" fill="#E7D9FF" opacity="0.9" />
      <path d="M40 41 L40 48 M50 41 L50 50 M60 41 L60 46" stroke="#C9B4F5" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 76 C 34 66, 32 64, 30 62 M42 78 C 42 68, 44 64, 46 60 M50 78 C 52 68, 54 66, 56 62" fill="none" stroke={p.leafDark} strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="29" cy="61" rx="4.5" ry="7" fill={p.leaf} transform="rotate(-25 29 61)" />
      <ellipse cx="46" cy="59" rx="4.5" ry="7" fill={p.leaf} />
      <ellipse cx="56" cy="61" rx="4.5" ry="7" fill={p.leaf} transform="rotate(20 56 61)" />
      <path d="M34 78 h30 l-3 12 h-24 z" fill="#C96F45" stroke={STROKE} />
    </g>
  );
}

function WateringSet({ p, v }: { p: Palette; v: number }) {
  const can = v === 0 ? "#7FB3D5" : v === 1 ? p.accent : p.metal;
  return (
    <g>
      {shade(96, 50, 26)}
      <rect x="24" y="58" width="30" height="26" rx="6" fill={can} stroke={STROKE} />
      <path d="M24 66 L12 62 L12 58 L24 56" fill={can} stroke={STROKE} />
      <circle cx="11" cy="58" r="4" fill={can} stroke={STROKE} />
      <path d="M32 58 C 32 50, 40 50, 40 56" fill="none" stroke={can} strokeWidth="3.5" />
      <path d="M58 84 h24 l-3 -18 h-18 z" fill="#C96F45" stroke={STROKE} />
      <path d="M66 66 C 64 58, 62 56, 60 54 M70 66 C 71 58, 73 56, 75 54" fill="none" stroke={p.leafDark} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="59" cy="52" r="3.5" fill={p.accent} />
      <circle cx="76" cy="52" r="3.5" fill={p.accentSoft} />
    </g>
  );
}

function Fountain({ p, v }: { p: Palette; v: number }) {
  const stone = v === 1 ? p.fabric : v === 0 ? "#B9B2A5" : "#C98A3D";
  const stoneDark = v === 1 ? "#C9CFD6" : v === 0 ? "#8F887B" : "#A5692A";
  const water = "#6FC7E8";
  return (
    <g>
      {shade(96, 50, 40)}
      <ellipse cx="50" cy="86" rx="36" ry="9" fill={stoneDark} stroke={STROKE} />
      <ellipse cx="50" cy="82" rx="32" ry="7" fill={water} />
      <rect x="42" y="52" width="16" height="26" rx="4" fill={stone} stroke={STROKE} />
      <ellipse cx="50" cy="52" rx="18" ry="5.5" fill={stoneDark} stroke={STROKE} />
      <ellipse cx="50" cy="50" rx="14" ry="4" fill={water} />
      <rect x="46" y="30" width="8" height="20" rx="3" fill={stone} stroke={STROKE} />
      <circle cx="50" cy="26" r="4" fill={stone} stroke={STROKE} />
      <path d="M50 24 C 46 20, 42 20, 40 24 M50 24 C 54 20, 58 20, 60 24" fill="none" stroke={water} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 48 C 40 50, 38 52, 38 54 M56 48 C 60 50, 62 52, 62 54" fill="none" stroke={water} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Bench({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 38)}
      <rect x="12" y="60" width="76" height="9" rx="4" fill={v === 1 ? p.metal : p.wood} stroke={STROKE} />
      <rect x="12" y="46" width="76" height="7" rx="3.5" fill={v === 1 ? p.accent : p.wood} stroke={STROKE} />
      <path d="M12 53 C 12 46, 12 44, 12 46 M88 53 C 88 46, 88 44, 88 46" fill="none" />
      <rect x="14" y="42" width="72" height="5" rx="2.5" fill={v === 1 ? p.accent : p.wood} stroke={STROKE} />
      {v === 1 ? (
        <path d="M20 69 L18 90 M80 69 L82 90" stroke={p.metal} strokeWidth="5" strokeLinecap="round" />
      ) : (
        <>
          <path d="M20 69 L16 90 M80 69 L84 90" stroke={p.woodDark} strokeWidth="5" strokeLinecap="round" />
          <path d="M50 69 L50 90" stroke={p.woodDark} strokeWidth="4" />
        </>
      )}
      {v === 2 && <rect x="16" y="58" width="68" height="3" rx="1.5" fill={p.woodDark} opacity="0.6" />}
    </g>
  );
}

function FlowerBed({ p, v }: { p: Palette; v: number }) {
  const flowers = v === 0 ? ["#E2725B", "#F5B301", "#F06EA9"] : v === 1 ? ["#E76F51", "#FFD54F", "#F06EA9"] : ["#F06EA9", "#E2725B", "#A267D8"];
  return (
    <g>
      <ellipse cx="50" cy="88" rx="40" ry="8" fill="#8A5A33" stroke={STROKE} />
      <rect x="10" y="80" width="80" height="7" rx="3.5" fill={v === 1 ? p.metal : "#B07A4A"} stroke={STROKE} />
      {flowers.map((c, i) => (
        <g key={i}>
          <path d={`M${24 + i * 26} 82 C ${22 + i * 26} 74, ${23 + i * 26} 70, ${24 + i * 26} 66`} fill="none" stroke={p.leafDark} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={24 + i * 26} cy="63" r="6" fill={c} stroke={STROKE} strokeWidth="0.8" />
          <circle cx={24 + i * 26} cy="63" r="2.5" fill="#FFF3C4" />
        </g>
      ))}
      <ellipse cx="38" cy="84" rx="8" ry="3" fill={p.leaf} />
      <ellipse cx="62" cy="84" rx="8" ry="3" fill={p.leaf} />
    </g>
  );
}

function GardenPlanter({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 22)}
      <path d="M34 68 h32 l-4 24 h-24 z" fill={v === 0 ? "#5A8FDE" : v === 1 ? p.fabric : "#C96F45"} stroke={STROKE} />
      <rect x="32" y="64" width="36" height="7" rx="3" fill={v === 0 ? "#4A7BC8" : v === 1 ? "#DADDE2" : "#B65B33"} stroke={STROKE} />
      <path d="M44 62 C 42 54, 38 52, 36 50 M50 62 C 50 52, 52 48, 54 46 M56 62 C 60 54, 63 52, 66 50" fill="none" stroke={p.leafDark} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="35" cy="48" r="4.5" fill={v === 2 ? p.accent : "#F06EA9"} />
      <circle cx="55" cy="44" r="4.5" fill={v === 2 ? "#FFFFFF" : "#F5B301"} />
      <circle cx="67" cy="48" r="4.5" fill="#E2725B" />
      <ellipse cx="50" cy="64" rx="14" ry="3.5" fill={p.leaf} />
    </g>
  );
}

function GardenLamp({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 16)}
      <path d="M46 88 L46 40 M54 88 L54 40 M46 88 h8" fill="none" stroke={v === 1 ? p.metal : p.woodDark} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="90" rx="12" ry="3.5" fill={v === 1 ? p.metal : p.woodDark} />
      {v === 1 ? (
        <rect x="38" y="18" width="24" height="24" rx="4" fill={p.accent} stroke={STROKE} />
      ) : (
        <path d="M38 42 L44 20 h12 l6 22 Z" fill={v === 0 ? p.metal : p.accent} stroke={STROKE} />
      )}
      <rect x="43" y="26" width="14" height="12" rx="2" fill="#FFE9A8" />
      <circle cx="50" cy="16" r="3.5" fill={v === 1 ? p.accent : p.metal} />
    </g>
  );
}

function HallPlant({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 24)}
      <path d="M50 60 C 44 40, 36 34, 30 32 M50 58 C 50 36, 56 26, 62 20 M50 60 C 58 48, 68 44, 74 42" fill="none" stroke={p.leafDark} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="29" cy="30" rx="8" ry="12" fill={p.leaf} transform="rotate(-35 29 30)" />
      <ellipse cx="63" cy="17" rx="8" ry="13" fill={p.leaf} transform="rotate(10 63 17)" />
      <ellipse cx="76" cy="41" rx="9" ry="7" fill={p.leaf} transform="rotate(-8 76 41)" />
      <ellipse cx="44" cy="38" rx="7" ry="10" fill={p.leafDark} transform="rotate(-15 44 38)" />
      <ellipse cx="50" cy="62" rx="15" ry="4.5" fill={p.leafDark} />
      <path d="M36 62 h28 l-4 30 h-20 z" fill={v === 0 ? "#C96F45" : v === 1 ? p.fabric : p.accent} stroke={STROKE} />
      <rect x="34" y="59" width="32" height="6" rx="3" fill={v === 0 ? "#A45B33" : v === 1 ? "#DADDE2" : p.accentSoft} stroke={STROKE} />
    </g>
  );
}

function Mirror({ p, v }: { p: Palette; v: number }) {
  if (v === 1) {
    return (
      <g>
        {shade(96, 50, 30)}
        <circle cx="50" cy="42" r="26" fill="#CFE8F2" stroke={p.metal} strokeWidth="6" />
        <path d="M36 34 C 40 28, 46 26, 52 26" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <rect x="46" y="68" width="8" height="24" rx="3" fill={p.metal} />
        <ellipse cx="50" cy="93" rx="14" ry="4" fill={p.woodDark} />
      </g>
    );
  }
  return (
    <g>
      {shade(96, 50, 30)}
      {v === 0 ? (
        <path d="M32 24 Q 50 8 68 24 L 68 66 Q 50 74 32 66 Z" fill="#CFE8F2" stroke={p.woodDark} strokeWidth="6" />
      ) : (
        <rect x="30" y="16" width="40" height="52" rx="6" fill="#CFE8F2" stroke={p.woodDark} strokeWidth="6" />
      )}
      <path d="M40 30 C 44 24, 50 22, 56 22" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <rect x="46" y="72" width="8" height="20" rx="3" fill={p.wood} />
      <ellipse cx="50" cy="93" rx="14" ry="4" fill={p.woodDark} />
    </g>
  );
}

function ConsoleTable({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 34)}
      <rect x="14" y="54" width="72" height="8" rx="4" fill={v === 1 ? p.metal : p.wood} stroke={STROKE} />
      <rect x="26" y="62" width="48" height="12" rx="3" fill={v === 1 ? p.accent : p.woodDark} stroke={STROKE} />
      <circle cx="50" cy="68" r="2" fill={p.fabric} />
      {v === 1 ? (
        <path d="M22 74 L20 90 M78 74 L80 90" stroke={p.metal} strokeWidth="5" strokeLinecap="round" />
      ) : (
        <path d="M22 74 L20 90 M78 74 L80 90 M50 74 L50 90" stroke={p.woodDark} strokeWidth="4.5" strokeLinecap="round" />
      )}
      <rect x="34" y="42" width="10" height="12" rx="2" fill={p.accent} stroke={STROKE} />
      <ellipse cx="62" cy="48" rx="7" ry="7" fill={p.accentSoft} stroke={STROKE} />
    </g>
  );
}

function Runner({ p, v }: { p: Palette; v: number }) {
  // perspective hallway runner: wide at the front, narrow at the back
  const base = v === 1 ? p.accent : "#B03A48";
  const inner = v === 1 ? p.accentSoft : v === 0 ? "#E2725B" : "#C65B62";
  return (
    <g>
      <path d="M8 96 L92 96 L74 44 L26 44 Z" fill={base} stroke={STROKE} strokeWidth="1.5" />
      <path d="M15 92 L85 92 L70 50 L30 50 Z" fill={inner} />
      {v === 1 ? (
        <g fill={base}>
          <path d="M50 88 l9 -5 9 5 -9 5 z" transform="translate(-9,-1)" />
          <path d="M50 72 l6 -4 6 4 -6 4 z" transform="translate(-6,-1)" />
          <path d="M50 58 l3.5 -2.5 3.5 2.5 -3.5 2.5 z" transform="translate(-3.5,-1)" />
        </g>
      ) : v === 0 ? (
        <g fill="#F6EBDC">
          <ellipse cx="50" cy="86" rx="14" ry="4" />
          <ellipse cx="50" cy="74" rx="10" ry="3" />
          <ellipse cx="50" cy="64" rx="7" ry="2.2" />
        </g>
      ) : (
        <g stroke="#FAD7A0" strokeWidth="2" fill="none">
          <path d="M12 90 L88 90" />
          <path d="M20 78 L80 78" />
          <path d="M27 66 L73 66" />
        </g>
      )}
    </g>
  );
}

/* -------------------- new items (110-level campaign) -------------------- */

function WallArt({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <rect x="18" y="18" width="64" height="56" rx="4" fill={p.woodDark} stroke={STROKE} />
      <rect x="24" y="24" width="52" height="44" fill={p.fabric} stroke={STROKE} />
      {v === 1 ? (
        <>
          <circle cx="62" cy="36" r="8" fill={p.metal} />
          <path d="M26 62 L44 44 L56 54 L70 40 L74 62 Z" fill={p.accent} opacity="0.85" />
        </>
      ) : v === 2 ? (
        <>
          <path d="M24 60 Q 38 40 52 56 T 76 44" fill="none" stroke={p.accent} strokeWidth="5" strokeLinecap="round" />
          <circle cx="60" cy="34" r="6" fill={p.accentSoft} />
        </>
      ) : (
        <>
          <circle cx="60" cy="36" r="7" fill={p.accentSoft} />
          <path d="M26 62 L42 48 L54 56 L68 44 L74 62 Z" fill={p.leaf} opacity="0.9" />
        </>
      )}
    </g>
  );
}

function Sconce({ p, v }: { p: Palette; v: number }) {
  const shadeColor = v === 1 ? p.metal : v === 2 ? p.accent : p.fabric;
  return (
    <g>
      <rect x="44" y="30" width="12" height="34" rx="3" fill={p.metal} stroke={STROKE} />
      <rect x="30" y="40" width="20" height="7" rx="3" fill={p.metal} transform="rotate(24 30 40)" />
      <path d={v === 1 ? "M28 40 L52 24 L64 44 L40 52 Z" : "M30 42 Q 42 18 62 36 L 58 46 Q 44 34 36 48 Z"} fill={shadeColor} stroke={STROKE} />
      <circle cx="46" cy="46" r="6" fill="#FFE9A8" />
    </g>
  );
}

function WallShelf({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <rect x="16" y="52" width="68" height="7" rx="3" fill={p.wood} stroke={STROKE} />
      <path d="M22 59 L22 72 L34 59 Z" fill={p.woodDark} />
      <path d="M78 59 L78 72 L66 59 Z" fill={p.woodDark} />
      <rect x="22" y={v === 2 ? 26 : 30} width="14" height={v === 2 ? 26 : 22} rx="3" fill={p.accent} stroke={STROKE} />
      <rect x="42" y="36" width="12" height="16" rx="3" fill={p.fabric} stroke={STROKE} />
      <circle cx="64" cy="44" r="9" fill={p.leaf} stroke={STROKE} />
    </g>
  );
}

function WallMap({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <rect x="14" y="14" width="72" height="60" rx="4" fill={p.woodDark} stroke={STROKE} />
      <rect x="20" y="20" width="60" height="48" fill={v === 1 ? "#DDEAE6" : "#CFE6E4"} stroke={STROKE} />
      <path d="M24 30 Q 36 22 46 30 T 70 26 L 74 34 Q 60 40 48 36 L 26 38 Z" fill={p.leaf} opacity="0.85" />
      <path d="M24 52 Q 40 44 52 52 T 74 48 L 74 64 L 24 64 Z" fill={p.accent} opacity="0.7" />
      <circle cx="62" cy="42" r="4" fill={p.accentSoft} />
    </g>
  );
}

function BathMirror({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {v === 2 ? (
        <rect x="24" y="12" width="52" height="46" rx="6" fill={p.metal} stroke={STROKE} />
      ) : (
        <circle cx="50" cy="36" r="26" fill={p.metal} stroke={STROKE} />
      )}
      <rect x="28" y="18" width="44" height="34" fill="#D6ECF4" />
      <circle cx="50" cy="36" r="22" fill="#D6ECF4" />
      <path d="M38 26 C 42 21, 48 19, 54 19" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <rect x="30" y="66" width="40" height="6" rx="3" fill={p.fabric} stroke={STROKE} />
      <circle cx="58" cy="62" r="5" fill={p.accent} />
    </g>
  );
}

function TowelRack({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <rect x="14" y="26" width="72" height="6" rx="3" fill={p.metal} stroke={STROKE} />
      <rect x="14" y="30" width="6" height="26" rx="3" fill={p.metal} />
      <rect x="80" y="30" width="6" height="26" rx="3" fill={p.metal} />
      <path d="M26 32 h18 v40 q -9 6 -18 0 Z" fill={v === 1 ? p.accent : p.fabric} stroke={STROKE} />
      <path d="M56 32 h16 v32 q -8 5 -16 0 Z" fill={v === 1 ? p.fabric : p.accent} stroke={STROKE} />
      <line x1="30" y1="40" x2="30" y2="62" stroke={STROKE} strokeWidth="1.5" />
      <line x1="62" y1="40" x2="62" y2="56" stroke={STROKE} strokeWidth="1.5" />
    </g>
  );
}

function HangingPlant({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      <line x1="50" y1="0" x2="50" y2="34" stroke={p.metal} strokeWidth="2.5" />
      <path d="M40 34 L60 34 L56 52 L44 52 Z" fill={v === 1 ? p.metal : p.woodDark} stroke={STROKE} />
      <rect x="38" y="32" width="24" height="5" rx="2.5" fill={v === 1 ? p.accent : p.leafDark} stroke={STROKE} />
      <path d="M50 52 C 46 66, 44 76, 46 88 M50 52 C 56 64, 60 72, 58 84 M50 52 C 40 62, 34 70, 36 80" fill="none" stroke={p.leafDark} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="46" cy="90" rx="8" ry="6" fill={p.leaf} />
      <ellipse cx="59" cy="86" rx="7" ry="5" fill={v === 2 ? p.accent : p.leaf} />
      <ellipse cx="35" cy="82" rx="6" ry="5" fill={p.leaf} />
      <circle cx="52" cy="76" r="3.5" fill={p.accentSoft} />
    </g>
  );
}

function Globe({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 20)}
      <ellipse cx="50" cy="88" rx="16" ry="5" fill={p.woodDark} />
      <rect x="47" y="60" width="6" height="26" fill={p.wood} />
      <circle cx="50" cy="42" r="24" fill={v === 1 ? "#BFE0E8" : "#5A8FDE"} stroke={STROKE} strokeWidth="2" />
      <path d="M32 36 Q 40 26 50 32 T 68 30 Q 70 40 62 44 Q 50 40 40 46 Z" fill={p.leaf} opacity="0.9" />
      <path d="M34 54 Q 44 48 54 54 T 66 52" fill="none" stroke={p.accent} strokeWidth="4" opacity="0.7" />
      <path d="M28 52 A 24 24 0 0 1 50 18" fill="none" stroke={p.metal} strokeWidth="2.5" opacity="0.8" />
    </g>
  );
}

function Fridge({ p, v }: { p: Palette; v: number }) {
  const body = v === 1 ? p.metal : v === 2 ? p.accentSoft : p.fabric;
  return (
    <g>
      {shade(96, 50, 30)}
      <rect x="26" y="14" width="48" height="76" rx="7" fill={body} stroke={STROKE} />
      <line x1="26" y1="42" x2="74" y2="42" stroke={STROKE} strokeWidth="2.5" />
      <rect x="62" y="20" width="4" height="16" rx="2" fill={p.metal} />
      <rect x="62" y="48" width="4" height="26" rx="2" fill={p.metal} />
      <circle cx="38" cy="28" r="4" fill={p.accent} />
      <circle cx="48" cy="30" r="4" fill={p.leaf} />
      <circle cx="44" cy="22" r="3.5" fill={p.accentSoft} />
    </g>
  );
}

function Dresser({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 36)}
      <rect x="14" y="36" width="72" height="44" rx="6" fill={p.wood} stroke={STROKE} />
      <rect x="10" y="30" width="80" height="9" rx="4" fill={p.woodDark} stroke={STROKE} />
      {v === 1 ? (
        <>
          <rect x="20" y="44" width="60" height="12" rx="3" fill={p.fabric} />
          <rect x="20" y="62" width="60" height="12" rx="3" fill={p.fabric} />
          <circle cx="50" cy="50" r="2.5" fill={p.metal} />
          <circle cx="50" cy="68" r="2.5" fill={p.metal} />
        </>
      ) : (
        <>
          <rect x="20" y="44" width="28" height="12" rx="3" fill={p.fabric} />
          <rect x="52" y="44" width="28" height="12" rx="3" fill={p.fabric} />
          <rect x="20" y="62" width="28" height="12" rx="3" fill={p.fabric} />
          <rect x="52" y="62" width="28" height="12" rx="3" fill={p.fabric} />
          <circle cx="34" cy="50" r="2.5" fill={p.metal} />
          <circle cx="66" cy="50" r="2.5" fill={p.metal} />
          <circle cx="34" cy="68" r="2.5" fill={p.metal} />
          <circle cx="66" cy="68" r="2.5" fill={p.metal} />
        </>
      )}
      <rect x="42" y="14" width="12" height="14" rx="3" fill={p.accent} />
      <circle cx="48" cy="10" r="6" fill={p.leaf} />
    </g>
  );
}

function Workbench({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 38)}
      <rect x="10" y="40" width="80" height="9" rx="4" fill={v === 1 ? p.metal : p.wood} stroke={STROKE} />
      <rect x="16" y="49" width="7" height="40" fill={p.woodDark} />
      <rect x="77" y="49" width="7" height="40" fill={p.woodDark} />
      <rect x="18" y="66" width="64" height="6" rx="3" fill={p.woodDark} opacity="0.85" />
      <path d="M26 40 v-8 a 8 8 0 0 1 16 0 v8 Z" fill={p.pot ?? p.woodDark} stroke={STROKE} />
      <circle cx="34" cy="28" r="7" fill={p.leaf} />
      <path d="M54 40 v-6 h14 v6 Z" fill={p.accent} stroke={STROKE} />
      <circle cx="61" cy="30" r="6" fill={p.accentSoft} />
    </g>
  );
}

function Birdhouse({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 20)}
      <rect x="44" y="42" width="12" height="48" rx="3" fill={p.woodDark} />
      <ellipse cx="50" cy="90" rx="14" ry="4" fill={p.woodDark} />
      <rect x="32" y="20" width="36" height="26" rx="3" fill={p.wood} stroke={STROKE} />
      <path d="M28 22 L50 6 L72 22 Z" fill={v === 1 ? p.metal : p.accent} stroke={STROKE} />
      <circle cx="50" cy="32" r="6" fill="#5A4632" />
      <line x1="50" y1="38" x2="50" y2="44" stroke="#5A4632" strokeWidth="2.5" />
      <path d="M78 66 q 8 -4 12 2 q -6 4 -12 -2" fill={p.leafDark} />
      <circle cx="76" cy="64" r="4" fill={p.accent} />
    </g>
  );
}

function Umbrella({ p, v }: { p: Palette; v: number }) {
  const canopy = v === 1 ? p.accent : v === 2 ? p.leaf : p.accent;
  return (
    <g>
      {shade(96, 50, 22)}
      <ellipse cx="50" cy="90" rx="16" ry="4.5" fill={p.woodDark} />
      <rect x="47" y="30" width="6" height="60" rx="3" fill={p.metal} />
      <path d="M8 44 Q 50 8 92 44 L 84 52 Q 50 22 16 52 Z" fill={canopy} stroke={STROKE} />
      {v !== 1 ? (
        <>
          <path d="M22 46 Q 50 24 50 24 Q 50 24 78 46" fill="none" stroke={p.fabric} strokeWidth="5" opacity="0.7" />
          <circle cx="50" cy="14" r="4" fill={p.accentSoft} />
        </>
      ) : (
        <path d="M36 40 Q 50 20 64 40" fill="none" stroke={p.fabric} strokeWidth="5" opacity="0.7" />
      )}
    </g>
  );
}

function CoatRack({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 22)}
      <ellipse cx="50" cy="90" rx="15" ry="4.5" fill={p.woodDark} />
      <rect x="47" y="18" width="6" height="72" rx="3" fill={p.woodDark} />
      <path d="M50 20 L30 30 M50 20 L70 30 M50 20 L50 8" stroke={p.wood} strokeWidth="5" strokeLinecap="round" />
      <circle cx="30" cy="31" r="4" fill={p.accent} />
      <circle cx="70" cy="31" r="4" fill={p.accent} />
      <circle cx="50" cy="8" r="4" fill={p.accent} />
      <path d="M56 34 q 14 4 12 26 q -2 14 -12 14 q -8 -2 -8 -18 Z" fill={v === 1 ? p.accent : p.fabric} stroke={STROKE} />
      <path d="M60 70 q 4 12 0 18" fill="none" stroke={STROKE} strokeWidth="1.5" />
    </g>
  );
}

function Bathtub({ p, v }: { p: Palette; v: number }) {
  const tub = v === 1 ? "#E8EAED" : v === 2 ? p.fabric : "#F6F3EA";
  return (
    <g>
      {shade(96, 50, 40)}
      <path d="M10 42 h80 v20 q 0 26 -18 26 h-44 q -18 0 -18 -26 Z" fill={tub} stroke={STROKE} />
      <rect x="6" y="36" width="88" height="12" rx="6" fill={v === 1 ? p.metal : "#ECE7DB"} stroke={STROKE} />
      <rect x="14" y="44" width="72" height="8" rx="4" fill="#9FDCEC" opacity="0.9" />
      <circle cx="32" cy="46" r="5" fill="#FFFFFF" />
      <circle cx="48" cy="48" r="4" fill="#FFFFFF" />
      <circle cx="62" cy="45" r="3.5" fill="#FFFFFF" />
      <rect x="86" y="20" width="6" height="20" rx="3" fill={p.metal} />
      <path d="M86 22 h-14 v6" fill="none" stroke={p.metal} strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Sink({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 26)}
      <path d="M38 62 h24 l-3 28 h-18 Z" fill={p.fabric} stroke={STROKE} />
      <ellipse cx="50" cy="60" rx="26" ry="10" fill={v === 1 ? p.metal : "#F6F3EA"} stroke={STROKE} />
      <ellipse cx="50" cy="58" rx="19" ry="6.5" fill="#D9EEF2" />
      <rect x="44" y="30" width="6" height="22" rx="3" fill={p.metal} />
      <path d="M44 32 h-10 v8" fill="none" stroke={p.metal} strokeWidth="5" strokeLinecap="round" />
      <circle cx="34" cy="42" r="2.5" fill="#7FD4E8" />
    </g>
  );
}

function Vase({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 16)}
      <path d="M38 58 h24 l-4 34 h-16 Z" fill={v === 1 ? p.metal : v === 2 ? p.accent : p.cushion} stroke={STROKE} />
      <ellipse cx="50" cy="58" rx="14" ry="4" fill={v === 1 ? p.accentSoft : p.fabric} stroke={STROKE} />
      <path d="M44 58 q -2 -14 6 -22 M50 58 q 0 -18 0 -24 M56 58 q 3 -12 -3 -20" fill="none" stroke={p.leafDark} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="30" r="7" fill={v === 2 ? p.accent : p.accentSoft} />
      <circle cx="44" cy="34" r="6" fill={p.leaf} />
      <circle cx="58" cy="36" r="5.5" fill={p.metal} />
    </g>
  );
}

function Piano({ p, v }: { p: Palette; v: number }) {
  const body = v === 1 ? p.woodDark : v === 2 ? p.wood : p.woodDark;
  return (
    <g>
      {shade(96, 50, 40)}
      <rect x="14" y="14" width="72" height="60" rx="6" fill={body} stroke={STROKE} />
      <rect x="20" y="20" width="60" height="18" rx="3" fill={p.accent} opacity="0.25" />
      <rect x="14" y="60" width="84" height="10" rx="3" fill={p.wood} stroke={STROKE} />
      <rect x="18" y="63" width="72" height="6" rx="2" fill="#FDF8EC" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={22 + i * 12} y="63" width="4" height="4" fill="#22222A" />
      ))}
      <rect x="30" y="80" width="7" height="14" rx="2" fill={p.woodDark} />
      <rect x="63" y="80" width="7" height="14" rx="2" fill={p.woodDark} />
    </g>
  );
}

function Cello({ p, v }: { p: Palette; v: number }) {
  const body = v === 1 ? p.accent : p.wood;
  return (
    <g>
      {shade(96, 50, 22)}
      <ellipse cx="50" cy="92" rx="12" ry="4" fill={p.woodDark} />
      <rect x="48" y="80" width="4" height="12" fill={p.metal} />
      <path d="M36 78 q -6 -12 0 -22 q 4 -8 14 -8 q 10 0 14 8 q 6 10 0 22 q -4 8 -14 8 q -10 0 -14 -8 Z" fill={body} stroke={STROKE} />
      <path d="M50 48 v-34" stroke={p.woodDark} strokeWidth="5" />
      <circle cx="50" cy="12" r="5" fill={p.woodDark} />
      <rect x="42" y="62" width="16" height="5" rx="2" fill={p.woodDark} />
      <path d="M46 48 v30 M50 48 v30 M54 48 v30" stroke="#D9CFA8" strokeWidth="1.4" />
    </g>
  );
}

function MusicStand({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 20)}
      <path d="M38 92 L50 62 L62 92 M30 88 L50 62 L70 88" fill="none" stroke={p.metal} strokeWidth="4" strokeLinecap="round" />
      <rect x="47" y="36" width="6" height="28" fill={p.metal} />
      <rect x="28" y="12" width="44" height="30" rx="3" fill={v === 1 ? p.accent : p.metal} stroke={STROKE} transform="rotate(-8 50 27)" />
      <rect x="33" y="16" width="34" height="22" fill={p.fabric} transform="rotate(-8 50 27)" />
      <circle cx="44" cy="26" r="3" fill={p.woodDark} />
      <circle cx="52" cy="22" r="3" fill={p.woodDark} />
      <path d="M44 29 v6 l6 -2 v-6" fill="none" stroke={p.woodDark} strokeWidth="1.5" />
    </g>
  );
}

function Desk({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 40)}
      <rect x="8" y="38" width="84" height="9" rx="4" fill={p.wood} stroke={STROKE} />
      <rect x="14" y="47" width="26" height="30" rx="3" fill={p.woodDark} stroke={STROKE} />
      <rect x="18" y="52" width="18" height="8" rx="2" fill={p.fabric} />
      <rect x="18" y="64" width="18" height="8" rx="2" fill={p.fabric} />
      <rect x="70" y="47" width="8" height="42" fill={p.woodDark} />
      <rect x="84" y="47" width="8" height="42" fill={p.woodDark} />
      <rect x="46" y="32" width="22" height="6" rx="2" fill="#FDF8EC" stroke={STROKE} />
      <rect x="44" y="26" width="16" height="6" rx="2" fill={v === 1 ? p.accent : p.leaf} stroke={STROKE} />
      <rect x="66" y="22" width="6" height="16" rx="3" fill={p.metal} />
      <path d="M66 24 L58 16 h12 Z" fill={v === 2 ? p.accent : p.accentSoft} />
    </g>
  );
}

function OfficeChair({ p, v }: { p: Palette; v: number }) {
  const fabric = v === 1 ? p.metal : p.accent;
  return (
    <g>
      {shade(96, 50, 24)}
      <rect x="28" y="18" width="44" height="26" rx="6" fill={fabric} stroke={STROKE} />
      <rect x="36" y="24" width="28" height="8" rx="3" fill={p.fabric} />
      <rect x="34" y="44" width="32" height="10" rx="4" fill={fabric} stroke={STROKE} />
      <rect x="47" y="54" width="6" height="18" fill={p.metal} />
      <path d="M34 78 L50 70 L66 78 M38 84 L50 72 L62 84" fill="none" stroke={p.metal} strokeWidth="4" strokeLinecap="round" />
      <circle cx="34" cy="80" r="3.5" fill={p.woodDark} />
      <circle cx="66" cy="80" r="3.5" fill={p.woodDark} />
      <circle cx="38" cy="86" r="3.5" fill={p.woodDark} />
      <circle cx="62" cy="86" r="3.5" fill={p.woodDark} />
    </g>
  );
}

function Chest({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 30)}
      <rect x="18" y="36" width="64" height="42" rx="5" fill={p.wood} stroke={STROKE} />
      <path d="M18 38 Q 50 20 82 38 v10 H18 Z" fill={v === 1 ? p.metal : p.woodDark} stroke={STROKE} />
      <rect x="26" y="36" width="7" height="42" fill={v === 1 ? p.metal : p.accent} opacity="0.85" />
      <rect x="67" y="36" width="7" height="42" fill={v === 1 ? p.metal : p.accent} opacity="0.85" />
      <rect x="45" y="46" width="10" height="12" rx="2" fill={p.accent} stroke={STROKE} />
      <circle cx="50" cy="50" r="2" fill={p.woodDark} />
    </g>
  );
}

function Boxes({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 30)}
      <rect x="18" y="52" width="44" height="36" rx="3" fill={p.wood} stroke={STROKE} />
      <line x1="18" y1="64" x2="62" y2="64" stroke={STROKE} strokeWidth="2" />
      <rect x="42" y="26" width="34" height="28" rx="3" fill={p.woodDark} stroke={STROKE} transform="rotate(4 59 40)" />
      <rect x="22" y="24" width="22" height="18" rx="3" fill={v === 1 ? p.accent : p.fabric} stroke={STROKE} transform="rotate(-6 33 33)" />
    </g>
  );
}

function Hay({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 34)}
      <rect x="12" y="46" width="76" height="36" rx="10" fill={v === 1 ? p.cushion : "#E3C25F"} stroke={STROKE} />
      <line x1="30" y1="46" x2="30" y2="82" stroke="#B89044" strokeWidth="4" />
      <line x1="70" y1="46" x2="70" y2="82" stroke="#B89044" strokeWidth="4" />
      <path d="M12 58 h76 M12 70 h76" stroke="#D4AE52" strokeWidth="2" opacity="0.8" />
      <path d="M16 40 q 10 -8 20 0 M40 38 q 10 -8 20 0 M64 40 q 10 -8 18 0" fill="none" stroke={v === 2 ? p.accent : "#E3C25F"} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Saddle({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 26)}
      <path d="M30 88 L36 50 M70 88 L64 50" stroke={p.woodDark} strokeWidth="5" strokeLinecap="round" />
      <rect x="30" y="48" width="40" height="7" rx="3" fill={p.woodDark} />
      <path d="M28 48 q 22 -18 44 0 q 2 10 -6 12 h-32 q -8 -2 -6 -12 Z" fill={v === 1 ? p.metal : p.fabric} stroke={STROKE} />
      <circle cx="50" cy="34" r="7" fill={p.woodDark} />
      <path d="M32 58 l-6 14 h8 M68 58 l6 14 h-8" fill="none" stroke={v === 1 ? p.metal : p.accent} strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}

function Bucket({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 18)}
      <path d="M34 44 h32 l-4 42 h-24 Z" fill={v === 1 ? p.accent : p.metal} stroke={STROKE} />
      <ellipse cx="50" cy="44" rx="16" ry="5" fill={v === 1 ? p.accentSoft : p.fabric} stroke={STROKE} />
      <ellipse cx="50" cy="45" rx="11" ry="3.5" fill="#7FD4E8" />
      <path d="M36 44 A 16 14 0 0 1 64 44" fill="none" stroke={p.woodDark} strokeWidth="3.5" />
    </g>
  );
}

function Horse({ p, v }: { p: Palette; v: number }) {
  const coat = v === 1 ? p.metal : v === 2 ? p.accent : p.wood;
  return (
    <g>
      {shade(96, 50, 34)}
      <rect x="22" y="36" width="52" height="24" rx="11" fill={coat} stroke={STROKE} />
      <rect x="28" y="58" width="7" height="30" rx="3" fill={coat} />
      <rect x="40" y="58" width="7" height="32" rx="3" fill={coat} />
      <rect x="52" y="58" width="7" height="32" rx="3" fill={coat} />
      <rect x="62" y="58" width="7" height="30" rx="3" fill={coat} />
      <path d="M66 40 q 12 -4 14 6 q 1 8 -8 10 l-8 0 Z" fill={coat} stroke={STROKE} />
      <rect x="72" y="42" width="12" height="9" rx="4" fill={p.fabric} />
      <circle cx="86" cy="46" r="2" fill="#5A4632" />
      <path d="M68 34 l4 -8 4 8 M74 34 l4 -7 3 7" fill={p.woodDark} />
      <path d="M24 38 q -10 2 -12 16 q -2 8 4 8" fill="none" stroke={p.woodDark} strokeWidth="5" strokeLinecap="round" />
      <path d="M40 34 q -4 12 0 22" fill="none" stroke={p.woodDark} strokeWidth="4" strokeLinecap="round" />
      <circle cx="74" cy="44" r="2.2" fill="#2E2418" />
    </g>
  );
}

function FruitTree({ p, v }: { p: Palette; v: number }) {
  const fruit = v === 1 ? p.accent : "#E2483C";
  return (
    <g>
      {shade(96, 50, 30)}
      <path d="M46 90 q -1 -24 -3 -34 h14 q -2 10 -3 34 Z" fill={p.woodDark} stroke={STROKE} />
      <circle cx="50" cy="36" r="28" fill={p.leaf} stroke={STROKE} />
      <circle cx="34" cy="44" r="15" fill={p.leafDark} />
      <circle cx="66" cy="44" r="14" fill={p.leaf} />
      <circle cx="38" cy="36" r="4.5" fill={fruit} />
      <circle cx="56" cy="28" r="4.5" fill={fruit} />
      <circle cx="64" cy="46" r="4.5" fill={v === 2 ? p.accentSoft : fruit} />
      <circle cx="44" cy="52" r="4.5" fill={fruit} />
    </g>
  );
}

function FruitBasket({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 22)}
      <path d="M30 52 h40 l-5 38 h-30 Z" fill={p.wood} stroke={STROKE} />
      <line x1="30" y1="64" x2="70" y2="64" stroke={STROKE} strokeWidth="2" />
      <line x1="32" y1="76" x2="68" y2="76" stroke={STROKE} strokeWidth="2" />
      <ellipse cx="50" cy="52" rx="20" ry="5" fill={p.woodDark} stroke={STROKE} />
      <circle cx="42" cy="46" r="8" fill="#E2483C" stroke={STROKE} />
      <circle cx="58" cy="46" r="8" fill={v === 1 ? p.accent : "#F5B301"} stroke={STROKE} />
      <circle cx="50" cy="38" r="8" fill={v === 2 ? p.leaf : "#E2725B"} stroke={STROKE} />
      <path d="M34 48 A 20 18 0 0 1 66 48" fill="none" stroke={p.woodDark} strokeWidth="3.5" />
    </g>
  );
}

function Ladder({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 26)}
      <path d="M30 92 L42 10 M70 92 L58 10" stroke={v === 1 ? p.metal : p.wood} strokeWidth="6" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={36 - i * 1.6} y1={24 + i * 14} x2={64 + i * 1.6} y2={24 + i * 14} stroke={p.woodDark} strokeWidth="5" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Crate({ p, v }: { p: Palette; v: number }) {
  return (
    <g>
      {shade(96, 50, 26)}
      <rect x="22" y="46" width="56" height="42" rx="4" fill={p.wood} stroke={STROKE} />
      <line x1="22" y1="60" x2="78" y2="60" stroke={STROKE} strokeWidth="2" />
      <line x1="22" y1="74" x2="78" y2="74" stroke={STROKE} strokeWidth="2" />
      <circle cx="38" cy="40" r="7.5" fill="#E2483C" stroke={STROKE} />
      <circle cx="54" cy="40" r="7.5" fill={v === 1 ? p.accent : "#F5B301"} stroke={STROKE} />
      <circle cx="46" cy="32" r="7.5" fill={v === 2 ? p.leaf : "#E2725B"} stroke={STROKE} />
    </g>
  );
}

/* ------------------------------ dispatcher ------------------------------ */

const ART: Record<string, (props: { p: Palette; v: number }) => React.ReactNode> = {
  sofa: Sofa,
  armchair: Armchair,
  coffee_table: CoffeeTable,
  chandelier: Chandelier,
  curtain: Curtain,
  carpet: Carpet,
  bookcase: Bookcase,
  shelf: Shelf,
  chair: Chair,
  floor_lamp: FloorLamp,
  rug: Rug,
  cabinet: Cabinet,
  kitchen_table: KitchenTable,
  kitchen_chair: KitchenChair,
  pendant_light: PendantLight,
  kitchen_decor: KitchenDecor,
  bed: Bed,
  wardrobe: Wardrobe,
  bedside_lamp: BedsideLamp,
  bed_curtain: Curtain,
  bed_carpet: Carpet,
  planter: Planter,
  flower_stand: FlowerStand,
  green_shelf: GreenShelf,
  grow_lamp: GrowLamp,
  watering_set: WateringSet,
  fountain: Fountain,
  bench: Bench,
  flower_bed: FlowerBed,
  garden_planter: GardenPlanter,
  garden_lamp: GardenLamp,
  hall_chandelier: Chandelier,
  console_table: ConsoleTable,
  mirror: Mirror,
  runner: Runner,
  hall_plant: HallPlant,

  /* ---- 110-level campaign additions ---- */
  wall_art: WallArt,
  hall_painting: WallArt,
  sconce: Sconce,
  wall_lamp: Sconce,
  kitchen_shelf: WallShelf,
  wall_map: WallMap,
  bath_mirror: BathMirror,
  towel_rack: TowelRack,
  green_hanger: HangingPlant,
  globe: Globe,
  fridge: Fridge,
  dresser: Dresser,
  workbench: Workbench,
  birdhouse: Birdhouse,
  umbrella: Umbrella,
  coat_rack: CoatRack,
  bathtub: Bathtub,
  sink: Sink,
  bath_mat: Rug,
  bath_plant: Planter,
  dining_table: KitchenTable,
  dining_chair: KitchenChair,
  dining_sideboard: Cabinet,
  dining_chandelier: Chandelier,
  dining_vase: Vase,
  dining_carpet: Rug,
  piano: Piano,
  cello: Cello,
  music_stand: MusicStand,
  music_lamp: FloorLamp,
  music_carpet: Rug,
  desk: Desk,
  office_chair: OfficeChair,
  study_lamp: FloorLamp,
  office_bookcase: Bookcase,
  study_rug: Rug,
  attic_chest: Chest,
  attic_boxes: Boxes,
  attic_lamp: PendantLight,
  attic_carpet: Rug,
  attic_plant: HallPlant,
  gazebo_seat: Bench,
  gazebo_table: CoffeeTable,
  gazebo_lantern: GardenLamp,
  gazebo_plants: GardenPlanter,
  guest_bed: Bed,
  guest_table: KitchenTable,
  guest_lamp: BedsideLamp,
  guest_rug: Rug,
  stable_horse: Horse,
  stable_hay: Hay,
  stable_saddle: Saddle,
  stable_bucket: Bucket,
  fruit_tree: FruitTree,
  fruit_basket: FruitBasket,
  orchard_ladder: Ladder,
  orchard_crate: Crate,
};

export function DecorArt({
  item,
  variant,
  className,
}: {
  item: string;
  variant: number;
  className?: string;
}) {
  const Art = ART[item] ?? Shelf;
  const p = PALETTES[Math.min(Math.max(variant, 0), 2)];
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={item}
    >
      <Art p={p} v={Math.min(Math.max(variant, 0), 2)} />
    </svg>
  );
}

/** Static preview used in shop cards: includes a soft floor shadow. */
export function DecorPreview({
  item,
  variant,
  className,
}: {
  item: string;
  variant: number;
  className?: string;
}) {
  return (
    <div className={cn("relative flex items-end justify-center", className)}>
      <DecorArt item={item} variant={variant} className="h-[85%] w-[85%]" />
    </div>
  );
}
