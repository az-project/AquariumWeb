// server.js:123-137 이식 — 에러 메시지(한국어)는 클라이언트 표시 계약이므로 유지.
export function normalizeUsername(username = ""): string {
  return String(username).trim();
}

export function validateUsername(username: string): string {
  if (!/^[A-Za-z0-9_.-]{3,32}$/.test(username)) {
    return "아이디는 영문, 숫자, 점, 밑줄, 하이픈으로 3~32자까지 입력하세요.";
  }
  return "";
}

export function validatePassword(password = ""): string {
  if (String(password).length < 6) return "비밀번호는 6자 이상 입력하세요.";
  return "";
}
