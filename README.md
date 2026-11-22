# عمارت رنگین — Color Manor

A mobile-first hybrid-casual game: **Water Sort puzzle × Manor Renovation**, fully playable offline, bilingual (فارسی RTL / English LTR), with online leaderboards.

## Play

- Live URL: deploy to Vercel following [README-DEPLOY-FA.md](./README-DEPLOY-FA.md)
- Local dev: `npm install` → `cp .env.example .env` → `npm run db:push` → `npm run dev`

## Features

- **110 solver-verified levels** with per-level guide panels
- **3D WebGL tube board** — liquids stack in exact slots, zero drift; 1–5 tubes in one row, 6+ in two clearly separated rows
- **16 renovation areas** (7 original + 5 interior rooms + 4 yard buildings) unlocked by stars
- **94 shop items × 3 variants** across 5 categories, each labeled with its target room and exact placement (floor / wall / window / ceiling)
- **Economy**: stars + coins, daily lucky wheel, 3 coin packs, referral rewards
- **Online layer**: leaderboard, admin panel (`/admin`, `ADMIN_KEY` gated) with Device-ID coin grants — all fire-and-forget safe
- **Persistence**: full localStorage save + optional server sync; language switch never loses progress

## Tech

Next.js 16 · React 19 · TypeScript · Three.js · Tailwind 4 · Prisma 6 (SQLite / Turso libSQL) · Zustand

## Database

`src/lib/db.ts` picks automatically:
- `TURSO_DATABASE_URL` set → cloud database (Turso/libSQL over HTTP — serverless-safe)
- otherwise → local SQLite file (development)

Initialize Turso tables: `turso db shell <db> < prisma/turso-init.sql` (or `npm run db:turso-init`).
Health check: `TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… bun scripts/smoke-test.mjs`

## Deploy

Full step-by-step (Persian), including GitHub Desktop line-by-line: **[README-DEPLOY-FA.md](./README-DEPLOY-FA.md)**
