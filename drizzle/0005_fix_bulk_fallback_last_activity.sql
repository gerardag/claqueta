-- 0003/0004 recomputed last_activity_at for shows corrupted by the tvtime
-- import's date-fallback (see pipeline.ts), but only for episodes whose
-- watched_at fell within 15 minutes of a row in `imports`. That table
-- doesn't have a row for every import that ever ran (older/orphaned
-- imports), so shows corrupted by those were never touched — and some
-- fallback-marked episodes don't even share an identical millisecond
-- timestamp with each other (they're stamped one `new Date()` call per
-- episode in a loop), so a same-value cluster check misses them too.
--
-- The reliable signal is at the show level, not the episode level: no
-- human finishes watching several *different* shows within the same
-- minute. When 3+ distinct shows for the same user have last_activity_at
-- landing in the same one-minute window, that's the fingerprint of a
-- single bulk import run touching all of them at once, not real
-- activity. For user_shows caught in such a window, recompute
-- last_activity_at from the show's own watched episodes, excluding any
-- watched_at that also falls in one of that user's suspect windows. If
-- nothing real is left, fall back to the epoch so the show is judged on
-- its merits again instead of looking permanently fresh.
WITH suspect_windows AS (
  SELECT user_id, (last_activity_at / 60000) AS minute_bucket
  FROM `user_shows`
  GROUP BY user_id, minute_bucket
  HAVING COUNT(DISTINCT show_id) >= 3
)
UPDATE `user_shows`
SET `last_activity_at` = coalesce((
  SELECT MAX(we.watched_at)
  FROM `watched_episodes` we
  JOIN `episodes` e ON e.id = we.episode_id
  WHERE e.show_id = `user_shows`.show_id
    AND we.user_id = `user_shows`.user_id
    AND NOT EXISTS (
      SELECT 1 FROM suspect_windows sw
      WHERE sw.user_id = we.user_id
        AND sw.minute_bucket = (we.watched_at / 60000)
    )
), 0)
WHERE EXISTS (
  SELECT 1 FROM suspect_windows sw
  WHERE sw.user_id = `user_shows`.user_id
    AND sw.minute_bucket = (`user_shows`.last_activity_at / 60000)
);
