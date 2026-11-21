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
import type { Lang } from "@/game/i18n";

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#FDF3E0] to-[#F6D9A8]">
      <MansionFacade className="w-72 animate-pulse" unlockedCount={0} />
    </div>
  );
}

function LanguagePicker() {
  const setLanguage = useGame((s) => s.setLanguage);
  const choose = (l: Lang) => setLanguage(l);
  return (
    <div
      dir="rtl"
      className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#FDF3E0] to-[#F6D9A8] px-6"
    >
      <MansionFacade className="w-80 max-w-full drop-shadow" unlockedCount={0} />
      <h1 className="mt-2 text-3xl font-black text-orange-700">عمارت رنگین</h1>
      <p className="mt-4 text-center text-base font-bold text-stone-600">زبان بازی را انتخاب کن</p>
      <p dir="ltr" className="text-center text-base font-bold text-stone-600">
        Choose your language
      </p>
      <div className="mt-6 grid w-full max-w-xs grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => choose("fa")}
          className="min-h-16 rounded-3xl border-2 border-amber-300 bg-white/90 text-xl font-black text-stone-800 shadow-[0_4px_0_#d9bf98] active:translate-y-[3px] active:shadow-none"
        >
          فارسی
        </button>
        <button
          type="button"
          onClick={() => choose("en")}
          dir="ltr"
          className="min-h-16 rounded-3xl border-2 border-amber-300 bg-white/90 text-xl font-black text-stone-800 shadow-[0_4px_0_#d9bf98] active:translate-y-[3px] active:shadow-none"
        >
          English
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const language = useGame((s) => s.language);
  const sound = useGame((s) => s.sound);
  const screen = useGame((s) => s.screen);
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
      {screen === "puzzle" && <PuzzleScreen key={`lvl-${useGame.getState().activeLevel}`} />}
      {screen === "manor" && <MansionScreen />}
      {screen === "room" && <RoomScreen />}
      {screen === "shop" && <ShopScreen />}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InlineToast />
    </>
  );
}
