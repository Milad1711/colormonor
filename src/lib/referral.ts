import { db } from "@/lib/db";

/**
 * Referral program helpers.
 * Every player gets a short invite code (derived from the device id, made
 * unique server-side). When a player enters a friend's code for the first
 * time, BOTH sides receive a coin grant (claimed on the next sync).
 */

export const REFERRAL_REWARD = 300;
export const REFERRAL_REASON_INVITE = "referral-invite";
export const REFERRAL_REASON_JOIN = "referral-join";

/** Human-friendly 6-char code derived from a device id. */
export function deriveCode(deviceId: string): string {
  const tail = deviceId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (tail.slice(-6) || "MANOR0").slice(-8);
}

/**
 * Lazily assign a unique refCode to a player row.
 * Collisions fall back to an incrementing numeric suffix.
 */
export async function ensureRefCode(player: { id: string; deviceId: string; refCode: string | null }): Promise<string> {
  if (player.refCode) return player.refCode;
  const base = deriveCode(player.deviceId);
  for (let i = 0; i < 40; i++) {
    const code = i === 0 ? base : `${base.slice(0, 5)}${i}`;
    const clash = await db.player.findFirst({ where: { refCode: code, id: { not: player.id } } });
    if (!clash) {
      await db.player.update({ where: { id: player.id }, data: { refCode: code } });
      return code;
    }
  }
  // extremely unlikely fallback: random suffix
  const code = `${base.slice(0, 4)}${Math.floor(Math.random() * 900 + 100)}`;
  await db.player.update({ where: { id: player.id }, data: { refCode: code } });
  return code;
}
