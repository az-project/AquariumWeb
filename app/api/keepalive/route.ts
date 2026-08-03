// Supabase 무료 티어는 7일 미사용 시 프로젝트를 자동 일시정지시킨다 (2026-08-03 실제 발생:
// 로그인·MCP OAuth 전면 장애). Vercel Cron이 매일 이 라우트를 호출해 가벼운 조회로
// 활동을 기록하여 일시정지를 방지한다. vercel.json의 crons 설정과 쌍으로 동작한다.
import { NextResponse } from "next/server";
import { getUserStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  // Vercel Cron은 CRON_SECRET 환경변수가 있으면 Authorization 헤더로 보내준다.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }

  try {
    await getUserStore().findByUsernameKey("__keepalive__");
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "keepalive failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: noStore });
  }
}
