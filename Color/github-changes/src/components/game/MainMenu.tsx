"use client";

import { useGame } from "@/game/store";
import { Mansion3D } from "./Mansion3D";
import { Backdrop } from "./Backdrop";
import {
  CoinBadge,
  GameButton,
  StarBadge,
  useT,
} from "./UiBits";
import { WheelEntryButton, PacksEntryButton } from "./LuckyWheel";
import { LeaderboardModal } from "./LeaderboardModal";
import { ReferralModal } from "./ReferralModal";
import { sfx } from "@/game/audio";
import { fmtNum } from "@/game/i18n";
import { isNativeApp } from "@/lib/bazaar";
import { TOTAL_LEVELS } from "@/game/levels";
import { useRef, useState } from "react";

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
  const openCoinStore = useGame((s) => s.openCoinStore);
  const setLanguage = useGame((s) => s.setLanguage);
  const [boardOpen, setBoardOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  // hidden admin entry: five taps on the footer line opens the admin panel.
  // native APK: same-frame navigation — the popup WebView never becomes
  // visible on screen, so window.open would look like a dead button.
  const adminTaps = useRef(0);
  const adminTap = () => {
    adminTaps.current += 1;
    if (adminTaps.current >= 5) {
      adminTaps.current = 0;
      if (isNativeApp()) window.location.assign("/admin");
      else window.open("/admin", "_blank");
    }
  };

  return (
    <div className="scene-root flex min-h-dvh flex-col items-center px-4 pb-8 pt-4">
      <Backdrop />

      {/* top badges */}
      <div className="flex w-full max-w-md items-center justify-between">
        <div className="flex items-center gap-2">
          <StarBadge value={starBalance} />
          <CoinBadge value={coins} onClick={() => openCoinStore()} />
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

      {/* live WebGL 3D manor hero — drag to spin it around */}
      <div className="relative mt-1 h-[30vh] max-h-72 min-h-52 w-full max-w-md">
        <div
          className="ground-shadow absolute bottom-0 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-[100%]"
          aria-hidden
        />
        <Mansion3D unlockedCount={unlockedRooms.length} className="mf-float absolute inset-0" />
        <span className="pointer-events-none absolute start-1 top-1 rounded-full border border-white/70 bg-white/75 px-2.5 py-0.5 text-[10px] font-black text-stone-500 shadow-sm backdrop-blur">
          3D
        </span>
      </div>

      <h1 className="title3d mt-1 text-center text-4xl font-black tracking-wide">
        {t("app_name")}
      </h1>
      <p className="mt-2 rounded-full border border-white/70 bg-white/70 px-4 py-1 text-center text-sm font-bold text-stone-600 shadow-sm backdrop-blur">
        {t("app_tagline")}
      </p>

      {/* actions */}
      <div className="mt-5 flex w-full max-w-xs flex-col gap-3">
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
        <div className="grid grid-cols-2 gap-3">
          <WheelEntryButton onOpen={() => openCoinStore("wheel")} />
          <PacksEntryButton onOpen={() => openCoinStore("packs")} />
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setBoardOpen(true);
            }}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-white to-amber-50 px-2 text-amber-800 shadow-[0_4px_0_#e7c98f] transition-transform active:translate-y-[3px] active:shadow-none"
          >
            <span className="text-xl leading-none">🏆</span>
            <span className="text-sm font-black">{t("leaderboard")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setRefOpen(true);
            }}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-3xl border-2 border-emerald-200 bg-gradient-to-b from-white to-emerald-50 px-2 text-emerald-700 shadow-[0_4px_0_#a7f3d0] transition-transform active:translate-y-[3px] active:shadow-none"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
              <circle cx="17" cy="9.5" r="2.4" />
              <path d="M15.5 14.6c2.6-.4 4.6 1 5 3.4" />
            </svg>
            <span className="text-sm font-black">{t("referral")}</span>
          </button>
        </div>
      </div>

      {/* quick language switch */}
      <div className="mt-5 flex items-center gap-1 rounded-full border border-white/70 bg-white/80 p-1 shadow-sm backdrop-blur">
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
      <button
        type="button"
        onClick={adminTap}
        className="mt-3 text-center text-[11px] font-bold text-stone-400"
      >
        {fmtNum(lang, TOTAL_LEVELS)} {t("levels")} · {t("manor_subtitle")}
      </button>

      <LeaderboardModal open={boardOpen} onClose={() => setBoardOpen(false)} />
      <ReferralModal open={refOpen} onClose={() => setRefOpen(false)} />
    </div>
  );
}
