import { getExerciseById } from "@/lib/dataset";
import { errorResponse, handleOptions, apiHeaders } from "@/lib/http";

/**
 * Community suggestions (PRODUCT.md §6.4): proposals, not edits. Each valid
 * submission is filed as a labeled GitHub issue on the public repo — the
 * moderation queue IS the issue tracker, and accepted suggestions become
 * dataset MINOR/PATCH releases. Degrades to 503 when no token is configured.
 */

const REPO = process.env.SUGGESTIONS_REPO ?? "aschenoni/exercise-api";
const TYPES = ["new_exercise", "correction", "new_field", "other"] as const;
type SuggestionType = (typeof TYPES)[number];

interface SuggestionBody {
  type: SuggestionType;
  title: string;
  details?: string;
  exercise_id?: string;
  contact?: string;
}

function validate(raw: unknown): SuggestionBody | string {
  if (typeof raw !== "object" || raw === null) return "Body must be a JSON object.";
  const b = raw as Record<string, unknown>;
  if (typeof b.type !== "string" || !TYPES.includes(b.type as SuggestionType)) {
    return `"type" must be one of: ${TYPES.join(", ")}.`;
  }
  if (typeof b.title !== "string" || b.title.trim().length < 5 || b.title.length > 200) {
    return `"title" is required (5–200 characters).`;
  }
  for (const [field, max] of [
    ["details", 4000],
    ["exercise_id", 100],
    ["contact", 200],
  ] as const) {
    const v = b[field];
    if (v !== undefined && (typeof v !== "string" || v.length > max)) {
      return `"${field}" must be a string of at most ${max} characters.`;
    }
  }
  if (
    typeof b.exercise_id === "string" &&
    b.exercise_id.trim() !== "" &&
    !getExerciseById(b.exercise_id.trim())
  ) {
    return `"exercise_id" "${b.exercise_id}" does not exist in the catalog. List ids via GET /v1/exercises.`;
  }
  return {
    type: b.type as SuggestionType,
    title: b.title.trim(),
    details: typeof b.details === "string" ? b.details.trim() : undefined,
    exercise_id:
      typeof b.exercise_id === "string" && b.exercise_id.trim() !== ""
        ? b.exercise_id.trim()
        : undefined,
    contact: typeof b.contact === "string" ? b.contact.trim() : undefined,
  };
}

export async function POST(request: Request): Promise<Response> {
  const token = process.env.GITHUB_ISSUES_TOKEN;
  if (!token) {
    return errorResponse(
      "service_unavailable",
      "Suggestions are not configured on this deployment yet. You can open an issue directly: https://github.com/" +
        REPO +
        "/issues",
    );
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return errorResponse("invalid_parameter", "Body must be valid JSON.");
  }
  const result = validate(parsed);
  if (typeof result === "string") return errorResponse("invalid_parameter", result);

  const issueBody = [
    `**Type:** ${result.type}`,
    result.exercise_id ? `**Exercise:** \`${result.exercise_id}\`` : null,
    result.contact ? `**Contact:** ${result.contact}` : null,
    "",
    result.details ?? "_No details provided._",
    "",
    "---",
    "_Filed automatically via `POST /v1/suggestions`._",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "exercise-api-suggestions",
    },
    body: JSON.stringify({
      title: `[suggestion] ${result.title}`,
      body: issueBody,
      labels: ["suggestion", `suggestion:${result.type}`],
    }),
  });

  if (!res.ok) {
    return errorResponse(
      "service_unavailable",
      "Could not record the suggestion right now. Please retry later or open an issue directly on GitHub.",
    );
  }
  const issue = (await res.json()) as { html_url: string; number: number };
  return new Response(
    JSON.stringify({
      object: "suggestion",
      status: "received",
      issue_url: issue.html_url,
      message: "Thanks! Suggestions are reviewed before entering the catalog as a dataset release.",
    }),
    { status: 202, headers: apiHeaders({ "Cache-Control": "no-store" }) },
  );
}

export const OPTIONS = handleOptions;
