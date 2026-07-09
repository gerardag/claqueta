"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { checkLoginRateLimit } from "@/lib/rate-limit";

export async function loginAction(_prev: unknown, formData: FormData) {
  const t = await getTranslations("auth");

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = checkLoginRateLimit(ip);
  if (!allowed) {
    return { error: t("tooManyAttempts") };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t("invalidCredentials") };
    }
    throw error;
  }

  redirect("/");
}
