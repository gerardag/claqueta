import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userShows, shows, episodes, watchedEpisodes } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);

  const trackedShows = db
    .select({
      tmdbId: shows.tmdbId,
      name: shows.name,
      state: userShows.state,
      createdAt: userShows.createdAt,
      lastActivityAt: userShows.lastActivityAt,
      showId: shows.id,
    })
    .from(userShows)
    .innerJoin(shows, eq(userShows.showId, shows.id))
    .where(eq(userShows.userId, userId))
    .all();

  const exportShows = trackedShows.map((s) => {
    const watched = db
      .select({
        seasonNumber: episodes.seasonNumber,
        episodeNumber: episodes.episodeNumber,
        watchedAt: watchedEpisodes.watchedAt,
      })
      .from(watchedEpisodes)
      .innerJoin(episodes, eq(watchedEpisodes.episodeId, episodes.id))
      .where(
        and(
          eq(watchedEpisodes.userId, userId),
          eq(episodes.showId, s.showId),
        ),
      )
      .all();

    return {
      tmdbId: s.tmdbId,
      name: s.name,
      state: s.state,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      watchedEpisodes: watched.map((e) => ({
        season: e.seasonNumber,
        episode: e.episodeNumber,
        watchedAt: e.watchedAt,
      })),
    };
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    shows: exportShows,
  };

  const filename = `claqueta-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
