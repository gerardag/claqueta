DROP TABLE IF EXISTS `imports`;--> statement-breakpoint
CREATE TABLE `imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`source` text DEFAULT 'tvtime' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_shows` integer DEFAULT 0 NOT NULL,
	`processed_shows` integer DEFAULT 0 NOT NULL,
	`imported_shows` integer DEFAULT 0 NOT NULL,
	`imported_episodes` integer DEFAULT 0 NOT NULL,
	`skipped_shows` integer DEFAULT 0 NOT NULL,
	`skipped_json` text,
	`csv_data_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE TABLE `tvdb_tmdb_map` (
	`tvdb_id` integer PRIMARY KEY NOT NULL,
	`tmdb_id` integer,
	`resolved_at` integer NOT NULL
);
