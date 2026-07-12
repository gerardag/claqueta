-- 0003 recomputed last_activity_at for shows whose watched episodes were a
-- mix of real dates and import-fallback dates (using the max real date).
-- It deliberately skipped shows where EVERY watched episode came from the
-- fallback (no real date to recompute from at all), leaving last_activity_at
-- pinned to the import's created_at — often "now", making an untouched show
-- look freshly watched and keeping it out of the "stale" bucket forever.
--
-- There's no reliable watched date to recover for these, so reset them to
-- the epoch. That's well past STALE_DAYS in every case, so they fall back
-- into "stale" where the user can re-evaluate them, instead of sitting
-- indefinitely in "watching"/"following".
UPDATE `user_shows`
SET `last_activity_at` = 0
WHERE EXISTS (
  SELECT 1
  FROM `watched_episodes` we
  JOIN `episodes` e ON e.id = we.episode_id
  WHERE e.show_id = `user_shows`.show_id
    AND we.user_id = `user_shows`.user_id
    AND EXISTS (
      SELECT 1 FROM `imports` i
      WHERE we.watched_at >= i.created_at
        AND we.watched_at <= i.created_at + 15 * 60 * 1000
    )
)
AND NOT EXISTS (
  SELECT 1
  FROM `watched_episodes` we
  JOIN `episodes` e ON e.id = we.episode_id
  WHERE e.show_id = `user_shows`.show_id
    AND we.user_id = `user_shows`.user_id
    AND NOT EXISTS (
      SELECT 1 FROM `imports` i
      WHERE we.watched_at >= i.created_at
        AND we.watched_at <= i.created_at + 15 * 60 * 1000
    )
);
