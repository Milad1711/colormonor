/**
 * DDL statements for the online-services tables (Player + Grant).
 *
 * Mirrors prisma/turso-init.sql 1:1. Used by src/lib/db.ts to AUTO-CREATE
 * the schema on first use when the app runs against Turso/libSQL (Vercel),
 * so no manual CLI step is needed after deploying.
 *
 * Every statement is IF NOT EXISTS — idempotent, safe to re-run any time.
 */
export const SCHEMA_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "levelsCleared" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "refCode" TEXT,
    "refBy" TEXT,
    "refClaimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "Grant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME,
    CONSTRAINT "Grant_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Player" ("deviceId") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Player_deviceId_key" ON "Player"("deviceId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Player_refCode_key" ON "Player"("refCode")`,
  `CREATE INDEX IF NOT EXISTS "Grant_deviceId_idx" ON "Grant"("deviceId")`,
];
