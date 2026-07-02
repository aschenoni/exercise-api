import { DATASET_VERSION, EXERCISES } from "@/lib/dataset";
import { apiHeaders, handleOptions } from "@/lib/http";

export function GET(): Response {
  return new Response(
    JSON.stringify({
      status: "ok",
      dataset_version: DATASET_VERSION,
      exercises: EXERCISES.length,
    }),
    {
      status: 200,
      headers: apiHeaders({ "Cache-Control": "no-store" }),
    },
  );
}

export const OPTIONS = handleOptions;
