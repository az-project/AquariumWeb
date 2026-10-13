import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { issueAuthorizationCode, verifyAccessToken } from "@/lib/auth/oauth";
import { POST } from "../app/oauth/token/route";

function tokenRequest(body: Record<string, string>) {
  return POST(new Request("http://localhost/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  }) as unknown as NextRequest);
}

describe("oauth token endpoint", () => {
  it("issues a refresh token and renews access with it", async () => {
    const code = issueAuthorizationCode({ clientId: "c1", redirectUri: "https://x.test/cb", username: "admin", scope: "reeflog.read" });
    const first = await (await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: "https://x.test/cb" })).json();
    expect(first.refresh_token).toBeTruthy();

    const renewed = await (await tokenRequest({ grant_type: "refresh_token", refresh_token: first.refresh_token })).json();
    expect(verifyAccessToken(renewed.access_token)?.username).toBe("admin");
    expect(renewed.refresh_token).toBeTruthy();
  });

  it("rejects an access token or garbage used as a refresh token", async () => {
    const code = issueAuthorizationCode({ clientId: "c1", redirectUri: "https://x.test/cb", username: "admin", scope: "reeflog.read" });
    const first = await (await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: "https://x.test/cb" })).json();
    expect((await tokenRequest({ grant_type: "refresh_token", refresh_token: first.access_token })).status).toBe(400);
    expect((await tokenRequest({ grant_type: "refresh_token", refresh_token: "nope" })).status).toBe(400);
  });
});
