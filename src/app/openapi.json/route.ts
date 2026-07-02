import type { NextRequest } from "next/server";
import { buildOpenApiDocument } from "@/lib/openapi";
import { handleOptions, jsonResponse } from "@/lib/http";

export function GET(request: NextRequest): Response {
  return jsonResponse(buildOpenApiDocument(request.nextUrl.origin));
}

export const OPTIONS = handleOptions;
