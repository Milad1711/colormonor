"use client";

import { cn } from "@/lib/utils";
import { fmtNum, t, type Lang } from "@/game/i18n";
import { useGame } from "@/game/store";
import { primeAudio, sfx } from "@/game/audio";
import { useToastStore } from "./toast";

/* ---------------- shared UI atoms with game styling ---------------- */

export function useT(): { t: (k: string) => string; lang: Lang; n: (v: number) => string } {
  const lang = useGame((s) => s.language ?? "fa");
  return {
    lang,
    t: (k: string) => t(lang, k),
    n: (v: number) => fmtNum(lang, v),
  };
}

export function GameButton({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  silent,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  className?: string;
  disabled?: boolean;
  silent?: boolean;
}) {
  const variants: Record<string, string> = {
    primary:
      "btn-shine bg-gradient-to-b from-amber-400 via-orange-400 to-orange-500 text-white border-orange-600/40 shadow-[0_4px_0_#c2410c,inset_0_2px_0_rgba(255,255,255,0.45)]",
    secondary:
      "bg-gradient-to-b from-emerald-400 via-teal-400 to-teal-500 text-white border-teal-600/40 shadow-[0_4px_0_#0f766e,inset_0_2px_0_rgba(255,255,255,0.4)]",
    gold:
      "btn-shine bg-gradient-to-b from-yellow-300 via-amber-300 to-amber-400 text-amber-950 border-amber-600/40 shadow-[0_4px_0_#b45309,inset_0_2px_0_rgba(255,255,255,0.6)]",
    ghost:
      "bg-white/85 text-stone-700 border-stone-300 shadow-[0_3px_0_#d6d3d1]",
    danger:
      "bg-gradient-to-b from-rose-400 to-rose-500 text-white border-rose-600/40 shadow-[0_4px_0_#be123c]",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!silent) sfx.tap();
        onClick?.();
      }}
      className={cn(
        "min-h-11 rounded-2xl border px-5 py-2.5 text-base font-bold transition-all",
        "active:translate-y-[3px] active:shadow-none",
        "disabled:opacity-50 disabled:active:translate-y-0 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function CoinBadge({ value, onClick }: { value: number; onClick?: () => void }) {
  const { lang } = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1 shadow-[0_3px_10px_rgba(120,80,30,0.16)] backdrop-blur",
        onClick && "cursor-pointer hover:bg-amber-50",
      )}
      title={t(lang, "coins")}
    >
      <CoinIcon className="size-5" />
      <span className="text-sm font-bold text-amber-900 tabular-nums">{fmtNum(lang, value)}</span>
    </button>
  );
}

export function StarBadge({ value }: { value: number }) {
  const { lang } = useT();
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1 shadow-[0_3px_10px_rgba(120,80,30,0.16)] backdrop-blur"
      title={t(lang, "stars")}
    >
      <StarIcon className="size-5" filled />
      <span className="text-sm font-bold text-amber-900 tabular-nums">{fmtNum(lang, value)}</span>
    </div>
  );
}

export function StarIcon({ className, filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden>
      <path
        d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.35 6.2 20.4l1.1-6.47L2.6 9.35l6.5-.95L12 2.5z"
        fill={filled ? "#F5B301" : "#E7E5E4"}
        stroke={filled ? "#B45309" : "#A8A29E"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="#F5B301" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" fill="#FFD54F" stroke="#E29B00" strokeWidth="1" />
      <path d="M9.5 12.5l1.8 1.8 3.4-3.8" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="#78716C" />
      <path d="M8 10V7.5a4 4 0 018 0V10" fill="none" stroke="#78716C" strokeWidth="2.5" />
      <circle cx="12" cy="15" r="1.8" fill="#FDE68A" />
    </svg>
  );
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  const { lang } = useT();
  return (
    <button
      type="button"
      onClick={() => {
        sfx.tap();
        onClick();
      }}
      aria-label={label}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/85 px-3 text-stone-700 shadow-[0_3px_10px_rgba(120,80,30,0.15)] backdrop-blur active:scale-95"
    >
      <svg viewBox="0 0 24 24" className={cn("size-5", lang === "fa" && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

/** Small toast panel rendered near the bottom of the screen. */
export function InlineToast() {
  const { message, tone, seq } = useToastStore();
  if (!message) return null;
  const tones = {
    info: "bg-stone-800/90 text-white",
    error: "bg-rose-600/95 text-white",
    success: "bg-emerald-600/95 text-white",
  };
  return (
    <div
      key={seq}
      role="status"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-24 z-[60] mx-auto w-fit max-w-[85vw] rounded-full px-4 py-2 text-center text-sm font-bold shadow-lg toast-pop",
        tones[tone],
      )}
    >
      {message}
    </div>
  );
}

/** Attach global audio priming to the first user gesture. */
export function AudioPrimer() {
  if (typeof window !== "undefined") {
    // idempotent listeners; ensures AudioContext exists before first sfx
    if (!(window as unknown as { __cmAudioPrimed?: boolean }).__cmAudioPrimed) {
      (window as unknown as { __cmAudioPrimed?: boolean }).__cmAudioPrimed = true;
      const prime = () => primeAudio();
      window.addEventListener("pointerdown", prime, { once: true });
      window.addEventListener("keydown", prime, { once: true });
    }
  }
  return null;
}
