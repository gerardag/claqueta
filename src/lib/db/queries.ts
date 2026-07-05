import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "./schema";

type DB = BetterSQLite3Database<typeof schema>;

// TODO: implement
export function getUserShows(
  _db: DB,
  _userId: number,
  _state?: schema.UserShow["state"],
): schema.UserShow[] {
  throw new Error("Not implemented");
}

// TODO: implement
export function getShowProgress(
  _db: DB,
  _userId: number,
  _showId: number,
): { watched: number; total: number } {
  throw new Error("Not implemented");
}

// TODO: implement
export function touchActivity(
  _db: DB,
  _userId: number,
  _showId: number,
): void {
  throw new Error("Not implemented");
}

// TODO: implement
export function markEpisodeWatched(
  _db: DB,
  _userId: number,
  _episodeId: number,
): void {
  throw new Error("Not implemented");
}

// TODO: implement
export function getUpcoming(
  _db: DB,
  _userId: number,
): (schema.Episode & { showName: string })[] {
  throw new Error("Not implemented");
}

// TODO: implement
export function upsertShow(_db: DB, _show: schema.NewShow): schema.Show {
  throw new Error("Not implemented");
}

// TODO: implement
export function upsertEpisodes(
  _db: DB,
  _episodes: schema.NewEpisode[],
): void {
  throw new Error("Not implemented");
}
