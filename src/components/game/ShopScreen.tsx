"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/game/store";
import {
  CATEGORY_KEYS,
  ROOMS,
  SHOP_ITEMS,
  ROOM_BY_ID,
  switchCost,
  variantPrice,
  VARIANT_NAME_KEYS,
  type ItemCategory,
} from "@/game/decor";
import { sfx } from "@/game/audio";
import { BackButton, CoinBadge, LockIcon, useT } from "./UiBits";
import { DecorPreview } from "./DecorArt";
import { Modal } from "./Modal";
import { toast } from "./toast";
import { cn } from "@/lib/utils";
import { Backdrop } from "./Backdrop";

/** item id -> the unique slot that hosts it */
const SLOT_FOR_ITEM = new Map<string, string>();
ROOMS.forEach((room) => room.slots.forEach((slot) => SLOT_FOR_ITEM.set(slot.item, slot.id)));
const ROOM_FOR_SLOT = new Map<string, string>();
ROOMS.forEach((room) => room.slots.forEach((slot) => ROOM_FOR_SLOT.set(slot.id, room.id)));

export function ShopScreen() {
  const { t, n } = useT();
  const coins = useGame((s) => s.coins);
  const decor = useGame((s) => s.decor);
  const unlockedRooms = useGame((s) => s.unlockedRooms);
  const shopContext = useGame((s) => s.shopContext);
  const buyDecor = useGame((s) => s.buyDecor);
  const switchDecor = useGame((s) => s.switchDecor);
  const openRoom = useGame((s) => s.openRoom);
  const goManor = useGame((s) => s.goManor);
  const goMenu = useGame((s) => s.goMenu);

  const [cat, setCat] = useState<ItemCategory | "all">(shopContext?.slotId ? (SHOP_ITEMS[ROOMS.flatMap((r) => r.slots).find((sl) => sl.id === shopContext.slotId)!.item].category) : "all");
  const [detail, setDetail] = useState<string | null>(null); // item id
  const [selVariant, setSelVariant] = useState(0);

  const items = useMemo(() => {
    const all = Object.values(SHOP_ITEMS);
    if (cat === "all") return all;
    return all.filter((it) => it.category === cat);
  }, [cat]);

  const contextSlot = shopContext?.slotId ?? null;
  const contextItem = contextSlot ? ROOMS.flatMap((r) => r.slots).find((s) => s.id === contextSlot)?.item : null;

  const goBack = () => {
    if (shopContext) openRoom(shopContext.roomId);
    else goMenu();
  };

  const openDetail = (itemId: string) => {
    const slotId = SLOT_FOR_ITEM.get(itemId)!;
    const owned = decor[slotId];
    setSelVariant(owned ? owned.variant : 0);
    setDetail(itemId);
  };

  const purchase = (itemId: string, variant: number) => {
    const slotId = SLOT_FOR_ITEM.get(itemId)!;
    const roomId = ROOM_FOR_SLOT.get(slotId)!;
    if (!unlockedRooms.includes(roomId)) {
      sfx.error();
      toast(t("room_locked_title"), "error");
      return;
    }
    const owned = decor[slotId];
    const price = variantPrice(itemId, variant);
    if (owned) {
      if (owned.variant === variant) return;
      const cost = switchCost(price);
      if (coins < cost) {
        sfx.error();
        toast(t("coins_insufficient_generic"), "error");
        return;
      }
      if (switchDecor(slotId, itemId, variant)) {
        sfx.buy();
        toast(t("switch_ok"), "success");
        setDetail(null);
        openRoom(roomId);
      }
    } else {
      if (coins < price) {
        sfx.error();
        toast(t("coins_insufficient_generic"), "error");
        return;
      }
      if (buyDecor(slotId, itemId, variant)) {
        sfx.buy();
        setTimeout(() => sfx.place(), 220);
        toast(t("purchase_ok"), "success");
        setDetail(null);
        openRoom(roomId);
      }
    }
  };

  return (
    <div className="scene-root flex min-h-dvh flex-col px-4 pb-8 pt-4">
      <Backdrop />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton onClick={goBack} label={t("back")} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black text-stone-800">{t("shop")}</h1>
            {contextItem && (
              <p className="truncate text-[11px] font-bold text-orange-600">
                {t("equip_from_room")}: {t("item_" + contextItem)}
              </p>
            )}
          </div>
        </div>
        <CoinBadge value={coins} />
      </header>
      <p className="mt-1 text-center text-[11px] font-bold text-stone-500">{t("price_change_note")}</p>

      {/* category tabs */}
      <div className="mx-auto mt-3 flex w-full max-w-md gap-1.5 overflow-x-auto pb-1">
        <CatTab active={cat === "all"} label={t("shop_filter_all")} onClick={() => setCat("all")} />
        {CATEGORY_KEYS.map((k) => (
          <CatTab key={k} active={cat === k} label={t(k)} onClick={() => setCat(k)} />
        ))}
      </div>

      {/* items */}
      <div className="mx-auto mt-3 grid w-full max-w-md grid-cols-2 gap-3">
        {items.map((it) => {
          const slotId = SLOT_FOR_ITEM.get(it.id)!;
          const roomId = ROOM_FOR_SLOT.get(slotId)!;
          const locked = !unlockedRooms.includes(roomId);
          const owned = decor[slotId];
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => {
                sfx.tap();
                openDetail(it.id);
              }}
              className={cn(
                "relative flex flex-col items-center rounded-3xl border-2 bg-white/90 p-2.5 text-center shadow-[0_6px_16px_rgba(120,80,30,0.14)] backdrop-blur transition-transform active:scale-95",
                owned ? "border-emerald-300" : "border-amber-200",
                contextItem === it.id && "ring-2 ring-orange-400",
              )}
            >
              {locked && (
                <span className="absolute end-2 top-2 rounded-full bg-stone-300 p-1">
                  <LockIcon className="size-3.5" />
                </span>
              )}
              <DecorPreview item={it.id} variant={owned ? owned.variant : 0} className="h-24 w-full" />
              <span className="mt-1 line-clamp-1 text-sm font-black text-stone-700">{t("item_" + it.id)}</span>
              {owned ? (
                <span className="mt-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                  {t("owned")}
                </span>
              ) : (
                <span className="mt-0.5 text-[11px] font-bold text-amber-700">
                  {t("buy")}: {n(it.prices[0])}+
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* detail dialog */}
      <Modal open={detail !== null} onClose={() => setDetail(null)} ariaLabel={t("select_model")}>
        {detail && (() => {
          const item = SHOP_ITEMS[detail];
          const slotId = SLOT_FOR_ITEM.get(detail)!;
          const roomId = ROOM_FOR_SLOT.get(slotId)!;
          const locked = !unlockedRooms.includes(roomId);
          const owned = decor[slotId];
          const price = variantPrice(detail, selVariant);
          const isSwitch = !!owned && owned.variant !== selVariant;
          const cost = isSwitch ? switchCost(price) : price;
          return (
            <div>
              <h2 className="text-center text-lg font-black text-stone-800">{t("item_" + detail)}</h2>
              <p className="mt-0.5 text-center text-[11px] font-bold text-stone-500">
                {t(ROOM_BY_ID.get(roomId)!.nameKey)} · {t(VARIANT_NAME_KEYS[selVariant])}
              </p>
              <div className="mx-auto mt-2 h-36 w-40 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100 p-1 shadow-inner">
                <DecorPreview item={detail} variant={selVariant} className="h-full w-full" />
              </div>
              <p className="mt-1.5 text-center text-[11px] font-bold text-stone-500">{t("preview_hint")}</p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {item.prices.map((p, v) => {
                  const mine = owned && owned.variant === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        sfx.select();
                        setSelVariant(v);
                      }}
                      className={cn(
                        "flex flex-col items-center rounded-2xl border-2 p-1.5 text-center transition-all active:scale-95",
                        selVariant === v ? "border-orange-400 bg-orange-50" : "border-stone-200 bg-white",
                      )}
                    >
                      <DecorPreview item={detail} variant={v} className="h-14 w-full" />
                      <span className="mt-0.5 text-[10px] font-black text-stone-600">{t(VARIANT_NAME_KEYS[v])}</span>
                      <span className="text-[10px] font-bold text-amber-700 tabular-nums">{mine ? t("equipped") : n(p)}</span>
                    </button>
                  );
                })}
              </div>

              {locked ? (
                <p className="mt-3 rounded-xl bg-stone-100 p-2 text-center text-xs font-bold text-stone-500">
                  <LockIcon className="me-1 inline size-4 align-text-bottom" />
                  {t("room_locked_title")}
                </p>
              ) : (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={!!owned && owned.variant === selVariant}
                    onClick={() => purchase(detail, selVariant)}
                    className={cn(
                      "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] transition-all active:translate-y-[3px] active:shadow-none disabled:opacity-50",
                      isSwitch ? "bg-gradient-to-b from-sky-500 to-teal-500" : "bg-gradient-to-b from-amber-400 to-orange-500",
                    )}
                  >
                    {isSwitch ? t("switch_item") : t("buy")}
                    <span className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-sm">
                      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                        <circle cx="12" cy="12" r="9" fill="#F5B301" stroke="#B45309" strokeWidth="1.5" />
                      </svg>
                      {n(cost)}
                    </span>
                  </button>
                </div>
              )}
              {owned && owned.variant !== selVariant && (
                <p className="mt-1.5 text-center text-[11px] font-bold text-stone-500">
                  {t("switch_cost")}: {n(switchCost(price))} — {t("price_change_note")}
                </p>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

function CatTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.tap();
        onClick();
      }}
      className={cn(
        "min-h-9 shrink-0 rounded-full px-3.5 text-sm font-black transition-colors",
        active ? "bg-orange-500 text-white shadow" : "bg-white/80 text-stone-500 border border-stone-200",
      )}
    >
      {label}
    </button>
  );
}
