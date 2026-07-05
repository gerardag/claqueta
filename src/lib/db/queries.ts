import { eq, and, sql, asc, gt } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DB = BetterSQLite3Database<typeof schema>;

const STALE_DAYS = Number(process.env.STALE_DAYS ?? "45");

export interface ShowWithProgress {
  userShowId: number;
  showId: number;
  tmdbId: number;
  name: string;
  posterPath: string | null;
  state: schema.UserShow["state"];
  lastActivityAt: Date;
  nextAirDate: string | null;
  watched: number;
  totalAired: number;
  totalEpisodes: number;
}

export function getUserShowsGrouped(db: DB, userId: number) {
  const now = new Date();
  const staleThreshold = new Date(
    now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000,
  );

  const rows = db
    .select({
      userShowId: schema.userShows.id,
      showId: schema.shows.id,
      tmdbId: schema.shows.tmdbId,
      name: schema.shows.name,
      posterPath: schema.shows.posterPath,
      state: schema.userShows.state,
      lastActivityAt: schema.userShows.lastActivityAt,
      nextAirDate: schema.shows.nextAirDate,
      totalEpisodes: sql<number>`coalesce(${schema.shows.numberOfEpisodes}, 0)`,
      watched: sql<number>`coalesce((
        select count(*) from ${schema.watchedEpisodes}
        inner join ${schema.episodes} on ${schema.episodes.id} = ${schema.watchedEpisodes.episodeId}
        where ${schema.watchedEpisodes.userId} = ${userId}
          and ${schema.episodes.showId} = ${schema.shows.id}
      ), 0)`,
      totalAired: sql<number>`coalesce((
        select count(*) from ${schema.episodes}
        where ${schema.episodes.showId} = ${schema.shows.id}
          and ${schema.episodes.airDate} <= ${now.toISOString().slice(0, 10)}
      ), 0)`,
    })
    .from(schema.userShows)
    .innerJoin(schema.shows, eq(schema.userShows.showId, schema.shows.id))
    .where(eq(schema.userShows.userId, userId))
    .all();

  const watching: ShowWithProgress[] = [];
  const stale: ShowWithProgress[] = [];
  const following: ShowWithProgress[] = [];
  const completed: ShowWithProgress[] = [];
  const stopped: ShowWithProgress[] = [];

  for (const row of rows) {
    const item: ShowWithProgress = {
      userShowId: row.userShowId,
      showId: row.showId,
      tmdbId: row.tmdbId,
      name: row.name,
      posterPath: row.posterPath,
      state: row.state,
      lastActivityAt: row.lastActivityAt,
      nextAirDate: row.nextAirDate,
      watched: row.watched,
      totalAired: row.totalAired,
      totalEpisodes: row.totalEpisodes,
    };

    switch (row.state) {
      case "WATCHING":
        if (row.lastActivityAt > staleThreshold) {
          watching.push(item);
        } else {
          stale.push(item);
        }
        break;
      case "FOLLOWING":
        following.push(item);
        break;
      case "COMPLETED":
        completed.push(item);
        break;
      case "STOPPED":
        stopped.push(item);
        break;
    }
  }

  watching.sort(
    (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime(),
  );
  stale.sort(
    (a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime(),
  );
  following.sort((a, b) => {
    if (!a.nextAirDate) return 1;
    if (!b.nextAirDate) return -1;
    return a.nextAirDate.localeCompare(b.nextAirDate);
  });
  completed.sort(
    (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime(),
  );
  stopped.sort(
    (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime(),
  );

  return { watching, stale, following, completed, stopped };
}

export function getUserShows(
  db: DB,
  userId: number,
  state?: schema.UserShow["state"],
): schema.UserShow[] {
  if (state) {
    return db
      .select()
      .from(schema.userShows)
      .where(
        and(
          eq(schema.userShows.userId, userId),
          eq(schema.userShows.state, state),
        ),
      )
      .all();
  }
  return db
    .select()
    .from(schema.userShows)
    .where(eq(schema.userShows.userId, userId))
    .all();
}

export function getShowProgress(
  db: DB,
  userId: number,
  showId: number,
): { watched: number; total: number } {
  const today = new Date().toISOString().slice(0, 10);

  const [result] = db
    .select({
      watched: sql<number>`coalesce((
        select count(*) from ${schema.watchedEpisodes}
        inner join ${schema.episodes} on ${schema.episodes.id} = ${schema.watchedEpisodes.episodeId}
        where ${schema.watchedEpisodes.userId} = ${userId}
          and ${schema.episodes.showId} = ${showId}
      ), 0)`,
      total: sql<number>`coalesce((
        select count(*) from ${schema.episodes}
        where ${schema.episodes.showId} = ${showId}
          and ${schema.episodes.airDate} <= ${today}
      ), 0)`,
    })
    .from(sql`(select 1)`)
    .all();

  return { watched: result.watched, total: result.total };
}

export function touchActivity(db: DB, userId: number, showId: number): void {
  db.update(schema.userShows)
    .set({ lastActivityAt: new Date() })
    .where(
      and(
        eq(schema.userShows.userId, userId),
        eq(schema.userShows.showId, showId),
      ),
    )
    .run();
}

export function markEpisodeWatched(
  db: DB,
  userId: number,
  episodeId: number,
): void {
  db.insert(schema.watchedEpisodes)
    .values({ userId, episodeId })
    .onConflictDoNothing()
    .run();
}

export function getUpcoming(
  db: DB,
  userId: number,
): (schema.Episode & { showName: string })[] {
  const today = new Date().toISOString().slice(0, 10);

  return db
    .select({
      id: schema.episodes.id,
      showId: schema.episodes.showId,
      tmdbId: schema.episodes.tmdbId,
      seasonNumber: schema.episodes.seasonNumber,
      episodeNumber: schema.episodes.episodeNumber,
      name: schema.episodes.name,
      overview: schema.episodes.overview,
      airDate: schema.episodes.airDate,
      runtime: schema.episodes.runtime,
      showName: schema.shows.name,
    })
    .from(schema.episodes)
    .innerJoin(schema.shows, eq(schema.episodes.showId, schema.shows.id))
    .innerJoin(
      schema.userShows,
      and(
        eq(schema.userShows.showId, schema.shows.id),
        eq(schema.userShows.userId, userId),
      ),
    )
    .where(gt(schema.episodes.airDate, today))
    .orderBy(asc(schema.episodes.airDate))
    .all();
}

export function upsertShow(db: DB, show: schema.NewShow): schema.Show {
  return db
    .insert(schema.shows)
    .values(show)
    .onConflictDoUpdate({
      target: schema.shows.tmdbId,
      set: {
        name: show.name,
        originalName: show.originalName,
        overview: show.overview,
        posterPath: show.posterPath,
        backdropPath: show.backdropPath,
        firstAirDate: show.firstAirDate,
        status: show.status,
        numberOfSeasons: show.numberOfSeasons,
        numberOfEpisodes: show.numberOfEpisodes,
        nextAirDate: show.nextAirDate,
        lastSyncedAt: new Date(),
      },
    })
    .returning()
    .get();
}

export function upsertEpisodes(db: DB, episodes: schema.NewEpisode[]): void {
  if (episodes.length === 0) return;
  for (const ep of episodes) {
    db.insert(schema.episodes)
      .values(ep)
      .onConflictDoUpdate({
        target: [
          schema.episodes.showId,
          schema.episodes.seasonNumber,
          schema.episodes.episodeNumber,
        ],
        set: {
          tmdbId: ep.tmdbId,
          name: ep.name,
          overview: ep.overview,
          airDate: ep.airDate,
          runtime: ep.runtime,
        },
      })
      .run();
  }
}

export function updateUserShowState(
  db: DB,
  userId: number,
  showId: number,
  state: schema.UserShow["state"],
): void {
  db.update(schema.userShows)
    .set({ state, lastActivityAt: new Date() })
    .where(
      and(
        eq(schema.userShows.userId, userId),
        eq(schema.userShows.showId, showId),
      ),
    )
    .run();
}

export function deleteUserShow(db: DB, userId: number, showId: number): void {
  db.delete(schema.userShows)
    .where(
      and(
        eq(schema.userShows.userId, userId),
        eq(schema.userShows.showId, showId),
      ),
    )
    .run();
}
