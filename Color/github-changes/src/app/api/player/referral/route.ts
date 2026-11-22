import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db";
import { clampInt, cleanDeviceId } from "@/lib/admin";
import { ensureRefCode, REFERRAL_REWARD, REFERRAL_REASON_INVITE, REFERRAL_REASON_JOIN } from "@/lib/referral";

/**
 * Referral program.
 * GET  ?deviceId=…            → the player's invite code + join status
 * POST { deviceId, code }     → join via a friend's code: both get coins
 *                               (issued as pending grants, claimed on sync)
 */
export async function GET(req: Request) {
  try {
    await dbReady;
    const url = new URL(req.url);
    const deviceId = cleanDeviceId(url.searchParams.get("deviceId"));
    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "deviceId required" }, { status: 400 });
    }
    const player = await db.player.upsert({
      where: { deviceId },
      create: { deviceId },
      update: {},
    });
    const code = await ensureRefCode(player);
    return NextResponse.json({
      ok: true,
      code,
      claimed: player.refClaimedAt !== null,
      reward: REFERRAL_REWARD,
    });
  } catch (e) {
    console.error("referral GET error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbReady;
    const body = await req.json().catch(() => null);
    const deviceId = cleanDeviceId(body?.deviceId);
    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "deviceId required" }, { status: 400 });
    }
    const rawCode = typeof body?.code === "string" ? body.code.trim().toUpperCase().slice(0, 12) : "";
    if (!/^[A-Z0-9]{4,12}$/.test(rawCode)) {
      return NextResponse.json({ ok: false, error: "bad-code" }, { status: 400 });
    }

    const joiner = await db.player.upsert({
      where: { deviceId },
      create: { deviceId },
      update: {},
    });

    if (joiner.refClaimedAt) {
      return NextResponse.json({ ok: false, error: "already-joined" }, { status: 409 });
    }

    const ownCode = await ensureRefCode(joiner);
    if (rawCode === ownCode) {
      return NextResponse.json({ ok: false, error: "self-code" }, { status: 400 });
    }

    const inviter = await db.player.findUnique({ where: { refCode: rawCode } });
    if (!inviter || inviter.deviceId === joiner.deviceId) {
      return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
    }

    // one coin grant for each side — claimed on the player's next sync
    const reward = clampInt(REFERRAL_REWARD, 1, 100_000, REFERRAL_REWARD);
    await db.$transaction([
      db.grant.create({
        data: { deviceId: inviter.deviceId, amount: reward, reason: REFERRAL_REASON_INVITE },
      }),
      db.grant.create({
        data: { deviceId: joiner.deviceId, amount: reward, reason: REFERRAL_REASON_JOIN },
      }),
      db.player.update({
        where: { id: joiner.id },
        data: { refBy: inviter.deviceId, refClaimedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true, amount: reward });
  } catch (e) {
    console.error("referral POST error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
