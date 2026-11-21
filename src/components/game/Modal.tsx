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
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/55 p-4 backdrop-blur-[2px]"
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
          "modal-pop relative w-full max-w-sm rounded-3xl border-4 border-amber-100 bg-[#FFF9EF] p-5 shadow-2xl",
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
            className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-full bg-stone-200 text-stone-600 shadow-sm active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
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
