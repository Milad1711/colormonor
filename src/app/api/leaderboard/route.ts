import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";

/**
 * Public leaderboard — top 100 players by score.
 * Score = stars*100 + levelsCleared*20 (reported by the client).
 */
export async function GET() {
  try {
    await dbReady;
    const players = await db.player.findMany({
      where: { score: { gt: 0 } },
      orderBy: [{ score: "desc" }, { stars: "desc" }, { updatedAt: "asc" }],
      take: 100,
      select: {
        deviceId: true,
        name: true,
        score: true,
        stars: true,
        levelsCleared: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      ok: true,
      players: players.map((p, i) => ({ ...p, rank: i + 1 })),
    });
  } catch (e) {
    console.error("leaderboard error", e);
    return NextResponse.json({ ok: false, players: [] }, { status: 500 });
  }
}
