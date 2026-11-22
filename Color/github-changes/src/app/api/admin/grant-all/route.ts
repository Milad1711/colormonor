import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { adminDenied, adminKeyOk, clampInt } from "@/lib/admin";

/** Broadcast a coin gift to every known player at once. */
export async function POST(req: Request) {
  if (!adminKeyOk(req)) return adminDenied();
  try {
    await dbReady;
    const body = await req.json().catch(() => null);
    const amount = clampInt(body?.amount, 1, 1_000_000, 0);
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 120) : "";
    if (amount <= 0) {
      return NextResponse.json({ ok: false, error: "amount must be positive" }, { status: 400 });
    }
    const players = await db.player.findMany({ select: { deviceId: true }, take: 5000 });
    if (players.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }
    await db.grant.createMany({
      data: players.map((p) => ({ deviceId: p.deviceId, amount, reason: reason || "broadcast" })),
    });
    return NextResponse.json({ ok: true, sent: players.length });
  } catch (e) {
    console.error("admin/grant-all error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
