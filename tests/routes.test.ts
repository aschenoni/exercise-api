import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { DATASET_VERSION, EXERCISES } from "@/lib/dataset";
import { GET as listExercises } from "@/app/v1/exercises/route";
import { GET as getExercise } from "@/app/v1/exercises/[id]/route";
import { GET as getMeta } from "@/app/v1/meta/route";
import { GET as getHealth } from "@/app/health/route";
import { GET as getOpenApi } from "@/app/openapi.json/route";
import { GET as v1Fallback } from "@/app/v1/[...missing]/route";

const req = (url: string) => new NextRequest(`http://localhost${url}`);
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /v1/exercises", () => {
  it("returns the list envelope with contract headers", async () => {
    const res = listExercises(req("/v1/exercises?muscle=chest&limit=5"));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Dataset-Version")).toBe(DATASET_VERSION);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
    const body = await res.json();
    expect(body.object).toBe("list");
    expect(body.count).toBe(body.data.length);
    expect(body.count).toBeLessThanOrEqual(5);
    expect(body.total).toBeGreaterThanOrEqual(body.count);
    expect(body.limit).toBe(5);
    expect(body.offset).toBe(0);
  });

  it("400s with the error envelope on invalid params", async () => {
    const res = listExercises(req("/v1/exercises?muscle=nope"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_parameter");
    expect(body.error.message).toContain("biceps");
  });
});

describe("GET /v1/exercises/{id}", () => {
  it("returns the bare record", async () => {
    const res = await getExercise(req("/v1/exercises/barbell_bench_press"), params("barbell_bench_press"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("barbell_bench_press");
    expect(Object.keys(body).length).toBe(20);
    expect(body.modality).toBe("hypertrophy");
  });

  it("404s with the error envelope on a miss", async () => {
    const res = await getExercise(req("/v1/exercises/not_real"), params("not_real"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("not_found");
  });
});

describe("GET /v1/meta and /health", () => {
  it("meta exposes vocabularies and the dataset version", async () => {
    const res = getMeta();
    const body = await res.json();
    expect(body.object).toBe("meta");
    expect(body.dataset_version).toBe(DATASET_VERSION);
    expect(body.counts.total).toBe(EXERCISES.length);
  });

  it("health reports liveness and dataset size, uncached", async () => {
    const res = getHealth();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json();
    expect(body).toEqual({
      status: "ok",
      dataset_version: DATASET_VERSION,
      exercises: EXERCISES.length,
    });
  });
});

describe("GET /openapi.json", () => {
  it("serves a valid-looking 3.1 doc derived from the contract", async () => {
    const res = getOpenApi(req("/openapi.json"));
    const doc = await res.json();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.servers[0].url).toBe("http://localhost");
    // /v1/chat is absent while the CHAT_ENABLED kill switch is off (default)
    expect(Object.keys(doc.paths)).toEqual([
      "/v1/exercises",
      "/v1/exercises/{id}",
      "/v1/meta",
      "/v1/suggestions",
      "/health",
    ]);
    const props = doc.components.schemas.Exercise.properties;
    expect(Object.keys(props).length).toBe(20);
    expect(props.primary_muscle.enum.length).toBe(16);
    expect(props.modality.enum).toEqual([
      "hypertrophy",
      "conditioning",
      "calisthenics",
      "mobility",
    ]);
    // nullable-by-contract fields are JSON Schema type unions
    expect(props.e1rm_substitution_group.type).toEqual(["string", "null"]);
    expect(props.sfr_class.type).toEqual(["string", "null"]);
    expect(doc.paths["/v1/exercises"].get.operationId).toBe("listExercises");
  });
});

describe("unknown /v1 paths", () => {
  it("fall through to a JSON 404 envelope", async () => {
    const res = v1Fallback();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("not_found");
  });
});
