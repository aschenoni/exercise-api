import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { CORS_HEADERS } from "@/lib/http";

/**
 * Rate-limit gate for /v1/*. Runs before the CDN cache on Vercel, so every
 * request counts — including ones the cache would serve. /health and the
 * site/docs are deliberately unmatched (uptime monitors stay free).
 */

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") return NextResponse.next();

  const result = await checkRateLimit(clientIp(request));

  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.resetSeconds),
  };

  if (!result.allowed) {
    const message =
      result.reason === "burst"
        ? "Per-minute burst limit exceeded. Slow down and retry shortly."
        : `Daily free allowance (${result.limit} requests) exhausted for this IP. Resets at UTC midnight. Tip: catalog responses are cacheable — fetch limit=200 once and work locally, or pin a snapshot release for bulk use.`;
    return new Response(JSON.stringify({ error: { code: "rate_limited", message } }), {
      status: 429,
      headers: {
        ...headers,
        "Retry-After": String(result.retryAfterSeconds ?? result.resetSeconds),
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...CORS_HEADERS,
      },
    });
  }

  const response = NextResponse.next();
  for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
  return response;
}

export const config = {
  matcher: "/v1/:path*",
};
