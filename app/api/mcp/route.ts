import { NextResponse, type NextRequest } from "next/server";
import { bearerTokenFromRequest, issuerFromRequest, verifyAccessToken } from "@/lib/auth/oauth";
import { handleReefLogMcpRequest, type JsonRpcRequest } from "@/lib/mcp/reef-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": process.env.REEFLOG_MCP_ALLOW_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type,mcp-session-id",
  "Access-Control-Expose-Headers": "mcp-session-id,www-authenticate"
};

function unauthorized(request: NextRequest) {
  const issuer = issuerFromRequest(request);
  return NextResponse.json(
    { error: "Unauthorized", authorization_server: issuer },
    {
      status: 401,
      headers: {
        ...noStore,
        "WWW-Authenticate": `Bearer resource_metadata="${issuer}/.well-known/oauth-protected-resource"`
      }
    }
  );
}

function isAuthorized(request: NextRequest): boolean {
  const token = bearerTokenFromRequest(request);
  if (!token) return false;
  return Boolean(verifyAccessToken(token));
}

function sseResponse(payloads: unknown[]) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      for (const payload of payloads) {
        controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(payload)}\n\n`));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      ...noStore,
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}

async function handlePayload(payload: JsonRpcRequest | JsonRpcRequest[]) {
  if (Array.isArray(payload)) {
    const results = await Promise.all(payload.map(item => handleReefLogMcpRequest(item)));
    return results.filter(Boolean);
  }
  const result = await handleReefLogMcpRequest(payload);
  return result ? [result] : [];
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: noStore });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized(request);
  return sseResponse([
    {
      jsonrpc: "2.0",
      method: "notifications/message",
      params: {
        level: "info",
        logger: "reef-log-mcp",
        data: "Reef Log MCP stream is ready. Send JSON-RPC requests with POST /api/mcp."
      }
    }
  ]);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized(request);

  let payload: JsonRpcRequest | JsonRpcRequest[];
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400, headers: noStore }
    );
  }

  const results = await handlePayload(payload);
  if (!results.length) {
    return new Response(null, { status: 202, headers: noStore });
  }

  const wantsStream = request.headers.get("accept")?.includes("text/event-stream");
  if (wantsStream) return sseResponse(results);

  return NextResponse.json(Array.isArray(payload) ? results : results[0], { headers: noStore });
}
