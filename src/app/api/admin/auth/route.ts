import { NextResponse } from "next/server";
import { expectedAdminKey } from "@/lib/admin";

/** Admin login — verifies the key and echoes back a simple ok. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  if (key.length > 0 && key === expectedAdminKey()) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "wrong key" }, { status: 401 });
}
