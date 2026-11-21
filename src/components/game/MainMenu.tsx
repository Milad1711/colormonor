"use client";

import { useGame } from "@/game/store";
import { MansionFacade } from "./MansionFacade";
import { Backdrop } from "./Backdrop";
import {
  CoinBadge,
  GameButton,
  StarBadge,
  useT,
} from "./UiBits";
import { sfx } from "@/game/audio";
import { fmtNum } from "@/game/i18n";

export function MainMenu({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { t, n, lang } = useT();
  const coins = useGame((s) => s.coins);
  const starBalance = useGame((s) => s.starBalance);
  const currentLevel = useGame((s) => s.currentLevel);
  const unlockedRooms = useGame((s) => s.unlockedRooms);
  const playLevel = useGame((s) => s.playLevel);
  const goLevels = useGame((s) => s.goLevels);
  const goManor = useGame((s) => s.goManor);
  const goShop = useGame((s) => s.goShop);
  const setLanguage = useGame((s) => s.setLanguage);

  return (
    <div className="scene-root flex min-h-dvh flex-col items-center px-4 pb-8 pt-5">
      <Backdrop />

      {/* top badges */}
      <div className="flex w-full max-w-md items-center justify-between">
        <div className="flex items-center gap-2">
          <StarBadge value={starBalance} />
          <CoinBadge value={coins} />
        </div>
        <button
          type="button"
          onClick={() => {
            sfx.tap();
            onOpenSettings();
          }}
          aria-label={t("settings")}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-stone-600 shadow-[0_3px_10px_rgba(120,80,30,0.15)] backdrop-blur active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34h0a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55h0a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v0a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" />
          </svg>
        </button>
      </div>

      {/* 3D floating manor hero */}
      <div className="relative mt-1 w-full max-w-md">
        <div
          className="ground-shadow absolute bottom-1 left-1/2 h-7 w-4/5 -translate-x-1/2 rounded-[100%]"
          aria-hidden
        />
        <MansionFacade unlockedCount={unlockedRooms.length} className="mf-float relative w-full" />
      </div>

      <h1 className="title3d mt-2 text-center text-4xl font-black tracking-wide">
        {t("app_name")}
      </h1>
      <p className="mt-2 rounded-full border border-white/70 bg-white/70 px-4 py-1 text-center text-sm font-bold text-stone-600 shadow-sm backdrop-blur">
        {t("app_tagline")}
      </p>

      {/* actions */}
      <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <GameButton className="w-full text-lg" onClick={() => playLevel(currentLevel)}>
          {currentLevel > 1 ? `${t("continue_level")} ${n(currentLevel)}` : t("play")}
        </GameButton>
        <div className="grid grid-cols-2 gap-3">
          <GameButton variant="ghost" className="w-full" onClick={goLevels}>
            {t("levels")}
          </GameButton>
          <GameButton variant="secondary" className="w-full" onClick={goManor}>
            {t("enter_manor")}
          </GameButton>
        </div>
        <GameButton variant="gold" className="w-full" onClick={() => goShop()}>
          {t("shop")}
        </GameButton>
      </div>

      {/* quick language switch */}
      <div className="mt-6 flex items-center gap-1 rounded-full border border-white/70 bg-white/80 p-1 shadow-sm backdrop-blur">
        {(["fa", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              sfx.tap();
              setLanguage(l);
            }}
            className={
              "min-h-9 rounded-full px-4 text-sm font-black transition-colors " +
              (lang === l ? "bg-orange-500 text-white shadow" : "text-stone-500")
            }
          >
            {l === "fa" ? "فارسی" : "English"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] font-bold text-stone-400">
        {fmtNum(lang, 50)} {t("levels")} · {t("manor_subtitle")}
      </p>
    </div>
  );
}
