import { NextResponse, type NextRequest } from "next/server";
import { issuerFromRequest } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const issuer = issuerFromRequest(request);
  return NextResponse.json(
    {
      resource: `${issuer}/api/mcp`,
      authorization_servers: [issuer],
      bearer_methods_supported: ["header"],
      scopes_supported: ["reeflog.read", "reeflog.write"],
      resource_documentation: `${issuer}/api/mcp`
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
