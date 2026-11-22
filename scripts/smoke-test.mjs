#!/usr/bin/env node
/**
 * smoke-test.mjs — verifies the exact production code path used on Vercel:
 * PrismaClient + @prisma/adapter-libsql talking through libSQL.
 *
 *   TURSO_DATABASE_URL=file:db/turso-test.db bun scripts/smoke-test.mjs
 */

import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("set TURSO_DATABASE_URL (file:... or libsql://...)");
  process.exit(1);
}

const adapter = new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
const prisma = new PrismaClient({ adapter });

const device = "smoke-" + Date.now();

const created = await prisma.player.create({
  data: {
    deviceId: device,
    name: "SmokeTest",
    coins: 500,
    stars: 30,
    levelsCleared: 12,
    score: 5400,
    currentLevel: 13,
  },
});
console.log("created:", created.deviceId, "coins:", created.coins, "stars:", created.stars);

const grant = await prisma.grant.create({
  data: { deviceId: device, amount: 250, reason: "smoke test" },
});
console.log("grant created:", grant.id.slice(0, 8) + "…", "amount:", grant.amount);

const found = await prisma.player.findUnique({
  where: { deviceId: device },
  include: { grants: true },
});
console.log("readback ok:", found.deviceId === device, "grants:", found.grants.length);

const all = await prisma.player.findMany({ orderBy: { score: "desc" }, take: 5 });
console.log("top players:", all.map((p) => `${p.name}:${p.score}`).join(", "));

await prisma.player.delete({ where: { deviceId: device } });
console.log("cleanup ok — SMOKE TEST PASSED");
await prisma.$disconnect();
