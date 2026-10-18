// iOS 단축어(시리)용 수질 기록 엔드포인트. OAuth 대신 고정 토큰(REEFLOG_SHORTCUT_TOKEN)으로 인증한다.
// 응답의 message는 단축어가 그대로 읽어 줄 수 있는 문장이다.
import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { bearerTokenFromRequest } from "@/lib/auth/oauth";
import { mergeWaterLogValues } from "@/lib/mcp/reef-log";
import {
  describeValues,
  FIELD_LABELS,
  parseQuickLogText,
  todayInTimeZone,
  type ParsedQuickLog,
  type WaterLogField
} from "@/lib/shortcut/quick-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 16 * 1024;

function reply(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: noStore });
}

// Vercel 환경변수나 단축어 헤더에 복사·붙여넣기로 섞여 들어간 공백, 따옴표를 무시한다.
function cleanToken(value: string): string {
  return value.trim().replace(/^["']+|["']+$/g, "").trim();
}

function tokenMatches(token: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(token).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function numericFields(body: Record<string, unknown>): ParsedQuickLog["values"] {
  const values: ParsedQuickLog["values"] = {};
  for (const field of Object.keys(FIELD_LABELS) as WaterLogField[]) {
    const raw = body[field];
    if (raw === undefined || raw === null || raw === "") continue;
    const number = Number(raw);
    if (Number.isFinite(number)) values[field] = number;
  }
  return values;
}

export async function POST(request: NextRequest) {
  const expected = cleanToken(process.env.REEFLOG_SHORTCUT_TOKEN || "");
  if (!expected) {
    return reply(503, { ok: false, message: "단축어 토큰이 서버에 설정되지 않았어요." });
  }
  const token = cleanToken(bearerTokenFromRequest(request) || request.headers.get("x-reeflog-token") || "");
  if (!token || !tokenMatches(token, expected)) {
    return reply(401, { ok: false, message: "인증에 실패했어요. 단축어의 토큰을 확인해 주세요." });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return reply(413, { ok: false, message: "요청이 너무 커요." });
  }
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw || "{}");
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return reply(400, { ok: false, message: "요청 형식이 올바르지 않아요." });
  }

  const today = todayInTimeZone(process.env.REEFLOG_TIMEZONE || "Asia/Seoul");
  const text = typeof body.text === "string" ? body.text : "";
  const parsed = text ? parseQuickLogText(text, today) : { values: {} };
  const values = { ...parsed.values, ...numericFields(body) };
  const bodyDate = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : undefined;
  const date = bodyDate || parsed.date || today;

  if (!Object.keys(values).length) {
    return reply(400, {
      ok: false,
      message: text ? `"${text}"에서 수치를 찾지 못했어요. 예: 인산염 0.01 질산염 3` : "저장할 수치가 없어요."
    });
  }

  try {
    const tankId = typeof body.tankId === "string" ? body.tankId : undefined;
    const log = await mergeWaterLogValues(date, values, tankId);
    const dayLabel = date === today ? "오늘" : date;
    return reply(200, { ok: true, message: `${dayLabel} ${describeValues(values)} 저장했어요.`, date, values, log });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return reply(500, { ok: false, message: `저장에 실패했어요. ${message}` });
  }
}
