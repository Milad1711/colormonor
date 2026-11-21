"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { ROOM_BY_ID, variantPrice } from "@/game/decor";
import { sfx } from "@/game/audio";
import { hasWebGL } from "@/game/three-kit";
import { BackButton, CoinBadge, GameButton, useT } from "./UiBits";
import { RoomScene } from "./RoomScene";
import { RoomScene3D } from "./RoomScene3D";
import { DecorArt } from "./DecorArt";
import { Modal, Confetti } from "./Modal";
import { Backdrop } from "./Backdrop";
import { cn } from "@/lib/utils";

export function RoomScreen() {
  const { t, n } = useT();
  const activeRoom = useGame((s) => s.activeRoom);
  const goManor = useGame((s) => s.goManor);
  const goShop = useGame((s) => s.goShop);
  const coins = useGame((s) => s.coins);
  const starBalance = useGame((s) => s.starBalance);
  const decor = useGame((s) => s.decor);
  const roomJustCompleted = useGame((s) => s.roomJustCompleted);
  const clearRoomJustCompleted = useGame((s) => s.clearRoomJustCompleted);
  /** last empty spot the player tapped — the shop button aligns beneath it */
  const [lastSlot, setLastSlot] = useState<string | null>(null);

  const room = activeRoom ? ROOM_BY_ID.get(activeRoom) : null;

  // celebrate a just-completed renovation
  useEffect(() => {
    if (roomJustCompleted) {
      const id = setTimeout(() => clearRoomJustCompleted(), 8000);
      return () => clearTimeout(id);
    }
  }, [roomJustCompleted, clearRoomJustCompleted]);

  if (!room) {
    goManor();
    return null;
  }

  const filled = room.slots.filter((s) => decor[s.id]).length;
  const complete = filled === room.slots.length;
  const use3D = hasWebGL();
  const emptySlots = room.slots.filter((s) => !decor[s.id]);
  // the slot the "go to shop" action points at: the last tapped empty spot,
  // otherwise the first empty one — and the button sits exactly beneath it
  const targetSlot =
    emptySlots.find((s) => s.id === lastSlot) ?? emptySlots[0] ?? null;
  const targetXpct = targetSlot
    ? Math.min(78, Math.max(22, (targetSlot.x / 400) * 100))
    : 50;

  const openSlot = (slotId: string) => {
    sfx.tap();
    setLastSlot(slotId);
    goShop({ roomId: room.id, slotId });
  };

  return (
    <div className="scene-root flex min-h-dvh flex-col px-4 pb-8 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton onClick={goManor} label={t("back")} />
          <h1 className="truncate text-lg font-black text-stone-800">{t(room.nameKey)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-2xl border border-white/70 bg-white/85 px-3 py-1.5 text-sm font-bold text-stone-700 shadow-[0_3px_10px_rgba(120,80,30,0.15)] backdrop-blur tabular-nums">
            {n(filled)}/{n(room.slots.length)}
          </span>
          <CoinBadge value={coins} />
        </div>
      </header>

      {/* scene — real 3D interior (WebGL) or cartoon SVG fallback */}
      <div className="relative mx-auto mt-3 w-full max-w-lg overflow-hidden rounded-[26px] border-4 border-white/80 shadow-[0_16px_40px_rgba(120,70,20,0.28)]">
        {use3D ? (
          <RoomScene3D
            roomId={room.id}
            decor={decor}
            onSlotTap={openSlot}
            className="block aspect-[4/3] w-full touch-none"
          />
        ) : (
          <div className="relative aspect-[400/280] w-full">
            <RoomScene room={room.id} className="block h-full w-full" />
            {room.slots.map((slot) => {
              const owned = decor[slot.id];
              const widthPct = (100 * slot.scale) / 400 * 100;
              const posStyle = {
                left: `${(slot.x / 400) * 100}%`,
                top: `${(slot.y / 280) * 100}%`,
                width: `${widthPct}%`,
                transform: slot.anchorTop ? "translate(-50%, 0)" : "translate(-50%, -100%)",
              } as const;
              if (!owned) {
                return (
                  <button
                    key={slot.id}
                    type="button"
                    title={t("item_" + slot.item)}
                    aria-label={t("item_" + slot.item)}
                    onClick={() => openSlot(slot.id)}
                    className="group absolute flex items-center justify-center"
                    style={posStyle}
                  >
                    <span className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-stone-400/70 bg-white/45 text-lg font-black text-stone-500 shadow-sm transition-all group-hover:scale-110 group-active:scale-90">
                      +
                    </span>
                  </button>
                );
              }
              return (
                <div
                  key={slot.id}
                  className={slot.anchorTop ? "item-pop anchor-top pointer-events-none absolute" : "item-pop pointer-events-none absolute"}
                  style={posStyle}
                >
                  <DecorArt item={slot.item} variant={owned.variant} className="aspect-square w-full" />
                </div>
              );
            })}
          </div>
        )}
        {use3D && (
          <span className="pointer-events-none absolute start-2 top-2 rounded-full border border-white/70 bg-white/75 px-2.5 py-0.5 text-[10px] font-black text-stone-500 shadow-sm backdrop-blur">
            3D
          </span>
        )}
        {complete && (
          <div className="absolute start-3 bottom-3 rounded-full bg-amber-400/95 px-3 py-1 text-xs font-black text-amber-950 shadow">
            ✓ {t("room_complete_title")}
          </div>
        )}
      </div>

      {/* per-slot coin chips — one under every empty spot, with the price */}
      {emptySlots.length > 0 && (
        <div className="relative mx-auto mt-1.5 h-14 w-full max-w-lg">
          {emptySlots.map((slot, i) => {
            const min = variantPrice(slot.item, 0);
            const affordable = coins >= min;
            const xpct = Math.min(88, Math.max(12, (slot.x / 400) * 100));
            return (
              <button
                key={slot.id}
                type="button"
                title={t("item_" + slot.item)}
                aria-label={`${t("item_" + slot.item)} — ${t("coins")} ${n(min)}`}
                onClick={() => openSlot(slot.id)}
                className={cn(
                  "absolute flex -translate-x-1/2 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black shadow-sm transition-transform active:scale-90",
                  i % 2 === 0 ? "top-0" : "top-7",
                  affordable
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-600",
                  targetSlot?.id === slot.id && "ring-2 ring-amber-300 ring-offset-1",
                )}
                style={{ left: `${xpct}%` }}
              >
                <svg viewBox="0 0 24 24" className="size-3" aria-hidden>
                  <circle cx="12" cy="12" r="9.5" fill="#F5B301" stroke="#B45309" strokeWidth="1.6" />
                </svg>
                +{n(min)}
              </button>
            );
          })}
        </div>
      )}

      {/* footer — go-to-shop sits exactly beneath the relevant empty spot */}
      <div className="mx-auto mt-1 w-full max-w-lg">
        {!complete && emptySlots.length > 0 ? (
          <div className="relative h-14 w-full">
            <div
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${targetXpct}%` }}
            >
              <GameButton
                variant="gold"
                className="whitespace-nowrap px-5"
                onClick={() => goShop({ roomId: room.id, slotId: targetSlot?.id })}
              >
                {t("go_to_shop")}
              </GameButton>
              <div className="mx-auto h-2.5 w-0.5 bg-gradient-to-b from-amber-300 to-transparent" aria-hidden />
            </div>
          </div>
        ) : (
          <>
            {!complete && (
              <p className="text-center text-xs font-bold text-stone-500">{t("slot_empty_hint")}</p>
            )}
            <GameButton
              variant="gold"
              className="mx-auto mt-2 w-full max-w-xs"
              onClick={() => goShop({ roomId: room.id })}
            >
              {t("go_to_shop")}
            </GameButton>
          </>
        )}
      </div>

      {/* completion celebration */}
      {roomJustCompleted === room.id && (
        <>
          <Confetti count={22} />
          <Modal open closable onClose={clearRoomJustCompleted} ariaLabel={t("room_complete_title")}>
            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-orange-400 shadow-md">
                <svg viewBox="0 0 24 24" className="size-9 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 11l9-8 9 8" />
                  <path d="M5 10v10h14V10" />
                  <path d="M10 20v-6h4v6" />
                </svg>
              </div>
              <h2 className="mt-3 text-xl font-black text-orange-600">{t("room_complete_title")}</h2>
              <p className="mt-1 text-sm font-bold text-stone-600">{t("room_complete_body")}</p>
              <GameButton className="mt-5 w-full" onClick={clearRoomJustCompleted}>
                {t("room_complete_btn")}
              </GameButton>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
