"use client";

/**
 * LuckyWheel — daily fortune wheel.
 * One free spin per local calendar day; the used day is persisted in the
 * save so progress survives reloads. Prizes are weighted so small wins are
 * common and the golden jackpot is rare. Tick sounds fire whenever the
 * pointer sweeps over a pin (computed from the easing curve, so they slow
 * down with the wheel exactly like a real wheel of fortune).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import { useT } from "./UiBits";
import { Confetti } from "./Modal";
import { cn } from "@/lib/utils";

const SIZE = 300;
const C = SIZE / 2;
const R = 122;

const SEGMENTS = [
  { value: 20, color: "#F59E42", text: "#7C3A00" },
  { value: 40, color: "#55B85B", text: "#173F19" },
  { value: 60, color: "#5A8FDE", text: "#1B3A6B" },
  { value: 100, color: "#F06EA9", text: "#7A2347" },
  { value: 150, color: "#3EC5B0", text: "#134D44" },
  { value: 200, color: "#A267D8", text: "#4A2377" },
  { value: 300, color: "#E2725B", text: "#6E2413" },
  { value: 500, color: "#F5B301", text: "#6E4300" },
] as const;

/** weights aligned with SEGMENTS (jackpot rare) */
const WEIGHTS = [24, 20, 17, 15, 11, 8, 4, 1];

const SPIN_MS = 4600;
const EASE = [0.16, 0.86, 0.24, 1] as const; // fast start, gentle stop

function pickSegment(): number {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return 0;
}

/** segment i spans [i*45°, (i+1)*45°) clockwise from the top pointer */
function segPath(i: number): string {
  const a0 = ((i * 45 - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * 45 - 90) * Math.PI) / 180;
  const x0 = C + R * Math.cos(a0);
  const y0 = C + R * Math.sin(a0);
  const x1 = C + R * Math.cos(a1);
  const y1 = C + R * Math.sin(a1);
  return `M ${C} ${C} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function segLabelPos(i: number): { x: number; y: number; rot: number } {
  const mid = i * 45 + 22.5 - 90;
  const rad = (mid * Math.PI) / 180;
  return {
    x: C + R * 0.68 * Math.cos(rad),
    y: C + R * 0.68 * Math.sin(rad),
    rot: mid + 90,
  };
}

/** cubic-bezier easing with control points (x1,y1,x2,y2), returns progress 0..1 */
function cubicEase(x: number): number {
  const [x1, y1, x2, y2] = EASE;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Newton-Raphson on the x component
  let t = x;
  for (let k = 0; k < 8; k++) {
    const u = 1 - t;
    const bx = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
    const dx = 3 * u * u * x1 + 6 * u * t * (x2 - x1) + 3 * t * t * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    t -= (bx - x) / dx;
  }
  const u = 1 - t;
  return 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
}

function msUntilTomorrow(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function LuckyWheel({ compact = false }: { compact?: boolean }) {
  const { t, n } = useT();
  const coins = useGame((s) => s.coins);
  const lastWheelDate = useGame((s) => s.lastWheelDate);
  const registerSpin = useGame((s) => s.registerSpin);
  const addCoins = useGame((s) => s.addCoins);
  const spinReady = useSpinAvailable(lastWheelDate);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<number | null>(null);
  // ticking clock for the countdown label (state is set inside the interval
  // callback, never synchronously in the effect body)
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    if (spinReady) return;
    const id = setInterval(() => setNowTick((v) => v + 1), 20000);
    return () => clearInterval(id);
  }, [spinReady]);

  const countdown = useMemo(() => {
    void nowTick; // recomputed whenever the 20s tick fires
    if (spinReady) return "";
    const ms = msUntilTomorrow();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const mm = n(m).length < 2 ? "0" + n(m) : n(m);
    return `${n(h)}:${mm}`;
  }, [spinReady, n, nowTick]);

  const wheelAngle = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const spin = useCallback(() => {
    if (spinning || !spinReady) return;
    if (!registerSpin()) return; // guard against races
    setPrize(null);
    setSpinning(true);
    sfx.spinStart();

    const seg = pickSegment();
    const jitter = (Math.random() - 0.5) * 26; // stay inside the segment
    const target = wheelAngle.current + 360 * 5 + (360 - (seg * 45 + 22.5 + jitter)) - (wheelAngle.current % 360);
    const startAngle = wheelAngle.current;
    const delta = target - startAngle;
    const t0 = performance.now();
    let lastTickIdx = -1;

    const frame = (now: number) => {
      const p = Math.min((now - t0) / SPIN_MS, 1);
      const eased = cubicEase(p);
      const angle = startAngle + delta * eased;
      setRotation(angle);
      // tick when the pointer crosses a pin (every 45°)
      const pinIdx = Math.floor(((angle % 360) + 360) % 360 / 45);
      if (pinIdx !== lastTickIdx) {
        lastTickIdx = pinIdx;
        sfx.tick();
      }
      if (p < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        wheelAngle.current = target;
        setSpinning(false);
        const won = SEGMENTS[seg].value;
        addCoins(won);
        setPrize(won);
        if (won >= 300) sfx.jackpot();
        else sfx.win();
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [spinning, spinReady, registerSpin, addCoins]);

  const labels = useMemo(() => SEGMENTS.map((_, i) => segLabelPos(i)), []);

  return (
    <div className="flex flex-col items-center">
      {/* coins balance */}
      <div className="mb-1 flex items-center gap-1.5 self-center rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-sm font-black text-amber-800 shadow-sm">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <circle cx="12" cy="12" r="9.5" fill="#F5B301" stroke="#B45309" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="6" fill="#FFD54F" stroke="#E29B00" strokeWidth="1" />
        </svg>
        <span className="tabular-nums">{n(coins)}</span>
      </div>

      {/* wheel */}
      <div className={cn("wheel-stage relative", compact ? "w-64" : "w-72 max-w-full")}>
        {!spinning && !spinReady && prize === null && (
          <span className="wheel-used-badge">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </span>
        )}
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block w-full drop-shadow-[0_14px_28px_rgba(180,90,20,0.35)]" role="img" aria-label={t("lucky_wheel")}>
          <defs>
            <radialGradient id="lw-hub" cx="0.38" cy="0.3" r="0.9">
              <stop offset="0" stopColor="#FFF7DB" />
              <stop offset="0.55" stopColor="#FFD75E" />
              <stop offset="1" stopColor="#E89B0C" />
            </radialGradient>
            <linearGradient id="lw-rim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE08A" />
              <stop offset="0.5" stopColor="#E89B0C" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>
          </defs>

          {/* static rim with bulbs */}
          <circle cx={C} cy={C} r={R + 9} fill="url(#lw-rim)" stroke="#8A4A0B" strokeWidth="2.5" />
          {Array.from({ length: 16 }).map((_, i) => {
            const a = ((i * 22.5 - 90) * Math.PI) / 180;
            const x = C + (R + 9) * Math.cos(a);
            const y = C + (R + 9) * Math.sin(a);
            return (
              <circle
                key={i}
                className="wheel-bulb"
                cx={x.toFixed(2)}
                cy={y.toFixed(2)}
                r="4.2"
                fill="#FFF3C4"
                stroke="#B45309"
                strokeWidth="1.2"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            );
          })}

          {/* rotating disc */}
          <g
            className="wheel-disc"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "none" : "transform 0.5s ease-out",
            }}
          >
            {SEGMENTS.map((s, i) => (
              <g key={i}>
                <path d={segPath(i)} fill={s.color} stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
                <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
              </g>
            ))}
            {SEGMENTS.map((s, i) => {
              const p = labels[i];
              return (
                <g key={`l${i}`} transform={`rotate(${p.rot} ${p.x} ${p.y})`}>
                  <text
                    x={p.x}
                    y={p.y + 5.5}
                    textAnchor="middle"
                    fontSize="21"
                    fontWeight="900"
                    fill={s.text}
                    style={{ paintOrder: "stroke" }}
                  >
                    {s.value}
                  </text>
                </g>
              );
            })}
            {/* pins */}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = ((i * 45 - 90) * Math.PI) / 180;
              const x = C + R * Math.cos(a);
              const y = C + R * Math.sin(a);
              return <circle key={`p${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r="3.4" fill="#FFF7DB" stroke="#8A4A0B" strokeWidth="1.4" />;
            })}
            <circle cx={C} cy={C} r="26" fill="url(#lw-hub)" stroke="#8A4A0B" strokeWidth="3" />
            <path
              d="M150 136.5l3.4 6.9 7.6 1.1-5.5 5.4 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6-5.5-5.4 7.6-1.1z"
              fill="#B45309"
              opacity="0.85"
            />
          </g>
        </svg>

        {/* pointer */}
        <div className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center" aria-hidden>
          <svg viewBox="0 0 40 46" className="w-9 drop-shadow-md">
            <path d="M20 44 L6 14 Q20 2 34 14 Z" fill="#E23A3A" stroke="#8A1A1A" strokeWidth="2.5" />
            <circle cx="20" cy="15" r="6.5" fill="#FFF3C4" stroke="#8A1A1A" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* status / action */}
      <div className="mt-4 w-full max-w-64 text-center">
        {spinReady ? (
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className={cn(
              "btn-shine w-full min-h-13 rounded-full bg-gradient-to-b from-rose-500 via-red-500 to-rose-600 px-6 text-xl font-black text-white shadow-[0_5px_0_#9F1239,inset_0_2px_0_rgba(255,255,255,0.5)] transition-all",
              "active:translate-y-[4px] active:shadow-none disabled:opacity-70",
            )}
          >
            {spinning ? (
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="size-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                  <path d="M21 12a9 9 0 11-6.2-8.6" />
                </svg>
                {t("spinning")}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {t("spin_now")}
                <span className="wheel-free-chip">{t("wheel_free_badge")}</span>
              </span>
            )}
          </button>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white/85 px-4 py-3 text-sm font-bold leading-6 text-stone-600 shadow-sm">
            <p>{t("wheel_used_today")}</p>
            <p className="mt-1 text-xs font-black text-amber-700">
              {t("wheel_next_free")}: <span className="tabular-nums">{countdown}</span>
            </p>
          </div>
        )}
        <p className="mt-2 text-[11px] font-bold text-stone-500">{t("lucky_wheel_sub")}</p>
      </div>

      {/* prize overlay */}
      {prize !== null && (
        <>
          <Confetti count={36} />
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px] bg-stone-900/40 backdrop-blur-[2px]" onClick={() => setPrize(null)}>
            <div className="modal-pop w-72 rounded-[26px] border-4 border-white/80 bg-gradient-to-b from-[#FFFBEF] to-[#FFF2D9] p-5 text-center shadow-[0_24px_60px_rgba(124,58,12,0.4)]">
              <div className="coin-pop mx-auto flex size-20 items-center justify-center rounded-full border-4 border-white/70 bg-gradient-to-b from-amber-300 to-orange-500 shadow-[0_10px_24px_rgba(234,88,12,0.45)]">
                <svg viewBox="0 0 24 24" className="size-11" aria-hidden>
                  <circle cx="12" cy="12" r="9.5" fill="#F5B301" stroke="#B45309" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="6" fill="#FFD54F" stroke="#E29B00" strokeWidth="1.1" />
                  <path d="M9.5 12.5l1.8 1.8 3.4-3.8" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="title3d mt-2 text-2xl font-black">{t("wheel_prize_title")}</h3>
              <p className="mt-1 text-3xl font-black text-amber-600 tabular-nums">
                +{n(prize)}{" "}
                <span className="text-sm font-bold text-stone-500">{t("pack_coins_word")}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  sfx.tap();
                  setPrize(null);
                }}
                className="mt-4 w-full min-h-11 rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-500 text-base font-black text-white shadow-[0_4px_0_#0f766e] active:translate-y-[3px] active:shadow-none"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Tracks today's local date key (refreshes every 30s) and returns true when
 * the stored last-spin date differs from it — i.e. the free spin is ready.
 */
function useSpinAvailable(lastWheelDate: string | null): boolean {
  const [today, setToday] = useState("");
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const p = (v: number) => String(v).padStart(2, "0");
      setToday(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);
  // free spin is ready when the stored last-spin date differs from today
  return today !== "" && lastWheelDate !== today;
}

/** Small round entry button showing whether today's spin is still available. */
export function WheelEntryButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useT();
  const lastWheelDate = useGame((s) => s.lastWheelDate);
  const free = useSpinAvailable(lastWheelDate);
  return (
    <button
      type="button"
      onClick={() => {
        sfx.tap();
        onOpen();
      }}
      className="btn-shine relative flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-rose-500 via-red-500 to-rose-600 px-3 text-base font-black text-white shadow-[0_4px_0_#9F1239,inset_0_2px_0_rgba(255,255,255,0.45)] transition-all active:translate-y-[3px] active:shadow-none"
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <circle cx="12" cy="12" r="9" fill="#FFF3C4" stroke="#7F1D1D" strokeWidth="1.6" />
        <path d="M12 3v9l6.5 6.2M12 12L4.4 6.7M12 12l9.3-2" stroke="#7F1D1D" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="1.8" fill="#7F1D1D" />
      </svg>
      {t("lucky_wheel")}
      {free && <span className="wheel-free-chip">{t("wheel_free_badge")}</span>}
    </button>
  );
}

/** Compact entry button for the coin packs. */
export function PacksEntryButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={() => {
        sfx.tap();
        onOpen();
      }}
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 px-3 text-base font-black text-white shadow-[0_4px_0_#c2410c,inset_0_2px_0_rgba(255,255,255,0.45)] transition-all active:translate-y-[3px] active:shadow-none"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 10l9-7 9 7" />
        <path d="M5 9.5V20h14V9.5" />
        <path d="M9 20v-4.5a3 3 0 016 0V20" />
      </svg>
      {t("coin_packs")}
    </button>
  );
}
