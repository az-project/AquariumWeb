import crypto from "node:crypto";
import type { NextRequest } from "next/server";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const AUTH_CODE_TTL_SECONDS = 5 * 60;
const DEV_FALLBACK_SECRET = "aquarium-dev-session-secret-do-not-use-in-prod";

export interface OAuthCodePayload {
  type: "authorization_code";
  clientId: string;
  redirectUri: string;
  username: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  exp: number;
}

export interface OAuthAccessPayload {
  type: "access_token";
  clientId: string;
  username: string;
  scope: string;
  exp: number;
}

export interface OAuthAuthorizeParams {
  responseType: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

function authSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.REEFLOG_OAUTH_SECRET;
  return secret && secret.length >= 32 ? secret : DEV_FALLBACK_SECRET;
}

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", authSecret()).update(value).digest("base64url");
}

export function issueSignedToken(payload: OAuthCodePayload | OAuthAccessPayload): string {
  const body = base64Url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySignedToken<T extends OAuthCodePayload | OAuthAccessPayload>(token: string, type: T["type"]): T | null {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature || signature !== sign(body)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    if (payload.type !== type || Number(payload.exp || 0) < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function issueAuthorizationCode(payload: Omit<OAuthCodePayload, "type" | "exp">): string {
  return issueSignedToken({
    ...payload,
    type: "authorization_code",
    exp: Math.floor(Date.now() / 1000) + AUTH_CODE_TTL_SECONDS
  });
}

export function issueAccessToken(payload: Omit<OAuthAccessPayload, "type" | "exp">): { accessToken: string; expiresIn: number } {
  return {
    accessToken: issueSignedToken({
      ...payload,
      type: "access_token",
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS
    }),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS
  };
}

export function verifyAccessToken(token: string): OAuthAccessPayload | null {
  return verifySignedToken<OAuthAccessPayload>(token, "access_token");
}

export function verifyAuthorizationCode(token: string): OAuthCodePayload | null {
  return verifySignedToken<OAuthCodePayload>(token, "authorization_code");
}

export function verifyPkce(codeVerifier: string, codeChallenge = "", method = "plain"): boolean {
  if (!codeChallenge) return true;
  if (method.toUpperCase() === "S256") {
    const digest = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    if (digest.length !== codeChallenge.length) return false;
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(codeChallenge));
  }
  if (codeVerifier.length !== codeChallenge.length) return false;
  return crypto.timingSafeEqual(Buffer.from(codeVerifier), Buffer.from(codeChallenge));
}

export function issuerFromRequest(request: NextRequest): string {
  const configured = process.env.REEFLOG_OAUTH_ISSUER;
  if (configured) return configured.replace(/\/+$/, "");
  return request.nextUrl.origin;
}

export function parseAuthorizeParams(searchParams: URLSearchParams): OAuthAuthorizeParams {
  return {
    responseType: searchParams.get("response_type") || "",
    clientId: searchParams.get("client_id") || "",
    redirectUri: searchParams.get("redirect_uri") || "",
    scope: searchParams.get("scope") || "reeflog.read reeflog.write",
    state: searchParams.get("state") || "",
    codeChallenge: searchParams.get("code_challenge") || "",
    codeChallengeMethod: searchParams.get("code_challenge_method") || "plain"
  };
}

export function encodedAuthorizeParams(params: OAuthAuthorizeParams): string {
  const search = new URLSearchParams({
    response_type: params.responseType,
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: params.scope,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: params.codeChallengeMethod
  });
  return search.toString();
}

export function redirectWithError(redirectUri: string, error: string, state = ""): Response {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  if (state) url.searchParams.set("state", state);
  return Response.redirect(url, 302);
}

export function redirectWithCode(redirectUri: string, code: string, state = ""): Response {
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  return Response.redirect(url, 302);
}

export function isAllowedRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

export function bearerTokenFromRequest(request: NextRequest): string {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] || "";
}
