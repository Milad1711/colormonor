"use client";

import { useCallback, useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { ROOM_BY_ID, variantPrice, slotPlaceKey } from "@/game/decor";
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
  /** placement guide panel (what goes where) — open by default */
  const [guideOpen, setGuideOpen] = useState(true);
  /** live on-screen x (%) of every empty slot, projected from the 3D camera */
  const [slotPos, setSlotPos] = useState<Record<string, number>>({});
  const handleSlotPositions = useCallback((pos: Record<string, number>) => setSlotPos(pos), []);

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
  /** exact on-screen x of a slot: live 3D projection, or the SVG fallback */
  const slotXpct = (slot: { id: string; x: number }) =>
    slotPos[slot.id] ?? Math.round((slot.x / 400) * 100);
  const targetXpct = targetSlot
    ? Math.min(82, Math.max(18, slotXpct(targetSlot)))
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
            onSlotPositions={handleSlotPositions}
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

      {/* per-slot chips — one under every empty spot: item name + where it
          goes + price, so the player always knows WHAT belongs WHERE.
          Chips are sorted by their live projected x so they never collide. */}
      {emptySlots.length > 0 && (
        <div className="relative mx-auto mt-1.5 h-[8.5rem] w-full max-w-lg">
          {[...emptySlots]
            .sort((a, b) => slotXpct(a) - slotXpct(b))
            .map((slot, i) => {
            const min = variantPrice(slot.item, 0);
            const affordable = coins >= min;
            const xpct = Math.min(88, Math.max(12, slotXpct(slot)));
            const row = i % 3;
            return (
              <button
                key={slot.id}
                type="button"
                title={`${t("item_" + slot.item)} — ${t(slotPlaceKey(slot))}`}
                aria-label={`${t("item_" + slot.item)} — ${t(slotPlaceKey(slot))} — ${t("coins")} ${n(min)}`}
                onClick={() => openSlot(slot.id)}
                className={cn(
                  "absolute flex -translate-x-1/2 flex-col items-center rounded-2xl border px-2.5 py-1 shadow-sm transition-all active:scale-90",
                  row === 0 ? "top-0" : row === 1 ? "top-11" : "top-[5.5rem]",
                  affordable
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-600",
                  targetSlot?.id === slot.id && "ring-2 ring-amber-300 ring-offset-1",
                )}
                style={{ left: `${xpct}%` }}
              >
                <span className="whitespace-nowrap text-[11px] font-black leading-3.5">
                  {t("item_" + slot.item)}
                </span>
                <span className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[10px] font-bold leading-3 opacity-90">
                  {t(slotPlaceKey(slot))}
                  <svg viewBox="0 0 24 24" className="size-3" aria-hidden>
                    <circle cx="12" cy="12" r="9.5" fill="#F5B301" stroke="#B45309" strokeWidth="1.6" />
                  </svg>
                  {n(min)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* placement guide — the full "what goes where" list for this room */}
      <div className="mx-auto mt-1 w-full max-w-lg">
        <button
          type="button"
          onClick={() => {
            sfx.tap();
            setGuideOpen((v) => !v);
          }}
          className="flex min-h-9 w-full items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-3 text-xs font-black text-stone-700 shadow-sm backdrop-blur active:scale-[0.99]"
        >
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="size-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18h6" />
              <path d="M10 21h4" />
              <path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />
            </svg>
            {t("placement_guide")}
            <span className="text-[10px] font-bold text-stone-400">· {t("placement_guide_sub")}</span>
          </span>
          <svg viewBox="0 0 24 24" className={cn("size-4 text-stone-400 transition-transform", guideOpen && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {guideOpen && (
          <div className="mt-1.5 rounded-2xl border border-white/70 bg-white/85 p-2 shadow-sm backdrop-blur">
            <ul className="space-y-1">
              {room.slots.map((slot) => {
                const owned = decor[slot.id];
                const price = variantPrice(slot.item, 0);
                return (
                  <li key={slot.id}>
                    <button
                      type="button"
                      onClick={() => openSlot(slot.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-start transition-colors",
                        owned ? "bg-emerald-50/80" : "bg-amber-50/80 hover:bg-amber-100/80",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white",
                          owned ? "bg-emerald-500" : "bg-amber-400",
                        )}
                        aria-hidden
                      >
                        {owned ? "✓" : "+"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-black text-stone-700">
                          {t("item_" + slot.item)}
                        </span>
                        <span className="block text-[10px] font-bold text-stone-500">
                          {t(slotPlaceKey(slot))}
                          {!owned && (
                            <span className="inline-flex items-center gap-0.5">
                              ·
                              <svg viewBox="0 0 24 24" className="size-3" aria-hidden>
                                <circle cx="12" cy="12" r="9.5" fill="#F5B301" stroke="#B45309" strokeWidth="1.6" />
                              </svg>
                              {n(price)}
                            </span>
                          )}
                        </span>
                      </span>
                      {!owned && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                          {t("buy")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

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
