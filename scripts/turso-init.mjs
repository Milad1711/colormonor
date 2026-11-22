#!/usr/bin/env node
/**
 * turso-init.mjs — one-shot table creation for the Turso (libSQL) database.
 *
 * Usage (from the project root):
 *   TURSO_DATABASE_URL=libsql://<your-db>.turso.io TURSO_AUTH_TOKEN=<token> bun scripts/turso-init.mjs
 *
 * Creates the Player + Grant tables IF NOT EXISTS — safe to re-run.
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(here, "..", "prisma", "turso-init.sql");

const url = process.env.TURSO_DATABASE_URL?.trim();
const token = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url) {
  console.error(
    "✗ TURSO_DATABASE_URL is missing.\n" +
      "  Get both values from: turso db show <name>  and  turso db tokens create <name>\n" +
      "  then run: TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... bun scripts/turso-init.mjs",
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");

console.log(`→ connecting to ${url.replace(/\/\/.*@/, "//***@")}`);
const client = createClient({ url, authToken: token || undefined });

const statements = sql
  .split(";")
  .map((s) =>
    s
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter((s) => s.length > 0);

let created = 0;
for (const stmt of statements) {
  await client.execute(stmt);
  created += 1;
}

const check = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Player','Grant')",
);
console.log(`✓ executed ${created} statements`);
console.log(
  "✓ tables present:",
  check.rows.map((r) => r.name).join(", "),
);
client.close();
