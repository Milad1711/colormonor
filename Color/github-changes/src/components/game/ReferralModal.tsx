"use client";

/**
 * ReferralModal — "Invite Friends". Every player gets a short invite code;
 * when a friend enters it, BOTH players receive a coin grant (claimed on the
 * next sync, fully offline-safe: the modal simply reports connection errors).
 */

import { useCallback, useEffect, useState } from "react";
import { getDeviceId } from "@/game/device";
import { getApiBase } from "@/game/api-base";
import { syncNow } from "@/game/net";
import { sfx } from "@/game/audio";
import { Modal, Confetti } from "./Modal";
import { GameButton, useT } from "./UiBits";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

interface RefInfo {
  code: string;
  claimed: boolean;
  reward: number;
}

type ErrKey = "referral_err_net" | "referral_err_used" | "referral_err_self" | "referral_err_bad";

const ERR_MAP: Record<string, ErrKey> = {
  "already-joined": "referral_err_used",
  "self-code": "referral_err_self",
  "not-found": "referral_err_bad",
  "bad-code": "referral_err_bad",
};

export function ReferralModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, n } = useT();
  const [info, setInfo] = useState<RefInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [party, setParty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${getApiBase()}/api/player/referral?deviceId=${encodeURIComponent(getDeviceId())}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data?.ok) setInfo({ code: data.code, claimed: !!data.claimed, reward: data.reward ?? 200 });
      else setErr(t("referral_err_net"));
    } catch {
      setErr(t("referral_err_net"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => load(), 0);
      return () => clearTimeout(id);
    }
  }, [open, load]);

  const copyCode = async () => {
    if (!info) return;
    sfx.tap();
    try {
      await navigator.clipboard.writeText(info.code);
      toast(t("referral_copied"), "success");
    } catch {
      toast(info.code, "info");
    }
  };

  const shareCode = async () => {
    if (!info) return;
    sfx.tap();
    const text = `${t("referral_share_text")} ${info.code}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("referral"), text });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast(t("referral_copied"), "success");
    } catch {
      toast(info.code, "info");
    }
  };

  const submit = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setErr(null);
    try {
      const res = await fetch(getApiBase() + "/api/player/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId(), code }),
      });
      const data = await res.json();
      if (data?.ok) {
        sfx.chest();
        setParty(true);
        setTimeout(() => setParty(false), 1600);
        toast(`${t("referral_ok")} +${n(data.amount)}`, "success");
        setCodeInput("");
        setInfo((prev) => (prev ? { ...prev, claimed: true } : prev));
        syncNow(true); // bank the coins immediately
        load();
      } else {
        const key = ERR_MAP[data?.error ?? ""] ?? "referral_err_net";
        setErr(t(key));
        sfx.error();
      }
    } catch {
      setErr(t("referral_err_net"));
      sfx.error();
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm" ariaLabel={t("referral")}>
      {party && <Confetti count={26} />}
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-b from-teal-300 to-emerald-500 text-3xl shadow-md">
          <svg viewBox="0 0 24 24" className="size-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
            <circle cx="17" cy="9.5" r="2.4" />
            <path d="M15.5 14.6c2.6-.4 4.6 1 5 3.4" />
          </svg>
        </div>
        <h2 className="title3d mt-2 text-2xl font-black">{t("referral")}</h2>
        <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{t("referral_sub")}</p>
      </div>

      {/* my code — code box, then its actions directly beneath it */}
      <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
        <div className="text-[11px] font-black text-emerald-700">{t("referral_my_code")}</div>
        <div
          dir="ltr"
          className={cn(
            "mt-1 select-all rounded-xl border-2 border-dashed border-emerald-300 bg-white px-4 py-2 font-mono text-2xl font-black tracking-[0.3em] text-emerald-800",
            loading && "opacity-40",
          )}
        >
          {info?.code ?? "······"}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={copyCode}
            className="min-h-11 rounded-xl bg-emerald-500 px-3 text-xs font-black text-white shadow-[0_3px_0_#047857] active:translate-y-[2px] active:shadow-none"
          >
            {t("referral_copy")}
          </button>
          <button
            type="button"
            onClick={shareCode}
            className="min-h-11 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-black text-emerald-700 shadow-[0_3px_0_#a7f3d0] active:translate-y-[2px] active:shadow-none"
          >
            {t("referral_share")}
          </button>
        </div>
      </div>

      {/* reward banner */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <circle cx="12" cy="12" r="9.5" fill="#F5B301" stroke="#B45309" strokeWidth="1.5" />
        </svg>
        {t("referral_reward_row")}
      </div>

      {/* friend code entry — the claim button sits EXACTLY beneath the
          code input: full-width, stacked, clean */}
      {!info?.claimed ? (
        <div className="mt-3 rounded-2xl border border-stone-200 bg-white/90 p-3">
          <div className="text-center text-[11px] font-black text-stone-500">{t("referral_enter")}</div>
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            dir="ltr"
            maxLength={12}
            className="mt-1.5 min-h-12 w-full rounded-xl border-2 border-amber-200 bg-amber-50/60 px-3 text-center font-mono text-lg font-black tracking-[0.2em] text-stone-800 outline-none focus:border-amber-400"
            placeholder="ABC123"
            aria-label={t("referral_enter")}
          />
          <GameButton className="mt-2 w-full" onClick={submit} disabled={!codeInput.trim()}>
            {t("referral_submit")}
          </GameButton>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center text-xs font-black text-emerald-700">
          ✓ {t("referral_joined_note")}
        </div>
      )}

      {err && (
        <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-600">
          {err}
        </p>
      )}
      <p className="mt-2.5 text-center text-[10px] font-bold leading-4 text-stone-400">{t("referral_note")}</p>
    </Modal>
  );
}
