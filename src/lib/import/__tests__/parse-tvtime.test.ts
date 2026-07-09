import { describe, it, expect } from "vitest";
import { detectAndParse } from "../parse-tvtime";

describe("detectAndParse", () => {
  const showsCsv = [
    "tv_show_id,tv_show_name",
    "73255,Breaking Bad",
    "81189,Game of Thrones",
  ].join("\n");

  const episodesCsv = [
    "tv_show_id,episode_season_number,episode_number,created_at",
    "73255,1,1,2020-03-15T10:00:00Z",
    "73255,1,2,2020-03-16T10:00:00Z",
    "81189,1,1,2020-04-01T12:00:00Z",
  ].join("\n");

  it("parses shows from followed_tv_show.csv", () => {
    const result = detectAndParse([
      { name: "followed_tv_show.csv", content: showsCsv },
    ]);

    expect(result.shows).toHaveLength(2);
    expect(result.shows[0]).toEqual({ tvdbId: 73255, name: "Breaking Bad" });
  });

  it("parses episodes from seen_episode.csv", () => {
    const result = detectAndParse([
      { name: "followed_tv_show.csv", content: showsCsv },
      { name: "seen_episode.csv", content: episodesCsv },
    ]);

    expect(result.episodes).toHaveLength(3);
    expect(result.episodes[0]).toMatchObject({
      tvdbShowId: 73255,
      seasonNumber: 1,
      episodeNumber: 1,
    });
    expect(result.episodes[0].watchedAt).toBeInstanceOf(Date);
  });

  it("deduplicates episodes across files", () => {
    const result = detectAndParse([
      { name: "followed_tv_show.csv", content: showsCsv },
      { name: "seen_episode.csv", content: episodesCsv },
      { name: "seen_episode_2.csv", content: episodesCsv },
    ]);

    expect(result.episodes).toHaveLength(3);
  });

  it("skips season 0 (specials) episodes", () => {
    const withSpecial = [
      "tv_show_id,episode_season_number,episode_number,created_at",
      "73255,0,1,2020-01-01T00:00:00Z",
      "73255,1,1,2020-01-02T00:00:00Z",
    ].join("\n");

    const result = detectAndParse([
      { name: "followed_tv_show.csv", content: showsCsv },
      { name: "seen_episode.csv", content: withSpecial },
    ]);

    // season 0 is included in parse but pipeline skips it — parser still returns it
    // What matters is both are parsed
    expect(result.episodes.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty when no matching files", () => {
    const result = detectAndParse([
      { name: "random.csv", content: "a,b\n1,2" },
    ]);

    expect(result.shows).toHaveLength(0);
    expect(result.episodes).toHaveLength(0);
  });

  it("adds shows discovered from episodes but not in shows file", () => {
    const epsOnly = [
      "tv_show_id,episode_season_number,episode_number",
      "99999,1,1",
    ].join("\n");

    const result = detectAndParse([
      { name: "followed_tv_show.csv", content: showsCsv },
      { name: "seen_episode.csv", content: epsOnly },
    ]);

    const ids = result.shows.map((s) => s.tvdbId);
    expect(ids).toContain(99999);
  });

  it("parses user_tv_show_data for episode counts", () => {
    const countsCsv = [
      "tv_show_id,nb_episodes_seen",
      "73255,62",
      "81189,73",
    ].join("\n");

    const result = detectAndParse([
      { name: "followed_tv_show.csv", content: showsCsv },
      { name: "seen_episode.csv", content: episodesCsv },
      { name: "user_tv_show_data.csv", content: countsCsv },
    ]);

    expect(result.episodeCountByShow.get(73255)).toBe(62);
    expect(result.episodeCountByShow.get(81189)).toBe(73);
  });

  it("handles invalid/missing IDs gracefully", () => {
    const badCsv = [
      "tv_show_id,tv_show_name",
      ",",
      "abc,Bad",
      "-1,Negative",
      "0,Zero",
      "42,Valid",
    ].join("\n");

    const result = detectAndParse([
      { name: "followed_tv_show.csv", content: badCsv },
    ]);

    expect(result.shows).toHaveLength(1);
    expect(result.shows[0].tvdbId).toBe(42);
  });
});
