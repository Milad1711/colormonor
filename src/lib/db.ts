import { PrismaClient } from "@prisma/client";

/**
 * Database layer — dual mode:
 *
 *  1) LOCAL DEV  (no TURSO_DATABASE_URL set):
 *     Standard PrismaClient over the bundled SQLite engine, using
 *     DATABASE_URL (e.g. file:./db/custom.db).
 *
 *  2) PRODUCTION — Vercel + Turso (TURSO_DATABASE_URL set):
 *     PrismaClient runs through the libSQL driver adapter
 *     (@prisma/adapter-libsql + @libsql/client) and talks HTTP to the
 *     Turso cloud database. Serverless-safe: no native engine, no
 *     filesystem needed.
 *
 * The client instance is cached on globalThis in development so Next.js
 * hot reloads do not open a connection per module reload.
 */

type PrismaClientLike = PrismaClient<never, never>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientLike | undefined;
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

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
