"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { sfx, setSoundEnabled } from "@/game/audio";
import { GameButton, useT } from "./UiBits";
import { Modal } from "./Modal";
import { toast } from "./toast";
import { cn } from "@/lib/utils";
import { getDeviceId } from "@/game/device";
import { getApiBase, setApiBase, getBakedApiBase } from "@/game/api-base";
import { isNativeApp } from "@/lib/bazaar";
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
  // v1.1.3 — online server URL (native APK only): the baked API_BASE can
  // go stale (Vercel domain changes), so the user pastes the real link once
  // and every online service (leaderboard, referral, admin) follows it.
  const [srv, setSrv] = useState("");
  const saveServerUrl = () => {
    const v = srv.trim();
    if (v && !/^https:\/\/[a-z0-9.-]+(?::\d+)?/i.test(v)) {
      toast(t("server_url_bad"), "error");
      return;
    }
    setApiBase(v);
    sfx.tap();
    toast(t("server_url_saved"), "success");
  };
  // SSR/CSR consistency: bridge detection after mount (native APK only)
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNativeApp()), []);
  // prefill the input with the effective URL each time the modal opens
  useEffect(() => {
    if (open && native) setSrv(getApiBase());
  }, [open, native]);

  // copy the device id so the player can hand it to the admin/support
  // (clipboard API first, textarea fallback for older WebViews)
  const copyDeviceId = async () => {
    sfx.tap();
    const id = getDeviceId();
    let ok = false;
    try {
      await navigator.clipboard.writeText(id);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = id;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) toast(t("device_copied"), "success");
    else toast(id, "info"); // last resort: show it so the user can note it
  };

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

        {/* device id + copy + admin link */}
        <div className="mt-2.5 rounded-2xl border border-stone-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-stone-400">{t("device_id")}</div>
            <button
              type="button"
              onClick={copyDeviceId}
              aria-label={t("device_copy")}
              title={t("device_copy")}
              className="flex min-h-7 min-w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-500 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="8" y="8" width="12" height="12" rx="2.5" />
                <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
              </svg>
            </button>
          </div>
          <div dir="ltr" className="truncate text-left font-mono text-[11px] text-stone-500">
            {getDeviceId()}
          </div>
          {/* native APK: same-frame navigation — popup WebView never shows;
              web: new tab as before */}
          <a
            href="/admin"
            {...(native ? {} : { target: "_blank", rel: "noreferrer" })}
            className="mt-2 inline-flex min-h-8 items-center gap-1 rounded-xl bg-stone-100 px-3 text-[11px] font-black text-stone-500 active:scale-95"
          >
            🔧 {t("admin_panel")}
          </a>
        </div>

        {/* online server (native APK only) */}
        {native && (
          <div className="mt-2.5 rounded-2xl border border-stone-200 bg-white p-3">
            <div className="text-[11px] font-bold text-stone-400">{t("server_url")}</div>
            <div className="mt-1.5 flex gap-2">
              <input
                dir="ltr"
                value={srv}
                onChange={(e) => setSrv(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveServerUrl()}
                placeholder={getBakedApiBase() || "https://color-manor.vercel.app"}
                className="min-h-9 flex-1 rounded-xl border-2 border-stone-200 bg-stone-50 px-3 font-mono text-[11px] font-bold text-stone-700 outline-none focus:border-amber-400"
              />
              <GameButton variant="ghost" className="min-h-9 px-3 text-xs" onClick={saveServerUrl}>
                {t("save")}
              </GameButton>
            </div>
            <div className="mt-1 text-[10px] font-bold leading-4 text-stone-400">{t("server_url_hint")}</div>
          </div>
        )}

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
