import { checkRateLimit, getClientIp } from "./limiter";

// The limiter keeps module-level shared state (a `Map` of buckets), so
// each test uses its own unique key to avoid cross-test interference
// within this file.
let keyCounter = 0;
function uniqueKey(prefix: string) {
  keyCounter += 1;
  return `${prefix}:${keyCounter}`;
}

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = uniqueKey("under");
    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("allows exactly `limit` requests, then blocks the next one", () => {
    const key = uniqueKey("exact");
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    const third = checkRateLimit(key, 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the count once the window elapses", () => {
    jest.useFakeTimers();
    try {
      const key = uniqueKey("window-reset");
      const windowMs = 10_000;

      expect(checkRateLimit(key, 1, windowMs).allowed).toBe(true);
      expect(checkRateLimit(key, 1, windowMs).allowed).toBe(false);

      jest.advanceTimersByTime(windowMs + 1);

      expect(checkRateLimit(key, 1, windowMs).allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it("tracks independent keys independently", () => {
    const keyA = uniqueKey("a");
    const keyB = uniqueKey("b");
    expect(checkRateLimit(keyA, 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit(keyA, 1, 60_000).allowed).toBe(false);
    // A different key should be unaffected by keyA's exhausted bucket.
    expect(checkRateLimit(keyB, 1, 60_000).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("prefers x-forwarded-for, taking the first entry", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(getClientIp(headers)).toBe("9.9.9.9");
  });

  it("falls back to 'unknown' when neither header is present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
