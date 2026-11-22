import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { clampInt, cleanDeviceId } from "@/lib/admin";
import { ensureRefCode } from "@/lib/referral";

/**
 * Player sync — the game client reports its local progress and receives
 * its leaderboard rank plus any coin grants the admin has issued for
 * this device (not yet claimed). Fully offline-safe: failures are
 * ignored by the client.
 */
export async function POST(req: Request) {
  try {
    await dbReady;
    const body = await req.json().catch(() => null);
    const deviceId = cleanDeviceId(body?.deviceId);
    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "deviceId required" }, { status: 400 });
    }

    const coins = clampInt(body?.coins, 0, 10_000_000, 0);
    const stars = clampInt(body?.stars, 0, 50_000, 0);
    const levelsCleared = clampInt(body?.levelsCleared, 0, 10_000, 0);
    const score = clampInt(body?.score, 0, 10_000_000, stars * 100 + levelsCleared * 20);
    const currentLevel = clampInt(body?.currentLevel, 1, 10_000, 1);
    const name =
      typeof body?.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 24)
        : null;

    const player = await db.player.upsert({
      where: { deviceId },
      create: { deviceId, name, coins, stars, levelsCleared, score, currentLevel },
      update: { name: name ?? undefined, coins, stars, levelsCleared, score, currentLevel },
    });
    // lazily give every player their unique invite code (no-op once set)
    await ensureRefCode(player);

    const pending = await db.grant.findMany({
      where: { deviceId, claimed: false },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { id: true, amount: true, reason: true },
    });

    const [better, total] = await Promise.all([
      db.player.count({ where: { score: { gt: player.score } } }),
      db.player.count(),
    ]);

    return NextResponse.json({
      ok: true,
      rank: better + 1,
      total,
      pendingGrants: pending,
    });
  } catch (e) {
    console.error("player/sync error", e);
    return NextResponse.json({ ok: false, error: "sync failed" }, { status: 500 });
  }
}
