"use client";

/**
 * Online services layer — leaderboard + admin coin gifts.
 * Everything here is fire-and-forget safe: if the server is unreachable
 * the game keeps working perfectly from local storage.
 */

import { useGame } from "./store";
import { getDeviceId } from "./device";
import { getApiBase } from "./api-base";
import { t, type Lang } from "./i18n";
import { toast } from "@/components/game/toast";

export interface LeaderRow {
  rank: number;
  deviceId: string;
  name: string | null;
  score: number;
  stars: number;
  levelsCleared: number;
}

export interface SyncResult {
  ok: boolean;
  rank: number;
  total: number;
}

let lastSync = 0;
let syncing = false;
let claimResync: ReturnType<typeof setTimeout> | null = null;

/** Score formula shared with the server: stars*100 + levels*20. */
export function computeScore(): { score: number; stars: number; levelsCleared: number } {
  const s = useGame.getState();
  const recs = Object.values(s.levels);
  const stars = recs.reduce((sum, r) => sum + r.stars, 0);
  const levelsCleared = recs.length;
  return { score: stars * 100 + levelsCleared * 20, stars, levelsCleared };
}

/** Auto display name when the player has not chosen one. */
export function autoName(): string {
  const id = getDeviceId();
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
  return `P-${tail}`;
}

/**
 * Push local progress to the server; pull rank + pending coin gifts.
 * Throttled to one call per 4s unless `force`.
 */
export async function syncNow(force = false): Promise<SyncResult | null> {
  if (typeof window === "undefined") return null;
  const now = Date.now();
  if (syncing || (!force && now - lastSync < 4000)) return null;
  const s = useGame.getState();
  if (!s.language) return null; // language picker still showing
  syncing = true;
  lastSync = now;
  try {
    const { score, stars, levelsCleared } = computeScore();
    const res = await fetch(getApiBase() + "/api/player/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        name: s.playerName ?? autoName(),
        coins: s.coins,
        stars,
        levelsCleared,
        score,
        currentLevel: s.currentLevel,
      }),
    });
    const data = await res.json();
    if (!data?.ok) return null;

    // ---- admin coin gifts ----
    const grants: { id: string; amount: number; reason: string }[] = data.pendingGrants ?? [];
    if (grants.length > 0) {
      const total = grants.reduce((sum, g) => sum + g.amount, 0);
      if (total !== 0) {
        useGame.getState().addCoins(total);
        const lang: Lang = useGame.getState().language ?? "fa";
        toast(`${t(lang, "gift_received")} +${total}`, "success");
      }
      fetch(getApiBase() + "/api/player/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId(), ids: grants.map((g) => g.id) }),
      }).catch(() => {});
      // report the updated wallet balance shortly after claiming
      if (claimResync) clearTimeout(claimResync);
      claimResync = setTimeout(() => syncNow(true), 900);
    }

    return { ok: true, rank: data.rank ?? 0, total: data.total ?? 0 };
  } catch {
    return null; // offline — ignore silently
  } finally {
    syncing = false;
  }
}

export async function fetchLeaderboard(): Promise<LeaderRow[]> {
  try {
    const res = await fetch(getApiBase() + "/api/leaderboard", { cache: "no-store" });
    const data = await res.json();
    return data?.ok && Array.isArray(data.players) ? data.players : [];
  } catch {
    return [];
  }
}
