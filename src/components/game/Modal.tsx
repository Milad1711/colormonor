"use client";

import { cn } from "@/lib/utils";
import { sfx } from "@/game/audio";

export function Modal({
  open,
  onClose,
  children,
  className,
  closable = true,
  ariaLabel,
}: {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  closable?: boolean;
  ariaLabel?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={() => {
        if (closable && onClose) {
          sfx.tap();
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "modal-pop relative w-full max-w-sm rounded-[28px] border-4 border-white/80 bg-gradient-to-b from-[#FFFBEF] to-[#FFF2D9] p-5 shadow-[0_24px_60px_rgba(124,58,12,0.35)]",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {closable && onClose && (
          <button
            type="button"
            aria-label="close"
            onClick={() => {
              sfx.tap();
              onClose();
            }}
            className="absolute end-2.5 top-2.5 z-30 flex size-11 items-center justify-center rounded-full border-2 border-stone-200/80 bg-stone-200/95 text-stone-600 shadow-md backdrop-blur transition-transform active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function Confetti({ count = 28 }: { count?: number }) {
  const colors = ["#E2725B", "#F5B301", "#55B85B", "#5A8FDE", "#A267D8", "#F06EA9", "#3EC5B0"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${Math.random() * 700}ms`,
            animationDuration: `${1600 + Math.random() * 1400}ms`,
            transform: `rotate(${Math.random() * 360}deg)`,
            width: `${7 + Math.random() * 6}px`,
            height: `${10 + Math.random() * 8}px`,
          }}
        />
      ))}
    </div>
  );
}
