"use client";

/**
 * CoinStoreModal — the "Coin Bank": one place for the daily Lucky Spin
 * and the golden Coin Packs. Opened from the coin badge, the main menu
 * or the shop header.
 */

import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import { Modal } from "./Modal";
import { CoinBadge, useT } from "./UiBits";
import { LuckyWheel } from "./LuckyWheel";
import { CoinPacks } from "./CoinPacks";
import { cn } from "@/lib/utils";

export function CoinStoreModal() {
  const { t } = useT();
  const open = useGame((s) => s.coinStoreOpen);
  const close = useGame((s) => s.closeCoinStore);
  const tab = useGame((s) => s.coinStoreTab);
  const setTab = useGame((s) => s.setCoinStoreTab);

  const switchTab = (next: typeof tab) => {
    sfx.tap();
    setTab(next);
  };

  return (
    <Modal open={open} onClose={close} ariaLabel={t("coin_bank")} className="max-w-xs">
      <div className="text-center">
        <h2 className="title3d text-2xl font-black">{t("coin_bank")}</h2>
        <p className="mt-0.5 text-[11px] font-bold text-stone-500">{t("coin_bank_sub")}</p>
      </div>

      {/* tabs */}
      <div className="mx-auto mt-3 grid w-full grid-cols-2 gap-1.5 rounded-full bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => switchTab("wheel")}
          className={cn(
            "min-h-10 rounded-full px-2 text-sm font-black transition-all",
            tab === "wheel"
              ? "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[0_2px_0_#9F1239]"
              : "text-stone-500",
          )}
        >
          {t("lucky_wheel")}
        </button>
        <button
          type="button"
          onClick={() => switchTab("packs")}
          className={cn(
            "min-h-10 rounded-full px-2 text-sm font-black transition-all",
            tab === "packs"
              ? "bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-[0_2px_0_#c2410c]"
              : "text-stone-500",
          )}
        >
          {t("coin_packs")}
        </button>
      </div>

      {/* content */}
      <div className="mt-3 max-h-[52vh] overflow-y-auto pe-0.5">
        {tab === "wheel" ? <LuckyWheel compact /> : <CoinPacks />}
      </div>
    </Modal>
  );
}

/** Re-export so screens can show a live coin counter next to entries. */
export { CoinBadge };
