/**
 * Dataset integrity check — the gate every dataset release must pass.
 * Run with: pnpm data:check  (plain Node ≥ 22.6, no build step)
 *
 * Asserts the invariants in PRODUCT.md §5 / PLAN.md P0: record count, tier
 * counts, unique ids, full schema conformance against FIELD_SPECS, semver
 * dataset version, and cross-field consistency.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EXPECTED_COUNTS, validateExercise } from "../src/lib/schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems: string[] = [];

const exercises = JSON.parse(
  readFileSync(join(root, "data", "exercises.json"), "utf8"),
) as Record<string, unknown>[];
const { dataset_version } = JSON.parse(
  readFileSync(join(root, "data", "version.json"), "utf8"),
) as { dataset_version: string };

// Dataset version is semver.
if (!/^\d+\.\d+\.\d+$/.test(dataset_version)) {
  problems.push(`dataset_version "${dataset_version}" is not MAJOR.MINOR.PATCH semver`);
}

// Counts.
if (exercises.length !== EXPECTED_COUNTS.total) {
  problems.push(`expected ${EXPECTED_COUNTS.total} records, found ${exercises.length}`);
}
const tierCounts: Record<string, number> = {};
for (const e of exercises) {
  const tier = String(e.tier);
  tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
}
for (const tier of ["core", "extended"] as const) {
  if (tierCounts[tier] !== EXPECTED_COUNTS[tier]) {
    problems.push(
      `expected ${EXPECTED_COUNTS[tier]} ${tier} records, found ${tierCounts[tier] ?? 0}`,
    );
  }
}

// Unique ids.
const seen = new Set<string>();
for (const e of exercises) {
  const id = String(e.id);
  if (seen.has(id)) problems.push(`duplicate id "${id}"`);
  seen.add(id);
}

// Per-record schema conformance + cross-field consistency.
exercises.forEach((e, i) => {
  problems.push(...validateExercise(e, i));

  const id = String(e.id);
  if (typeof e.id === "string" && !/^[a-z0-9_]+$/.test(id)) {
    problems.push(`record[${i}] (${id}): id is not a snake_case slug`);
  }
  if (
    typeof e.default_rep_low === "number" &&
    typeof e.default_rep_high === "number" &&
    e.default_rep_low > e.default_rep_high
  ) {
    problems.push(`record[${i}] (${id}): default_rep_low > default_rep_high`);
  }
  if ((e.progression_group === null) !== (e.progression_level === null)) {
    problems.push(
      `record[${i}] (${id}): progression_group and progression_level must be null together`,
    );
  }
});

if (problems.length > 0) {
  console.error(`data:check FAILED — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}

console.log(
  `data:check OK — ${exercises.length} records (${tierCounts.core} core, ${tierCounts.extended} extended), ` +
    `all ids unique, schema conformant, dataset v${dataset_version}`,
);
