import { describe, expect, it } from "vitest";
import { DATASET_VERSION, EXERCISES, getExerciseById, getMeta } from "@/lib/dataset";
import { EXPECTED_COUNTS, validateExercise } from "@/lib/schema";

describe("dataset contract", () => {
  it("has the expected record and tier counts", () => {
    expect(EXERCISES.length).toBe(EXPECTED_COUNTS.total);
    expect(EXERCISES.filter((e) => e.tier === "core").length).toBe(EXPECTED_COUNTS.core);
    expect(EXERCISES.filter((e) => e.tier === "extended").length).toBe(
      EXPECTED_COUNTS.extended,
    );
  });

  it("has globally unique ids", () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });

  it("conforms to FIELD_SPECS record by record", () => {
    const problems = EXERCISES.flatMap((e, i) => validateExercise(e, i));
    expect(problems).toEqual([]);
  });

  it("exposes a semver dataset version", () => {
    expect(DATASET_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("looks up exercises by id", () => {
    expect(getExerciseById("barbell_bench_press")?.name).toBe("Barbell Bench Press");
    expect(getExerciseById("nope")).toBeUndefined();
  });

  it("computes meta whose counts sum back to the dataset", () => {
    const meta = getMeta();
    expect(meta.counts.total).toBe(EXPECTED_COUNTS.total);
    expect(meta.counts.by_tier).toEqual({
      core: EXPECTED_COUNTS.core,
      extended: EXPECTED_COUNTS.extended,
    });
    const muscleSum = meta.primary_muscles.reduce((s, m) => s + m.count, 0);
    expect(muscleSum).toBe(EXPECTED_COUNTS.total);
    expect(meta.primary_muscles.length).toBe(16);
    expect(meta.patterns.length).toBe(20);
    expect(meta.equipment.length).toBe(34);
    expect(meta.modalities).toEqual([
      { value: "calisthenics", count: 47 },
      { value: "hypertrophy", count: 136 },
    ]);
    expect(meta.dataset_version).toBe(DATASET_VERSION);
  });
});
