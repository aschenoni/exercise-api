/**
 * The canonical ExerciseAPI data contract.
 *
 * Everything that describes the shape of an exercise record lives here and
 * ONLY here: the `Exercise` type, the controlled vocabularies, and the
 * per-field specs. The dataset integrity check (`scripts/data-check.ts`),
 * the query-param validation (`src/lib/query.ts`), and the OpenAPI document
 * (`src/lib/openapi.ts`) are all derived from this module, so the published
 * contract cannot drift from the code.
 *
 * `/v1` is an additive-only contract: fields may be added, never removed,
 * renamed, or retyped. Breaking changes require `/v2`. See PRODUCT.md §10.
 */

export const PRIMARY_MUSCLES = [
  "abs",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "front_delts",
  "glutes",
  "hamstrings",
  "lats",
  "lower_back",
  "quads",
  "rear_delts",
  "side_delts",
  "traps",
  "triceps",
  "upper_back",
] as const;

export const PATTERNS = [
  "anti_extension",
  "calf_raise",
  "curl",
  "fly",
  "hip_hinge",
  "hip_thrust",
  "horizontal_press",
  "horizontal_pull",
  "incline_press",
  "lateral_raise",
  "leg_curl",
  "leg_extension",
  "lunge",
  "rear_delt",
  "shrug",
  "squat",
  "triceps_extension",
  "trunk_flexion",
  "vertical_press",
  "vertical_pull",
] as const;

export const EQUIPMENT = [
  "ab_wheel",
  "adjustable_bench",
  "assisted_pullup_machine",
  "barbell",
  "bench_or_box",
  "cable_stack",
  "chest_press_machine",
  "dip_belt",
  "dip_station",
  "dumbbells",
  "ez_curl_bar",
  "flat_bench",
  "gymnastic_rings",
  "hack_squat_machine",
  "hip_thrust_machine",
  "landmine",
  "lat_pulldown",
  "leg_curl_machine",
  "leg_extension_machine",
  "leg_press",
  "none_bodyweight",
  "parallettes",
  "pec_deck",
  "power_rack",
  "preacher_bench",
  "pullup_bar",
  "resistance_bands",
  "seated_calf_machine",
  "seated_row_machine",
  "shoulder_press_machine",
  "smith_machine",
  "standing_calf_machine",
  "suspension_trainer",
  "t_bar_row",
] as const;

export const SFR_CLASSES = ["high", "moderate", "low"] as const;

export const TIERS = ["core", "extended"] as const;

export type PrimaryMuscle = (typeof PRIMARY_MUSCLES)[number];
export type Pattern = (typeof PATTERNS)[number];
export type Equipment = (typeof EQUIPMENT)[number];
export type SfrClass = (typeof SFR_CLASSES)[number];
export type Tier = (typeof TIERS)[number];

/** One exercise record. 19 fields, all always present (nullable → null). */
export interface Exercise {
  id: string;
  name: string;
  primary_muscle: PrimaryMuscle;
  secondary_muscles: PrimaryMuscle[];
  pattern: Pattern;
  equipment: Equipment[];
  sfr_class: SfrClass;
  is_gold_standard: boolean;
  preferred_rank: number;
  e1rm_substitution_group: string;
  default_rep_low: number;
  default_rep_high: number;
  loadable: boolean;
  unilateral: boolean;
  home_hotel_friendly: boolean;
  tier: Tier;
  progression_group: string | null;
  progression_level: number | null;
  cues: string;
}

/** Dataset invariants asserted by `data:check` and the test suite. */
export const EXPECTED_COUNTS = { total: 183, core: 87, extended: 96 } as const;

export type FieldSpec = {
  kind: "string" | "enum" | "enum_array" | "boolean" | "integer";
  enum?: readonly string[];
  nullable?: boolean;
  minimum?: number;
  description: string;
};

/**
 * Per-field specs — the machine-readable half of the contract.
 * Order here is the canonical field order.
 */
export const FIELD_SPECS: Record<keyof Exercise, FieldSpec> = {
  id: {
    kind: "string",
    description:
      "Stable, URL-safe snake_case slug, unique across the catalog (e.g. `barbell_bench_press`). Never reused or renamed — safe to store as a foreign reference.",
  },
  name: {
    kind: "string",
    description: "Human-readable display name.",
  },
  primary_muscle: {
    kind: "enum",
    enum: PRIMARY_MUSCLES,
    description: "The muscle the exercise primarily targets.",
  },
  secondary_muscles: {
    kind: "enum_array",
    enum: PRIMARY_MUSCLES,
    description:
      "Muscles meaningfully worked besides the primary. Same vocabulary as `primary_muscle`. May be empty.",
  },
  pattern: {
    kind: "enum",
    enum: PATTERNS,
    description: "Movement pattern classification.",
  },
  equipment: {
    kind: "enum_array",
    enum: EQUIPMENT,
    description:
      "Every equipment token required to perform the exercise. `none_bodyweight` means no equipment is needed.",
  },
  sfr_class: {
    kind: "enum",
    enum: SFR_CLASSES,
    description:
      "Stimulus-to-fatigue ratio class: how much hypertrophy stimulus the exercise delivers per unit of fatigue. `high` is best.",
  },
  is_gold_standard: {
    kind: "boolean",
    description:
      "True when the exercise is a research/EMG-backed top pick for its primary muscle (see data/SOURCE.md for citations).",
  },
  preferred_rank: {
    kind: "integer",
    minimum: 1,
    description:
      "1-based preference order among exercises sharing a primary muscle — lower is more preferred by the curators.",
  },
  e1rm_substitution_group: {
    kind: "string",
    description:
      "Named group of interchangeable exercises for estimated-1RM tracking: swapping within a group preserves comparable strength-progression data.",
  },
  default_rep_low: {
    kind: "integer",
    minimum: 1,
    description: "Lower bound of the curated default hypertrophy rep range.",
  },
  default_rep_high: {
    kind: "integer",
    minimum: 1,
    description: "Upper bound of the curated default hypertrophy rep range.",
  },
  loadable: {
    kind: "boolean",
    description:
      "True when the exercise can be progressively loaded with external weight.",
  },
  unilateral: {
    kind: "boolean",
    description: "True when the exercise trains one side at a time.",
  },
  home_hotel_friendly: {
    kind: "boolean",
    description:
      "True when the exercise is practical with minimal/portable equipment (hotel room, home setup).",
  },
  tier: {
    kind: "enum",
    enum: TIERS,
    description:
      "`core` = the curated default library; `extended` = additive variations and calisthenics progression rungs.",
  },
  progression_group: {
    kind: "string",
    nullable: true,
    description:
      "Named calisthenics progression chain this exercise belongs to (e.g. `planche_push_line`), or null for non-progression exercises.",
  },
  progression_level: {
    kind: "integer",
    nullable: true,
    minimum: 1,
    description:
      "1-based difficulty rung within `progression_group` (higher = harder), or null.",
  },
  cues: {
    kind: "string",
    description: "Short coaching cues for correct execution.",
  },
};

export const EXERCISE_FIELDS = Object.keys(FIELD_SPECS) as (keyof Exercise)[];

/** Sortable fields for the list endpoint (prefix with `-` for descending). */
export const SORT_KEYS = ["name", "preferred_rank", "id"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/** Convert one FieldSpec to a JSON Schema fragment (used by the OpenAPI doc). */
export function fieldSpecToJsonSchema(spec: FieldSpec): Record<string, unknown> {
  let schema: Record<string, unknown>;
  switch (spec.kind) {
    case "string":
      schema = { type: "string" };
      break;
    case "enum":
      schema = { type: "string", enum: [...(spec.enum ?? [])] };
      break;
    case "enum_array":
      schema = {
        type: "array",
        items: { type: "string", enum: [...(spec.enum ?? [])] },
      };
      break;
    case "boolean":
      schema = { type: "boolean" };
      break;
    case "integer":
      schema = { type: "integer" };
      if (spec.minimum !== undefined) schema.minimum = spec.minimum;
      break;
  }
  if (spec.nullable) {
    // OpenAPI 3.1 == JSON Schema: nullable is expressed via a type union.
    schema.type = [schema.type as string, "null"];
  }
  schema.description = spec.description;
  return schema;
}

/**
 * Validate one record against FIELD_SPECS.
 * Returns a list of human-readable problems (empty = valid).
 * Deliberately dependency-free so `data:check` needs no runtime deps.
 */
export function validateExercise(record: unknown, index: number): string[] {
  const problems: string[] = [];
  const where = `record[${index}]`;
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return [`${where}: not an object`];
  }
  const rec = record as Record<string, unknown>;
  const label = typeof rec.id === "string" ? `${where} (${rec.id})` : where;

  for (const key of Object.keys(rec)) {
    if (!(key in FIELD_SPECS)) problems.push(`${label}: unknown field "${key}"`);
  }
  for (const field of EXERCISE_FIELDS) {
    const spec = FIELD_SPECS[field];
    if (!(field in rec)) {
      problems.push(`${label}: missing field "${field}"`);
      continue;
    }
    const value = rec[field];
    if (value === null) {
      if (!spec.nullable) problems.push(`${label}: "${field}" must not be null`);
      continue;
    }
    switch (spec.kind) {
      case "string":
        if (typeof value !== "string" || value.trim() === "")
          problems.push(`${label}: "${field}" must be a non-empty string`);
        break;
      case "enum":
        if (typeof value !== "string" || !spec.enum!.includes(value))
          problems.push(`${label}: "${field}" has invalid value ${JSON.stringify(value)}`);
        break;
      case "enum_array":
        if (
          !Array.isArray(value) ||
          value.some((v) => typeof v !== "string" || !spec.enum!.includes(v))
        )
          problems.push(`${label}: "${field}" must be an array of known tokens`);
        break;
      case "boolean":
        if (typeof value !== "boolean")
          problems.push(`${label}: "${field}" must be a boolean`);
        break;
      case "integer":
        if (
          typeof value !== "number" ||
          !Number.isInteger(value) ||
          (spec.minimum !== undefined && value < spec.minimum)
        )
          problems.push(`${label}: "${field}" must be an integer >= ${spec.minimum ?? "-inf"}`);
        break;
    }
  }
  return problems;
}
