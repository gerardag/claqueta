import { describe, it, expect } from "vitest";
import { ttlMs } from "../cache";

describe("ttlMs", () => {
  it("returns 24h for search", () => {
    expect(ttlMs("search")).toBe(24 * 60 * 60 * 1000);
  });

  it("returns 24h for show", () => {
    expect(ttlMs("show")).toBe(24 * 60 * 60 * 1000);
  });

  it("returns 7 days for season", () => {
    expect(ttlMs("season")).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("returns 6h for airing", () => {
    expect(ttlMs("airing")).toBe(6 * 60 * 60 * 1000);
  });
});
