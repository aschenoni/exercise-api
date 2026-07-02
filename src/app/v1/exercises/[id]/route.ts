import { getExerciseById } from "@/lib/dataset";
import { errorResponse, handleOptions, jsonResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const exercise = getExerciseById(id);
  if (!exercise) {
    return errorResponse(
      "not_found",
      `No exercise with id "${id}". Ids are snake_case slugs, e.g. barbell_bench_press; list them via GET /v1/exercises.`,
    );
  }
  return jsonResponse(exercise);
}

export const OPTIONS = handleOptions;
