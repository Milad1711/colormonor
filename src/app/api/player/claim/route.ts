import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { cleanDeviceId } from "@/lib/admin";

/**
 * Claim coin grants. The client applies pending grant amounts to its
 * local wallet and then acknowledges them here, so the same gift is
 * never applied twice.
 */
export async function POST(req: Request) {
  try {
    await dbReady;
    const body = await req.json().catch(() => null);
    const deviceId = cleanDeviceId(body?.deviceId);
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((x: unknown) => typeof x === "string").slice(0, 30)
      : [];
    if (!deviceId || ids.length === 0) {
      return NextResponse.json({ ok: false, error: "deviceId and ids required" }, { status: 400 });
    }

    const grants = await db.grant.findMany({
      where: { id: { in: ids }, deviceId, claimed: false },
      select: { id: true, amount: true },
    });
    const claimedAmount = grants.reduce((s, g) => s + g.amount, 0);

    if (grants.length > 0) {
      await db.grant.updateMany({
        where: { id: { in: grants.map((g) => g.id) } },
        data: { claimed: true, claimedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, claimed: claimedAmount, count: grants.length });
  } catch (e) {
    console.error("player/claim error", e);
    return NextResponse.json({ ok: false, error: "claim failed" }, { status: 500 });
  }
}
