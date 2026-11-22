"use client";

/**
 * LeaderboardModal — compete with other players.
 * Top 100 by score (stars×100 + levels×20), your own row highlighted,
 * editable player name and your device id for admin coin gifts.
 */

import { useCallback, useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { fetchLeaderboard, syncNow, autoName, type LeaderRow } from "@/game/net";
import { getDeviceId } from "@/game/device";
import { sfx } from "@/game/audio";
import { Modal } from "./Modal";
import { GameButton, useT } from "./UiBits";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

const RANK_ICONS = ["🥇", "🥈", "🥉"] as const;

export function LeaderboardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, n, lang } = useT();
  const playerName = useGame((s) => s.playerName);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await fetchLeaderboard());
    setLoading(false);
    syncNow(true); // keep rank fresh
  }, []);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => load(), 0);
      return () => clearTimeout(id);
    }
  }, [open, load]);

  const myId = getDeviceId();

  const saveName = () => {
    setPlayerName(draft.trim() || null);
    setEditing(false);
    sfx.coin();
    toast(t("name_saved"), "success");
    syncNow(true);
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm" ariaLabel={t("leaderboard")}>
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-orange-500 text-3xl shadow-md">
          🏆
        </div>
        <h2 className="title3d mt-2 text-2xl font-black">{t("leaderboard")}</h2>
        <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{t("leaderboard_sub")}</p>
      </div>

      {/* name editor */}
      <div className="mt-3 rounded-2xl border border-stone-200 bg-white/90 p-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={24}
              className="min-h-10 flex-1 rounded-xl border-2 border-amber-200 bg-amber-50/60 px-3 text-base font-bold text-stone-800 outline-none focus:border-amber-400"
              placeholder={autoName()}
              aria-label={t("name_label")}
            />
            <GameButton className="px-4" onClick={saveName}>
              {t("save")}
            </GameButton>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-stone-400">{t("name_label")}</div>
              <div className="truncate text-base font-black text-stone-800">
                {playerName ?? autoName()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.tap();
                setDraft(playerName ?? autoName());
                setEditing(true);
              }}
              className="min-h-9 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-700 active:scale-95"
            >
              {t("edit_name")}
            </button>
          </div>
        )}
        <div className="mt-2 border-t border-dashed border-stone-200 pt-2">
          <div className="text-[11px] font-bold text-stone-400">{t("device_id")}</div>
          <div dir="ltr" className="truncate text-left font-mono text-[11px] text-stone-500">
            {myId}
          </div>
        </div>
      </div>

      {/* board */}
      <div className="mt-3 max-h-[44vh] min-h-40 overflow-y-auto rounded-2xl border border-stone-200 bg-white/85 p-2">
        {loading && rows.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm font-bold text-stone-400">
            …
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
            <span className="text-3xl">🏗️</span>
            <p className="px-4 text-xs font-bold leading-5 text-stone-500">{t("no_players_yet")}</p>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {rows.map((r) => {
              const me = r.deviceId === myId;
              return (
                <li
                  key={r.deviceId}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2",
                    me ? "border-2 border-amber-300 bg-amber-50 shadow-sm" : "bg-stone-50",
                  )}
                >
                  <span className="w-9 shrink-0 text-center text-lg font-black leading-none text-stone-600 tabular-nums">
                    {r.rank <= 3 ? RANK_ICONS[r.rank - 1] : n(r.rank)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-black text-stone-800">
                        {r.name || autoName()}
                      </span>
                      {me && (
                        <span className="shrink-0 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-amber-950">
                          {t("you_badge")}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-stone-400 tabular-nums">
                      ⭐ {n(r.stars)} · {t("levels")} {n(r.levelsCleared)}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-gradient-to-b from-amber-300 to-orange-400 px-2.5 py-1 text-xs font-black text-white tabular-nums shadow-sm">
                    {n(r.score)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-500 tabular-nums">
          {t("medals")}: {n(rows.length)}
        </span>
        <div className="flex gap-2">
          <GameButton variant="ghost" className="px-4" onClick={load}>
            <span className="flex items-center gap-1.5 text-sm">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12a9 9 0 11-2.6-6.3" />
                <path d="M21 3v6h-6" />
              </svg>
              {t("refresh")}
            </span>
          </GameButton>
          <GameButton className="px-6" onClick={onClose}>
            {t("close")}
          </GameButton>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] font-bold text-stone-400" dir={lang === "fa" ? "rtl" : "ltr"}>
        {t("your_rank")} · {t("score")} = ⭐×100 + {t("level")}×20
      </p>
    </Modal>
  );
}
