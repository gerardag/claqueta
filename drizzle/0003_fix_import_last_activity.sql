-- The tvtime import (src/lib/import/pipeline.ts) used to fall back to
-- `new Date()` as the watched_at date for episodes it couldn't match
-- 1:1 by date, and let that fallback date overwrite last_activity_at
-- for the whole show. That made shows nobody had actually touched in
-- years look freshly watched, so they showed up under "watching"
-- instead of "stale". The pipeline no longer does this (see commit
-- history), but shows already imported before the fix still carry the
-- corrupted last_activity_at. Recompute it from real dated episodes,
-- ignoring watched_at timestamps that fall within 15 minutes of any
-- import's created_at (the fallback window). Shows with no
-- non-fallback dated episode are left untouched since there's no
-- reliable date to recompute from.
UPDATE `user_shows`
SET `last_activity_at` = (
  SELECT MAX(we.watched_at)
  FROM `watched_episodes` we
  JOIN `episodes` e ON e.id = we.episode_id
  WHERE e.show_id = `user_shows`.show_id
    AND we.user_id = `user_shows`.user_id
    AND NOT EXISTS (
      SELECT 1 FROM `imports` i
      WHERE we.watched_at >= i.created_at
        AND we.watched_at <= i.created_at + 15 * 60 * 1000
    )
)
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
AND EXISTS (
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
