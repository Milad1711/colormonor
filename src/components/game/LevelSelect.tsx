"use client";

import { useGame } from "@/game/store";
import { TOTAL_LEVELS } from "@/game/levels";
import { sfx } from "@/game/audio";
import { BackButton, CoinBadge, LockIcon, StarIcon, useT } from "./UiBits";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

export function LevelSelect() {
  const { t, n } = useT();
  const currentLevel = useGame((s) => s.currentLevel);
  const levels = useGame((s) => s.levels);
  const coins = useGame((s) => s.coins);
  const playLevel = useGame((s) => s.playLevel);
  const goMenu = useGame((s) => s.goMenu);

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-[#FDF3E0] to-[#F6D9A8] px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton onClick={goMenu} label={t("back")} />
          <h1 className="text-lg font-black text-stone-800">{t("levels")}</h1>
        </div>
        <CoinBadge value={coins} />
      </header>
      <p className="mt-1 text-center text-xs font-bold text-stone-500">{t("level_select_sub")}</p>

      <div className="mx-auto mt-4 grid w-full max-w-md grid-cols-5 gap-2.5">
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((id) => {
          const rec = levels[String(id)];
          const locked = id > currentLevel;
          const isNext = id === currentLevel;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (locked) {
                  sfx.error();
                  toast(t("level_locked"), "error");
                  return;
                }
                sfx.tap();
                playLevel(id);
              }}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 shadow-sm transition-transform active:scale-95",
                locked
                  ? "border-stone-200 bg-stone-200/70 text-stone-400"
                  : isNext
                    ? "border-orange-400 bg-gradient-to-b from-amber-300 to-orange-400 text-white ring-2 ring-orange-300 ring-offset-1 ring-offset-[#FDF3E0]"
                    : "border-emerald-200 bg-gradient-to-b from-emerald-50 to-teal-100 text-stone-700",
              )}
              aria-label={`${t("level")} ${n(id)}${locked ? " - " + t("level_locked") : ""}`}
            >
              {locked ? (
                <LockIcon className="size-6 opacity-70" />
              ) : (
                <>
                  <span className="text-lg font-black leading-none">{n(id)}</span>
                  <span className="mt-1 flex gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <StarIcon key={s} className="size-3" filled={!!rec && s <= rec.stars} />
                    ))}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
