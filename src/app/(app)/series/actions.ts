"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  updateUserShowState,
  upsertUserShowState,
  deleteUserShow,
  getEpisodeByShowSeasonEp,
  markEpisodeWatched,
  touchActivity,
  getShowByTmdbId,
  getUserShowByTmdbId,
  getShowProgress,
  isShowFullyWatchedAndEnded,
} from "@/lib/db/queries";
import { requireUser } from "@/lib/auth-helpers";

export async function stopShowAction(showId: number) {
  const user = await requireUser();
  updateUserShowState(db, Number(user.id), showId, "STOPPED");
  revalidatePath("/series");
}

export async function deleteShowAction(showId: number) {
  const user = await requireUser();
  deleteUserShow(db, Number(user.id), showId);
  revalidatePath("/series");
}

export async function markNextEpisodeAction(
  showId: number,
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
) {
  const user = await requireUser();
  const userId = Number(user.id);

  const episode = getEpisodeByShowSeasonEp(db, showId, seasonNumber, episodeNumber);
  if (!episode) return;

  markEpisodeWatched(db, userId, episode.id);

  const show = getShowByTmdbId(db, tmdbId);
  const userShow = getUserShowByTmdbId(db, userId, tmdbId);
  const { watched, total } = getShowProgress(db, userId, showId);

  if (isShowFullyWatchedAndEnded(show?.status ?? null, watched, total)) {
    upsertUserShowState(db, userId, showId, "COMPLETED");
  } else if (userShow?.state === "WATCHING") {
    touchActivity(db, userId, showId);
  } else {
    upsertUserShowState(db, userId, showId, "WATCHING");
  }

  revalidatePath("/series");
}
