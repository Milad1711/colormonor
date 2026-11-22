import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { adminDenied, adminKeyOk, cleanDeviceId } from "@/lib/admin";

/** Admin player lookup by device id — profile + grant history. */
export async function GET(req: Request) {
  if (!adminKeyOk(req)) return adminDenied();
  const url = new URL(req.url);
  const deviceId = cleanDeviceId(url.searchParams.get("deviceId"));
  if (!deviceId) {
    return NextResponse.json({ ok: false, error: "deviceId required" }, { status: 400 });
  }
  try {
    await dbReady;
    const player = await db.player.findUnique({ where: { deviceId } });
    const grants = await db.grant.findMany({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    return NextResponse.json({
      ok: true,
      player: player
        ? {
            deviceId: player.deviceId,
            name: player.name,
            coins: player.coins,
            stars: player.stars,
            levelsCleared: player.levelsCleared,
            score: player.score,
            currentLevel: player.currentLevel,
            updatedAt: player.updatedAt,
          }
        : null,
      grants,
    });
  } catch (e) {
    console.error("admin/player error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
