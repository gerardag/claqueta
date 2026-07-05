"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { markEpisodeWatched, touchActivity } from "@/lib/db/queries";
import { episodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";

export async function markWatchedAction(episodeId: number) {
  const user = await requireUser();
  const userId = Number(user.id);

  markEpisodeWatched(db, userId, episodeId);

  const ep = db
    .select({ showId: episodes.showId })
    .from(episodes)
    .where(eq(episodes.id, episodeId))
    .get();

  if (ep) {
    touchActivity(db, userId, ep.showId);
  }

  revalidatePath("/calendar");
}
