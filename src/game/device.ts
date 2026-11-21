"use client";

/**
 * Stable per-device identity used for the leaderboard and the admin
 * coin-gift system. Generated once, persisted in localStorage.
 */

const KEY = "color-manor-device-id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    const uuid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    id = `cm-${uuid}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

/** Short human-friendly suffix (used for auto player names). */
export function deviceIdTail(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
}
