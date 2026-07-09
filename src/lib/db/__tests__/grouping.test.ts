import { describe, it, expect } from "vitest";
import type { ShowWithProgress } from "../queries";

function makeShow(overrides: Partial<ShowWithProgress>): ShowWithProgress {
  return {
    userShowId: 1,
    showId: 1,
    tmdbId: 1,
    name: "Test",
    posterPath: null,
    state: "WATCHING",
    lastActivityAt: new Date(),
    nextAirDate: null,
    watched: 5,
    totalAired: 10,
    totalEpisodes: 10,
    nextEpisode: null,
    latestUnwatchedAirDate: null,
    ...overrides,
  };
}

function groupShows(items: ShowWithProgress[], staleDays = 45) {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);

  const watching: ShowWithProgress[] = [];
  const watchlist: ShowWithProgress[] = [];
  const stale: ShowWithProgress[] = [];
  const following: ShowWithProgress[] = [];
  const completed: ShowWithProgress[] = [];
  const stopped: ShowWithProgress[] = [];

  for (const item of items) {
    const pending = item.totalAired - item.watched;

    switch (item.state) {
      case "WATCHING":
        if (item.watched === 0) {
          watchlist.push(item);
        } else if (item.lastActivityAt <= staleThreshold) {
          stale.push(item);
        } else if (pending === 0 && !item.nextAirDate) {
          following.push(item);
        } else {
          watching.push(item);
        }
        break;
      case "FOLLOWING":
        if (item.lastActivityAt <= staleThreshold) {
          stale.push(item);
        } else {
          following.push(item);
        }
        break;
      case "COMPLETED":
        completed.push(item);
        break;
      case "STOPPED":
        stopped.push(item);
        break;
    }
  }

  return { watching, watchlist, stale, following, completed, stopped };
}

describe("groupShows", () => {
  it("puts WATCHING with watched=0 in watchlist", () => {
    const show = makeShow({ state: "WATCHING", watched: 0 });
    const groups = groupShows([show]);
    expect(groups.watchlist).toHaveLength(1);
    expect(groups.watching).toHaveLength(0);
  });

  it("puts WATCHING with old activity in stale", () => {
    const show = makeShow({
      state: "WATCHING",
      watched: 5,
      lastActivityAt: new Date("2024-01-01"),
    });
    const groups = groupShows([show]);
    expect(groups.stale).toHaveLength(1);
    expect(groups.watching).toHaveLength(0);
  });

  it("puts WATCHING with no pending and no nextAirDate in following", () => {
    const show = makeShow({
      state: "WATCHING",
      watched: 10,
      totalAired: 10,
      nextAirDate: null,
    });
    const groups = groupShows([show]);
    expect(groups.following).toHaveLength(1);
  });

  it("puts active WATCHING with pending episodes in watching", () => {
    const show = makeShow({
      state: "WATCHING",
      watched: 5,
      totalAired: 10,
    });
    const groups = groupShows([show]);
    expect(groups.watching).toHaveLength(1);
  });

  it("puts FOLLOWING with old activity in stale", () => {
    const show = makeShow({
      state: "FOLLOWING",
      lastActivityAt: new Date("2024-01-01"),
    });
    const groups = groupShows([show]);
    expect(groups.stale).toHaveLength(1);
    expect(groups.following).toHaveLength(0);
  });

  it("puts COMPLETED in completed", () => {
    const show = makeShow({ state: "COMPLETED" });
    const groups = groupShows([show]);
    expect(groups.completed).toHaveLength(1);
  });

  it("puts STOPPED in stopped", () => {
    const show = makeShow({ state: "STOPPED" });
    const groups = groupShows([show]);
    expect(groups.stopped).toHaveLength(1);
  });

  it("sorts watching by latestUnwatchedAirDate descending", () => {
    const a = makeShow({
      userShowId: 1,
      name: "A",
      latestUnwatchedAirDate: "2025-01-01",
      totalAired: 10,
      watched: 5,
    });
    const b = makeShow({
      userShowId: 2,
      name: "B",
      latestUnwatchedAirDate: "2025-06-01",
      totalAired: 10,
      watched: 5,
    });
    const groups = groupShows([a, b]);

    groups.watching.sort((x, y) => {
      const xDate = x.latestUnwatchedAirDate ?? "";
      const yDate = y.latestUnwatchedAirDate ?? "";
      if (xDate !== yDate) return yDate.localeCompare(xDate);
      return y.lastActivityAt.getTime() - x.lastActivityAt.getTime();
    });

    expect(groups.watching[0].name).toBe("B");
  });
});
