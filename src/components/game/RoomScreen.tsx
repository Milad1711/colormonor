"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import { ROOM_BY_ID } from "@/game/decor";
import { sfx } from "@/game/audio";
import { BackButton, CoinBadge, GameButton, useT } from "./UiBits";
import { RoomScene } from "./RoomScene";
import { DecorArt } from "./DecorArt";
import { Modal, Confetti } from "./Modal";
import { Backdrop } from "./Backdrop";

export function RoomScreen() {
  const { t } = useT();
  const activeRoom = useGame((s) => s.activeRoom);
  const goManor = useGame((s) => s.goManor);
  const goShop = useGame((s) => s.goShop);
  const coins = useGame((s) => s.coins);
  const starBalance = useGame((s) => s.starBalance);
  const decor = useGame((s) => s.decor);
  const roomJustCompleted = useGame((s) => s.roomJustCompleted);
  const clearRoomJustCompleted = useGame((s) => s.clearRoomJustCompleted);

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

  return (
    <div className="scene-root flex min-h-dvh flex-col px-4 pb-8 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton onClick={goManor} label={t("back")} />
          <h1 className="truncate text-lg font-black text-stone-800">{t(room.nameKey)}</h1>
        </div>
        <CoinBadge value={coins} />
      </header>

      {/* scene */}
      <div className="relative mx-auto mt-3 w-full max-w-md overflow-hidden rounded-[26px] border-4 border-white/80 shadow-[0_16px_40px_rgba(120,70,20,0.28)]">
        <RoomScene room={room.id} className="block w-full" />
        {room.slots.map((slot) => {
          const owned = decor[slot.id];
          const widthPct = (100 * slot.scale) / 400 * 100;
          const posStyle = {
            left: `${(slot.x / 400) * 100}%`,
            top: `${(slot.y / 280) * 100}%`,
            width: `${widthPct}%`,
            transform: slot.anchorTop ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          } as const;
          if (owned) {
            return (
              <div
                key={slot.id}
                className={slot.anchorTop ? "item-pop anchor-top pointer-events-none absolute" : "item-pop pointer-events-none absolute"}
                style={posStyle}
              >
                <DecorArt item={slot.item} variant={owned.variant} className="aspect-square w-full" />
              </div>
            );
          }
          return (
            <button
              key={slot.id}
              type="button"
              title={t("item_" + slot.item)}
              aria-label={t("item_" + slot.item)}
              onClick={() => {
                sfx.tap();
                goShop({ roomId: room.id, slotId: slot.id });
              }}
              className="group absolute flex items-center justify-center"
              style={posStyle}
            >
              <span className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-stone-400/70 bg-white/45 text-lg font-black text-stone-500 shadow-sm transition-all group-hover:scale-110 group-active:scale-90">
                +
              </span>
            </button>
          );
        })}
        {complete && (
          <div className="absolute start-3 top-3 rounded-full bg-amber-400/95 px-3 py-1 text-xs font-black text-amber-950 shadow">
            ✓ {t("room_complete_title")}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="mx-auto mt-4 w-full max-w-md">
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
