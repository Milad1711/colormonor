"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { sfx, setSoundEnabled } from "@/game/audio";
import { GameButton, useT } from "./UiBits";
import { Modal } from "./Modal";
import { toast } from "./toast";
import { cn } from "@/lib/utils";
import type { Lang } from "@/game/i18n";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const language = useGame((s) => s.language ?? "fa");
  const setLanguage = useGame((s) => s.setLanguage);
  const sound = useGame((s) => s.sound);
  const setSound = useGame((s) => s.setSound);
  const guideEnabled = useGame((s) => s.guideEnabled);
  const setGuideEnabled = useGame((s) => s.setGuideEnabled);
  const resetProgress = useGame((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <Modal open={open && !confirmReset} onClose={onClose} ariaLabel={t("settings")}>
        <h2 className="text-center text-xl font-black text-stone-800">{t("settings")}</h2>

        {/* language */}
        <div className="mt-4">
          <div className="mb-1.5 text-sm font-black text-stone-600">{t("language")}</div>
          <div className="grid grid-cols-2 gap-2">
            {(["fa", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  sfx.tap();
                  setLanguage(l);
                }}
                className={cn(
                  "min-h-11 rounded-2xl border-2 px-4 text-base font-black transition-colors",
                  language === l
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-stone-200 bg-white text-stone-500",
                )}
              >
                {l === "fa" ? "فارسی" : "English"}
              </button>
            ))}
          </div>
        </div>

        {/* sound */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-3">
          <span className="text-sm font-black text-stone-600">{t("sound")}</span>
          <Switch
            checked={sound}
            label={sound ? t("on") : t("off")}
            onChange={(v) => {
              setSound(v);
              if (v) sfx.coin();
              toast(v ? t("sound_on_toast") : t("sound_off_toast"), "info");
            }}
          />
        </div>

        {/* guide toggle */}
        <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-3">
          <span className="text-sm font-black text-stone-600">{t("per_level_guide_toggle")}</span>
          <Switch
            checked={guideEnabled}
            label={guideEnabled ? t("on") : t("off")}
            onChange={(v) => {
              sfx.tap();
              setGuideEnabled(v);
            }}
          />
        </div>

        {/* reset */}
        <GameButton variant="danger" className="mt-5 w-full" onClick={() => setConfirmReset(true)}>
          {t("reset_progress")}
        </GameButton>
      </Modal>

      <Modal open={open && confirmReset} onClose={() => setConfirmReset(false)} ariaLabel={t("reset_confirm_title")}>
        <div className="text-center">
          <h2 className="text-xl font-black text-rose-600">{t("reset_confirm_title")}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{t("reset_confirm_body")}</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <GameButton
              variant="ghost"
              onClick={() => {
                setConfirmReset(false);
                onClose();
              }}
            >
              {t("cancel")}
            </GameButton>
            <GameButton
              variant="danger"
              onClick={() => {
                setSoundEnabled(true);
                resetProgress();
                setConfirmReset(false);
                toast(t("reset_done"), "success");
              }}
            >
              {t("confirm")}
            </GameButton>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex min-h-9 min-w-16 items-center gap-1 rounded-full border px-1 transition-colors",
        checked ? "justify-end border-emerald-300 bg-emerald-100" : "justify-start border-stone-300 bg-stone-100",
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-xs font-black text-white shadow",
          checked ? "bg-emerald-500" : "bg-stone-400",
        )}
      >
        {checked ? "✓" : "✕"}
      </span>
      <span className={cn("px-1 text-xs font-bold", checked ? "text-emerald-700" : "text-stone-500")}>{label}</span>
    </button>
  );
}
