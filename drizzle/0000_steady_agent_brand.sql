CREATE TABLE `episodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`show_id` integer NOT NULL,
	`tmdb_id` integer,
	`season_number` integer NOT NULL,
	`episode_number` integer NOT NULL,
	`name` text,
	`overview` text,
	`air_date` text,
	`runtime` integer,
	FOREIGN KEY (`show_id`) REFERENCES `shows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `episodes_show_season_episode_idx` ON `episodes` (`show_id`,`season_number`,`episode_number`);--> statement-breakpoint
CREATE INDEX `episodes_show_air_date_idx` ON `episodes` (`show_id`,`air_date`);--> statement-breakpoint
CREATE TABLE `imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`source` text DEFAULT 'tvtime' NOT NULL,
	`total_rows` integer NOT NULL,
	`imported_rows` integer NOT NULL,
	`skipped_rows` integer NOT NULL,
	`errors_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`name` text NOT NULL,
	`original_name` text,
	`overview` text,
	`poster_path` text,
	`backdrop_path` text,
	`first_air_date` text,
	`status` text,
	`number_of_seasons` integer,
	`number_of_episodes` integer,
	`next_air_date` text,
	`last_synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shows_tmdb_id_unique` ON `shows` (`tmdb_id`);--> statement-breakpoint
CREATE TABLE `user_shows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`show_id` integer NOT NULL,
	`state` text NOT NULL,
	`last_activity_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`show_id`) REFERENCES `shows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_shows_user_show_idx` ON `user_shows` (`user_id`,`show_id`);--> statement-breakpoint
CREATE INDEX `user_shows_user_state_idx` ON `user_shows` (`user_id`,`state`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text,
	`locale` text DEFAULT 'ca' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `watched_episodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`episode_id` integer NOT NULL,
	`watched_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `watched_episodes_user_episode_idx` ON `watched_episodes` (`user_id`,`episode_id`);--> statement-breakpoint
CREATE INDEX `watched_episodes_user_idx` ON `watched_episodes` (`user_id`);