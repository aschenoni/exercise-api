import { describe, expect, it } from "vitest";
import { checkRateLimit, DAILY_LIMIT, BURST_LIMIT } from "@/lib/ratelimit";

// Fixed clock: 2026-07-03T12:00:00Z — resetSeconds should be 12h.
const NOON = Date.UTC(2026, 6, 3, 12, 0, 0);

describe("checkRateLimit (in-memory store)", () => {
  it("allows requests under both limits with correct headers data", async () => {
    const r = await checkRateLimit("ip-a", { now: NOON });
    expect(r.allowed).toBe(true);
    expect(r.limit).toBe(DAILY_LIMIT);
    expect(r.remaining).toBe(DAILY_LIMIT - 1);
    expect(r.resetSeconds).toBe(12 * 3600);
  });

  it("trips the burst limit and recovers the next minute", async () => {
    let last;
    for (let i = 0; i < BURST_LIMIT + 1; i++) {
      last = await checkRateLimit("ip-burst", { now: NOON, dailyLimit: 10_000 });
    }
    expect(last!.allowed).toBe(false);
    expect(last!.reason).toBe("burst");
    expect(last!.retryAfterSeconds).toBeGreaterThan(0);
    expect(last!.retryAfterSeconds).toBeLessThanOrEqual(60);
    // next minute: burst key rotates, allowed again
    const next = await checkRateLimit("ip-burst", { now: NOON + 60_000, dailyLimit: 10_000 });
    expect(next.allowed).toBe(true);
  });

  it("trips the daily limit with Retry-After until UTC midnight", async () => {
    let last;
    for (let i = 0; i < 6; i++) {
      // spread across minutes so burst never trips
      last = await checkRateLimit("ip-daily", {
        now: NOON + i * 60_000,
        dailyLimit: 5,
        burstLimit: 3,
      });
    }
    expect(last!.allowed).toBe(false);
    expect(last!.reason).toBe("daily");
    expect(last!.remaining).toBe(0);
    expect(last!.retryAfterSeconds).toBe(last!.resetSeconds);
    // next UTC day: fresh allowance
    const tomorrow = await checkRateLimit("ip-daily", {
      now: NOON + 13 * 3600_000,
      dailyLimit: 5,
      burstLimit: 3,
    });
    expect(tomorrow.allowed).toBe(true);
  });

  it("degrades open when the store throws", async () => {
    const broken = {
      incr: async () => {
        throw new Error("store down");
      },
    };
    const r = await checkRateLimit("ip-x", { now: NOON, store: broken });
    expect(r.allowed).toBe(true);
  });

  it("tracks IPs independently", async () => {
    await checkRateLimit("ip-1", { now: NOON, dailyLimit: 1, burstLimit: 10 });
    const blocked = await checkRateLimit("ip-1", { now: NOON + 61_000, dailyLimit: 1, burstLimit: 10 });
    const other = await checkRateLimit("ip-2", { now: NOON, dailyLimit: 1, burstLimit: 10 });
    expect(blocked.allowed).toBe(false);
    expect(other.allowed).toBe(true);
  });
});
