import { DATASET_VERSION } from "./dataset";

/**
 * HTTP conventions for every /v1 response, in one place:
 * - CORS: public read-only API, any origin.
 * - Caching: catalog data only changes on deploy, so responses are CDN-cached
 *   hard (`s-maxage`) and served stale while revalidating. Most read traffic
 *   never touches compute — this is what keeps the free tier cheap.
 * - `X-Dataset-Version`: lets consumers detect catalog releases cheaply.
 */

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

export function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": CACHE_CONTROL,
    "X-Dataset-Version": DATASET_VERSION,
    ...CORS_HEADERS,
    ...extra,
  };
}

export function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: apiHeaders(),
  });
}

/** Stable machine-readable error codes — part of the /v1 contract. */
export type ErrorCode = "invalid_parameter" | "not_found" | "internal_error";

const ERROR_STATUS: Record<ErrorCode, number> = {
  invalid_parameter: 400,
  not_found: 404,
  internal_error: 500,
};

export function errorResponse(code: ErrorCode, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status: ERROR_STATUS[code],
    headers: apiHeaders({ "Cache-Control": "no-store" }),
  });
}

/** Shared preflight handler for all API routes. */
export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
