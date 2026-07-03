import type { Exercise } from "./schema";
import { SITE_URL } from "./site";
import exercisesJson from "../../data/exercises.json";
import versionJson from "../../data/version.json";

/**
 * The catalog at runtime: bundled static JSON, loaded once into memory and
 * frozen. No database — every query is a pure function over this array.
 */
export const EXERCISES: readonly Exercise[] = Object.freeze(
  exercisesJson as Exercise[],
);

export const DATASET_VERSION: string = versionJson.dataset_version;

const byId = new Map<string, Exercise>(EXERCISES.map((e) => [e.id, e]));

export function getExerciseById(id: string): Exercise | undefined {
  return byId.get(id);
}

/** value → occurrence count, sorted by value, for /v1/meta filter-building. */
function countBy(values: string[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({ value, count }));
}

export interface Meta {
  object: "meta";
  dataset_version: string;
  api_version: "v1";
  license: {
    data: string;
    code: string;
    attribution_required: boolean;
    attribution: string;
    details_url: string;
  };
  counts: { total: number; by_tier: Record<string, number> };
  primary_muscles: { value: string; count: number }[];
  patterns: { value: string; count: number }[];
  equipment: { value: string; count: number }[];
  sfr_classes: { value: string; count: number }[];
  modalities: { value: string; count: number }[];
  substitution_groups: { value: string; count: number }[];
  progression_groups: { value: string; count: number }[];
}

let cachedMeta: Meta | undefined;

export function getMeta(): Meta {
  if (cachedMeta) return cachedMeta;
  const all = EXERCISES;
  cachedMeta = {
    object: "meta",
    dataset_version: DATASET_VERSION,
    api_version: "v1",
    license: {
      data: "CC-BY-4.0",
      code: "MIT",
      attribution_required: true,
      attribution: `Exercise data by ExerciseAPI (${SITE_URL}), licensed under CC BY 4.0.`,
      details_url: "https://creativecommons.org/licenses/by/4.0/",
    },
    counts: {
      total: all.length,
      by_tier: Object.fromEntries(
        countBy(all.map((e) => e.tier)).map(({ value, count }) => [value, count]),
      ),
    },
    primary_muscles: countBy(all.map((e) => e.primary_muscle)),
    patterns: countBy(all.map((e) => e.pattern)),
    equipment: countBy(all.flatMap((e) => e.equipment)),
    sfr_classes: countBy(all.map((e) => e.sfr_class).filter((v) => v !== null)),
    modalities: countBy(all.map((e) => e.modality)),
    substitution_groups: countBy(
      all.map((e) => e.e1rm_substitution_group).filter((v) => v !== null),
    ),
    progression_groups: countBy(
      all.map((e) => e.progression_group).filter((g): g is string => g !== null),
    ),
  };
  return cachedMeta;
}
