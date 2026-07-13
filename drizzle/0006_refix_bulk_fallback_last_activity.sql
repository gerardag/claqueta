-- 0005 already recomputes last_activity_at for shows caught in an import's
-- bulk-fallback "same minute, 3+ shows" fingerprint, but on at least one
-- database this left a handful of shows still pinned to the fallback
-- "now" timestamp (House of Cards, Chef's Table, El conte de la serventa,
-- You, Snowpiercer) — the migration tracking table shows 0005 as applied,
-- but its effect didn't stick for these rows. Re-running the exact same
-- recompute is harmless (it's idempotent: already-correct rows are
-- untouched) and guarantees every environment converges to the right
-- last_activity_at regardless of what happened the first time.
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
