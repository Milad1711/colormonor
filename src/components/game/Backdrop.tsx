"use client";

/**
 * SceneBackdrop — a fixed, dreamy 3D-style backdrop shared by every screen:
 * warm gradient sky, glowing sun, drifting clouds, distant hills, soft
 * floating color orbs (paint drops) and twinkling sparks. Purely decorative
 * and pointer-transparent; sits behind all screen content.
 */

const ORBS: Array<{
  c: string;
  left: string;
  top: string;
  size: number;
  dur: number;
  delay: number;
}> = [
  { c: "#FF8A5C", left: "7%", top: "16%", size: 52, dur: 8.5, delay: 0 },
  { c: "#FFC94D", left: "80%", top: "10%", size: 64, dur: 10, delay: 0.6 },
  { c: "#7EC8E3", left: "20%", top: "62%", size: 44, dur: 9, delay: 1.2 },
  { c: "#B79CE0", left: "88%", top: "48%", size: 56, dur: 11, delay: 0.3 },
  { c: "#FFB1C1", left: "46%", top: "80%", size: 48, dur: 9.5, delay: 1.8 },
  { c: "#8ED9A8", left: "66%", top: "34%", size: 40, dur: 8, delay: 2.2 },
];

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 46" className={className} style={style} aria-hidden>
      <g fill="#FFFFFF">
        <ellipse cx="34" cy="32" rx="26" ry="12" />
        <ellipse cx="62" cy="24" rx="24" ry="14" />
        <ellipse cx="88" cy="32" rx="22" ry="11" />
        <ellipse cx="52" cy="34" rx="30" ry="10" />
      </g>
    </svg>
  );
}

export function Backdrop() {
  return (
    <div className="scene-backdrop" aria-hidden>
      <div className="scene-sky" />
      <div className="scene-sun" />

      <Cloud className="cloud absolute" style={{ top: "7%", left: "5%", width: "22vw", maxWidth: 170, animationDuration: "12s" }} />
      <Cloud className="cloud absolute" style={{ top: "16%", right: "6%", width: "17vw", maxWidth: 140, animationDuration: "9s", animationDelay: "0.8s", opacity: 0.9 }} />
      <Cloud className="cloud absolute" style={{ top: "38%", left: "58%", width: "13vw", maxWidth: 110, animationDuration: "14s", animationDelay: "1.6s", opacity: 0.55 }} />

      {/* distant hills */}
      <svg className="absolute inset-x-0 bottom-0 h-[30%] w-full" viewBox="0 0 480 120" preserveAspectRatio="none" aria-hidden>
        <path d="M0 82 Q 110 40 240 76 Q 360 104 480 62 L480 120 L0 120 Z" fill="#BBD79F" opacity="0.5" />
        <path d="M0 100 Q 150 62 300 94 Q 400 112 480 86 L480 120 L0 120 Z" fill="#A9CB8C" opacity="0.6" />
      </svg>

      {/* floating paint orbs */}
      {ORBS.map((o, i) => (
        <span
          key={i}
          className="orb"
          style={{
            left: o.left,
            top: o.top,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle at 34% 30%, ${o.c} 0%, ${o.c}00 72%)`,
            ["--dur" as string]: `${o.dur}s`,
            animationDelay: `${o.delay}s`,
          }}
        />
      ))}

      {/* twinkling sparks */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={`t${i}`}
          className="twinkle"
          style={{
            left: `${(i * 37 + 8) % 100}%`,
            top: `${(i * 23 + 6) % 62}%`,
            ["--dur" as string]: `${2.2 + (i % 5) * 0.55}s`,
            animationDelay: `${i * 0.35}s`,
          }}
        />
      ))}

      <div className="vignette" />
    </div>
  );
}
