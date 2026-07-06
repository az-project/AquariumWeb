// server.js:293-297 이식 — 세션 상태 조회
import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";

export async function GET() {
  const username = await getSessionUsername();
  return NextResponse.json(
    username ? { authenticated: true, username } : { authenticated: false },
    { headers: { "Cache-Control": "no-store" } }
  );
}
