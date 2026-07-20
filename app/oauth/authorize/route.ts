import { NextResponse, type NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { getSession, getSessionUsername } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/validate";
import {
  encodedAuthorizeParams,
  isAllowedRedirectUri,
  issueAuthorizationCode,
  parseAuthorizeParams,
  redirectWithCode,
  redirectWithError,
  type OAuthAuthorizeParams
} from "@/lib/auth/oauth";
import { getUserStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char] || char);
}

function basePage(title: string, body: string): Response {
  return new Response(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef8f5;color:#102321;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:min(440px,calc(100vw - 32px));background:#fff;border:1px solid #dbe7e4;border-radius:18px;box-shadow:0 24px 70px rgba(7,36,34,.14);padding:28px}
    h1{margin:0 0 10px;font-size:28px;line-height:1.15}
    p{margin:0 0 18px;color:#5f7470;line-height:1.55}
    label{display:grid;gap:8px;margin:14px 0;font-weight:700;color:#253b38}
    input{height:46px;border:1px solid #d6e2df;border-radius:12px;padding:0 14px;font:inherit}
    button{width:100%;height:50px;border:0;border-radius:14px;background:linear-gradient(135deg,#12393d,#21bcae);color:white;font-weight:800;font-size:16px;cursor:pointer}
    .muted{font-size:13px;color:#7d918d}
    .error{color:#d93f32;font-weight:700}
    .scope{display:grid;gap:10px;margin:20px 0;padding:16px;background:#f3fbf8;border-radius:14px}
  </style>
</head>
<body><main>${body}</main></body>
</html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function validateParams(params: OAuthAuthorizeParams): string {
  if (params.responseType !== "code") return "지원하지 않는 response_type입니다.";
  if (!params.clientId) return "client_id가 필요합니다.";
  if (!params.redirectUri || !isAllowedRedirectUri(params.redirectUri)) return "redirect_uri가 올바르지 않습니다.";
  if (params.codeChallengeMethod && !["plain", "S256"].includes(params.codeChallengeMethod)) return "지원하지 않는 code_challenge_method입니다.";
  return "";
}

function loginPage(params: OAuthAuthorizeParams, error = ""): Response {
  const query = encodedAuthorizeParams(params);
  return basePage("리프로그 MCP 로그인", `
    <h1>리프로그 로그인</h1>
    <p>MCP 클라이언트 연결을 계속하려면 리프로그 계정으로 로그인하세요.</p>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
    <form method="post" action="/oauth/authorize?${escapeHtml(query)}">
      <input type="hidden" name="action" value="login" />
      <label>아이디<input name="username" autocomplete="username" required /></label>
      <label>비밀번호<input name="password" type="password" autocomplete="current-password" required /></label>
      <button type="submit">로그인</button>
    </form>
  `);
}

function consentPage(params: OAuthAuthorizeParams, username: string): Response {
  const query = encodedAuthorizeParams(params);
  return basePage("리프로그 MCP 권한 승인", `
    <h1>MCP 연결 승인</h1>
    <p><strong>${escapeHtml(username)}</strong> 계정으로 리프로그 MCP 연결을 승인합니다.</p>
    <div class="scope">
      <strong>허용 권한</strong>
      <span>어항, 수질, 생물, 관리 일정 조회</span>
      <span>수질 로그 및 관리 일정 추가</span>
    </div>
    <p class="muted">클라이언트: ${escapeHtml(params.clientId)}</p>
    <form method="post" action="/oauth/authorize?${escapeHtml(query)}">
      <input type="hidden" name="action" value="approve" />
      <button type="submit">연결 승인</button>
    </form>
  `);
}

export async function GET(request: NextRequest) {
  const params = parseAuthorizeParams(request.nextUrl.searchParams);
  const error = validateParams(params);
  if (error) {
    return params.redirectUri && isAllowedRedirectUri(params.redirectUri)
      ? redirectWithError(params.redirectUri, "invalid_request", params.state)
      : basePage("OAuth 오류", `<h1>연결 오류</h1><p class="error">${escapeHtml(error)}</p>`);
  }

  const username = await getSessionUsername();
  return username ? consentPage(params, username) : loginPage(params);
}

export async function POST(request: NextRequest) {
  const params = parseAuthorizeParams(request.nextUrl.searchParams);
  const error = validateParams(params);
  if (error) return basePage("OAuth 오류", `<h1>연결 오류</h1><p class="error">${escapeHtml(error)}</p>`);

  const form = await request.formData();
  const action = String(form.get("action") || "");

  if (action === "login") {
    const username = normalizeUsername(String(form.get("username") || ""));
    const password = String(form.get("password") || "");
    const user = await getUserStore().findByUsernameKey(username.toLowerCase());
    if (!user || !verifyPassword(password, user)) return loginPage(params, "아이디 또는 비밀번호가 맞지 않습니다.");

    const session = await getSession();
    session.username = user.username;
    await session.save();
    return NextResponse.redirect(new URL(`/oauth/authorize?${encodedAuthorizeParams(params)}`, request.nextUrl.origin));
  }

  if (action === "approve") {
    const username = await getSessionUsername();
    if (!username) return loginPage(params);
    const code = issueAuthorizationCode({
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      username,
      scope: params.scope,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod
    });
    return redirectWithCode(params.redirectUri, code, params.state);
  }

  return basePage("OAuth 오류", "<h1>연결 오류</h1><p class=\"error\">알 수 없는 요청입니다.</p>");
}
