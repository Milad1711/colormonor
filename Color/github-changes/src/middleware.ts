import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS for /api/* — the Android APK serves the game from its private
 * appassets origin, so its calls to the live API are cross-origin.
 * All /api endpoints are public game services (admin routes are guarded
 * by the ADMIN_KEY header), so a permissive CORS policy is safe here.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
  "Access-Control-Max-Age": "86400",
};

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
