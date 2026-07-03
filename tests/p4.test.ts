import { afterEach, describe, expect, it, vi } from "vitest";
import { retrieveContext } from "@/lib/retrieval";
import { POST as suggest } from "@/app/v1/suggestions/route";
import { POST as chat } from "@/app/v1/chat/route";

const post = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("retrieval", () => {
  it("surfaces relevant records with compact shape", () => {
    const ctx = retrieveContext("best dumbbell chest press");
    expect(ctx.length).toBeGreaterThan(0);
    expect(ctx.length).toBeLessThanOrEqual(12);
    expect(ctx[0]).toHaveProperty("id");
    expect(ctx[0]).toHaveProperty("cues");
    expect(
      ctx.some(
        (e) => e.primary_muscle === "chest" || (e.equipment as string[]).includes("dumbbells"),
      ),
    ).toBe(true);
  });

  it("returns empty for gibberish", () => {
    expect(retrieveContext("zzz qqq xxyzzy")).toEqual([]);
  });
});

describe("POST /v1/suggestions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("503s with a helpful pointer when no token is configured", async () => {
    vi.stubEnv("GITHUB_ISSUES_TOKEN", "");
    const res = await suggest(post("/v1/suggestions", { type: "other", title: "hello there" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error.code).toBe("service_unavailable");
  });

  it("validates type, title, and exercise_id existence", async () => {
    vi.stubEnv("GITHUB_ISSUES_TOKEN", "tok");
    const cases: [unknown, RegExp][] = [
      [{ type: "spam", title: "valid title" }, /type/],
      [{ type: "other", title: "hi" }, /title/],
      [{ type: "correction", title: "fix the thing", exercise_id: "not_real" }, /does not exist/],
    ];
    for (const [body, msg] of cases) {
      const res = await suggest(post("/v1/suggestions", body));
      expect(res.status).toBe(400);
      expect((await res.json()).error.message).toMatch(msg);
    }
  });

  it("files a GitHub issue and returns 202 with the url", async () => {
    vi.stubEnv("GITHUB_ISSUES_TOKEN", "tok");
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(
          JSON.stringify({ html_url: "https://github.com/x/y/issues/1", number: 1 }),
          { status: 201 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await suggest(
      post("/v1/suggestions", {
        type: "correction",
        title: "Bench press cue tweak",
        exercise_id: "barbell_bench_press",
        details: "Cue wording suggestion.",
      }),
    );
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.status).toBe("received");
    expect(body.issue_url).toContain("/issues/1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/repos/aschenoni/exercise-api/issues");
    const sent = JSON.parse(String(init?.body));
    expect(sent.title).toBe("[suggestion] Bench press cue tweak");
    expect(sent.labels).toContain("suggestion:correction");
  });
});

describe("POST /v1/chat", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("503s when no gateway credentials exist", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    vi.stubEnv("VERCEL_OIDC_TOKEN", "");
    vi.stubEnv("VERCEL", "");
    const res = await chat(post("/v1/chat", { messages: [] }));
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("service_unavailable");
  });

  it("400s on malformed bodies when credentials exist", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    const res = await chat(post("/v1/chat", { messages: [] }));
    expect(res.status).toBe(400);
    const noText = await chat(
      post("/v1/chat", { messages: [{ id: "1", role: "user", parts: [] }] }),
    );
    expect(noText.status).toBe(400);
  });
});
