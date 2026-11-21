"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { setSoundEnabled } from "@/game/audio";
import { AudioPrimer, InlineToast } from "@/components/game/UiBits";
import { MainMenu } from "@/components/game/MainMenu";
import { LevelSelect } from "@/components/game/LevelSelect";
import { PuzzleScreen } from "@/components/game/PuzzleScreen";
import { MansionScreen } from "@/components/game/MansionScreen";
import { RoomScreen } from "@/components/game/RoomScreen";
import { ShopScreen } from "@/components/game/ShopScreen";
import { SettingsModal } from "@/components/game/SettingsModal";
import { MansionFacade } from "@/components/game/MansionFacade";
import { Backdrop } from "@/components/game/Backdrop";
import type { Lang } from "@/game/i18n";

function Splash() {
  return (
    <div className="scene-root flex min-h-dvh flex-col items-center justify-center">
      <Backdrop />
      <MansionFacade className="mf-float w-72" unlockedCount={0} />
      <div className="mt-6 h-2 w-40 overflow-hidden rounded-full bg-white/60">
        <div className="loader-bar h-full w-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
      </div>
    </div>
  );
}

function LanguagePicker() {
  const setLanguage = useGame((s) => s.setLanguage);
  const choose = (l: Lang) => setLanguage(l);
  return (
    <div className="scene-root flex min-h-dvh flex-col items-center justify-center px-6">
      <Backdrop />
      <MansionFacade className="mf-float w-80 max-w-full drop-shadow-xl" unlockedCount={0} />
      <div className="mt-4 w-full max-w-sm rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_18px_50px_rgba(124,58,12,0.22)] backdrop-blur-md">
        <h1 className="title3d text-center text-3xl font-black">عمارت رنگین</h1>
        <p className="mt-3 text-center text-base font-bold text-stone-600">زبان بازی را انتخاب کن</p>
        <p dir="ltr" className="text-center text-base font-bold text-stone-600">
          Choose your language
        </p>
        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => choose("fa")}
            className="min-h-16 rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-white to-amber-50 text-xl font-black text-stone-800 shadow-[0_4px_0_#d9bf98] active:translate-y-[3px] active:shadow-none"
          >
            فارسی
          </button>
          <button
            type="button"
            onClick={() => choose("en")}
            dir="ltr"
            className="min-h-16 rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-white to-amber-50 text-xl font-black text-stone-800 shadow-[0_4px_0_#d9bf98] active:translate-y-[3px] active:shadow-none"
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const language = useGame((s) => s.language);
  const sound = useGame((s) => s.sound);
  const screen = useGame((s) => s.screen);
  // Subscribing to activeLevel is essential: tapping "Next Level" inside the
  // win modal changes activeLevel while the screen is already "puzzle", and
  // the keyed PuzzleScreen must remount immediately for the new level.
  const activeLevel = useGame((s) => s.activeLevel);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setSoundEnabled(sound), [sound]);
  useEffect(() => {
    const lang = language ?? "fa";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }, [language]);

  if (!mounted) return <Splash />;
  if (!language) return <LanguagePicker />;

  return (
    <>
      <AudioPrimer />
      {screen === "menu" && <MainMenu onOpenSettings={() => setSettingsOpen(true)} />}
      {screen === "levels" && <LevelSelect />}
      {screen === "puzzle" && <PuzzleScreen key={`lvl-${activeLevel}`} />}
      {screen === "manor" && <MansionScreen />}
      {screen === "room" && <RoomScreen />}
      {screen === "shop" && <ShopScreen />}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InlineToast />
    </>
  );
}
