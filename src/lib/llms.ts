import { EXERCISE_FIELDS, FIELD_SPECS, SORT_KEYS } from "./schema";
import { DATASET_VERSION, getMeta } from "./dataset";
import { DEFAULT_LIMIT, MAX_LIMIT } from "./query";

/**
 * llms.txt / llms-full.txt — the curated markdown map of the API for
 * doc-reading agents (https://llmstxt.org). Generated from the same schema
 * and dataset modules as the routes and OpenAPI doc, so it cannot drift.
 */

const INTRO = `# ExerciseAPI

> Free, public, read-only REST API for a hand-curated, hypertrophy-focused
> exercise library: 183 exercises with stimulus-to-fatigue ratings,
> research-backed gold-standard flags, e1RM substitution groups, calisthenics
> progression chains, curated rep ranges, and coaching cues.

Keyless to try (first 100 calls/day free per IP). JSON only. CORS enabled.
All endpoints are GET. The /v1 contract is additive-only. Data license:
CC BY 4.0 — attribution REQUIRED (ready-to-use credit line in GET /v1/meta,
\`license.attribution\`).`;

function endpointList(origin: string): string {
  return `## Endpoints

- [GET ${origin}/v1/exercises](${origin}/v1/exercises): list + filter the catalog (see Parameters)
- [GET ${origin}/v1/exercises/{id}](${origin}/v1/exercises/barbell_bench_press): one exercise by stable slug
- [GET ${origin}/v1/meta](${origin}/v1/meta): controlled vocabularies + counts + dataset_version + license
- [GET ${origin}/health](${origin}/health): liveness + dataset size
- [GET ${origin}/openapi.json](${origin}/openapi.json): OpenAPI 3.1 spec (canonical machine contract)
- POST ${origin}/v1/suggestions: propose a missing exercise/correction (JSON: type, title, details?, exercise_id?; strict limits)
- POST ${origin}/v1/chat: catalog-grounded assistant, streaming (AI SDK UIMessage format; strict limits; UI at ${origin}/chat)`;
}

export function llmsTxt(origin: string): string {
  return `${INTRO}

${endpointList(origin)}

## Docs

- [Documentation](${origin}/docs): endpoint reference, field dictionary, examples
- [Full API reference for agents](${origin}/llms-full.txt): everything in one file
- [Interactive API reference](${origin}/docs/api): rendered OpenAPI

## Conventions

- List envelope: \`{ object: "list", data, count, total, limit, offset }\`
- Error envelope: \`{ error: { code, message } }\` — stable codes: invalid_parameter, not_found, rate_limited, internal_error
- Invalid filter values return 400 with the valid values listed in the message
- \`X-Dataset-Version\` header on every response (dataset semver, currently ${DATASET_VERSION})
`;
}

export function llmsFullTxt(origin: string): string {
  const meta = getMeta();
  const vocab = (items: { value: string; count: number }[]) =>
    items.map((i) => `${i.value} (${i.count})`).join(", ");

  const fieldRows = EXERCISE_FIELDS.map((f) => {
    const s = FIELD_SPECS[f];
    const type =
      s.kind === "enum_array"
        ? "enum[]"
        : s.kind === "enum"
          ? "enum"
          : s.kind;
    return `| ${f} | ${type}${s.nullable ? " \\| null" : ""} | ${s.description} |`;
  }).join("\n");

  return `${llmsTxt(origin)}
## Parameters for GET /v1/exercises

All filters AND together; comma-separated values within one filter OR together.

| Param | Values | Meaning |
|---|---|---|
| muscle | ${meta.primary_muscles.map((m) => m.value).join(", ")} | primary muscle |
| secondary_muscle | same vocabulary as muscle | secondary involvement |
| pattern | ${meta.patterns.map((p) => p.value).join(", ")} | movement pattern |
| sfr_class | high, moderate, low | stimulus-to-fatigue class |
| tier | core, extended | catalog tier |
| modality | hypertrophy, conditioning, calisthenics, mobility | training purpose |
| substitution_group | see /v1/meta | e1RM substitution group |
| progression_group | see /v1/meta | calisthenics chain |
| equipment | see Equipment vocabulary | requires this token |
| available_equipment | see Equipment vocabulary | SUBSET match: entire equipment list covered by your tokens; none_bodyweight always implied |
| gold_standard, loadable, unilateral, home_hotel_friendly | true, false | boolean filters |
| q | free text | substring search over name + id |
| sort | ${SORT_KEYS.flatMap((k) => [k, `-${k}`]).join(", ")} | stable sort, id tiebreak |
| limit | 1–${MAX_LIMIT} (default ${DEFAULT_LIMIT}) | page size; ${MAX_LIMIT} fits the whole catalog |
| offset | ≥ 0 | zero-based |

## Field dictionary (${EXERCISE_FIELDS.length} fields, all always present)

| Field | Type | Meaning |
|---|---|---|
${fieldRows}

## Vocabularies (value (record count))

- Primary muscles: ${vocab(meta.primary_muscles)}
- Patterns: ${vocab(meta.patterns)}
- Equipment: ${vocab(meta.equipment)}
- SFR classes: ${vocab(meta.sfr_classes)}
- Modalities: ${vocab(meta.modalities)}
- Substitution groups: ${vocab(meta.substitution_groups)}
- Progression groups: ${vocab(meta.progression_groups)}

## Examples

- Everything doable with dumbbells + a bench, best stimulus first:
  \`GET ${origin}/v1/exercises?available_equipment=dumbbells,flat_bench&sfr_class=high\`
- Gold-standard chest exercises: \`GET ${origin}/v1/exercises?muscle=chest&gold_standard=true\`
- The front-lever progression, easiest first:
  \`GET ${origin}/v1/exercises?progression_group=front_lever_pull_line&sort=preferred_rank\`
- One record: \`GET ${origin}/v1/exercises/barbell_bench_press\`

## Rate limits

Anonymous: 100 requests/day per IP (plus a per-minute burst limit).
On 429 you get the error envelope with code \`rate_limited\` and a Retry-After
header. RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset headers are
sent on /v1 responses. A free API key tier with higher limits is planned.

## Versioning

- API contract: /v1 in the path, additive-only; breaking changes → /v2.
- Dataset content: semver (currently ${DATASET_VERSION}) in /v1/meta and the
  X-Dataset-Version header. Pin snapshots from the GitHub releases if you
  need reproducible data.

## License & attribution

Data: CC BY 4.0 — free including commercial use, attribution REQUIRED.
Credit line: "${meta.license.attribution}"
Code: MIT.
`;
}
