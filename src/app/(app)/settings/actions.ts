"use server";

import { cookies } from "next/headers";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
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

const accountSchema = z.object({
  displayName: z.string().min(1),
  email: z.string().email(),
  currentPassword: z.string().min(1),
  newPassword: z.union([z.string().min(8), z.literal("")]),
});

export async function updateAccountAction(_prev: unknown, formData: FormData) {
  const t = await getTranslations("auth");
  const user = await requireUser();
  const userId = Number(user.id);

  const parsed = accountSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword") ?? "",
  });

  if (!parsed.success) {
    return { error: t("validationError") };
  }

  const { displayName, email, currentPassword, newPassword } = parsed.data;

  const current = db.select().from(users).where(eq(users.id, userId)).get();
  if (!current) {
    return { error: t("invalidCredentials") };
  }

  const validPassword = await compare(currentPassword, current.passwordHash);
  if (!validPassword) {
    return { error: t("invalidCredentials") };
  }

  const emailTaken = db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, userId)))
    .get();
  if (emailTaken) {
    return { error: t("emailTaken") };
  }

  db.update(users)
    .set({
      displayName,
      email,
      ...(newPassword ? { passwordHash: await hash(newPassword, 12) } : {}),
    })
    .where(eq(users.id, userId))
    .run();

  revalidatePath("/", "layout");
  return { success: true };
}
