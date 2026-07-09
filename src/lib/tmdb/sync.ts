import { db } from "@/lib/db";
import { shows, episodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchTmdb } from "./client";
import type { TmdbShowDetailRaw, TmdbSeasonDetailRaw } from "./dto";

export async function upsertShowFromTmdb(tmdbId: number): Promise<number> {
  const detail = await fetchTmdb<TmdbShowDetailRaw>(`/tv/${tmdbId}`, {}, "show");

  const existing = db
    .select({ id: shows.id })
    .from(shows)
    .where(eq(shows.tmdbId, tmdbId))
    .get();

  const showValues = {
    tmdbId,
    name: detail.name,
    originalName: detail.original_name,
    overview: detail.overview,
    posterPath: detail.poster_path,
    backdropPath: detail.backdrop_path,
    firstAirDate: detail.first_air_date,
    status: detail.status,
    numberOfSeasons: detail.number_of_seasons,
    numberOfEpisodes: detail.number_of_episodes,
    nextAirDate: detail.next_episode_to_air?.air_date ?? null,
    lastSyncedAt: new Date(),
  };

  let showId: number;
  if (existing) {
    db.update(shows).set(showValues).where(eq(shows.id, existing.id)).run();
    showId = existing.id;
  } else {
    const result = db.insert(shows).values(showValues).returning({ id: shows.id }).get();
    showId = result.id;
  }

  for (const s of detail.seasons) {
    const season = await fetchTmdb<TmdbSeasonDetailRaw>(
      `/tv/${tmdbId}/season/${s.season_number}`,
      {},
      "season",
    );

    for (const ep of season.episodes) {
      db.insert(episodes)
        .values({
          showId,
          tmdbId: ep.id,
          seasonNumber: season.season_number,
          episodeNumber: ep.episode_number,
          name: ep.name,
          overview: ep.overview,
          airDate: ep.air_date,
          runtime: ep.runtime,
        })
        .onConflictDoUpdate({
          target: [episodes.showId, episodes.seasonNumber, episodes.episodeNumber],
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

  return showId;
}
