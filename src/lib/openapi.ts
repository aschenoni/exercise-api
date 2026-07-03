import {
  EQUIPMENT,
  EXERCISE_FIELDS,
  EXPECTED_COUNTS,
  FIELD_SPECS,
  MODALITIES,
  PATTERNS,
  PRIMARY_MUSCLES,
  SFR_CLASSES,
  SORT_KEYS,
  TIERS,
  fieldSpecToJsonSchema,
} from "./schema";
import { DATASET_VERSION, getExerciseById } from "./dataset";
import { DEFAULT_LIMIT, MAX_LIMIT } from "./query";

/**
 * OpenAPI 3.1 document, generated at request time from the same schema module
 * and query constants the routes run on — the spec cannot drift from behavior.
 * Descriptions are written for LLM/agent consumers as much as humans.
 */

const exerciseSchema = {
  type: "object",
  description:
    "One exercise from the hand-curated, hypertrophy-focused catalog. All 19 fields are always present; nullable fields use null.",
  required: [...EXERCISE_FIELDS],
  properties: Object.fromEntries(
    EXERCISE_FIELDS.map((f) => [f, fieldSpecToJsonSchema(FIELD_SPECS[f])]),
  ),
  additionalProperties: false,
} as const;

const errorSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: {
          type: "string",
          enum: [
            "invalid_parameter",
            "not_found",
            "rate_limited",
            "service_unavailable",
            "internal_error",
          ],
          description: "Stable machine-readable error code.",
        },
        message: { type: "string", description: "Human-readable explanation." },
      },
    },
  },
} as const;

function csvParam(
  name: string,
  values: readonly string[] | null,
  description: string,
) {
  return {
    name,
    in: "query",
    required: false,
    description: `${description} Accepts a comma-separated list (matches any).`,
    schema: values
      ? { type: "string", enum: [...values] }
      : { type: "string" },
    style: "form",
  };
}

function boolParam(name: string, description: string) {
  return {
    name,
    in: "query",
    required: false,
    description,
    schema: { type: "boolean" },
  };
}

export function buildOpenApiDocument(origin: string) {
  const example = getExerciseById("barbell_bench_press");
  return {
    openapi: "3.1.0",
    info: {
      title: "ExerciseAPI",
      version: "1.0.0",
      summary:
        "Free, public, read-only REST API for a hand-curated, hypertrophy-focused exercise library.",
      description: [
        `A catalog of ${EXPECTED_COUNTS.total} hand-curated exercises with training-quality metadata: stimulus-to-fatigue ratings, research-backed gold-standard flags, e1RM substitution groups, calisthenics progression chains, curated rep ranges, and coaching cues.`,
        "",
        "No authentication required. All endpoints are GET, JSON-only, CORS-enabled, and CDN-cached.",
        "",
        "The `/v1` contract is additive-only: fields and enum values may be added, never removed or retyped. The catalog content is versioned independently via semver, exposed in `GET /v1/meta` and the `X-Dataset-Version` response header.",
        "",
        "Data license: CC BY 4.0 (attribution required). Code: MIT.",
      ].join("\n"),
      contact: { name: "ExerciseAPI" },
      license: { name: "CC BY 4.0 (data)", identifier: "CC-BY-4.0" },
    },
    servers: [{ url: origin, description: "This deployment" }],
    paths: {
      "/v1/exercises": {
        get: {
          operationId: "listExercises",
          summary: "List and filter exercises",
          description:
            "Returns exercises matching every provided filter (filters AND together; comma-separated values within one filter OR together). Use `available_equipment` to get only exercises doable with the gear you have — `none_bodyweight` (your own body) is always implied. Results are deterministic: stable sort with id tiebreak, so pagination is safe.",
          parameters: [
            csvParam("muscle", PRIMARY_MUSCLES, "Filter by primary muscle."),
            csvParam(
              "secondary_muscle",
              PRIMARY_MUSCLES,
              "Filter by secondary muscle involvement.",
            ),
            csvParam("pattern", PATTERNS, "Filter by movement pattern."),
            csvParam("sfr_class", SFR_CLASSES, "Filter by stimulus-to-fatigue class."),
            csvParam("tier", TIERS, "Filter by catalog tier."),
            csvParam(
              "modality",
              MODALITIES,
              "Filter by training purpose (conditioning and mobility arrive in upcoming dataset releases).",
            ),
            csvParam(
              "substitution_group",
              null,
              "Filter by e1RM substitution group (see GET /v1/meta for values).",
            ),
            csvParam(
              "progression_group",
              null,
              "Filter by calisthenics progression chain (see GET /v1/meta for values).",
            ),
            csvParam(
              "equipment",
              EQUIPMENT,
              "Exercises that require this equipment token.",
            ),
            csvParam(
              "available_equipment",
              EQUIPMENT,
              "Subset match: only exercises whose ENTIRE equipment list is covered by the provided tokens. `none_bodyweight` is always implied.",
            ),
            boolParam("gold_standard", "Only research-backed top picks (or explicitly exclude them with false)."),
            boolParam("loadable", "Filter by external-load capability."),
            boolParam("unilateral", "Filter by unilateral execution."),
            boolParam("home_hotel_friendly", "Filter by minimal-equipment practicality."),
            {
              name: "q",
              in: "query",
              required: false,
              description: "Case-insensitive substring search over name and id.",
              schema: { type: "string" },
            },
            {
              name: "sort",
              in: "query",
              required: false,
              description: `Sort key. Prefix with "-" for descending. Default: name.`,
              schema: {
                type: "string",
                enum: SORT_KEYS.flatMap((k) => [k, `-${k}`]),
              },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              description: `Page size, 1–${MAX_LIMIT}. Default ${DEFAULT_LIMIT}. The full catalog (${EXPECTED_COUNTS.total} records) fits in one page with limit=${MAX_LIMIT}.`,
              schema: { type: "integer", minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
            },
            {
              name: "offset",
              in: "query",
              required: false,
              description: "Zero-based offset into the filtered result set.",
              schema: { type: "integer", minimum: 0, default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "A page of matching exercises.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ExerciseList" },
                },
              },
            },
            "400": {
              description:
                "A filter value was invalid. The error message lists the valid values.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Error" } },
              },
            },
            "429": { $ref: "#/components/responses/RateLimited" },
          },
        },
      },
      "/v1/exercises/{id}": {
        get: {
          operationId: "getExercise",
          summary: "Fetch one exercise by slug",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Stable snake_case slug, e.g. barbell_bench_press.",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "The exercise.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Exercise" },
                  ...(example ? { examples: { barbell_bench_press: { value: example } } } : {}),
                },
              },
            },
            "404": {
              description: "No exercise with that id.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Error" } },
              },
            },
            "429": { $ref: "#/components/responses/RateLimited" },
          },
        },
      },
      "/v1/meta": {
        get: {
          operationId: "getMeta",
          summary: "Controlled vocabularies, counts, and dataset version",
          description:
            "Self-describing catalog metadata: every filterable vocabulary with occurrence counts (ideal for building filter UIs or validating agent tool calls) plus the current dataset_version.",
          responses: {
            "200": {
              description: "Catalog metadata.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Meta" } },
              },
            },
          },
        },
      },
      "/v1/suggestions": {
        post: {
          operationId: "createSuggestion",
          summary: "Suggest a missing exercise, field, or correction",
          description:
            "Community proposals, not edits: valid submissions are filed to the public issue tracker for review; accepted ones become dataset releases. Strictly rate-limited (5/day per IP).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuggestionRequest" },
              },
            },
          },
          responses: {
            "202": {
              description: "Suggestion recorded for review.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      object: { type: "string", const: "suggestion" },
                      status: { type: "string", const: "received" },
                      issue_url: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Validation failed; the message says why.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Error" } },
              },
            },
            "429": { $ref: "#/components/responses/RateLimited" },
            "503": { $ref: "#/components/responses/Unavailable" },
          },
        },
      },
      "/v1/chat": {
        post: {
          operationId: "chat",
          summary: "Catalog-grounded assistant (streaming)",
          description:
            "Answers questions from the catalog data only. Accepts AI SDK UIMessage arrays and streams the reply (AI SDK UI message stream). Tightly rate-limited (20/day per IP) with a shared daily budget; returns 503 when the deployment has no AI credentials.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["messages"],
                  properties: {
                    messages: {
                      type: "array",
                      description:
                        "AI SDK UIMessage array; the last user message is answered.",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Streaming assistant reply (AI SDK UI message stream).",
              content: { "text/event-stream": { schema: { type: "string" } } },
            },
            "400": {
              description: "Malformed body.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Error" } },
              },
            },
            "429": { $ref: "#/components/responses/RateLimited" },
            "503": { $ref: "#/components/responses/Unavailable" },
          },
        },
      },
      "/health": {
        get: {
          operationId: "getHealth",
          summary: "Liveness + dataset size",
          responses: {
            "200": {
              description: "Service is up.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", const: "ok" },
                      dataset_version: { type: "string" },
                      exercises: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      responses: {
        Unavailable: {
          description:
            "This feature is not configured on the deployment or temporarily unavailable. The read API is unaffected.",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Error" } },
          },
        },
        RateLimited: {
          description:
            "Anonymous rate limit exceeded (100 requests/day per IP, plus a per-minute burst limit). Honor Retry-After; RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset headers are sent on every /v1 response.",
          headers: {
            "Retry-After": {
              description: "Seconds until you may retry.",
              schema: { type: "integer" },
            },
          },
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Error" } },
          },
        },
      },
      schemas: {
        Exercise: exerciseSchema,
        ExerciseList: {
          type: "object",
          required: ["object", "data", "count", "total", "limit", "offset"],
          properties: {
            object: { type: "string", const: "list" },
            data: { type: "array", items: { $ref: "#/components/schemas/Exercise" } },
            count: { type: "integer", description: "Records in this page." },
            total: {
              type: "integer",
              description: "Records matching the filters across all pages.",
            },
            limit: { type: "integer" },
            offset: { type: "integer" },
          },
        },
        Meta: {
          type: "object",
          description:
            "Vocabularies with counts, plus dataset_version (semver, also sent as the X-Dataset-Version header).",
          required: [
            "object",
            "dataset_version",
            "api_version",
            "license",
            "counts",
            "primary_muscles",
            "patterns",
            "equipment",
            "sfr_classes",
            "modalities",
            "substitution_groups",
            "progression_groups",
          ],
          properties: {
            object: { type: "string", const: "meta" },
            dataset_version: { type: "string", example: DATASET_VERSION },
            api_version: { type: "string", const: "v1" },
            license: {
              type: "object",
              description:
                "Data is CC BY 4.0: free to use, attribution REQUIRED. Products using this data must display the `attribution` credit (or equivalent) per the license.",
              properties: {
                data: { type: "string", const: "CC-BY-4.0" },
                code: { type: "string", const: "MIT" },
                attribution_required: { type: "boolean", const: true },
                attribution: {
                  type: "string",
                  description: "Ready-to-use attribution line.",
                },
                details_url: { type: "string" },
              },
            },
            counts: {
              type: "object",
              properties: {
                total: { type: "integer" },
                by_tier: { type: "object", additionalProperties: { type: "integer" } },
              },
            },
            primary_muscles: { $ref: "#/components/schemas/VocabCounts" },
            patterns: { $ref: "#/components/schemas/VocabCounts" },
            equipment: { $ref: "#/components/schemas/VocabCounts" },
            sfr_classes: { $ref: "#/components/schemas/VocabCounts" },
            modalities: { $ref: "#/components/schemas/VocabCounts" },
            substitution_groups: { $ref: "#/components/schemas/VocabCounts" },
            progression_groups: { $ref: "#/components/schemas/VocabCounts" },
          },
        },
        VocabCounts: {
          type: "array",
          items: {
            type: "object",
            required: ["value", "count"],
            properties: {
              value: { type: "string" },
              count: { type: "integer" },
            },
          },
        },
        SuggestionRequest: {
          type: "object",
          required: ["type", "title"],
          properties: {
            type: {
              type: "string",
              enum: ["new_exercise", "correction", "new_field", "other"],
              description: "What kind of suggestion this is.",
            },
            title: {
              type: "string",
              minLength: 5,
              maxLength: 200,
              description: "One-line summary.",
            },
            details: {
              type: "string",
              maxLength: 4000,
              description:
                "The case for it: equipment, muscles, SFR reasoning, sources.",
            },
            exercise_id: {
              type: "string",
              description:
                "For corrections: the existing exercise's slug. Must exist in the catalog.",
            },
            contact: {
              type: "string",
              maxLength: 200,
              description: "Optional handle/email if follow-up questions are welcome.",
            },
          },
        },
        Error: errorSchema,
      },
    },
  };
}
