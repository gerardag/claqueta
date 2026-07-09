"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  markEpisodeWatched,
  unmarkEpisodeWatched,
  touchActivity,
  getShowByTmdbId,
  getEpisodeByShowSeasonEp,
  getEpisodesByShow,
  updateUserShowState,
  getUserShowByTmdbId,
} from "@/lib/db/queries";
import { requireUser } from "@/lib/auth-helpers";
import { upsertShowFromTmdb } from "@/lib/tmdb/sync";

export async function toggleEpisodeAction(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  watched: boolean,
) {
  const user = await requireUser();
  const userId = Number(user.id);

  await upsertShowFromTmdb(tmdbId);
  const show = getShowByTmdbId(db, tmdbId);
  if (!show) return;

  const episode = getEpisodeByShowSeasonEp(
    db,
    show.id,
    seasonNumber,
    episodeNumber,
  );
  if (!episode) return;

  if (watched) {
    unmarkEpisodeWatched(db, userId, episode.id);
  } else {
    markEpisodeWatched(db, userId, episode.id);
    touchActivity(db, userId, show.id);

    const userShow = getUserShowByTmdbId(db, userId, tmdbId);
    if (userShow && userShow.state === "STOPPED") {
      updateUserShowState(db, userId, show.id, "WATCHING");
    }
  }

  revalidatePath(`/series/${tmdbId}`);
  revalidatePath("/series");
}

export async function markSeasonWatchedAction(
  tmdbId: number,
  seasonNumber: number,
) {
  const user = await requireUser();
  const userId = Number(user.id);

  await upsertShowFromTmdb(tmdbId);
  const show = getShowByTmdbId(db, tmdbId);
  if (!show) return;

  const today = new Date().toISOString().slice(0, 10);
  const seasonEpisodes = getEpisodesByShow(db, show.id).filter(
    (ep) =>
      ep.seasonNumber === seasonNumber &&
      ep.airDate &&
      ep.airDate <= today,
  );

  for (const ep of seasonEpisodes) {
    markEpisodeWatched(db, userId, ep.id);
  }

  touchActivity(db, userId, show.id);

  const userShow = getUserShowByTmdbId(db, userId, tmdbId);
  if (userShow && userShow.state === "STOPPED") {
    updateUserShowState(db, userId, show.id, "WATCHING");
  }

  revalidatePath(`/series/${tmdbId}`);
  revalidatePath("/series");
}

export async function changeShowStateAction(
  tmdbId: number,
  state: "WATCHING" | "FOLLOWING" | "COMPLETED" | "STOPPED",
) {
  const user = await requireUser();
  const userId = Number(user.id);

  const show = getShowByTmdbId(db, tmdbId);
  if (!show) return;

  updateUserShowState(db, userId, show.id, state);

  revalidatePath(`/series/${tmdbId}`);
  revalidatePath("/series");
}
