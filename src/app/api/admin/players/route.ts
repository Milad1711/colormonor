import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminDenied, adminKeyOk } from "@/lib/admin";

/** Admin overview — recent players + server totals. */
export async function GET(req: Request) {
  if (!adminKeyOk(req)) return adminDenied();
  try {
    const [players, totalPlayers, totalGrants, grantedSum] = await Promise.all([
      db.player.findMany({
        orderBy: { updatedAt: "desc" },
        take: 60,
      }),
      db.player.count(),
      db.grant.count(),
      db.grant.aggregate({ _sum: { amount: true } }),
    ]);
    return NextResponse.json({
      ok: true,
      totalPlayers,
      totalGrants,
      grantedSum: grantedSum._sum.amount ?? 0,
      players: players.map((p) => ({
        deviceId: p.deviceId,
        name: p.name,
        coins: p.coins,
        stars: p.stars,
        levelsCleared: p.levelsCleared,
        score: p.score,
        currentLevel: p.currentLevel,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (e) {
    console.error("admin/players error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
