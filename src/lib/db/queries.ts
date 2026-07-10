import { eq, and, sql, asc, gt, gte, lte, inArray } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DB = BetterSQLite3Database<typeof schema>;

const STALE_DAYS = Number(process.env.STALE_DAYS ?? "45");

export interface NextEpisodeInfo {
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  airDate: string | null;
  pendingAfter: number;
}

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
  nextEpisode: NextEpisodeInfo | null;
  latestUnwatchedAirDate: string | null;
}

export function getUserShowsGrouped(db: DB, userId: number) {
  const now = new Date();
  const staleThreshold = new Date(
    now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000,
  );

  const today = now.toISOString().slice(0, 10);

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
          and ${schema.episodes.airDate} <= ${today}
      ), 0)`,
      nextEpSeason: sql<number | null>`(
        select ${schema.episodes.seasonNumber} from ${schema.episodes}
        where ${schema.episodes.showId} = ${schema.shows.id}
          and ${schema.episodes.airDate} <= ${today}
          and ${schema.episodes.id} not in (
            select ${schema.watchedEpisodes.episodeId} from ${schema.watchedEpisodes}
            where ${schema.watchedEpisodes.userId} = ${userId}
          )
        order by ${schema.episodes.seasonNumber} asc, ${schema.episodes.episodeNumber} asc
        limit 1
      )`,
      nextEpNumber: sql<number | null>`(
        select ${schema.episodes.episodeNumber} from ${schema.episodes}
        where ${schema.episodes.showId} = ${schema.shows.id}
          and ${schema.episodes.airDate} <= ${today}
          and ${schema.episodes.id} not in (
            select ${schema.watchedEpisodes.episodeId} from ${schema.watchedEpisodes}
            where ${schema.watchedEpisodes.userId} = ${userId}
          )
        order by ${schema.episodes.seasonNumber} asc, ${schema.episodes.episodeNumber} asc
        limit 1
      )`,
      nextEpName: sql<string | null>`(
        select ${schema.episodes.name} from ${schema.episodes}
        where ${schema.episodes.showId} = ${schema.shows.id}
          and ${schema.episodes.airDate} <= ${today}
          and ${schema.episodes.id} not in (
            select ${schema.watchedEpisodes.episodeId} from ${schema.watchedEpisodes}
            where ${schema.watchedEpisodes.userId} = ${userId}
          )
        order by ${schema.episodes.seasonNumber} asc, ${schema.episodes.episodeNumber} asc
        limit 1
      )`,
      nextEpAirDate: sql<string | null>`(
        select ${schema.episodes.airDate} from ${schema.episodes}
        where ${schema.episodes.showId} = ${schema.shows.id}
          and ${schema.episodes.airDate} <= ${today}
          and ${schema.episodes.id} not in (
            select ${schema.watchedEpisodes.episodeId} from ${schema.watchedEpisodes}
            where ${schema.watchedEpisodes.userId} = ${userId}
          )
        order by ${schema.episodes.seasonNumber} asc, ${schema.episodes.episodeNumber} asc
        limit 1
      )`,
      latestUnwatchedAirDate: sql<string | null>`(
        select ${schema.episodes.airDate} from ${schema.episodes}
        where ${schema.episodes.showId} = ${schema.shows.id}
          and ${schema.episodes.airDate} <= ${today}
          and ${schema.episodes.id} not in (
            select ${schema.watchedEpisodes.episodeId} from ${schema.watchedEpisodes}
            where ${schema.watchedEpisodes.userId} = ${userId}
          )
        order by ${schema.episodes.seasonNumber} desc, ${schema.episodes.episodeNumber} desc
        limit 1
      )`,
    })
    .from(schema.userShows)
    .innerJoin(schema.shows, eq(schema.userShows.showId, schema.shows.id))
    .where(eq(schema.userShows.userId, userId))
    .all();

  const watching: ShowWithProgress[] = [];
  const watchlist: ShowWithProgress[] = [];
  const stale: ShowWithProgress[] = [];
  const following: ShowWithProgress[] = [];
  const completed: ShowWithProgress[] = [];
  const stopped: ShowWithProgress[] = [];

  for (const row of rows) {
    const pending = row.totalAired - row.watched;
    const nextEpisode: NextEpisodeInfo | null =
      row.nextEpSeason != null && row.nextEpNumber != null
        ? {
            seasonNumber: row.nextEpSeason,
            episodeNumber: row.nextEpNumber,
            name: row.nextEpName,
            airDate: row.nextEpAirDate,
            pendingAfter: Math.max(0, pending - 1),
          }
        : null;

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
      nextEpisode,
      latestUnwatchedAirDate: row.latestUnwatchedAirDate,
    };

    const pendingEpisodesAreOld =
      row.nextEpAirDate != null &&
      new Date(row.nextEpAirDate + "T00:00:00") < staleThreshold;

    switch (row.state) {
      case "WATCHING":
        if (row.watched === 0) {
          watchlist.push(item);
        } else if (
          row.lastActivityAt <= staleThreshold ||
          pendingEpisodesAreOld
        ) {
          stale.push(item);
        } else if (pending === 0 && !row.nextAirDate) {
          following.push(item);
        } else {
          watching.push(item);
        }
        break;
      case "FOLLOWING":
        if (
          row.lastActivityAt <= staleThreshold ||
          pendingEpisodesAreOld
        ) {
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

  watching.sort((a, b) => {
    const aDate = a.latestUnwatchedAirDate ?? "";
    const bDate = b.latestUnwatchedAirDate ?? "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
  });
  watchlist.sort((a, b) => a.name.localeCompare(b.name));
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

  return { watching, watchlist, stale, following, completed, stopped };
}

export interface LibraryShow {
  userShowId: number;
  tmdbId: number;
  name: string;
  posterPath: string | null;
  state: schema.UserShow["state"];
  watched: number;
  totalAired: number;
}

export function getLibraryShows(db: DB, userId: number): LibraryShow[] {
  const today = new Date().toISOString().slice(0, 10);

  return db
    .select({
      userShowId: schema.userShows.id,
      tmdbId: schema.shows.tmdbId,
      name: schema.shows.name,
      posterPath: schema.shows.posterPath,
      state: schema.userShows.state,
      watched: sql<number>`coalesce((
        select count(*) from ${schema.watchedEpisodes}
        inner join ${schema.episodes} on ${schema.episodes.id} = ${schema.watchedEpisodes.episodeId}
        where ${schema.watchedEpisodes.userId} = ${userId}
          and ${schema.episodes.showId} = ${schema.shows.id}
      ), 0)`,
      totalAired: sql<number>`coalesce((
        select count(*) from ${schema.episodes}
        where ${schema.episodes.showId} = ${schema.shows.id}
          and ${schema.episodes.airDate} <= ${today}
      ), 0)`,
    })
    .from(schema.userShows)
    .innerJoin(schema.shows, eq(schema.userShows.showId, schema.shows.id))
    .where(eq(schema.userShows.userId, userId))
    .orderBy(asc(schema.shows.name))
    .all();
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

export interface CalendarEpisode {
  episodeId: number;
  showId: number;
  showName: string;
  posterPath: string | null;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  airDate: string;
  watched: boolean;
}

export function getCalendar(
  db: DB,
  userId: number,
  from: string,
  to: string,
): CalendarEpisode[] {
  return db
    .select({
      episodeId: schema.episodes.id,
      showId: schema.shows.id,
      showName: schema.shows.name,
      posterPath: schema.shows.posterPath,
      seasonNumber: schema.episodes.seasonNumber,
      episodeNumber: schema.episodes.episodeNumber,
      name: schema.episodes.name,
      airDate: schema.episodes.airDate,
      watched: sql<boolean>`exists(
        select 1 from ${schema.watchedEpisodes}
        where ${schema.watchedEpisodes.userId} = ${userId}
          and ${schema.watchedEpisodes.episodeId} = ${schema.episodes.id}
      )`,
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
    .where(
      and(
        inArray(schema.userShows.state, ["WATCHING", "FOLLOWING"]),
        gte(schema.episodes.airDate, from),
        lte(schema.episodes.airDate, to),
      ),
    )
    .orderBy(asc(schema.episodes.airDate), asc(schema.shows.name))
    .all() as CalendarEpisode[];
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

export function upsertUserShowState(
  db: DB,
  userId: number,
  showId: number,
  state: schema.UserShow["state"],
): void {
  db.insert(schema.userShows)
    .values({ userId, showId, state })
    .onConflictDoUpdate({
      target: [schema.userShows.userId, schema.userShows.showId],
      set: { state, lastActivityAt: new Date() },
    })
    .run();
}

export function getUserShowByTmdbId(
  db: DB,
  userId: number,
  tmdbId: number,
): (schema.UserShow & { showId: number }) | undefined {
  return db
    .select({
      id: schema.userShows.id,
      userId: schema.userShows.userId,
      showId: schema.userShows.showId,
      state: schema.userShows.state,
      lastActivityAt: schema.userShows.lastActivityAt,
      createdAt: schema.userShows.createdAt,
    })
    .from(schema.userShows)
    .innerJoin(schema.shows, eq(schema.userShows.showId, schema.shows.id))
    .where(
      and(
        eq(schema.userShows.userId, userId),
        eq(schema.shows.tmdbId, tmdbId),
      ),
    )
    .get() as (schema.UserShow & { showId: number }) | undefined;
}

export function getWatchedEpisodeIds(
  db: DB,
  userId: number,
  showId: number,
): Set<number> {
  const rows = db
    .select({ episodeId: schema.watchedEpisodes.episodeId })
    .from(schema.watchedEpisodes)
    .innerJoin(
      schema.episodes,
      eq(schema.episodes.id, schema.watchedEpisodes.episodeId),
    )
    .where(
      and(
        eq(schema.watchedEpisodes.userId, userId),
        eq(schema.episodes.showId, showId),
      ),
    )
    .all();
  return new Set(rows.map((r) => r.episodeId));
}

export function getShowByTmdbId(
  db: DB,
  tmdbId: number,
): schema.Show | undefined {
  return db
    .select()
    .from(schema.shows)
    .where(eq(schema.shows.tmdbId, tmdbId))
    .get();
}

export function getEpisodesByShow(
  db: DB,
  showId: number,
): schema.Episode[] {
  return db
    .select()
    .from(schema.episodes)
    .where(eq(schema.episodes.showId, showId))
    .orderBy(asc(schema.episodes.seasonNumber), asc(schema.episodes.episodeNumber))
    .all();
}

export function getEpisodeByShowSeasonEp(
  db: DB,
  showId: number,
  seasonNumber: number,
  episodeNumber: number,
): schema.Episode | undefined {
  return db
    .select()
    .from(schema.episodes)
    .where(
      and(
        eq(schema.episodes.showId, showId),
        eq(schema.episodes.seasonNumber, seasonNumber),
        eq(schema.episodes.episodeNumber, episodeNumber),
      ),
    )
    .get();
}

export function unmarkEpisodeWatched(
  db: DB,
  userId: number,
  episodeId: number,
): void {
  db.delete(schema.watchedEpisodes)
    .where(
      and(
        eq(schema.watchedEpisodes.userId, userId),
        eq(schema.watchedEpisodes.episodeId, episodeId),
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
