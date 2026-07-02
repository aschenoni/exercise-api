import type { NextRequest } from "next/server";
import { parseListQuery, runListQuery, QueryError } from "@/lib/query";
import { errorResponse, handleOptions, jsonResponse } from "@/lib/http";

export function GET(request: NextRequest): Response {
  let query;
  try {
    query = parseListQuery(request.nextUrl.searchParams);
  } catch (err) {
    if (err instanceof QueryError) return errorResponse("invalid_parameter", err.message);
    throw err;
  }
  const { data, total, limit, offset } = runListQuery(query);
  return jsonResponse({
    object: "list",
    data,
    count: data.length,
    total,
    limit,
    offset,
  });
}

export const OPTIONS = handleOptions;
