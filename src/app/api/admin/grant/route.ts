import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { adminDenied, adminKeyOk, cleanDeviceId, clampInt } from "@/lib/admin";

/**
 * Issue a coin grant for one device.
 * mode "add": amount is added to the player's wallet on their next sync.
 * mode "set": the server computes the delta needed to reach `amount`
 *             (based on the coins last reported by the client).
 * If the device has never synced, a shell player row is created so the
 * grant is waiting when the device first connects.
 */
export async function POST(req: Request) {
  if (!adminKeyOk(req)) return adminDenied();
  try {
    await dbReady;
    const body = await req.json().catch(() => null);
    const deviceId = cleanDeviceId(body?.deviceId);
    const amount = clampInt(body?.amount, -1_000_000, 1_000_000, 0);
    const mode = body?.mode === "set" ? "set" : "add";
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().slice(0, 120) : "";
    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "deviceId required" }, { status: 400 });
    }
    if (amount === 0) {
      return NextResponse.json({ ok: false, error: "amount is zero" }, { status: 400 });
    }

    let player = await db.player.findUnique({ where: { deviceId } });
    if (!player) {
      player = await db.player.create({ data: { deviceId } });
    }

    let delta = amount;
    if (mode === "set") {
      delta = amount - player.coins;
      if (delta === 0) {
        return NextResponse.json({ ok: false, error: "already at that amount" }, { status: 400 });
      }
    }

    const grant = await db.grant.create({
      data: { deviceId, amount: delta, reason: mode === "set" ? `set → ${amount}${reason ? " · " + reason : ""}` : reason },
    });

    return NextResponse.json({ ok: true, grant: { id: grant.id, amount: grant.amount } });
  } catch (e) {
    console.error("admin/grant error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}

/** Recent grants across all players. */
export async function GET(req: Request) {
  if (!adminKeyOk(req)) return adminDenied();
  try {
    await dbReady;
    const grants = await db.grant.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { player: { select: { name: true } } },
    });
    return NextResponse.json({
      ok: true,
      grants: grants.map((g) => ({
        id: g.id,
        deviceId: g.deviceId,
        playerName: g.player?.name ?? null,
        amount: g.amount,
        reason: g.reason,
        claimed: g.claimed,
        createdAt: g.createdAt,
      })),
    });
  } catch (e) {
    console.error("admin/grants list error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
