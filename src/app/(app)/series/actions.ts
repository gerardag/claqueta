"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { updateUserShowState, deleteUserShow } from "@/lib/db/queries";
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
