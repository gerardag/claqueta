import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const rows: Record<number, number | null> = {};
  return {
    db: {
      select: () => ({
        from: () => ({
          where: (cond: unknown) => ({
            get: () => {
              const tvdbId = (cond as { value: number }).value;
              return tvdbId in rows
                ? { tvdbId, tmdbId: rows[tvdbId] }
                : undefined;
            },
          }),
        }),
      }),
      insert: () => ({
        values: (v: { tvdbId: number; tmdbId: number | null }) => {
          rows[v.tvdbId] = v.tmdbId;
          return {
            onConflictDoUpdate: () => ({
              run: () => {},
            }),
          };
        },
      }),
    },
  };
});

vi.mock("@/lib/tmdb/client", () => ({
  findTmdbIdByTvdb: vi.fn(),
  searchTmdbShow: vi.fn(),
}));

import { findTmdbIdByTvdb, searchTmdbShow } from "@/lib/tmdb/client";

const findMock = vi.mocked(findTmdbIdByTvdb);
const searchMock = vi.mocked(searchTmdbShow);

describe("resolveTvdbToTmdb", () => {
  beforeEach(() => {
    vi.resetModules();
    findMock.mockReset();
    searchMock.mockReset();
  });

  it("uses TMDB find API as primary strategy", async () => {
    findMock.mockResolvedValue(12345);
    const { resolveTvdbToTmdb } = await import("../tvdb-resolver");
    const result = await resolveTvdbToTmdb(73255, "Breaking Bad");

    expect(findMock).toHaveBeenCalledWith(73255);
    expect(result).toBe(12345);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("falls back to search by name when find returns null", async () => {
    findMock.mockResolvedValue(null);
    searchMock.mockResolvedValue(54321);
    const { resolveTvdbToTmdb } = await import("../tvdb-resolver");
    const result = await resolveTvdbToTmdb(99999, "Unknown Show");

    expect(findMock).toHaveBeenCalledWith(99999);
    expect(searchMock).toHaveBeenCalledWith("Unknown Show");
    expect(result).toBe(54321);
  });

  it("returns null when both strategies fail", async () => {
    findMock.mockResolvedValue(null);
    searchMock.mockResolvedValue(null);
    const { resolveTvdbToTmdb } = await import("../tvdb-resolver");
    const result = await resolveTvdbToTmdb(11111, "Nonexistent");

    expect(result).toBeNull();
  });

  it("returns null when find fails and no name provided", async () => {
    findMock.mockResolvedValue(null);
    const { resolveTvdbToTmdb } = await import("../tvdb-resolver");
    const result = await resolveTvdbToTmdb(11111);

    expect(result).toBeNull();
    expect(searchMock).not.toHaveBeenCalled();
  });
});
