/**
 * Anonymous per-IP rate limiting (PRODUCT.md §7): the public free tier is
 * "first 100 calls each day", plus a per-minute burst limit so one client
 * can't monopolize compute.
 *
 * Store: Upstash Redis over REST when UPSTASH_REDIS_REST_URL/TOKEN are set
 * (accurate across all edge/serverless instances); otherwise an in-memory
 * map — best-effort per instance, which is acceptable pre-traffic and
 * degrades open (never blocks incorrectly on store failure).
 */

export const DAILY_LIMIT = 100;
export const BURST_LIMIT = 60; // per minute

export interface RateLimitResult {
  allowed: boolean;
  /** Which limit tripped (only when !allowed). */
  reason?: "burst" | "daily";
  limit: number;
  remaining: number;
  /** Seconds until the daily window resets (UTC midnight). */
  resetSeconds: number;
  retryAfterSeconds?: number;
}

interface Store {
  /** Increment key, setting ttl (seconds) if the key is new. Returns new count. */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

class MemoryStore implements Store {
  private map = new Map<string, { count: number; expiresAt: number }>();
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    const entry = this.map.get(key);
    if (!entry || entry.expiresAt <= now) {
      // opportunistic cleanup so the map can't grow unbounded
      if (this.map.size > 10_000) {
        for (const [k, v] of this.map) if (v.expiresAt <= now) this.map.delete(k);
      }
      this.map.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
}

class UpstashStore implements Store {
  constructor(
    private url: string,
    private token: string,
  ) {}
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(ttlSeconds), "NX"],
      ]),
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    const data = (await res.json()) as { result: number }[];
    return data[0].result;
  }
}

function defaultStore(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new UpstashStore(url, token) : new MemoryStore();
}

let store: Store | undefined;

export interface RateLimitOptions {
  dailyLimit?: number;
  burstLimit?: number;
  now?: number;
  store?: Store;
  /** Separate bucket namespace (e.g. "chat", "sugg") — default shared "api". */
  scope?: string;
}

/**
 * Global (not per-IP) daily counter — used for the chat spend cap.
 * Returns the new count; throws are swallowed to 0 (degrade open).
 */
export async function bumpDailyCounter(name: string, now = Date.now()): Promise<number> {
  const s = store ??= defaultStore();
  const day = new Date(now).toISOString().slice(0, 10);
  const ttl = Math.max(1, Math.ceil((Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate() + 1,
  ) - now) / 1000));
  try {
    return await s.incr(`ctr:${name}:${day}`, ttl);
  } catch {
    return 0;
  }
}

export async function checkRateLimit(
  ip: string,
  opts: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const dailyLimit = opts.dailyLimit ?? DAILY_LIMIT;
  const burstLimit = opts.burstLimit ?? BURST_LIMIT;
  const now = opts.now ?? Date.now();
  const s = opts.store ?? (store ??= defaultStore());

  const day = new Date(now).toISOString().slice(0, 10);
  const minute = Math.floor(now / 60_000);
  const nextUtcMidnight = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate() + 1,
  );
  const resetSeconds = Math.max(1, Math.ceil((nextUtcMidnight - now) / 1000));

  const scope = opts.scope ?? "api";
  try {
    const [daily, burst] = await Promise.all([
      s.incr(`rl:${scope}:d:${ip}:${day}`, resetSeconds),
      s.incr(`rl:${scope}:m:${ip}:${minute}`, 60),
    ]);

    if (burst > burstLimit) {
      return {
        allowed: false,
        reason: "burst",
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - daily),
        resetSeconds,
        retryAfterSeconds: 60 - Math.floor((now / 1000) % 60),
      };
    }
    if (daily > dailyLimit) {
      return {
        allowed: false,
        reason: "daily",
        limit: dailyLimit,
        remaining: 0,
        resetSeconds,
        retryAfterSeconds: resetSeconds,
      };
    }
    return {
      allowed: true,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - daily),
      resetSeconds,
    };
  } catch {
    // Degrade open: a broken store must never take the API down.
    return { allowed: true, limit: dailyLimit, remaining: dailyLimit, resetSeconds };
  }
}
