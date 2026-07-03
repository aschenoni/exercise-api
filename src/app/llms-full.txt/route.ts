import type { NextRequest } from "next/server";
import { llmsFullTxt } from "@/lib/llms";
import { apiHeaders, handleOptions } from "@/lib/http";

export function GET(request: NextRequest): Response {
  return new Response(llmsFullTxt(request.nextUrl.origin), {
    status: 200,
    headers: apiHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
  });
}

export const OPTIONS = handleOptions;
