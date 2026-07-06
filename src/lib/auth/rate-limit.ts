// server.js:185-212 이식 — IP당 10분 내 8회 로그인 실패 시 차단.
// 인메모리(단일 컨테이너 전제). Phase 2에서 분산 환경으로 가면 재검토.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

export function clientKeyFromHeaders(headers: Headers, fallback = "unknown"): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0];
  return (ip || fallback).trim();
}

export function isLoginLimited(clientKey: string): boolean {
  const attempt = loginAttempts.get(clientKey);
  if (!attempt || attempt.resetAt <= Date.now()) return false;
  return attempt.count >= MAX_ATTEMPTS;
}

export function recordLoginFailure(clientKey: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(clientKey);
  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  attempt.count += 1;
}

export function clearLoginFailures(clientKey: string): void {
  loginAttempts.delete(clientKey);
}
