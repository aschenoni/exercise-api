import { getMeta } from "@/lib/dataset";
import { handleOptions, jsonResponse } from "@/lib/http";

export function GET(): Response {
  return jsonResponse(getMeta());
}

export const OPTIONS = handleOptions;
