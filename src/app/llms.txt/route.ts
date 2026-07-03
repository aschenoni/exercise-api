import type { NextRequest } from "next/server";
import { llmsTxt } from "@/lib/llms";
import { apiHeaders, handleOptions } from "@/lib/http";

export function GET(request: NextRequest): Response {
  return new Response(llmsTxt(request.nextUrl.origin), {
    status: 200,
    headers: apiHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
  });
}

export const OPTIONS = handleOptions;
