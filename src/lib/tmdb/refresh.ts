import { db } from "@/lib/db";
import { shows, episodes, userShows } from "@/lib/db/schema";
import { eq, and, inArray, lt } from "drizzle-orm";
import { fetchTmdb } from "./client";
import type { TmdbShowDetailRaw, TmdbSeasonDetailRaw } from "./dto";

const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;
const NON_AIRING_STATUSES = ["Ended", "Canceled"];

export async function refreshUpcoming(userId: number): Promise<void> {
  const threshold = new Date(Date.now() - SYNC_INTERVAL_MS);

  const staleShows = db
    .select({
      showId: shows.id,
      tmdbId: shows.tmdbId,
      status: shows.status,
      numberOfSeasons: shows.numberOfSeasons,
    })
    .from(shows)
    .innerJoin(userShows, eq(userShows.showId, shows.id))
    .where(
      and(
        eq(userShows.userId, userId),
        inArray(userShows.state, ["WATCHING", "FOLLOWING"]),
        lt(shows.lastSyncedAt, threshold),
      ),
    )
    .all()
    .filter((s) => !NON_AIRING_STATUSES.includes(s.status ?? ""));

  for (const show of staleShows) {
    try {
      const detail = await fetchTmdb<TmdbShowDetailRaw>(
        `/tv/${show.tmdbId}`,
        {},
        "show",
      );

      db.update(shows)
        .set({
          name: detail.name,
          status: detail.status,
          numberOfSeasons: detail.number_of_seasons,
          numberOfEpisodes: detail.number_of_episodes,
          nextAirDate: detail.next_episode_to_air?.air_date ?? null,
          lastSyncedAt: new Date(),
        })
        .where(eq(shows.id, show.showId))
        .run();

      const seasonsToSync = detail.seasons.filter(
        (s) => s.season_number >= (show.numberOfSeasons ?? 1),
      );

      for (const s of seasonsToSync) {
        const season = await fetchTmdb<TmdbSeasonDetailRaw>(
          `/tv/${show.tmdbId}/season/${s.season_number}`,
          {},
          "season",
        );

        for (const ep of season.episodes) {
          db.insert(episodes)
            .values({
              showId: show.showId,
              tmdbId: ep.id,
              seasonNumber: season.season_number,
              episodeNumber: ep.episode_number,
              name: ep.name,
              overview: ep.overview,
              airDate: ep.air_date,
              runtime: ep.runtime,
            })
            .onConflictDoUpdate({
              target: [
                episodes.showId,
                episodes.seasonNumber,
                episodes.episodeNumber,
              ],
              set: {
                tmdbId: ep.id,
                name: ep.name,
                overview: ep.overview,
                airDate: ep.air_date,
                runtime: ep.runtime,
              },
            })
            .run();
        }
      }
    } catch {
      // Skip shows that fail to sync — don't block the rest
    }
  }
}
