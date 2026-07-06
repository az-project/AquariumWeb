// server.js:243-279 이식 — 회원가입 (400/409/201 계약 및 한국어 메시지 유지)
import { NextResponse, type NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { normalizeUsername, validatePassword, validateUsername } from "@/lib/auth/validate";
import { getUserStore } from "@/lib/storage";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    if (usernameError || passwordError) {
      return NextResponse.json({ error: usernameError || passwordError }, { status: 400, headers: noStore });
    }

    const store = getUserStore();
    if (await store.findByUsernameKey(username.toLowerCase())) {
      return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409, headers: noStore });
    }

    const user = {
      username,
      usernameKey: username.toLowerCase(),
      password: hashPassword(password),
      createdAt: new Date().toISOString()
    };
    await store.create(user);

    const session = await getSession();
    session.username = user.username;
    await session.save();
    return NextResponse.json({ ok: true, username: user.username }, { status: 201, headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500, headers: noStore });
  }
}
