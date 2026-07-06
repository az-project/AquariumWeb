// server.js:314-348 이식 — 공유 상태 GET/PUT (세션 필수, 401 계약 유지)
// 방어 강화: PUT 최소 스키마 검증(400), 파싱 실패 500, 백업 로테이션은 스토어에서 수행.
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { getStateStore, StateParseError, StateValidationError } from "@/lib/storage";

const noStore = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 2 * 1024 * 1024;

export async function GET() {
  if (!(await getSessionUsername())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }

  try {
    const state = await getStateStore().read();
    return NextResponse.json(state, { headers: noStore });
  } catch (error) {
    if (error instanceof StateParseError) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
    }
    const message = error instanceof Error ? error.message : "Read failed";
    return NextResponse.json({ error: message }, { status: 500, headers: noStore });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await getSessionUsername())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: noStore });
  }

  let state: unknown;
  try {
    state = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: noStore });
  }

  try {
    await getStateStore().write(state);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    if (error instanceof StateValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: noStore });
    }
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500, headers: noStore });
  }
}
