"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { liquid } from "@/game/palette";
import { isTubeComplete } from "@/game/solver";

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
