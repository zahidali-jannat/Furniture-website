import "server-only";

/**
 * A fixed-window limiter held in module memory.
 *
 * This is deliberately modest: it survives one server process, not a restart,
 * and not a horizontal scale-out. It is here so a single client cannot sit on
 * the endpoint and post a stranger's address a thousand times. Anything running
 * on more than one instance should back this with Redis or the platform's own
 * rate limiter.
 */
type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: limit - existing.count, retryAfter: 0 };
}

/** Keeps the map from growing without bound on a long-lived process. */
export function sweep() {
  const now = Date.now();
  for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
}
