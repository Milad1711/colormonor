"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
import { liquid } from "@/game/palette";
import { isTubeComplete } from "@/game/solver";
import { FLY_BACK, FLY_OUT, UNIT_MS, rowSplit, sleep, type TubeBoardApi } from "@/game/board-anim";

export interface PourInfo {
  to: number;
  color: number;
  units: number;
  /** ms until the whole pour animation finishes */
  totalMs: number;
  /** ms per unit */
  unitMs: number;
  /** ms until the first unit starts landing */
  startMs: number;
}

interface TubeProps {
  index: number;
  units: number[];
  selected: boolean;
  hinted: boolean;
  justCompleted: boolean;
  pour: PourInfo | null;
  onTap: (index: number) => void;
  shake: boolean;
}

export const Tube = forwardRef<HTMLButtonElement, TubeProps>(function Tube(
  { index, units, selected, hinted, justCompleted, pour, onTap, shake },
  ref,
) {
  const complete = isTubeComplete(units);
  const ghostForMe = pour && pour.to === index ? pour : null;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`tube-${index + 1}`}
      data-tube={index}
      onClick={() => onTap(index)}
      className={cn(
        "tube select-none outline-none",
        selected && "tube-selected",
        hinted && "tube-hinted",
        shake && "tube-shake",
        complete && "tube-complete",
      )}
    >
      {/* ground shadow + liquid units */}
      <span className="tube-shadow3d" aria-hidden />
      <div className="tube-units">
        {units.map((c, i) => {
          const col = liquid(c);
          return (
            <div
              key={i}
              data-unit={i}
              className="unit"
              style={{
                bottom: `${i * 25}%`,
                background: `linear-gradient(180deg, ${col.light} 0%, ${col.base} 46%, ${col.dark} 100%)`,
              }}
            />
          );
        })}
        {/* ghost units rising while pouring */}
        {ghostForMe &&
          Array.from({ length: ghostForMe.units }).map((_, gi) => {
            const col = liquid(ghostForMe.color);
            return (
              <div
                key={`g${gi}`}
                className="unit unit-ghost"
                style={{
                  bottom: `${(units.length + gi) * 25}%`,
                  background: `linear-gradient(180deg, ${col.light} 0%, ${col.base} 46%, ${col.dark} 100%)`,
                  animationDelay: `${ghostForMe.startMs + (gi + 1) * ghostForMe.unitMs}ms`,
                }}
              />
            );
          })}
      </div>
      {/* glass curvature + gloss */}
      <div className="tube-belly" />
      <div className="tube-gloss" />
      <div className="tube-rim" />
      {complete && <div className="tube-glow" />}
      {justCompleted && <Sparkles />}
    </button>
  );
});

function Sparkles() {
  const bits = Array.from({ length: 8 });
  return (
    <div className="sparkles" aria-hidden>
      {bits.map((_, i) => (
        <span
          key={i}
          className="sparkle"
          style={{
            ["--sx" as string]: `${(Math.random() - 0.5) * 90}px`,
            ["--sy" as string]: `${-20 - Math.random() * 60}px`,
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DOM fallback board (used when WebGL is unavailable). It owns the    */
/* pour animation and exposes the same imperative API as Tubes3D.      */
/* ------------------------------------------------------------------ */

interface BoardDOMProps {
  tubes: number[][];
  selected: number | null;
  hinted: { from: number; to: number } | null;
  justCompleted: number[];
  shakeIdx: number | null;
  onTap: (index: number) => void;
}

export const TubeBoardDOM = forwardRef<TubeBoardApi, BoardDOMProps>(function TubeBoardDOM(
  { tubes, selected, hinted, justCompleted, shakeIdx, onTap },
  ref,
) {
  const tubeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    async pour(from, to, count, color) {
      const srcEl = tubeRefs.current[from];
      const dstEl = tubeRefs.current[to];
      if (!srcEl || !dstEl || typeof srcEl.animate !== "function") {
        await sleep(FLY_OUT + count * UNIT_MS + 110 + FLY_BACK);
        return;
      }
      const s = srcEl.getBoundingClientRect();
      const d = dstEl.getBoundingClientRect();
      const dx = d.left + d.width / 2 - (s.left + s.width / 2);
      const dy = Math.min(d.top - s.top, 0) - 74;
      const dir = dx >= 0 ? 1 : -1;
      const pourDur = count * UNIT_MS + 110;
      const total = FLY_OUT + pourDur + FLY_BACK;
      const o1 = FLY_OUT / total;
      const o2 = (FLY_OUT + pourDur) / total;
      const anim = srcEl.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", offset: 0 },
          { transform: `translate(${dx * 0.45}px, ${dy - 16}px) rotate(0deg)`, offset: o1 * 0.7 },
          { transform: `translate(${dx}px, ${dy}px) rotate(${dir * 58}deg)`, offset: o1 },
          { transform: `translate(${dx}px, ${dy}px) rotate(${dir * 58}deg)`, offset: o2 },
          { transform: `translate(${dx * 0.45}px, ${dy - 16}px) rotate(0deg)`, offset: o2 + (1 - o2) * 0.4 },
          { transform: "translate(0,0) rotate(0deg)", offset: 1 },
        ],
        { duration: total, easing: "ease-in-out" },
      );
      const unitEls = srcEl.querySelectorAll<HTMLElement>("[data-unit]");
      for (let gi = 0; gi < count; gi++) {
        const idx = (tubes[from]?.length ?? 0) - 1 - gi;
        const el = unitEls[idx];
        if (el) {
          el.animate(
            [{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }],
            { duration: UNIT_MS, delay: FLY_OUT + gi * UNIT_MS, fill: "forwards", easing: "ease-in" },
          );
        }
      }
      await anim.finished.catch(() => sleep(total));
    },
  }), [tubes]);

  const rows = rowSplit(tubes.length);
  const rowsRendered = rows.map((count, i) => ({
    start: rows.slice(0, i).reduce((a, b) => a + b, 0),
    count,
  }));

  return (
    <div className="tube-board flex w-full max-w-md flex-col items-center gap-9">
      {rowsRendered.map(({ start, count }) => (
        <div key={start} className="flex items-end justify-center gap-3 sm:gap-4">
          {Array.from({ length: count }).map((_, k) => {
            const idx = start + k;
            return (
              <Tube
                key={idx}
                ref={(el) => {
                  tubeRefs.current[idx] = el;
                }}
                index={idx}
                units={tubes[idx] ?? []}
                selected={selected === idx}
                hinted={hinted !== null && (hinted.from === idx || hinted.to === idx)}
                justCompleted={justCompleted.includes(idx)}
                pour={null}
                onTap={onTap}
                shake={shakeIdx === idx}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
});
