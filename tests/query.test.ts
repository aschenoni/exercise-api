import { describe, expect, it } from "vitest";
import { EXERCISES } from "@/lib/dataset";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parseListQuery,
  runListQuery,
  QueryError,
} from "@/lib/query";

function run(qs: string) {
  return runListQuery(parseListQuery(new URLSearchParams(qs)));
}

describe("parseListQuery validation", () => {
  it("rejects unknown enum values with the valid list in the message", () => {
    expect(() => parseListQuery(new URLSearchParams("muscle=bicep"))).toThrow(QueryError);
    expect(() => parseListQuery(new URLSearchParams("muscle=bicep"))).toThrow(/biceps/);
    expect(() => parseListQuery(new URLSearchParams("pattern=pressing"))).toThrow(QueryError);
    expect(() => parseListQuery(new URLSearchParams("sort=sfr"))).toThrow(QueryError);
    expect(() => parseListQuery(new URLSearchParams("loadable=yep"))).toThrow(QueryError);
    expect(() => parseListQuery(new URLSearchParams("limit=-1"))).toThrow(QueryError);
    expect(() => parseListQuery(new URLSearchParams("limit=0"))).toThrow(QueryError);
    expect(() => parseListQuery(new URLSearchParams("offset=1.5"))).toThrow(QueryError);
    expect(() =>
      parseListQuery(new URLSearchParams("substitution_group=made_up")),
    ).toThrow(/\/v1\/meta/);
  });

  it("applies defaults and clamps limit to MAX_LIMIT", () => {
    const q = parseListQuery(new URLSearchParams(""));
    expect(q.limit).toBe(DEFAULT_LIMIT);
    expect(q.offset).toBe(0);
    expect(q.sort).toBe("name");
    expect(parseListQuery(new URLSearchParams("limit=99999")).limit).toBe(MAX_LIMIT);
  });
});

describe("runListQuery filters", () => {
  it("filters by primary muscle", () => {
    const { data, total } = run("muscle=chest&limit=200");
    expect(total).toBeGreaterThan(0);
    expect(data.every((e) => e.primary_muscle === "chest")).toBe(true);
  });

  it("treats comma-separated values as OR within a filter", () => {
    const chest = run("muscle=chest&limit=200").total;
    const lats = run("muscle=lats&limit=200").total;
    expect(run("muscle=chest,lats&limit=200").total).toBe(chest + lats);
  });

  it("ANDs distinct filters together", () => {
    const { data } = run("muscle=chest&sfr_class=high&gold_standard=true&limit=200");
    expect(
      data.every(
        (e) => e.primary_muscle === "chest" && e.sfr_class === "high" && e.is_gold_standard,
      ),
    ).toBe(true);
  });

  it("filters by secondary muscle involvement", () => {
    const { data, total } = run("secondary_muscle=triceps&limit=200");
    expect(total).toBeGreaterThan(0);
    expect(data.every((e) => e.secondary_muscles.includes("triceps"))).toBe(true);
  });

  it("equipment= matches exercises requiring that token", () => {
    const { data } = run("equipment=barbell&limit=200");
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((e) => (e.equipment as string[]).includes("barbell"))).toBe(true);
  });

  it("available_equipment= is a subset match with bodyweight implied", () => {
    const { data, total } = run("available_equipment=dumbbells,flat_bench&limit=200");
    expect(total).toBeGreaterThan(0);
    const allowed = new Set(["dumbbells", "flat_bench", "none_bodyweight"]);
    expect(data.every((e) => e.equipment.every((t) => allowed.has(t)))).toBe(true);
    // pure bodyweight exercises are reachable without listing none_bodyweight
    const bodyweightOnly = run("available_equipment=pullup_bar&limit=200").data;
    expect(
      bodyweightOnly.some((e) => (e.equipment as string[]).includes("none_bodyweight")),
    ).toBe(true);
  });

  it("filters progression chains", () => {
    const { data, total } = run("progression_group=dip_line&limit=200&sort=preferred_rank");
    expect(total).toBeGreaterThan(0);
    expect(data.every((e) => e.progression_group === "dip_line")).toBe(true);
  });

  it("q searches name and id case-insensitively", () => {
    const byName = run("q=Bench&limit=200");
    expect(byName.total).toBeGreaterThan(0);
    expect(
      byName.data.every(
        (e) => e.name.toLowerCase().includes("bench") || e.id.includes("bench"),
      ),
    ).toBe(true);
    expect(run("q=zzznothing").total).toBe(0);
  });

  it("boolean filters work in both directions", () => {
    const yes = run("unilateral=true&limit=200").total;
    const no = run("unilateral=false&limit=200").total;
    expect(yes + no).toBe(EXERCISES.length);
  });
});

describe("sorting and pagination", () => {
  it("sorts by name ascending by default, descending with -name", () => {
    const asc = run("limit=200").data.map((e) => e.name);
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)));
    const desc = run("sort=-name&limit=200").data.map((e) => e.name);
    expect(desc).toEqual([...asc].reverse());
  });

  it("sorts by preferred_rank with deterministic id tiebreak", () => {
    const { data } = run("muscle=chest&sort=preferred_rank&limit=200");
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const cur = data[i];
      expect(
        prev.preferred_rank < cur.preferred_rank ||
          (prev.preferred_rank === cur.preferred_rank && prev.id < cur.id),
      ).toBe(true);
    }
  });

  it("paginates without overlap or gaps", () => {
    const page1 = run("limit=10&offset=0");
    const page2 = run("limit=10&offset=10");
    expect(page1.data.length).toBe(10);
    expect(page1.total).toBe(EXERCISES.length);
    const all = run("limit=200");
    expect([...page1.data, ...page2.data].map((e) => e.id)).toEqual(
      all.data.slice(0, 20).map((e) => e.id),
    );
  });

  it("returns an empty page past the end, with correct total", () => {
    const { data, total } = run("offset=5000");
    expect(data).toEqual([]);
    expect(total).toBe(EXERCISES.length);
  });
});
