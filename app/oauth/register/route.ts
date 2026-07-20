import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type"
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const clientId = `reef-log-${crypto.randomBytes(16).toString("hex")}`;
  const now = Math.floor(Date.now() / 1000);

  return NextResponse.json(
    {
      client_id: clientId,
      client_id_issued_at: now,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
      redirect_uris: Array.isArray(body.redirect_uris) ? body.redirect_uris : [],
      client_name: body.client_name || "Reef Log MCP Client"
    },
    { status: 201, headers }
  );
}
