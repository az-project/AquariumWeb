// 세션: 기존 인메모리 Map(server.js:86-114) → iron-session 암호화 stateless 쿠키.
// 쿠키명/수명/속성은 기존과 동일. 서버 재시작 시 세션 소멸 문제가 해소된다.
// Phase 2에서 Supabase Auth로 전환 시 이 파일만 교체.
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  username?: string;
}

const SESSION_COOKIE_NAME = "aquarium_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// iron-session은 32자 이상 비밀키가 필수. 운영에서는 반드시 SESSION_SECRET 주입.
const DEV_FALLBACK_SECRET = "aquarium-dev-session-secret-do-not-use-in-prod";

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] SESSION_SECRET이 설정되지 않았습니다. 배포 환경에서는 반드시 설정하세요.");
  }
  return DEV_FALLBACK_SECRET;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), {
    password: sessionSecret(),
    cookieName: SESSION_COOKIE_NAME,
    ttl: SESSION_MAX_AGE_SECONDS,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: /^true$/i.test(process.env.COOKIE_SECURE || ""),
      maxAge: SESSION_MAX_AGE_SECONDS
    }
  });
}

/** 로그인된 사용자명. 미로그인 시 null. */
export async function getSessionUsername(): Promise<string | null> {
  const session = await getSession();
  return session.username || null;
}
