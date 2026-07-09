import { describe, it, expect, vi, beforeEach } from "vitest";

describe("rate-limiter", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("allows requests up to the limit", async () => {
    vi.stubEnv("TMDB_RATE_LIMIT", "3");
    const { tryAcquire } = await import("../rate-limiter");

    expect(tryAcquire()).toBe(true);
    expect(tryAcquire()).toBe(true);
    expect(tryAcquire()).toBe(true);
    expect(tryAcquire()).toBe(false);
  });

  it("reports ms until available when exhausted", async () => {
    vi.stubEnv("TMDB_RATE_LIMIT", "1");
    const { tryAcquire, msUntilAvailable } = await import("../rate-limiter");

    tryAcquire();
    const ms = msUntilAvailable();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(60_000);
  });
});
