import { NextResponse, type NextRequest } from "next/server";
import { issueAccessToken, issueRefreshToken, verifyAuthorizationCode, verifyPkce, verifyRefreshToken } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,authorization"
};

function errorResponse(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

function tokenResponse(grant: { clientId: string; username: string; scope: string }) {
  const token = issueAccessToken(grant);
  return NextResponse.json(
    {
      access_token: token.accessToken,
      token_type: "Bearer",
      expires_in: token.expiresIn,
      // 매 갱신마다 새 refresh token을 발급해 사용하는 동안은 만료되지 않게 한다.
      refresh_token: issueRefreshToken(grant),
      scope: grant.scope
    },
    { headers }
  );
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries(await request.formData());

  const grantType = String(body.grant_type || "");

  if (grantType === "refresh_token") {
    const refresh = verifyRefreshToken(String(body.refresh_token || ""));
    if (!refresh) return errorResponse("invalid_grant", "Refresh token is invalid or expired.");
    if (body.client_id && String(body.client_id) !== refresh.clientId) return errorResponse("invalid_client", "client_id does not match.");
    return tokenResponse({ clientId: refresh.clientId, username: refresh.username, scope: refresh.scope });
  }

  if (grantType !== "authorization_code") {
    return errorResponse("unsupported_grant_type", "Only authorization_code and refresh_token are supported.");
  }

  const code = verifyAuthorizationCode(String(body.code || ""));
  if (!code) return errorResponse("invalid_grant", "Authorization code is invalid or expired.");
  if (String(body.redirect_uri || "") !== code.redirectUri) return errorResponse("invalid_grant", "redirect_uri does not match.");
  if (body.client_id && String(body.client_id) !== code.clientId) return errorResponse("invalid_client", "client_id does not match.");
  if (!verifyPkce(String(body.code_verifier || ""), code.codeChallenge, code.codeChallengeMethod)) {
    return errorResponse("invalid_grant", "PKCE verification failed.");
  }

  return tokenResponse({ clientId: code.clientId, username: code.username, scope: code.scope });
}
