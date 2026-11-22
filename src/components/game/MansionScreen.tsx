"use client";

import { useGame } from "@/game/store";
import { ROOMS, ROOM_BY_ID } from "@/game/decor";
import { sfx } from "@/game/audio";
import { BackButton, CoinBadge, GameButton, LockIcon, StarBadge, StarIcon, useT } from "./UiBits";
import { Mansion3D } from "./Mansion3D";
import { Modal } from "./Modal";
import { useState } from "react";
import { toast } from "./toast";
import { cn } from "@/lib/utils";
import { Backdrop } from "./Backdrop";

export function MansionScreen() {
  const { t, n } = useT();
  const coins = useGame((s) => s.coins);
  const starBalance = useGame((s) => s.starBalance);
  const unlockedRooms = useGame((s) => s.unlockedRooms);
  const decor = useGame((s) => s.decor);
  const openRoom = useGame((s) => s.openRoom);
  const unlockRoom = useGame((s) => s.unlockRoom);
  const openCoinStore = useGame((s) => s.openCoinStore);
  const goMenu = useGame((s) => s.goMenu);
  const [lockInfo, setLockInfo] = useState<string | null>(null);
  /** room card currently hovered (mouse) — shows the "why locked" bubble */
  const [hoverRoom, setHoverRoom] = useState<string | null>(null);

  const ROOM_ICONS: Record<string, { icon: string; chip: string; bar: string }> = {
    living: { icon: "🛋️", chip: "from-amber-300 to-orange-400", bar: "from-amber-400 to-orange-500" },
    library: { icon: "📚", chip: "from-sky-300 to-blue-400", bar: "from-sky-400 to-blue-500" },
    kitchen: { icon: "🍳", chip: "from-rose-300 to-pink-400", bar: "from-rose-400 to-pink-500" },
    bedroom: { icon: "🛏️", chip: "from-violet-300 to-purple-400", bar: "from-violet-400 to-purple-500" },
    greenhouse: { icon: "🪴", chip: "from-lime-300 to-green-400", bar: "from-lime-400 to-green-500" },
    garden: { icon: "⛲", chip: "from-teal-300 to-emerald-400", bar: "from-teal-400 to-emerald-500" },
    hallway: { icon: "🪜", chip: "from-yellow-300 to-amber-400", bar: "from-yellow-400 to-amber-500" },
  };

  return (
    <div className="scene-root flex min-h-dvh flex-col px-4 pb-8 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton onClick={goMenu} label={t("back")} />
          <h1 className="text-lg font-black text-stone-800">{t("manor_title")}</h1>
        </div>
        <div className="flex gap-2">
          <StarBadge value={starBalance} />
          <CoinBadge value={coins} onClick={() => openCoinStore()} />
        </div>
      </header>
      <p className="mt-1 text-center text-xs font-bold text-stone-500">{t("manor_subtitle")}</p>

      {/* live 3D manor — windows light up as wings unlock */}
      <div className="relative mx-auto mt-2 h-[26vh] max-h-60 min-h-44 w-full max-w-md">
        <Mansion3D unlockedCount={unlockedRooms.length} className="absolute inset-0" />
        <span className="pointer-events-none absolute start-1 top-1 rounded-full border border-white/70 bg-white/75 px-2.5 py-0.5 text-[10px] font-black text-stone-500 shadow-sm backdrop-blur">
          3D
        </span>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-md flex-col gap-3">
        {ROOMS.map((room) => {
          const locked = !unlockedRooms.includes(room.id);
          const filled = room.slots.filter((s) => decor[s.id]).length;
          const complete = filled === room.slots.length;
          const ic = ROOM_ICONS[room.id] ?? ROOM_ICONS.living;
          const missingStars = Math.max(0, room.unlockStars - starBalance);
          return (
            <div
              key={room.id}
              onMouseEnter={() => locked && setHoverRoom(room.id)}
              onMouseLeave={() => setHoverRoom((cur) => (cur === room.id ? null : cur))}
              className={cn(
                "relative overflow-visible rounded-3xl border-2 bg-white/85 p-3.5 pl-4 shadow-[0_6px_18px_rgba(120,80,30,0.14)] backdrop-blur transition-transform active:scale-[0.99]",
                locked ? "border-stone-200 opacity-90" : complete ? "border-amber-300 bg-amber-50/90" : "border-emerald-200",
              )}
            >
              {/* room icon chip */}
              <div
                className={cn(
                  "pointer-events-none absolute -end-4 -top-5 flex size-16 rotate-12 items-center justify-center rounded-2xl bg-gradient-to-b text-3xl shadow-md",
                  ic.chip,
                  locked && "opacity-30 grayscale",
                )}
                aria-hidden
              >
                {locked ? "🔒" : ic.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {locked && <LockIcon className="size-4 shrink-0" />}
                  <h2 className="truncate text-base font-black text-stone-800">{t(room.nameKey)}</h2>
                  {complete && (
                    <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all", ic.bar)}
                      style={{ width: `${(filled / room.slots.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-stone-500 tabular-nums">
                    {t("room_progress")}: {n(filled)}/{n(room.slots.length)}
                  </span>
                </div>
              </div>
              {locked ? (
                <>
                  {/* hover bubble — explains exactly WHY the wing is locked
                      and HOW to unlock it (React-state hover: deterministic
                      on mouse; touch users tap the button for details) */}
                  <div
                    className={cn(
                      "pointer-events-none absolute -top-2 start-3 end-3 z-20 -translate-y-full rounded-2xl border-2 border-stone-200 bg-white/95 p-3 shadow-[0_12px_30px_rgba(80,60,30,0.25)] backdrop-blur transition-opacity duration-200",
                      hoverRoom === room.id ? "opacity-100" : "opacity-0",
                    )}
                    role="tooltip"
                  >
                    <p className="flex items-center gap-1.5 text-xs font-black text-stone-700">
                      <LockIcon className="size-3.5 shrink-0" />
                      {t("room_locked_title")}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold leading-5 text-amber-700">
                      <StarIcon className="size-3.5 shrink-0" filled />
                      {t("locked_needs_before")} {n(room.unlockStars)} {t("stars")} {t("locked_needs_after")}
                      {missingStars > 0 && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800 tabular-nums">
                          +{n(missingStars)}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[10px] font-bold leading-4 text-stone-500">{t("unlock_free_note")}</p>
                    <p className="mt-1 text-[10px] font-bold leading-4 text-stone-500">{t("locked_how")}</p>
                    <span className="absolute bottom-0 start-10 size-3 -translate-y-1/2 rotate-45 border-b-2 border-e-2 border-stone-200 bg-white" aria-hidden />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.tap();
                      if (starBalance < room.unlockStars) {
                        sfx.error();
                        toast(t("not_enough_stars"), "error");
                        setLockInfo(room.id);
                        return;
                      }
                      if (unlockRoom(room.id)) {
                        sfx.unlock();
                        toast(t("room_unlocked_toast"), "success");
                      }
                    }}
                    className={cn(
                      "mt-2 flex min-h-11 items-center gap-1 rounded-2xl px-3 text-sm font-black transition-transform active:scale-95",
                      starBalance >= room.unlockStars
                        ? "bg-gradient-to-b from-emerald-400 to-teal-500 text-white shadow-[0_3px_0_#0f766e]"
                        : "border border-amber-300 bg-amber-100 text-amber-800",
                    )}
                  >
                    {starBalance >= room.unlockStars ? (
                      <>{t("unlock_now")}</>
                    ) : (
                      <>
                        <StarIcon className="size-4" filled />
                        {n(room.unlockStars)}
                        <span className="ms-1 text-[10px] font-bold text-amber-600">· {t("locked_tap_hint")}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sfx.tap();
                    openRoom(room.id);
                  }}
                  className="mt-2 min-h-11 w-fit rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-500 px-4 text-sm font-black text-white shadow-[0_3px_0_#0f766e] active:translate-y-[2px] active:shadow-none"
                >
                  {t("enter_manor")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* lock explanation */}
      <Modal open={lockInfo !== null} onClose={() => setLockInfo(null)} ariaLabel={t("room_locked_title")}>
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-stone-200">
            <LockIcon className="size-8" />
          </div>
          <h2 className="mt-3 text-lg font-black text-stone-800">{t("room_locked_title")}</h2>
          {lockInfo && (
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {t(ROOM_BY_ID.get(lockInfo)!.nameKey)} — {n(ROOM_BY_ID.get(lockInfo)!.unlockStars)} {t("stars")}
            </p>
          )}
          <p className="mt-2 text-xs font-bold leading-5 text-stone-500">{t("unlock_free_note")}</p>
          {lockInfo &&
            !unlockedRooms.includes(lockInfo) &&
            starBalance >= ROOM_BY_ID.get(lockInfo)!.unlockStars && (
              <GameButton
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => {
                  if (unlockRoom(lockInfo)) {
                    sfx.unlock();
                    toast(t("room_unlocked_toast"), "success");
                  }
                  setLockInfo(null);
                }}
              >
                {t("unlock_now")}
              </GameButton>
            )}
          <GameButton className="mt-4 w-full" onClick={() => setLockInfo(null)}>
            {t("close")}
          </GameButton>
        </div>
      </Modal>
    </div>
  );
}
