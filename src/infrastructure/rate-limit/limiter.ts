/**
 * Minimal in-memory rate limiter
 * @module infrastructure/rate-limit/limiter
 *
 * Fixed-window counter keyed by an arbitrary string (typically
 * `${route}:${ip}`). Deliberately simple — no Redis/Upstash dependency —
 * appropriate for this app's actual scale (single admin, low checkout
 * volume). Known limitation: state is per server instance/process, so it
 * resets on cold start and isn't shared across multiple instances if this
 * ever runs on a multi-instance deployment. That's an acceptable
 * trade-off for a basic abuse deterrent; swap for Upstash/Vercel KV if
 * the app ever needs durable, cross-instance limiting.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so this map can't grow unbounded
// across a long-lived server process.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();
function sweepExpired(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may retry, only meaningful when !allowed. */
  retryAfterSeconds: number;
}

/**
 * @param key Unique identifier for this limit bucket, e.g. `"login:1.2.3.4"`.
 * @param limit Max allowed hits within the window.
 * @param windowMs Window length in milliseconds.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP extraction from standard proxy headers (Vercel/most
 * reverse proxies set x-forwarded-for). Falls back to a constant so
 * environments without a proxy still get a (shared, coarser) limit rather
 * than no limit at all.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
