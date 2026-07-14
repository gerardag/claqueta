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
  upsertUserShowState,
  getUserShowByTmdbId,
  getShowProgress,
  isShowFullyWatchedAndEnded,
} from "@/lib/db/queries";
import { requireUser } from "@/lib/auth-helpers";
import { upsertShowFromTmdb } from "@/lib/tmdb/sync";

function applyWatchStateAfterProgress(
  userId: number,
  showId: number,
  showStatus: string | null,
  currentState: string | undefined,
) {
  const { watched, total } = getShowProgress(db, userId, showId);

  if (isShowFullyWatchedAndEnded(showStatus, watched, total)) {
    upsertUserShowState(db, userId, showId, "COMPLETED");
  } else if (!currentState || currentState === "STOPPED") {
    upsertUserShowState(db, userId, showId, "WATCHING");
  } else {
    touchActivity(db, userId, showId);
  }
}

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

    const userShow = getUserShowByTmdbId(db, userId, tmdbId);
    applyWatchStateAfterProgress(
      userId,
      show.id,
      show.status,
      userShow?.state,
    );
  }

  revalidatePath(`/series/${tmdbId}`);
  revalidatePath("/series");
}

export async function markEpisodeAndPreviousAction(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
) {
  const user = await requireUser();
  const userId = Number(user.id);

  await upsertShowFromTmdb(tmdbId);
  const show = getShowByTmdbId(db, tmdbId);
  if (!show) return;

  const today = new Date().toISOString().slice(0, 10);
  const episodesToMark = getEpisodesByShow(db, show.id).filter(
    (ep) =>
      ep.seasonNumber === seasonNumber &&
      ep.episodeNumber <= episodeNumber &&
      ep.airDate &&
      ep.airDate <= today,
  );

  for (const ep of episodesToMark) {
    markEpisodeWatched(db, userId, ep.id);
  }

  const userShow = getUserShowByTmdbId(db, userId, tmdbId);
  applyWatchStateAfterProgress(userId, show.id, show.status, userShow?.state);

  revalidatePath(`/series/${tmdbId}`);
  revalidatePath("/series");
}

export async function markSeasonWatchedAction(
  tmdbId: number,
  seasonNumbers: number | number[],
) {
  const user = await requireUser();
  const userId = Number(user.id);

  await upsertShowFromTmdb(tmdbId);
  const show = getShowByTmdbId(db, tmdbId);
  if (!show) return;

  const numbers = Array.isArray(seasonNumbers) ? seasonNumbers : [seasonNumbers];
  const today = new Date().toISOString().slice(0, 10);
  const seasonEpisodes = getEpisodesByShow(db, show.id).filter(
    (ep) =>
      numbers.includes(ep.seasonNumber) &&
      ep.airDate &&
      ep.airDate <= today,
  );

  for (const ep of seasonEpisodes) {
    markEpisodeWatched(db, userId, ep.id);
  }

  const userShow = getUserShowByTmdbId(db, userId, tmdbId);
  applyWatchStateAfterProgress(userId, show.id, show.status, userShow?.state);

  revalidatePath(`/series/${tmdbId}`);
  revalidatePath("/series");
}

export async function markShowWatchedAction(tmdbId: number) {
  const user = await requireUser();
  const userId = Number(user.id);

  await upsertShowFromTmdb(tmdbId);
  const show = getShowByTmdbId(db, tmdbId);
  if (!show) return;

  const today = new Date().toISOString().slice(0, 10);
  const airedEpisodes = getEpisodesByShow(db, show.id).filter(
    (ep) => ep.seasonNumber > 0 && ep.airDate && ep.airDate <= today,
  );

  for (const ep of airedEpisodes) {
    markEpisodeWatched(db, userId, ep.id);
  }

  touchActivity(db, userId, show.id);
  upsertUserShowState(db, userId, show.id, "COMPLETED");

  revalidatePath(`/series/${tmdbId}`);
  revalidatePath("/series");
}

export async function changeShowStateAction(
  tmdbId: number,
  state: "WATCHING" | "FOLLOWING" | "COMPLETED" | "STOPPED",
) {
  const user = await requireUser();
  const userId = Number(user.id);

  await upsertShowFromTmdb(tmdbId);
  const show = getShowByTmdbId(db, tmdbId);
  if (!show) return;

  upsertUserShowState(db, userId, show.id, state);

  revalidatePath(`/series/${tmdbId}`);
  revalidatePath("/series");
}
