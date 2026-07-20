import { NextResponse, type NextRequest } from "next/server";
import { issueAccessToken, verifyAuthorizationCode, verifyPkce } from "@/lib/auth/oauth";

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

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries(await request.formData());

  if (String(body.grant_type || "") !== "authorization_code") {
    return errorResponse("unsupported_grant_type", "Only authorization_code is supported.");
  }

  const code = verifyAuthorizationCode(String(body.code || ""));
  if (!code) return errorResponse("invalid_grant", "Authorization code is invalid or expired.");
  if (String(body.redirect_uri || "") !== code.redirectUri) return errorResponse("invalid_grant", "redirect_uri does not match.");
  if (body.client_id && String(body.client_id) !== code.clientId) return errorResponse("invalid_client", "client_id does not match.");
  if (!verifyPkce(String(body.code_verifier || ""), code.codeChallenge, code.codeChallengeMethod)) {
    return errorResponse("invalid_grant", "PKCE verification failed.");
  }

  const token = issueAccessToken({
    clientId: code.clientId,
    username: code.username,
    scope: code.scope
  });

  return NextResponse.json(
    {
      access_token: token.accessToken,
      token_type: "Bearer",
      expires_in: token.expiresIn,
      scope: code.scope
    },
    { headers }
  );
}
