import type { Exercise } from "./schema";
import { EXERCISES } from "./dataset";

/**
 * Lightweight keyword retrieval for the catalog-grounded chat: no embeddings,
 * no external calls — score records by token overlap and hand the top slice
 * to the model as context. 183 records make brute force the right tool.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function score(ex: Exercise, tokens: string[]): number {
  const hay = {
    id: ex.id,
    name: ex.name.toLowerCase(),
    muscle: [ex.primary_muscle, ...ex.secondary_muscles].join(" "),
    pattern: ex.pattern,
    equipment: ex.equipment.join(" "),
    groups: `${ex.e1rm_substitution_group ?? ""} ${ex.progression_group ?? ""}`,
    modality: ex.modality,
    cues: ex.cues.toLowerCase(),
  };
  let s = 0;
  for (const t of tokens) {
    if (hay.name.includes(t)) s += 5;
    if (hay.id.includes(t)) s += 4;
    if (hay.muscle.includes(t)) s += 3;
    if (hay.pattern.includes(t)) s += 3;
    if (hay.equipment.includes(t)) s += 2;
    if (hay.groups.includes(t)) s += 2;
    if (hay.modality.includes(t)) s += 2;
    if (hay.cues.includes(t)) s += 1;
  }
  return s;
}

/** Compact context record — keeps prompt tokens down. */
function compact(ex: Exercise) {
  return {
    id: ex.id,
    name: ex.name,
    primary_muscle: ex.primary_muscle,
    secondary_muscles: ex.secondary_muscles,
    pattern: ex.pattern,
    equipment: ex.equipment,
    sfr_class: ex.sfr_class,
    is_gold_standard: ex.is_gold_standard,
    default_reps: ex.default_rep_low !== null ? `${ex.default_rep_low}-${ex.default_rep_high}` : null,
    tier: ex.tier,
    modality: ex.modality,
    progression: ex.progression_group ? `${ex.progression_group} L${ex.progression_level}` : null,
    cues: ex.cues,
  };
}

export function retrieveContext(query: string, limit = 12) {
  const tokens = tokenize(query);
  const scored = EXERCISES.map((ex) => ({ ex, s: score(ex, tokens) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.ex.id.localeCompare(b.ex.id))
    .slice(0, limit);
  return scored.map((r) => compact(r.ex));
}
