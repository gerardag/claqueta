import { db } from "@/lib/db";
import {
  imports,
  userShows,
  episodes as episodesTable,
  watchedEpisodes,
} from "@/lib/db/schema";
import { eq, and, lte, gt, sql } from "drizzle-orm";
import { resolveTvdbToTmdb } from "./tvdb-resolver";
import { upsertShowFromTmdb } from "@/lib/tmdb/sync";
import type { TvTimeShow, TvTimeEpisode } from "./parse-tvtime";

interface SkippedEntry {
  tvdbId: number;
  name: string;
  reason: string;
}

export async function runImportPipeline(
  importId: number,
  userId: number,
  showsList: TvTimeShow[],
  episodesList: TvTimeEpisode[],
  episodeCountByShow?: Map<number, number>,
): Promise<void> {
  db.update(imports)
    .set({ status: "running", totalShows: showsList.length })
    .where(eq(imports.id, importId))
    .run();

  const episodesByShow = new Map<number, TvTimeEpisode[]>();
  for (const ep of episodesList) {
    const list = episodesByShow.get(ep.tvdbShowId) ?? [];
    list.push(ep);
    episodesByShow.set(ep.tvdbShowId, list);
  }

  const skipped: SkippedEntry[] = [];
  let importedShows = 0;
  let importedEpisodes = 0;

  for (let i = 0; i < showsList.length; i++) {
    const show = showsList[i];
    try {
      const tmdbId = await resolveTvdbToTmdb(show.tvdbId, show.name);
      if (!tmdbId) {
        skipped.push({
          tvdbId: show.tvdbId,
          name: show.name,
          reason: "No s'ha trobat a TMDB",
        });
        updateProgress(importId, i + 1, importedShows, importedEpisodes, skipped.length);
        continue;
      }

      let showId: number;
      try {
        showId = await upsertShowFromTmdb(tmdbId);
      } catch {
        skipped.push({
          tvdbId: show.tvdbId,
          name: show.name,
          reason: "Error sincronitzant des de TMDB",
        });
        updateProgress(importId, i + 1, importedShows, importedEpisodes, skipped.length);
        continue;
      }

      const existingUserShow = db
        .select({ id: userShows.id })
        .from(userShows)
        .where(and(eq(userShows.userId, userId), eq(userShows.showId, showId)))
        .get();

      if (!existingUserShow) {
        db.insert(userShows)
          .values({ userId, showId, state: "WATCHING" })
          .onConflictDoNothing()
          .run();
      }

      const showEpisodes = episodesByShow.get(show.tvdbId) ?? [];
      let episodeCount = 0;
      let latestWatched: Date | null = null;

      for (const ep of showEpisodes) {
        if (ep.seasonNumber === 0) continue;

        const dbEp = db
          .select({ id: episodesTable.id })
          .from(episodesTable)
          .where(
            and(
              eq(episodesTable.showId, showId),
              eq(episodesTable.seasonNumber, ep.seasonNumber),
              eq(episodesTable.episodeNumber, ep.episodeNumber),
            ),
          )
          .get();

        if (!dbEp) continue;

        const watchedAt = ep.watchedAt ?? new Date();
        db.insert(watchedEpisodes)
          .values({ userId, episodeId: dbEp.id, watchedAt })
          .onConflictDoNothing()
          .run();

        episodeCount++;
        if (!latestWatched || watchedAt > latestWatched) {
          latestWatched = watchedAt;
        }
      }

      const expectedCount = episodeCountByShow?.get(show.tvdbId) ?? 0;
      if (expectedCount > episodeCount) {
        const today = new Date().toISOString().slice(0, 10);
        const airedEps = db
          .select({ id: episodesTable.id })
          .from(episodesTable)
          .leftJoin(
            watchedEpisodes,
            and(
              eq(watchedEpisodes.episodeId, episodesTable.id),
              eq(watchedEpisodes.userId, userId),
            ),
          )
          .where(
            and(
              eq(episodesTable.showId, showId),
              gt(episodesTable.seasonNumber, 0),
              lte(episodesTable.airDate, today),
              sql`${watchedEpisodes.id} IS NULL`,
            ),
          )
          .orderBy(episodesTable.seasonNumber, episodesTable.episodeNumber)
          .all();

        const remaining = expectedCount - episodeCount;
        const toMark = airedEps.slice(0, remaining);
        const fallbackDate = new Date();
        for (const ep of toMark) {
          db.insert(watchedEpisodes)
            .values({ userId, episodeId: ep.id, watchedAt: fallbackDate })
            .onConflictDoNothing()
            .run();
          episodeCount++;
        }
        if (toMark.length > 0) latestWatched = fallbackDate;
      }

      if (latestWatched) {
        db.update(userShows)
          .set({ lastActivityAt: latestWatched })
          .where(
            and(eq(userShows.userId, userId), eq(userShows.showId, showId)),
          )
          .run();
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const counts = db
        .select({
          aired: sql<number>`count(*)`,
          watched: sql<number>`count(${watchedEpisodes.id})`,
        })
        .from(episodesTable)
        .leftJoin(
          watchedEpisodes,
          and(
            eq(watchedEpisodes.episodeId, episodesTable.id),
            eq(watchedEpisodes.userId, userId),
          ),
        )
        .where(
          and(
            eq(episodesTable.showId, showId),
            gt(episodesTable.seasonNumber, 0),
            lte(episodesTable.airDate, todayStr),
          ),
        )
        .get();

      const airedCount = counts?.aired ?? 0;
      const watchedCount = counts?.watched ?? 0;

      if (airedCount > 0 && watchedCount >= airedCount && !existingUserShow) {
        db.update(userShows)
          .set({ state: "COMPLETED" })
          .where(
            and(eq(userShows.userId, userId), eq(userShows.showId, showId)),
          )
          .run();
      }

      importedShows++;
      importedEpisodes += episodeCount;
      updateProgress(importId, i + 1, importedShows, importedEpisodes, skipped.length);
    } catch {
      skipped.push({
        tvdbId: show.tvdbId,
        name: show.name,
        reason: "Error inesperat",
      });
      updateProgress(importId, i + 1, importedShows, importedEpisodes, skipped.length);
    }
  }

  db.update(imports)
    .set({
      status: "done",
      processedShows: showsList.length,
      importedShows,
      importedEpisodes,
      skippedShows: skipped.length,
      skippedJson: JSON.stringify(skipped),
    })
    .where(eq(imports.id, importId))
    .run();
}

function updateProgress(
  importId: number,
  processed: number,
  imported: number,
  episodes: number,
  skippedCount: number,
): void {
  db.update(imports)
    .set({
      processedShows: processed,
      importedShows: imported,
      importedEpisodes: episodes,
      skippedShows: skippedCount,
    })
    .where(eq(imports.id, importId))
    .run();
}
