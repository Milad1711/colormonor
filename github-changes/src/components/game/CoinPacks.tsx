"use client";

/**
 * CoinPacks — three golden coin bundles (small / medium / golden) with
 * real price points in Toman (Cafe-Bazaar-style tiers: 57k / 129k / 271k).
 *
 * In the ANDROID APK the buy button goes through Café Bazaar's real
 * in-app billing (src/lib/bazaar.ts ↔ native bridge): the payment dialog
 * opens, the receipt is RSA-verified by the shell, then coins are granted.
 * On the web the claim stays a demo checkout (no payment gateway there).
 *
 * Product ids in the Bazaar developer panel (must match exactly):
 *   coin_pack_small / coin_pack_medium / coin_pack_golden
 *
 * Coin amounts are tuned to the game economy (decor.ts):
 *  - hint costs 20, room bonus pays 100
 *  - furnishing one room with base models ≈ 410–620 coins
 *  - furnishing the ENTIRE manor with the most premium models ≈ 6,805 coins
 * So the ladder reads naturally:
 *  - Small  57,000 T  → 1,200 coins ≈ one full room + a handful of hints
 *  - Medium 129,000 T → 2,900 coins ≈ several rooms (+20% value)
 *  - Golden 271,000 T → 6,800 coins ≈ the whole manor in luxury (+21% value)
 * Price-per-coin falls monotonically (47.5 → 44.5 → 39.9), so bigger packs
 * are always the better deal — the golden pack carries the "best value" tag.
 */

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import { useT } from "./UiBits";
import { Confetti } from "./Modal";
import { toast } from "./toast";
import { cn } from "@/lib/utils";
import {
  buyBazaar,
  isNativeApp,
  markTokenGranted,
  purchasePayload,
} from "@/lib/bazaar";

interface PackDef {
  id: "small" | "medium" | "golden";
  /** Café Bazaar product id — must exist verbatim in the developer panel. */
  sku: "coin_pack_small" | "coin_pack_medium" | "coin_pack_golden";
  amount: number;
  /** price in Toman */
  price: number;
  nameKey: string;
  descKey: string;
  skin: "wood" | "silver" | "gold";
}

const PACKS: PackDef[] = [
  { id: "small", sku: "coin_pack_small", amount: 1200, price: 57_000, nameKey: "pack_small", descKey: "pack_small_sub", skin: "wood" },
  { id: "medium", sku: "coin_pack_medium", amount: 2900, price: 129_000, nameKey: "pack_medium", descKey: "pack_medium_sub", skin: "silver" },
  { id: "golden", sku: "coin_pack_golden", amount: 6800, price: 271_000, nameKey: "pack_golden", descKey: "pack_golden_sub", skin: "gold" },
];

function ChestArt({ skin, className }: { skin: PackDef["skin"]; className?: string }) {
  const palette = {
    wood: { body: "#B98A55", dark: "#8A5A33", band: "#E8C27A", lid: "#C99C6B", glow: "#FFD97A" },
    silver: { body: "#A9B4C2", dark: "#6E7B8C", band: "#E7EEF5", lid: "#BECAD8", glow: "#DFF1FF" },
    gold: { body: "#F0B429", dark: "#B45309", band: "#FFE08A", lid: "#FFCB47", glow: "#FFF0B8" },
  }[skin];
  return (
    <svg viewBox="0 0 120 96" className={className} aria-hidden>
      {skin === "gold" && <circle cx="60" cy="52" r="44" fill={palette.glow} opacity="0.35" className="pack-glow" />}
      {/* glow rays for golden */}
      {skin === "gold" && (
        <g fill={palette.band} opacity="0.5">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect key={deg} x="58" y="2" width="4" height="18" rx="2" transform={`rotate(${deg} 60 52)`} />
          ))}
        </g>
      )}
      {/* chest body */}
      <rect x="22" y="44" width="76" height="44" rx="8" fill={palette.body} stroke={palette.dark} strokeWidth="3" />
      {/* lid */}
      <path d="M22 46 Q22 18 60 18 Q98 18 98 46 Z" fill={palette.lid} stroke={palette.dark} strokeWidth="3" />
      <rect x="22" y="40" width="76" height="8" rx="4" fill={palette.dark} opacity="0.85" />
      {/* metal bands */}
      <rect x="34" y="18" width="10" height="70" rx="4" fill={palette.band} stroke={palette.dark} strokeWidth="2" />
      <rect x="76" y="18" width="10" height="70" rx="4" fill={palette.band} stroke={palette.dark} strokeWidth="2" />
      {/* lock */}
      <rect x="51" y="42" width="18" height="20" rx="5" fill={palette.band} stroke={palette.dark} strokeWidth="2.4" />
      <circle cx="60" cy="50" r="3" fill={palette.dark} />
      <path d="M60 50v6" stroke={palette.dark} strokeWidth="2.6" strokeLinecap="round" />
      {/* coins spilling */}
      <g>
        <circle cx="44" cy="88" r="7" fill="#F5B301" stroke="#B45309" strokeWidth="2" />
        <circle cx="60" cy="91" r="7.5" fill="#FFD54F" stroke="#B45309" strokeWidth="2" />
        <circle cx="76" cy="88" r="7" fill="#F5B301" stroke="#B45309" strokeWidth="2" />
      </g>
    </svg>
  );
}

function PackCard({ pack, index }: { pack: PackDef; index: number }) {
  const { t, n } = useT();
  const addCoins = useGame((s) => s.addCoins);
  const [burst, setBurst] = useState(false);
  // native flag only after mount — keeps SSR/CSR HTML identical
  const [native, setNative] = useState(false);
  const [buying, setBuying] = useState(false);
  useEffect(() => setNative(isNativeApp()), []);

  const celebrate = () => {
    sfx.chest();
    setBurst(true);
    setTimeout(() => setBurst(false), 900);
  };

  const claim = async () => {
    if (!native) {
      // web build: demo checkout (no payment gateway outside the app)
      celebrate();
      addCoins(pack.amount);
      toast(`+${n(pack.amount)} ${t("pack_coins_word")} — ${t("pack_claimed_toast")}`, "success");
      return;
    }
    if (buying) return;
    setBuying(true);
    try {
      const ev = await buyBazaar(pack.sku, purchasePayload(pack.id));
      if (ev.type === "purchase" && ev.ok) {
        celebrate();
        addCoins(pack.amount);
        markTokenGranted(ev.token);
        try { window.ColorManorBridge?.consume(ev.token); } catch { /* retried on restore */ }
        toast(`+${n(pack.amount)} ${t("pack_coins_word")} — ${t("pack_purchased_toast")}`, "success");
      } else if (ev.type === "purchase") {
        const key =
          ev.error === "cancelled" ? "pack_cancelled"
          : ev.error === "bazaar_missing" ? "pack_no_bazaar"
          : ev.error === "verify_failed" || ev.error === "bad_state" || ev.error === "wrong_package" ? "pack_verify_failed"
          : "pack_failed";
        toast(t(key), ev.error === "cancelled" ? "info" : "error");
      }
    } finally {
      setBuying(false);
    }
  };

  const golden = pack.skin === "gold";

  return (
    <div
      className={cn(
        "pack-card relative flex items-center gap-3 overflow-hidden rounded-3xl border-2 bg-white/90 p-3 shadow-[0_8px_20px_rgba(120,70,20,0.18)] backdrop-blur transition-transform active:scale-[0.98]",
        golden ? "border-amber-400 pack-golden" : "border-stone-200",
      )}
    >
      {golden && (
        <span className="absolute start-0 top-3 rounded-e-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-0.5 text-[10px] font-black text-white shadow">
          ★ {t("pack_best")}
        </span>
      )}
      <ChestArt skin={pack.skin} className="h-16 w-20 shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className={cn("text-sm font-black leading-5", golden ? "text-amber-700" : "text-stone-800")}>
          {t(pack.nameKey)}
        </h3>
        <p className="text-base font-black text-amber-600 tabular-nums">
          +{n(pack.amount)}{" "}
          <span className="text-[11px] font-bold text-stone-500">{t("pack_coins_word")}</span>
        </p>
        <p className="text-[10px] font-bold leading-4 text-stone-400">{t(pack.descKey)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-1">
        <button
          type="button"
          onClick={claim}
          disabled={buying}
          className={cn(
            "btn-shine min-h-10 rounded-2xl px-3 py-1 text-sm font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.22)] transition-all active:translate-y-[3px] active:shadow-none disabled:opacity-70",
            golden
              ? "bg-gradient-to-b from-amber-400 via-orange-400 to-orange-500"
              : "bg-gradient-to-b from-emerald-400 to-teal-500",
          )}
        >
          {buying && native ? t("pack_buying") : t("pack_buy")}
        </button>
        <span className="rounded-xl bg-stone-100 px-2 py-0.5 text-center text-[10px] font-black text-stone-500 tabular-nums">
          {n(pack.price)} {t("toman")}
        </span>
      </div>
      {burst && <Confetti count={golden ? 30 : 14} />}
      <span className="hidden">{index}</span>
    </div>
  );
}

export function CoinPacks() {
  const { t } = useT();
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNativeApp()), []);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-xs font-bold text-stone-500">{t("coin_packs_sub")}</p>
      {PACKS.map((p, i) => (
        <PackCard key={p.id} pack={p} index={i} />
      ))}
      <p className="text-center text-[10px] font-bold leading-4 text-stone-400">
        {native ? t("pack_native_note") : t("pack_demo_note")}
      </p>
    </div>
  );
}
