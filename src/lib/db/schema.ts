import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  locale: text("locale").notNull().default("ca"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// shows — local TMDB metadata cache, shared across users
// ---------------------------------------------------------------------------
export const shows = sqliteTable("shows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tmdbId: integer("tmdb_id").notNull().unique(),
  name: text("name").notNull(),
  originalName: text("original_name"),
  overview: text("overview"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  firstAirDate: text("first_air_date"),
  status: text("status"),
  numberOfSeasons: integer("number_of_seasons"),
  numberOfEpisodes: integer("number_of_episodes"),
  nextAirDate: text("next_air_date"),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// episodes — local TMDB episode cache
// ---------------------------------------------------------------------------
export const episodes = sqliteTable(
  "episodes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    showId: integer("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id"),
    seasonNumber: integer("season_number").notNull(),
    episodeNumber: integer("episode_number").notNull(),
    name: text("name"),
    overview: text("overview"),
    airDate: text("air_date"),
    runtime: integer("runtime"),
  },
  (t) => [
    uniqueIndex("episodes_show_season_episode_idx").on(
      t.showId,
      t.seasonNumber,
      t.episodeNumber,
    ),
    index("episodes_show_air_date_idx").on(t.showId, t.airDate),
  ],
);

// ---------------------------------------------------------------------------
// user_shows — user ↔ show relationship
// ---------------------------------------------------------------------------
export const userShows = sqliteTable(
  "user_shows",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showId: integer("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),
    state: text("state", {
      enum: ["WATCHING", "FOLLOWING", "COMPLETED", "STOPPED"],
    }).notNull(),
    lastActivityAt: integer("last_activity_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("user_shows_user_show_idx").on(t.userId, t.showId),
    index("user_shows_user_state_idx").on(t.userId, t.state),
  ],
);

// ---------------------------------------------------------------------------
// watched_episodes
// ---------------------------------------------------------------------------
export const watchedEpisodes = sqliteTable(
  "watched_episodes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    episodeId: integer("episode_id")
      .notNull()
      .references(() => episodes.id, { onDelete: "cascade" }),
    watchedAt: integer("watched_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("watched_episodes_user_episode_idx").on(t.userId, t.episodeId),
    index("watched_episodes_user_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// imports — TVTime import jobs
// ---------------------------------------------------------------------------
export const imports = sqliteTable("imports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull().default("tvtime"),
  status: text("status", {
    enum: ["pending", "running", "done", "error"],
  })
    .notNull()
    .default("pending"),
  totalShows: integer("total_shows").notNull().default(0),
  processedShows: integer("processed_shows").notNull().default(0),
  importedShows: integer("imported_shows").notNull().default(0),
  importedEpisodes: integer("imported_episodes").notNull().default(0),
  skippedShows: integer("skipped_shows").notNull().default(0),
  skippedJson: text("skipped_json"),
  csvDataJson: text("csv_data_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// tvdb_tmdb_map — persistent TVDB→TMDB ID mapping cache
// ---------------------------------------------------------------------------
export const tvdbTmdbMap = sqliteTable("tvdb_tmdb_map", {
  tvdbId: integer("tvdb_id").primaryKey(),
  tmdbId: integer("tmdb_id"),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// tmdb_cache — HTTP-level cache for TMDB API responses
// ---------------------------------------------------------------------------
export const tmdbCache = sqliteTable("tmdb_cache", {
  key: text("key").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

export type TmdbCacheEntry = InferSelectModel<typeof tmdbCache>;

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Show = InferSelectModel<typeof shows>;
export type NewShow = InferInsertModel<typeof shows>;

export type Episode = InferSelectModel<typeof episodes>;
export type NewEpisode = InferInsertModel<typeof episodes>;

export type UserShow = InferSelectModel<typeof userShows>;
export type NewUserShow = InferInsertModel<typeof userShows>;

export type WatchedEpisode = InferSelectModel<typeof watchedEpisodes>;
export type NewWatchedEpisode = InferInsertModel<typeof watchedEpisodes>;

export type Import = InferSelectModel<typeof imports>;
export type NewImport = InferInsertModel<typeof imports>;

export type TvdbTmdbMapEntry = InferSelectModel<typeof tvdbTmdbMap>;
