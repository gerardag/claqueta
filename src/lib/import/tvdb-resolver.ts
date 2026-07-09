import { db } from "@/lib/db";
import { tvdbTmdbMap } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { findTmdbIdByTvdb, searchTmdbShow } from "@/lib/tmdb/client";

export async function resolveTvdbToTmdb(
  tvdbId: number,
  showName?: string,
): Promise<number | null> {
  const cached = db
    .select()
    .from(tvdbTmdbMap)
    .where(eq(tvdbTmdbMap.tvdbId, tvdbId))
    .get();

  if (cached?.tmdbId) return cached.tmdbId;

  let tmdbId = await findTmdbIdByTvdb(tvdbId);

  if (!tmdbId && showName) {
    tmdbId = await searchTmdbShow(showName);
  }

  db.insert(tvdbTmdbMap)
    .values({ tvdbId, tmdbId, resolvedAt: new Date() })
    .onConflictDoUpdate({
      target: tvdbTmdbMap.tvdbId,
      set: { tmdbId, resolvedAt: new Date() },
    })
    .run();

  return tmdbId;
}
