"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signIn } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function registerAction(_prev: unknown, formData: FormData) {
  const t = await getTranslations("auth");

  if (process.env.ALLOW_REGISTRATION === "false") {
    return { error: t("registrationDisabled") };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: t("validationError") };
  }

  const { name, email, password } = parsed.data;

  const existing = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    return { error: t("emailTaken") };
  }

  const passwordHash = await hash(password, 12);

  db.insert(users)
    .values({ email, passwordHash, displayName: name })
    .run();

  await signIn("credentials", { email, password, redirect: false });
  redirect("/");
}
