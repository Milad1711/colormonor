"use client";

/**
 * Café Bazaar in-app billing — client bridge for the Android APK.
 *
 * The native shell (android/…/MainActivity.java) exposes:
 *   window.ColorManorBridge.buy(productId, payload)      → payment dialog
 *   window.ColorManorBridge.restore()                    → unconsumed purchases
 *   window.ColorManorBridge.consume(token)               → consume one purchase
 *   window.ColorManorBridge.isBazaarAvailable()          → Bazaar installed?
 * and pushes events to window.__bazaar.onEvent({type, ...}).
 *
 * Event types:
 *   {type:"connected", ok:true, bazaarInstalled, signatureCheck}
 *   {type:"purchase", ok:true,  productId, token, payload, orderId}
 *   {type:"purchase", ok:false, error:"cancelled"|"bazaar_missing"|…}
 *   {type:"restore",  purchases:[{productId, token, payload, purchaseState, signatureOk}]}
 *   {type:"consumed", ok, token}
 *
 * Coin granting is exactly-once:
 *   - interactive buy → CoinPacks grants on the ok event, then marks the
 *     token in localStorage and consumes it,
 *   - restore → this module grants only tokens not yet marked, then consumes
 *     everything Bazaar reports (getPurchases only lists unconsumed items).
 *
 * Product ids must exist VERBATIM in the Café Bazaar developer panel:
 *   coin_pack_small / coin_pack_medium / coin_pack_golden
 */

import { STRINGS, type Lang } from "@/game/i18n";
import { useGame } from "@/game/store";
import { getDeviceId } from "@/game/device";
import { toast } from "@/components/game/toast";

/** productId → coins granted (must match CoinPacks PACKS amounts). */
export const BAZAAR_PRODUCTS: Record<string, number> = {
  coin_pack_small: 1200,
  coin_pack_medium: 2900,
  coin_pack_golden: 6800,
};

export interface BazaarOwnedPurchase {
  productId: string;
  token: string;
  payload: string;
  orderId?: string;
  purchaseState: number;
  signatureOk: boolean;
}

export type BazaarEvent =
  | { type: "connected"; ok: boolean; bazaarInstalled?: boolean; signatureCheck?: boolean }
  | ({ type: "purchase"; ok: true; productId: string; token: string; payload: string; orderId: string })
  | { type: "purchase"; ok: false; error: string; productId?: string }
  | { type: "restore"; purchases: BazaarOwnedPurchase[]; error?: string }
  | { type: "consumed"; ok: boolean; token: string };

interface NativeBridge {
  isBazaarAvailable(): boolean;
  isSignatureCheckEnabled(): boolean;
  buy(productId: string, payload: string): void;
  restore(): void;
  consume(token: string): void;
}

declare global {
  interface Window {
    ColorManorBridge?: NativeBridge;
    __bazaar?: { onEvent(ev: BazaarEvent): void };
  }
}

const GRANTED_KEY = "color-manor-bazaar-granted";

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && !!window.ColorManorBridge;
}

export function bazaarAvailable(): boolean {
  try {
    return isNativeApp() && !!window.ColorManorBridge?.isBazaarAvailable();
  } catch {
    return false;
  }
}

// ------------------------------------------------------- granted-token ledger
function grantedTokens(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(GRANTED_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markGranted(token: string): void {
  if (typeof window === "undefined" || !token) return;
  const set = grantedTokens();
  set.add(token);
  try {
    window.localStorage.setItem(GRANTED_KEY, JSON.stringify([...set].slice(-200)));
  } catch { /* storage full — ignore */ }
}

/** Mark a token as already granted (used right after an interactive buy). */
export function markTokenGranted(token: string): void {
  markGranted(token);
}

// ------------------------------------------------------------------ event bus
let listener: ((ev: BazaarEvent) => void) | null = null;
let pendingBuy: { productId: string; resolve: (ev: BazaarEvent) => void; timer: number } | null = null;

/** Register the native→JS event receiver (idempotent). */
function ensureListener(): void {
  if (typeof window === "undefined" || window.__bazaar) return;
  window.__bazaar = {
    onEvent: (ev: BazaarEvent) => {
      // resolve the awaiting interactive purchase
      if (ev.type === "purchase" && pendingBuy && (!("productId" in ev) || !ev.productId || ev.productId === pendingBuy.productId)) {
        const { resolve, timer } = pendingBuy;
        pendingBuy = null;
        window.clearTimeout(timer);
        resolve(ev);
      }
      if (ev.type === "restore") onRestore(ev);
      listener?.(ev);
    },
  };
}

/** One interactive purchase — resolves with the first purchase event. */
export function buyBazaar(productId: string, payload: string, timeoutMs = 300_000): Promise<BazaarEvent> {
  ensureListener();
  const bridge = typeof window !== "undefined" ? window.ColorManorBridge : undefined;
  if (!bridge) return Promise.resolve({ type: "purchase", ok: false, error: "not_native" });
  return new Promise<BazaarEvent>((resolve) => {
    if (pendingBuy) pendingBuy.resolve({ type: "purchase", ok: false, error: "superseded" });
    const timer = window.setTimeout(
      () => {
        pendingBuy = null;
        resolve({ type: "purchase", ok: false, error: "timeout" });
      },
      timeoutMs,
    );
    pendingBuy = { productId, resolve, timer };
    bridge.buy(productId, payload);
  });
}

/** Developer payload — ties the receipt to this device for support. */
export function purchasePayload(packId: string): string {
  try {
    return `cm|${packId}|${getDeviceId().slice(0, 18)}`;
  } catch {
    return `cm|${packId}`;
  }
}

// ----------------------------------------------------------------- restore
function lang(): Lang {
  return useGame.getState().language ?? "fa";
}

function tt(key: string): string {
  return STRINGS[lang()][key] ?? key;
}

function grantCoins(productId: string): number {
  const amount = BAZAAR_PRODUCTS[productId];
  if (!amount) return 0;
  useGame.getState().addCoins(amount);
  return amount;
}

function onRestore(ev: Extract<BazaarEvent, { type: "restore" }>): void {
  const list = (ev.purchases ?? []).filter(
    (p) => p.purchaseState === 0 && p.signatureOk !== false && p.token,
  );
  const done = grantedTokens();
  for (const p of list) {
    if (!done.has(p.token)) {
      const amount = grantCoins(p.productId);
      markGranted(p.token);
      if (amount > 0) {
        toast(`${tt("pack_restored")} +${amount.toLocaleString("en-US")}`, "success");
      }
    }
    // getPurchases only reports UNCONSUMED items — consume them all so the
    // user can buy the same pack again.
    try {
      window.ColorManorBridge?.consume(p.token);
    } catch { /* retried on next restore */ }
  }
}

/** Called once on app mount (page.tsx) — restores unfinished purchases. */
export function initBazaar(): void {
  if (!isNativeApp()) return;
  ensureListener();
  // give the native side a moment to bind, then pull unconsumed purchases
  window.setTimeout(() => {
    try {
      window.ColorManorBridge?.restore();
    } catch { /* ignore */ }
  }, 2500);
}
