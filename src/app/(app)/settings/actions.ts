"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { locales, type Locale } from "@/i18n/config";

export async function changeLocaleAction(locale: Locale) {
  if (!(locales as readonly string[]).includes(locale)) return;

  const user = await requireUser();
  const userId = Number(user.id);

  db.update(users)
    .set({ locale })
    .where(eq(users.id, userId))
    .run();

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
