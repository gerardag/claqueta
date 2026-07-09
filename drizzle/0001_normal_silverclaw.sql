CREATE TABLE `tmdb_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`expires_at` integer NOT NULL
);
