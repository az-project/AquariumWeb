// server.js:214-241 이식 — 로그인 (상태코드/에러 메시지 계약 유지)
import { NextResponse, type NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { clearLoginFailures, clientKeyFromHeaders, isLoginLimited, recordLoginFailure } from "@/lib/auth/rate-limit";
import { getSession } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/validate";
import { getUserStore } from "@/lib/storage";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const clientKey = clientKeyFromHeaders(request.headers);
  if (isLoginLimited(clientKey)) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429, headers: noStore });
  }

  try {
    const credentials = await request.json().catch(() => ({}));
    const username = normalizeUsername(credentials.username);
    const user = await getUserStore().findByUsernameKey(username.toLowerCase());
    if (!user || !verifyPassword(String(credentials.password || ""), user)) {
      recordLoginFailure(clientKey);
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401, headers: noStore });
    }

    clearLoginFailures(clientKey);
    const session = await getSession();
    session.username = user.username;
    await session.save();
    return NextResponse.json({ ok: true, username: user.username }, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500, headers: noStore });
  }
}
