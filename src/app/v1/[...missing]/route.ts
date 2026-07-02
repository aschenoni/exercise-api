import { errorResponse, handleOptions } from "@/lib/http";

/**
 * JSON 404 for any unknown /v1 path — agents get the same error envelope
 * everywhere instead of an HTML page.
 */
export function GET(): Response {
  return errorResponse(
    "not_found",
    "Unknown /v1 endpoint. Available: GET /v1/exercises, GET /v1/exercises/{id}, GET /v1/meta. Spec: GET /openapi.json.",
  );
}

export const OPTIONS = handleOptions;
