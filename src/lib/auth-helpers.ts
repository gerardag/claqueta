import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export async function getAvatarUrl(userId: number) {
  const user = db
    .select({ avatarUpdatedAt: users.avatarUpdatedAt })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  return user?.avatarUpdatedAt
    ? `/api/avatar/${userId}?v=${user.avatarUpdatedAt.getTime()}`
    : null;
}
