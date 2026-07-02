import type { Exercise, SortKey } from "./schema";
import { EQUIPMENT, PATTERNS, PRIMARY_MUSCLES, SFR_CLASSES, SORT_KEYS, TIERS } from "./schema";
import { EXERCISES, getMeta } from "./dataset";

/**
 * The in-memory query engine behind GET /v1/exercises.
 *
 * Parsing is strict on purpose: an unknown enum value or malformed boolean is
 * a 400 with the valid values spelled out, not a silently-empty result — the
 * single best affordance for agents (and humans) debugging an integration.
 */

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 200;

export interface ListQuery {
  muscle?: string[];
  secondary_muscle?: string[];
  pattern?: string[];
  sfr_class?: string[];
  tier?: string[];
  substitution_group?: string[];
  progression_group?: string[];
  equipment?: string[];
  available_equipment?: string[];
  gold_standard?: boolean;
  loadable?: boolean;
  unilateral?: boolean;
  home_hotel_friendly?: boolean;
  q?: string;
  sort: SortKey;
  sortDesc: boolean;
  limit: number;
  offset: number;
}

export class QueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueryError";
  }
}

function parseCsvEnum(
  params: URLSearchParams,
  name: string,
  allowed: readonly string[],
): string[] | undefined {
  const raw = params.getAll(name);
  if (raw.length === 0) return undefined;
  const values = raw.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  for (const v of values) {
    if (!allowed.includes(v)) {
      throw new QueryError(
        `Invalid value "${v}" for "${name}". Valid values: ${allowed.join(", ")}.`,
      );
    }
  }
  return values.length > 0 ? values : undefined;
}

/** Named groups aren't a fixed vocabulary; validate against the dataset. */
function parseCsvFromDataset(
  params: URLSearchParams,
  name: string,
  known: string[],
): string[] | undefined {
  const raw = params.getAll(name);
  if (raw.length === 0) return undefined;
  const values = raw.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  for (const v of values) {
    if (!known.includes(v)) {
      throw new QueryError(
        `Unknown value "${v}" for "${name}". See GET /v1/meta for the current list.`,
      );
    }
  }
  return values.length > 0 ? values : undefined;
}

function parseBoolean(params: URLSearchParams, name: string): boolean | undefined {
  const raw = params.get(name);
  if (raw === null) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  throw new QueryError(`Invalid value "${raw}" for "${name}". Use true or false.`);
}

function parseNonNegativeInt(
  params: URLSearchParams,
  name: string,
  fallback: number,
  max?: number,
): number {
  const raw = params.get(name);
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new QueryError(`Invalid value "${raw}" for "${name}". Use a non-negative integer.`);
  }
  if (name === "limit" && n === 0) {
    throw new QueryError(`"limit" must be at least 1.`);
  }
  return max !== undefined ? Math.min(n, max) : n;
}

export function parseListQuery(params: URLSearchParams): ListQuery {
  const meta = getMeta();
  const knownSubGroups = meta.substitution_groups.map((g) => g.value);
  const knownProgGroups = meta.progression_groups.map((g) => g.value);

  const rawSort = params.get("sort") ?? "name";
  const sortDesc = rawSort.startsWith("-");
  const sortKey = (sortDesc ? rawSort.slice(1) : rawSort) as SortKey;
  if (!SORT_KEYS.includes(sortKey)) {
    throw new QueryError(
      `Invalid value "${rawSort}" for "sort". Valid values: ${SORT_KEYS.flatMap((k) => [k, `-${k}`]).join(", ")}.`,
    );
  }

  const q = params.get("q")?.trim();

  return {
    muscle: parseCsvEnum(params, "muscle", PRIMARY_MUSCLES),
    secondary_muscle: parseCsvEnum(params, "secondary_muscle", PRIMARY_MUSCLES),
    pattern: parseCsvEnum(params, "pattern", PATTERNS),
    sfr_class: parseCsvEnum(params, "sfr_class", SFR_CLASSES),
    tier: parseCsvEnum(params, "tier", TIERS),
    substitution_group: parseCsvFromDataset(params, "substitution_group", knownSubGroups),
    progression_group: parseCsvFromDataset(params, "progression_group", knownProgGroups),
    equipment: parseCsvEnum(params, "equipment", EQUIPMENT),
    available_equipment: parseCsvEnum(params, "available_equipment", EQUIPMENT),
    gold_standard: parseBoolean(params, "gold_standard"),
    loadable: parseBoolean(params, "loadable"),
    unilateral: parseBoolean(params, "unilateral"),
    home_hotel_friendly: parseBoolean(params, "home_hotel_friendly"),
    q: q ? q.toLowerCase() : undefined,
    sort: sortKey,
    sortDesc,
    limit: parseNonNegativeInt(params, "limit", DEFAULT_LIMIT, MAX_LIMIT),
    offset: parseNonNegativeInt(params, "offset", 0),
  };
}

export interface ListResult {
  data: Exercise[];
  total: number;
  limit: number;
  offset: number;
}

export function runListQuery(query: ListQuery): ListResult {
  let results = EXERCISES.filter((e) => {
    if (query.muscle && !query.muscle.includes(e.primary_muscle)) return false;
    if (
      query.secondary_muscle &&
      !query.secondary_muscle.some((m) => (e.secondary_muscles as string[]).includes(m))
    )
      return false;
    if (query.pattern && !query.pattern.includes(e.pattern)) return false;
    if (query.sfr_class && !query.sfr_class.includes(e.sfr_class)) return false;
    if (query.tier && !query.tier.includes(e.tier)) return false;
    if (
      query.substitution_group &&
      !query.substitution_group.includes(e.e1rm_substitution_group)
    )
      return false;
    if (
      query.progression_group &&
      (e.progression_group === null || !query.progression_group.includes(e.progression_group))
    )
      return false;
    if (query.equipment && !query.equipment.some((t) => (e.equipment as string[]).includes(t)))
      return false;
    if (query.available_equipment) {
      // Subset match: doable with ONLY the listed gear. Your body is always
      // available, so `none_bodyweight` is implied.
      const have = new Set<string>([...query.available_equipment, "none_bodyweight"]);
      if (!e.equipment.every((t) => have.has(t))) return false;
    }
    if (query.gold_standard !== undefined && e.is_gold_standard !== query.gold_standard)
      return false;
    if (query.loadable !== undefined && e.loadable !== query.loadable) return false;
    if (query.unilateral !== undefined && e.unilateral !== query.unilateral) return false;
    if (
      query.home_hotel_friendly !== undefined &&
      e.home_hotel_friendly !== query.home_hotel_friendly
    )
      return false;
    if (query.q && !e.name.toLowerCase().includes(query.q) && !e.id.includes(query.q))
      return false;
    return true;
  });

  const dir = query.sortDesc ? -1 : 1;
  results = [...results].sort((a, b) => {
    const key = query.sort;
    const cmp =
      key === "preferred_rank"
        ? a.preferred_rank - b.preferred_rank
        : a[key].localeCompare(b[key]);
    // Stable tiebreak on id so pagination is deterministic.
    return cmp !== 0 ? dir * cmp : a.id.localeCompare(b.id);
  });

  return {
    data: results.slice(query.offset, query.offset + query.limit),
    total: results.length,
    limit: query.limit,
    offset: query.offset,
  };
}
