import { describe, it, expect } from "vitest";
import {
  normalizeSearchResult,
  normalizeShowDetail,
  normalizeSeasonDetail,
  type TmdbSearchShowRaw,
  type TmdbShowDetailRaw,
  type TmdbSeasonDetailRaw,
} from "../dto";

describe("normalizeSearchResult", () => {
  it("maps raw TMDB fields to DTO with image URL", () => {
    const raw: TmdbSearchShowRaw = {
      id: 42,
      name: "Test Show",
      overview: "A test show",
      poster_path: "/abc.jpg",
      backdrop_path: "/bg.jpg",
      first_air_date: "2024-01-15",
    };

    const result = normalizeSearchResult(raw);

    expect(result).toEqual({
      id: 42,
      name: "Test Show",
      overview: "A test show",
      posterUrl: "https://image.tmdb.org/t/p/w342/abc.jpg",
      firstAirDate: "2024-01-15",
    });
  });

  it("returns null posterUrl when poster_path is null", () => {
    const raw: TmdbSearchShowRaw = {
      id: 1,
      name: "No Poster",
      overview: "",
      poster_path: null,
      backdrop_path: null,
      first_air_date: "",
    };

    expect(normalizeSearchResult(raw).posterUrl).toBeNull();
  });
});

describe("normalizeShowDetail", () => {
  const base: TmdbShowDetailRaw = {
    id: 100,
    name: "Detail Show",
    original_name: "Original",
    overview: "Overview text",
    poster_path: "/poster.jpg",
    backdrop_path: "/backdrop.jpg",
    first_air_date: "2023-06-01",
    status: "Returning Series",
    number_of_seasons: 3,
    number_of_episodes: 30,
    next_episode_to_air: { air_date: "2024-03-15" },
    seasons: [
      {
        id: 200,
        season_number: 1,
        name: "Season 1",
        episode_count: 10,
        air_date: "2023-06-01",
        poster_path: "/s1.jpg",
      },
    ],
  };

  it("normalizes all fields including nextAirDate", () => {
    const result = normalizeShowDetail(base);

    expect(result.id).toBe(100);
    expect(result.posterUrl).toBe("https://image.tmdb.org/t/p/w342/poster.jpg");
    expect(result.backdropUrl).toBe("https://image.tmdb.org/t/p/w780/backdrop.jpg");
    expect(result.nextAirDate).toBe("2024-03-15");
    expect(result.seasons).toHaveLength(1);
    expect(result.seasons[0].posterUrl).toBe("https://image.tmdb.org/t/p/w185/s1.jpg");
  });

  it("returns null nextAirDate when next_episode_to_air is null", () => {
    const result = normalizeShowDetail({ ...base, next_episode_to_air: null });
    expect(result.nextAirDate).toBeNull();
  });
});

describe("normalizeSeasonDetail", () => {
  it("normalizes season with episodes", () => {
    const raw: TmdbSeasonDetailRaw = {
      id: 300,
      season_number: 2,
      name: "Season 2",
      episodes: [
        {
          id: 401,
          episode_number: 1,
          name: "Pilot",
          overview: "First episode",
          air_date: "2024-01-01",
          runtime: 45,
          still_path: "/still.jpg",
        },
        {
          id: 402,
          episode_number: 2,
          name: "Second",
          overview: "",
          air_date: null,
          runtime: null,
          still_path: null,
        },
      ],
    };

    const result = normalizeSeasonDetail(raw);

    expect(result.seasonNumber).toBe(2);
    expect(result.episodes).toHaveLength(2);
    expect(result.episodes[0].stillUrl).toBe("https://image.tmdb.org/t/p/w300/still.jpg");
    expect(result.episodes[1].stillUrl).toBeNull();
    expect(result.episodes[1].airDate).toBeNull();
  });
});
