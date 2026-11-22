import { NextResponse } from "next/server";

/**
 * Admin authentication helper. The panel sends the key in the
 * `x-admin-key` header; it must match ADMIN_KEY from the environment
 * (with a safe default so the panel works out of the box).
 */
export function expectedAdminKey(): string {
  return process.env.ADMIN_KEY || "manor-admin-1404";
}

export function adminKeyOk(req: Request): boolean {
  const got = req.headers.get("x-admin-key") ?? "";
  return got.length > 0 && got === expectedAdminKey();
}

export function adminDenied() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/** Clamp an incoming number into a safe integer range. */
export function clampInt(v: unknown, min: number, max: number, dflt = 0): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
}

/** Sanitize a device id coming from the wild. */
export function cleanDeviceId(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, 64);
  return s.length >= 6 ? s : null;
}
