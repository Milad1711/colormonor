import { PrismaClient } from "@prisma/client";
import { SCHEMA_DDL } from "./schema-ddl";

/**
 * Database layer — dual mode:
 *
 *  1) LOCAL DEV  (no TURSO_DATABASE_URL set):
 *     Standard PrismaClient over the bundled SQLite engine, using
 *     DATABASE_URL (e.g. file:./db/custom.db). Schema is managed with
 *     `prisma db push` — no runtime DDL needed.
 *
 *  2) PRODUCTION — Vercel + Turso (TURSO_DATABASE_URL set):
 *     PrismaClient runs through the libSQL driver adapter
 *     (@prisma/adapter-libsql + @libsql/client) and talks HTTP to the
 *     Turso cloud database. Serverless-safe: no native engine, no
 *     filesystem needed.
 *     On cold start the module also AUTO-CREATES the Player/Grant tables
 *     (IF NOT EXISTS — idempotent), so a fresh Turso database just works:
 *     deploy → first API call → tables appear. No CLI required.
 *
 * Routes `await dbReady` before their first query so the very first
 * request after a cold start also sees the schema.
 *
 * The client instance is cached on globalThis in development so Next.js
 * hot reloads do not open a connection per module reload.
 */

type PrismaClientLike = PrismaClient<never, never>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientLike | undefined;
  dbReady: Promise<void> | undefined;
};

function createClient(): PrismaClientLike {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl) {
    // Production path: Turso (or any libSQL server) over HTTP.
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken || undefined,
    });
    return new PrismaClient({
      adapter,
      log: ["error", "warn"],
    }) as PrismaClientLike;
  }

  // Local path: native SQLite engine from DATABASE_URL (see .env).
  return new PrismaClient({
    log: ["error", "warn"],
  }) as PrismaClientLike;
}

/**
 * One-shot schema creation for the libSQL path (Turso on Vercel).
 * Resolves immediately in local dev (schema handled by prisma db push).
 */
function ensureSchema(): Promise<void> {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (!tursoUrl) return Promise.resolve();

  return (async () => {
    const { createClient } = require("@libsql/client");
    const ddl = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
    try {
      for (const stmt of SCHEMA_DDL) await ddl.execute(stmt);
      console.log("[db] schema ready — Player + Grant tables present");
    } finally {
      ddl.close();
    }
  })().catch((e: unknown) => {
    console.error(
      "[db] FAILED to auto-create schema — check TURSO_DATABASE_URL and " +
        "TURSO_AUTH_TOKEN environment variables:",
      e instanceof Error ? e.message : e,
    );
    throw e;
  });
}

export const db = globalForPrisma.prisma ?? createClient();

// Awaited by every API route before the first query.
export const dbReady: Promise<void> =
  globalForPrisma.dbReady ?? ensureSchema();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.dbReady = dbReady;
}
