// server.js:116-150 이식 — 파라미터를 절대 바꾸지 말 것.
// (pbkdf2-sha256 / 120000 iterations / salt 16B / key 32B)
// 바꾸면 기존 data/users.json 계정이 로그인 불가가 된다.
import crypto from "node:crypto";
import type { StoredUser } from "@/lib/storage/types";

const ITERATIONS = 120000;

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function hashPassword(password: string): StoredUser["password"] {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, ITERATIONS, 32, "sha256").toString("hex");
  return { algorithm: "pbkdf2-sha256", iterations: ITERATIONS, salt, hash };
}

export function verifyPassword(password: string, user: StoredUser | null): boolean {
  if (!user?.password?.salt || !user.password.hash) return false;
  const iterations = Number(user.password.iterations || ITERATIONS);
  const hash = crypto.pbkdf2Sync(String(password), user.password.salt, iterations, 32, "sha256").toString("hex");
  return timingSafeEqualStrings(hash, user.password.hash);
}
