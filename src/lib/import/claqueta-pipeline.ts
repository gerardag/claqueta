import { db } from "@/lib/db";
import {
  imports,
  userShows,
  episodes as episodesTable,
  watchedEpisodes,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { upsertShowFromTmdb } from "@/lib/tmdb/sync";
import type { ClaquetaShow } from "./parse-claqueta";

interface SkippedEntry {
  tmdbId: number;
  name: string;
  reason: string;
}

export async function runClaquetaPipeline(
  importId: number,
  userId: number,
  showsList: ClaquetaShow[],
): Promise<void> {
  db.update(imports)
    .set({ status: "running", totalShows: showsList.length })
    .where(eq(imports.id, importId))
    .run();

  const skipped: SkippedEntry[] = [];
  let importedShows = 0;
  let importedEpisodes = 0;

  for (let i = 0; i < showsList.length; i++) {
    const show = showsList[i];
    try {
      let showId: number;
      try {
        showId = await upsertShowFromTmdb(show.tmdbId);
      } catch {
        skipped.push({
          tmdbId: show.tmdbId,
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

      const createdAt = typeof show.createdAt === "string"
        ? new Date(show.createdAt)
        : new Date(show.createdAt);
      const lastActivityAt = typeof show.lastActivityAt === "string"
        ? new Date(show.lastActivityAt)
        : new Date(show.lastActivityAt);

      if (!existingUserShow) {
        db.insert(userShows)
          .values({
            userId,
            showId,
            state: show.state,
            createdAt,
            lastActivityAt,
          })
          .onConflictDoNothing()
          .run();
      }

      let episodeCount = 0;
      for (const ep of show.watchedEpisodes) {
        const dbEp = db
          .select({ id: episodesTable.id })
          .from(episodesTable)
          .where(
            and(
              eq(episodesTable.showId, showId),
              eq(episodesTable.seasonNumber, ep.season),
              eq(episodesTable.episodeNumber, ep.episode),
            ),
          )
          .get();

        if (!dbEp) continue;

        const watchedAt = typeof ep.watchedAt === "string"
          ? new Date(ep.watchedAt)
          : new Date(ep.watchedAt);

        db.insert(watchedEpisodes)
          .values({ userId, episodeId: dbEp.id, watchedAt })
          .onConflictDoNothing()
          .run();

        episodeCount++;
      }

      importedShows++;
      importedEpisodes += episodeCount;
      updateProgress(importId, i + 1, importedShows, importedEpisodes, skipped.length);
    } catch {
      skipped.push({
        tmdbId: show.tmdbId,
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
